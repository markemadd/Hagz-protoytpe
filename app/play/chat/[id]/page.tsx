"use client";

import { Info, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/kora/list-state";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { GameStatusChip } from "@/components/kora/status-chip";
import { ScreenHeader } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SPORTS } from "@/lib/constants";
import { clockTime, dayLabel, firstName, formatHour } from "@/lib/format";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

const REPLIES = ["👍", "See you there!", "Can someone bring a pump? 😅", "Let's go 🔥", "I'll be 5 min early to warm up."];

export default function GameChatScreen() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, me, gamesById, playersById, sendMessage, hydrated } = useKora();
  const game = gamesById.get(id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLLIElement>(null);

  // Messages for this game only: O(M).
  const messages = useMemo(() => state.messages.filter((m) => m.gameId === id), [state.messages, id]);

  // Mark as read and keep the newest message in view.
  useEffect(() => {
    if (!game) return;
    dispatch({ type: "markChatRead", playerId: me.id, gameId: game.id });
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, game, me.id, dispatch]);

  if (!game) {
    return (
      <div>
        <ScreenHeader title="Chat" backHref="/play/chat" />
        <div className="p-4">{hydrated ? <EmptyState icon={<Info />} title="Chat not found" description="This game may have been removed." /> : <Skeleton className="h-40" />}</div>
      </div>
    );
  }

  const canChat = game.playerIds.includes(me.id);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !game) return;
    sendMessage(game.id, me.id, value);
    setText("");
    // Simulated teammate reply so the chat feels alive.
    const others = game.playerIds.filter((p) => p !== me.id);
    if (others.length) {
      const who = others[Math.floor(Math.random() * others.length)];
      window.setTimeout(() => sendMessage(game.id, who, REPLIES[Math.floor(Math.random() * REPLIES.length)]), 1600);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader
        title={`${SPORTS[game.sport].short} · ${dayLabel(game.date)} ${formatHour(game.startHour)}`}
        backHref="/play/chat"
        right={
          <Link href={`/play/games/${game.id}`} className="mr-1 inline-flex min-h-11 items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label="Game details">
            <GameStatusChip status={game.status} />
          </Link>
        }
      />

      <ol className="flex-1 space-y-3 px-4 py-4" aria-label="Messages" aria-live="polite">
        {messages.map((m) => {
          if (m.kind === "system") {
            return (
              <li key={m.id} className="flex justify-center">
                <span className={cn("rounded-full px-3 py-1.5 text-center text-xs font-semibold", m.text.includes("confirmed") ? "bg-brand-soft text-brand-dark" : "bg-slate-100 text-slate-700")}>
                  {m.text}
                </span>
              </li>
            );
          }
          const author = m.authorId ? playersById.get(m.authorId) : undefined;
          const mine = m.authorId === me.id;
          return (
            <li key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
              {!mine && author && <PlayerAvatar player={author} size="xs" />}
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-slate-100 text-slate-900")}>
                {!mine && <p className="text-xs font-bold text-brand-dark">{firstName(author?.name ?? "Player")}</p>}
                <p>{m.text}</p>
                <p className={cn("mt-0.5 text-right text-[10px]", mine ? "text-emerald-50" : "text-slate-600")}>{clockTime(m.at)}</p>
              </div>
            </li>
          );
        })}
        <li ref={endRef} aria-hidden className="h-0" />
      </ol>

      <form onSubmit={send} className="sticky bottom-0 flex items-center gap-2 border-t bg-white px-3 py-3">
        <Label htmlFor="msg" className="sr-only">Message</Label>
        <Input id="msg" placeholder={canChat ? "Message your team…" : "Join the game to chat"} value={text} onChange={(e) => setText(e.target.value)} disabled={!canChat} autoComplete="off" />
        <Button type="submit" size="icon" aria-label="Send message" disabled={!canChat || !text.trim()}>
          <SendHorizontal aria-hidden />
        </Button>
      </form>
    </div>
  );
}
