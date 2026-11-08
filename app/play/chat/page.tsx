"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { AsyncList } from "@/components/kora/list-state";
import { SportIcon } from "@/components/kora/sport-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SPORTS } from "@/lib/constants";
import { dayLabel, firstName, relativeTime } from "@/lib/format";
import { chatThreads } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ChatListScreen() {
  const { state, me, playersById, venuesById } = useKora();
  const threads = chatThreads(state.games, state.messages, state.chatReads, me.id);

  return (
    <div className="pb-6">
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Chat</h1>
        <p className="text-sm text-slate-600">One group chat per game, created automatically.</p>
      </header>
      <AsyncList
        listKey={`chats-${me.id}`}
        items={threads}
        getKey={(t) => t.game.id}
        className="divide-y border-y"
        skeleton={<Skeleton className="m-3 h-16" />}
        errorTitle="Couldn't load chats"
        empty={{
          icon: <MessageCircle />,
          title: "No chats yet",
          description: "Join or create a game and its group chat appears here.",
          action: <Button asChild><Link href="/play/find"><Search aria-hidden /> Find me a game</Link></Button>,
        }}
        renderItem={({ game, last, unread }) => {
          const author = last?.authorId ? playersById.get(last.authorId) : undefined;
          const preview = last ? (last.kind === "system" ? last.text : `${author?.id === me.id ? "You" : firstName(author?.name ?? "")}: ${last.text}`) : "Say hi to your team 👋";
          return (
            <Link href={`/play/chat/${game.id}`} className="flex min-h-[72px] items-center gap-3 px-4 py-3 outline-none hover:bg-slate-50 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                <SportIcon sport={game.sport} className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-bold">{SPORTS[game.sport].short} · {dayLabel(game.date)}</span>
                  {last && <span className="shrink-0 text-xs text-slate-600">{relativeTime(last.at)}</span>}
                </span>
                <span className="block truncate text-xs text-slate-600">{venuesById.get(game.venueId)?.name}</span>
                <span className={cn("block truncate text-sm", unread ? "font-semibold text-slate-900" : "text-slate-600")}>{preview}</span>
              </span>
              {unread > 0 && (
                <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {unread}<span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          );
        }}
      />
    </div>
  );
}
