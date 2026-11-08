"use client";

import { ArrowRight, CheckCircle2, Copy, FastForward, Hourglass, LayoutDashboard, MessageCircle, Play, Send, Share2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ReliabilityBadge } from "@/components/kora/badges";
import { EmptyState } from "@/components/kora/list-state";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { SpotsBar } from "@/components/kora/spots-bar";
import { PrototypeBox, ScreenHeader } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PERSONAS, SPORTS } from "@/lib/constants";
import { dayLabel, formatTimeRange } from "@/lib/format";
import { neededToConfirm, spotsLeft, statusSentence } from "@/lib/games";
import { OMAR_FRIENDS, PLAYERS } from "@/lib/mock-data";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function PublishedScreen() {
  const { id } = useParams<{ id: string }>();
  const { dispatch, gamesById, venuesById, courtsById, playersById, me, hydrated } = useKora();
  const game = gamesById.get(id);
  const [autoPlay, setAutoPlay] = useState(false);

  // "Watch players join": add one player every ~1.1 s until the game confirms.
  const playing = autoPlay && game?.status === "filling";
  useEffect(() => {
    if (!playing || !game) return;
    const t = window.setTimeout(() => dispatch({ type: "simulateJoins", gameId: game.id, count: 1 }), 1100);
    return () => window.clearTimeout(t);
  }, [playing, game, dispatch]);

  if (!game) {
    return (
      <div>
        <ScreenHeader title="Game published" backHref="/play" />
        <div className="p-4">{hydrated ? <EmptyState icon={<Hourglass />} title="Game not found" description="It may have been reset from the demo panel." /> : <Skeleton className="h-60 w-full" />}</div>
      </div>
    );
  }

  const venue = venuesById.get(game.venueId)!;
  const court = courtsById.get(game.courtId)!;
  const link = `https://kora.app/g/${game.id.replace("g-", "")}`;
  const confirmed = game.status === "confirmed";
  const need = neededToConfirm(game);
  // Players who joined via Kora (not the organiser's friends picked at creation are still listed; that's fine).
  const joinedPlayers = game.playerIds.map((pid) => playersById.get(pid)!).filter(Boolean);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied", { description: "Paste it in your group chat." });
    } catch {
      toast("Copy this link", { description: link });
    }
  }

  return (
    <div className="pb-8">
      <ScreenHeader title={confirmed ? "Game confirmed" : "Game published"} backHref={`/play/games/${game.id}`} />
      <div className="space-y-5 px-4 pt-5">
        {/* Status hero */}
        <section className={cn("rounded-3xl p-5 text-center", confirmed ? "bg-brand text-white" : "bg-slate-900 text-white")} aria-live="polite">
          <span className={cn("mx-auto flex size-16 items-center justify-center rounded-full", confirmed ? "bg-volt text-slate-900" : "bg-white/10 text-volt")}>
            {confirmed ? <CheckCircle2 className="size-8" aria-hidden /> : <Hourglass className="size-8" aria-hidden />}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">{confirmed ? "Confirmed — court booked!" : "Your game is live"}</h1>
          <p className="mt-1 text-sm text-slate-200">
            {SPORTS[game.sport].label} · {dayLabel(game.date)}, {formatTimeRange(game.startHour, game.duration)}
            <br />
            {court.name}, {venue.name}
          </p>
          <p className={cn("mx-auto mt-4 w-fit rounded-full px-4 py-1.5 text-sm font-bold", confirmed ? "bg-white text-brand-dark" : "bg-amber-300 text-slate-900")}>
            {confirmed ? "Everyone's share is charged" : `Waiting for ${need} more ${need === 1 ? "player" : "players"}`}
          </p>
          <div className="mt-4 rounded-2xl bg-white p-3 text-left text-slate-900">
            <SpotsBar game={game} />
          </div>
        </section>

        {confirmed && venue.ownerId && (
          <Link href="/owner/calendar" className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <LayoutDashboard className="size-5 shrink-0 text-brand" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="block font-bold">See it from Karim&apos;s side</span>
              <span className="text-slate-700">The held slot is now a confirmed booking on Nasr Arena&apos;s calendar.</span>
            </span>
            <ArrowRight className="size-5 text-brand" aria-hidden />
          </Link>
        )}

        {/* Share */}
        {!confirmed && (
          <section aria-labelledby="share" className="space-y-3">
            <h2 id="share" className="text-lg font-extrabold">Share & invite</h2>
            <div className="flex items-center gap-2 rounded-2xl border p-2 pl-4">
              <span className="flex-1 truncate font-mono text-sm text-slate-700">{link}</span>
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy aria-hidden /> Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => toast("Opening WhatsApp…", { description: "Message pre-filled with your game link." })}>
                <Share2 aria-hidden /> WhatsApp
              </Button>
              <InviteSheet gameId={game.id} invitedIds={game.invitedIds} inGame={game.playerIds} isOmar={me.id === PERSONAS.omar.playerId} />
            </div>
            {game.invitedIds.length > 0 && (
              <p className="text-sm text-slate-600">{game.invitedIds.length} invited · invited friends get first dibs on open spots.</p>
            )}
          </section>
        )}

        {/* Live roster */}
        <section aria-labelledby="roster">
          <h2 id="roster" className="mb-2 text-lg font-extrabold">Players ({game.playerIds.length}/{game.capacity})</h2>
          <ul className="divide-y rounded-2xl border" aria-live="polite">
            {joinedPlayers.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 animate-in fade-in slide-in-from-top-1">
                <PlayerAvatar player={p} size="sm" />
                <span className="flex-1 text-sm font-bold">{p.name}{p.id === me.id && " (you)"}</span>
                <ReliabilityBadge player={p} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-slate-600">{statusSentence(game)} · {spotsLeft(game)} spots left</p>
        </section>

        {game.status === "filling" && (
          <PrototypeBox title="Prototype: watch players join">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: "simulateJoins", gameId: game.id, count: 1 })}>
                <UserPlus aria-hidden /> +1 player
              </Button>
              <Button variant="dark" size="sm" onClick={() => setAutoPlay(true)} disabled={playing}>
                {playing ? <FastForward aria-hidden /> : <Play aria-hidden />} {playing ? "Joining…" : "Play it out"}
              </Button>
            </div>
          </PrototypeBox>
        )}

        <div className="grid gap-2">
          <Button asChild size="lg">
            <Link href={`/play/chat/${game.id}`}>
              <MessageCircle aria-hidden /> Open game chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/play/games/${game.id}`}>View game details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Bottom sheet listing friends to invite (checkbox rows with 44px targets). */
function InviteSheet({ gameId, invitedIds, inGame, isOmar }: { gameId: string; invitedIds: string[]; inGame: string[]; isOmar: boolean }) {
  const { dispatch } = useKora();
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  // Omar invites his friends; any persona can invite from the wider community.
  const candidates = PLAYERS.filter((p) => !inGame.includes(p.id) && p.id !== PERSONAS.salma.playerId && p.id !== PERSONAS.omar.playerId)
    .sort((a, b) => Number(OMAR_FRIENDS.includes(b.id) && isOmar) - Number(OMAR_FRIENDS.includes(a.id) && isOmar))
    .slice(0, 8);

  function send() {
    dispatch({ type: "inviteFriends", gameId, friendIds: picked });
    toast.success(`${picked.length} ${picked.length === 1 ? "invite" : "invites"} sent`, { description: "They'll get a push notification with your link." });
    setPicked([]);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <UserPlus aria-hidden /> Invite friends
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Invite friends</SheetTitle>
          <SheetDescription>Invited players get first dibs on open spots.</SheetDescription>
        </SheetHeader>
        <ul className="divide-y rounded-2xl border">
          {candidates.map((p) => {
            const already = invitedIds.includes(p.id);
            const id = `inv-${p.id}`;
            return (
              <li key={p.id}>
                <Label htmlFor={id} className="flex min-h-14 cursor-pointer items-center gap-3 px-3 font-normal">
                  <PlayerAvatar player={p} size="sm" />
                  <span className="flex-1">
                    <span className="block font-bold">{p.name}</span>
                    <span className="text-xs text-slate-600">{already ? "Invited" : isOmar && OMAR_FRIENDS.includes(p.id) ? "Friend" : "Played nearby"}</span>
                  </span>
                  <Checkbox
                    id={id}
                    disabled={already}
                    checked={already || picked.includes(p.id)}
                    onCheckedChange={(c) => setPicked((prev) => (c ? [...prev, p.id] : prev.filter((x) => x !== p.id)))}
                  />
                </Label>
              </li>
            );
          })}
        </ul>
        <SheetFooter>
          <Button size="lg" disabled={picked.length === 0} onClick={send}>
            <Send aria-hidden /> Send {picked.length || ""} {picked.length === 1 ? "invite" : "invites"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
