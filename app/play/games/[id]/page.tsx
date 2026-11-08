"use client";

import {
  CalendarDays,
  CalendarPlus,
  CircleDollarSign,
  Crown,
  FastForward,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  SearchX,
  Share2,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LevelBadge, ReliabilityBadge } from "@/components/kora/badges";
import { CourtArt } from "@/components/kora/court-art";
import { EmptyState } from "@/components/kora/list-state";
import { MiniMap } from "@/components/kora/mini-map";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { SpotsBar } from "@/components/kora/spots-bar";
import { SportIcon } from "@/components/kora/sport-icon";
import { GameStatusChip } from "@/components/kora/status-chip";
import { PrototypeBox, ScreenHeader, SectionTitle, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AREAS, HOLD_RELEASE_HOURS, LEVELS, SPORTS } from "@/lib/constants";
import { formatDuration, formatEGP, formatTimeRange, longDate } from "@/lib/format";
import { hasJoined, isInPast, neededToConfirm, spotsLeft, statusSentence } from "@/lib/games";
import { downloadIcs } from "@/lib/ics";
import { distanceFromArea } from "@/lib/matching";
import { priceSplit } from "@/lib/pricing";
import { useKora } from "@/lib/store";

export default function GameDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, me, gamesById, venuesById, courtsById, playersById, hydrated } = useKora();
  const game = gamesById.get(id);

  if (!game) {
    // Before saved state loads, a game created earlier may not exist yet: show a skeleton, not a 404.
    return (
      <div>
        <ScreenHeader title="Game" backHref="/play" />
        {hydrated ? (
          <div className="p-4">
            <EmptyState icon={<SearchX />} title="This game no longer exists" description="It may have been cancelled or the link is wrong." action={<Button asChild><Link href="/play/find">Find another game</Link></Button>} />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </div>
    );
  }

  const venue = venuesById.get(game.venueId)!;
  const court = courtsById.get(game.courtId)!;
  const organizer = playersById.get(game.organizerId)!;
  const joined = hasJoined(game, me.id);
  const isOrganizer = game.organizerId === me.id;
  const past = isInPast(game);
  const left = spotsLeft(game);
  const split = priceSplit(game.courtTotal, game.capacity, game.minPlayers);
  const km = distanceFromArea(me.area, venue);
  const rated = !!state.flags[`rated:${game.id}:${me.id}`];
  const hourly = Math.round(game.courtTotal / game.duration);

  function join() {
    dispatch({ type: "setCheckout", draft: { kind: "game", gameId: game!.id } });
    router.push("/play/checkout");
  }

  function addToCalendar() {
    downloadIcs({
      title: `${SPORTS[game!.sport].label} · Kora`,
      date: game!.date,
      startHour: game!.startHour,
      duration: game!.duration,
      location: `${venue.name}, ${venue.address}`,
      description: `${court.name}. Organised by ${organizer.name}.`,
    });
    toast.success("Calendar file downloaded");
  }

  async function share() {
    const url = `https://kora.app/g/${game!.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      toast(url);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Hero */}
      <div className="relative h-56 shrink-0">
        <CourtArt sport={game.sport} label={`${court.name} at ${venue.name}`} />
        <ScreenHeader
          title={SPORTS[game.sport].label}
          backHref="/play"
          transparent
          right={
            <button type="button" onClick={share} className="inline-flex size-11 items-center justify-center rounded-full bg-white/90 shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label="Share game link">
              <Share2 className="size-5" aria-hidden />
            </button>
          }
        />
        <div className="absolute bottom-3 left-4 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold">
            <SportIcon sport={game.sport} className="size-4 text-brand" /> {SPORTS[game.sport].short}
          </span>
          <GameStatusChip status={game.status} className="bg-white" />
        </div>
      </div>

      <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
        {/* Title & facts */}
        <section>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {SPORTS[game.sport].label} at {venue.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <LevelBadge level={game.level} />
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {game.visibility === "public" ? <Users className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
              {game.visibility === "public" ? "Public game" : "Invite-only"}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex gap-3">
              <dt className="sr-only">When</dt>
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <dd>
                <span className="block font-bold">{longDate(game.date)}</span>
                <span className="text-slate-600">{formatTimeRange(game.startHour, game.duration)} · {formatDuration(game.duration)}</span>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Where</dt>
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <dd>
                <span className="block font-bold">{court.name} · {court.indoor ? "Indoor" : "Outdoor"} · {court.surface}</span>
                <span className="text-slate-600">{venue.address} · {km} km from {AREAS[me.area].label}</span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Map placeholder */}
        <section aria-label="Map">
          <MiniMap pins={[{ id: venue.id, venue, label: venue.name }]} focus={venue} className="h-36" />
          <div className="mt-2 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/play/courts/${venue.id}`}>View venue</Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => toast("Opening directions…", { description: venue.address })}>
              <Navigation aria-hidden /> Directions
            </Button>
          </div>
        </section>

        {/* Spots */}
        <section aria-labelledby="spots" className="rounded-2xl border p-4">
          <h2 id="spots" className="font-bold">{statusSentence(game)}</h2>
          <SpotsBar game={game} className="mt-3" />
          {game.status === "filling" && (
            <p className="mt-3 text-sm text-slate-600">
              {left} {left === 1 ? "spot" : "spots"} left. The court is <strong className="text-slate-900">held</strong> now and booked once{" "}
              {game.minPlayers} players join.
            </p>
          )}
        </section>

        {/* Price split */}
        <section aria-labelledby="price" className="rounded-2xl bg-slate-50 p-4">
          <h2 id="price" className="flex items-center gap-2 font-bold">
            <CircleDollarSign className="size-5 text-brand" aria-hidden /> Price split
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Court · {formatDuration(game.duration)} × {formatEGP(hourly)}/h</dt>
              <dd className="font-semibold">{formatEGP(game.courtTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Split between {game.capacity} players</dt>
              <dd className="font-semibold">{formatEGP(split.shareFull)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Kora booking fee</dt>
              <dd className="font-semibold">{formatEGP(split.fee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <dt className="font-bold">Per person</dt>
              <dd className="font-extrabold">{formatEGP(split.perPerson)}</dd>
            </div>
          </dl>
          {split.maxPerPerson > split.perPerson && (
            <p className="mt-2 text-xs text-slate-600">
              If only {game.minPlayers} join, the court is split {game.minPlayers} ways: max {formatEGP(split.maxPerPerson)} each. Never more.
            </p>
          )}
        </section>

        {/* Organizer */}
        <section aria-labelledby="org">
          <SectionTitle id="org" title="Organiser" />
          <div className="flex items-center gap-3 rounded-2xl border p-3">
            <PlayerAvatar player={organizer} />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{organizer.name}{isOrganizer && " (you)"}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <ReliabilityBadge player={organizer} />
                <span className="text-xs text-slate-600">{organizer.gamesPlayed} games</span>
              </div>
            </div>
            {joined && (
              <Button asChild size="icon" variant="outline" aria-label="Open game chat">
                <Link href={`/play/chat/${game.id}`}>
                  <MessageCircle aria-hidden />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Players */}
        <section aria-labelledby="players">
          <SectionTitle id="players" title={`Players (${game.playerIds.length}/${game.capacity})`} />
          <ul className="divide-y rounded-2xl border">
            {game.playerIds.map((pid) => {
              const p = playersById.get(pid);
              if (!p) return null;
              const lvl = p.sports[game.sport];
              return (
                <li key={pid} className="flex items-center gap-3 p-3">
                  <PlayerAvatar player={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                      {p.name}
                      {pid === me.id && <span className="rounded-full bg-volt px-1.5 py-0.5 text-[10px] font-bold text-slate-900">You</span>}
                      {pid === game.organizerId && <Crown className="size-3.5 text-amber-600" aria-label="Organiser" />}
                    </p>
                    <p className="text-xs text-slate-600">{lvl ? LEVELS[lvl].label : "Level not set"}</p>
                  </div>
                  <ReliabilityBadge player={p} />
                </li>
              );
            })}
            {Array.from({ length: Math.min(left, 4) }, (_, i) => (
              <li key={`open-${i}`} className="flex items-center gap-3 p-3 text-sm text-slate-600">
                <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-slate-300">
                  <UserPlus className="size-4" aria-hidden />
                </span>
                Open spot
              </li>
            ))}
            {left > 4 && <li className="p-3 text-center text-sm text-slate-600">+{left - 4} more open spots</li>}
          </ul>
        </section>

        {/* Rules */}
        <section aria-labelledby="rules" className="rounded-2xl border p-4">
          <h2 id="rules" className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-brand" aria-hidden /> How this game works
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Game confirms when <strong>{game.minPlayers}/{game.capacity}</strong> join; <strong>full refund</strong> if it doesn&apos;t by {HOLD_RELEASE_HOURS} h before kick-off.</li>
            <li>• Your card is only charged when the game confirms. Until then it&apos;s a hold.</li>
            <li>• Free cancellation up to 24 h before. Late drop-outs lower your reliability score.</li>
            <li>• {game.sport === "padel" || game.sport === "tennis" ? "Bring your racket (rental at the desk)." : game.sport === "basketball" ? "Indoor shoes only on hardwood." : "Turf shoes recommended; bibs provided."}</li>
          </ul>
        </section>

        {/* Prototype simulators */}
        {!past && game.status === "filling" && (joined || isOrganizer) && (
          <PrototypeBox>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: "simulateJoins", gameId: game.id, count: 1 })}>
                <UserPlus aria-hidden /> +1 player
              </Button>
              <Button variant="dark" size="sm" onClick={() => dispatch({ type: "simulateJoins", gameId: game.id, count: left })}>
                <FastForward aria-hidden /> Game fills
              </Button>
            </div>
          </PrototypeBox>
        )}
        {game.status === "confirmed" && joined && (
          <PrototypeBox>
            <Button variant="dark" size="sm" className="w-full" onClick={() => dispatch({ type: "completeGame", gameId: game.id })}>
              <FastForward aria-hidden /> Fast-forward: game played
            </Button>
          </PrototypeBox>
        )}
      </div>

      {/* Primary action */}
      <StickyFooter>
        {game.status === "completed" && joined ? (
          rated ? (
            <Button size="lg" className="w-full" disabled>
              <Star aria-hidden /> Thanks for rating
            </Button>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href={`/play/games/${game.id}/rate`}>
                <Star aria-hidden /> Rate players & court
              </Link>
            </Button>
          )
        ) : game.status === "cancelled" ? (
          <p className="py-2 text-center text-sm font-semibold text-slate-700">This game was cancelled. Everyone was refunded in full.</p>
        ) : joined && game.status === "confirmed" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1" onClick={addToCalendar}>
              <CalendarPlus aria-hidden /> Calendar
            </Button>
            <Button asChild size="lg" className="flex-1">
              <Link href={`/play/chat/${game.id}`}>
                <MessageCircle aria-hidden /> Game chat
              </Link>
            </Button>
          </div>
        ) : joined ? (
          <div className="space-y-2">
            <p className="text-center text-sm font-semibold text-amber-900" role="status">
              You&apos;re in · spot held · waiting for {neededToConfirm(game)} more
            </p>
            <div className="flex gap-2">
              {isOrganizer ? (
                <Button asChild size="lg" variant="outline" className="flex-1">
                  <Link href={`/play/games/${game.id}/published`}>
                    <UserPlus aria-hidden /> Invite
                  </Link>
                </Button>
              ) : (
                <LeaveButton onConfirm={() => { dispatch({ type: "leaveGame", gameId: game.id, playerId: me.id }); toast("You left the game", { description: "Your hold was released." }); }} />
              )}
              <Button asChild size="lg" className="flex-1">
                <Link href={`/play/chat/${game.id}`}>
                  <MessageCircle aria-hidden /> Chat
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <p className="text-xl font-extrabold">{formatEGP(split.perPerson)}</p>
              <p className="text-xs font-medium text-slate-600">per person · {left} {left === 1 ? "spot" : "spots"} left</p>
            </div>
            <Button size="lg" className="flex-1" disabled={left === 0 || past || game.status !== "filling"} onClick={join}>
              {left === 0 ? "Game full" : "Join game"}
            </Button>
          </div>
        )}
      </StickyFooter>
    </div>
  );
}

function LeaveButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="flex-1">Leave</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this game?</DialogTitle>
          <DialogDescription>Your spot opens up for someone else and your payment hold is released straight away.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Stay in</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={onConfirm}>Leave game</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
