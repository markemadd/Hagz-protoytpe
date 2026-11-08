"use client";

import { Bell, ChevronRight, MapPin, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CourtArt } from "@/components/kora/court-art";
import { AsyncList } from "@/components/kora/list-state";
import { GameStatusChip } from "@/components/kora/status-chip";
import { GameCard } from "@/components/player/game-card";
import { SectionTitle } from "@/components/player/screen-header";
import { VenueCard } from "@/components/player/venue-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AREAS, PERSONAS, SPORTS } from "@/lib/constants";
import { dayLabel, firstName, formatTimeRange } from "@/lib/format";
import { statusSentence } from "@/lib/games";
import { distanceFromArea, gamesForPlayer } from "@/lib/matching";
import { myGames, unreadCount } from "@/lib/selectors";
import { useKora } from "@/lib/store";

export default function HomeScreen() {
  const { state, me, venuesById } = useKora();
  const isSalma = me.id === PERSONAS.salma.playerId;
  const onboarded = state.onboarded[me.id];
  const unread = unreadCount(state.notifications, me.id);

  // Matching runs over all open games: O(n log n). Recomputed only when games or profile change.
  const matches = useMemo(() => gamesForPlayer(state.games, venuesById, me, 5), [state.games, venuesById, me]);
  // Nearest venues first. O(V log V) with V = 6.
  const nearby = useMemo(
    () => [...state.venues].sort((a, b) => distanceFromArea(me.area, a) - distanceFromArea(me.area, b)),
    [state.venues, me.area],
  );
  const { upcoming, pending } = myGames(state.games, me.id);
  const nextGame = [...upcoming, ...pending].sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour)[0];

  const findCta = (
    <Button asChild variant="volt" size="lg" className="w-full">
      <Link href="/play/find">
        <Search aria-hidden /> Find me a game
      </Link>
    </Button>
  );
  const createCta = (
    <Button asChild size="lg" className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20">
      <Link href="/play/create">
        <Plus aria-hidden /> Create a game
      </Link>
    </Button>
  );

  return (
    <div className="pb-6">
      {/* Greeting + notifications */}
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <div>
          <p className="text-sm font-medium text-slate-600">Good evening,</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{firstName(me.name)} 👋</h1>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-600">
            <MapPin className="size-3.5" aria-hidden /> {AREAS[me.area].label} · within {me.radiusKm} km
          </p>
        </div>
        <Link
          href="/play/notifications"
          className="relative inline-flex size-11 items-center justify-center rounded-full border bg-white outline-none hover:bg-slate-50 focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </header>

      <div className="space-y-7 px-4">
        {!onboarded && (
          <Link href="/play/onboarding" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <Sparkles className="size-5 shrink-0 text-amber-700" aria-hidden />
            <span className="flex-1 text-sm">
              <span className="block font-bold">Finish setting up (1 min)</span>
              <span className="text-slate-700">Pick your sports, level and when you&apos;re free so we can match you.</span>
            </span>
            <ChevronRight className="size-5 text-slate-500" aria-hidden />
          </Link>
        )}

        {/* Big CTA */}
        <section aria-label="Get playing" className="relative overflow-hidden rounded-3xl bg-brand-dark p-5 text-white">
          <div aria-hidden className="absolute inset-0 opacity-20">
            <CourtArt sport={isSalma ? "padel" : "football5"} />
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-wider text-volt">{isSalma ? "New in Maadi?" : "Short a few players?"}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight">
              {isSalma ? "Tell us when you're free. We'll find the game." : "Post the game. Kora fills the empty spots."}
            </h2>
            <div className="mt-4 flex flex-col gap-2">{isSalma ? <>{findCta}{createCta}</> : <>{createCta}{findCta}</>}</div>
          </div>
        </section>

        {nextGame && (
          <section aria-labelledby="next-game">
            <SectionTitle id="next-game" title="Your next game" />
            <Link href={`/play/games/${nextGame.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-3 outline-none hover:border-slate-300 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                <CourtArt sport={nextGame.sport} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{SPORTS[nextGame.sport].label} · {dayLabel(nextGame.date)}</p>
                <p className="truncate text-sm text-slate-600">{formatTimeRange(nextGame.startHour, nextGame.duration)} · {statusSentence(nextGame)}</p>
              </div>
              <GameStatusChip status={nextGame.status} />
            </Link>
          </section>
        )}

        <section aria-labelledby="for-you">
          <SectionTitle
            id="for-you"
            title="Games for you"
            action={
              <Link href="/play/find" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-dark">
                See all
              </Link>
            }
          />
          <AsyncList
            listKey={`home-games-${me.id}`}
            items={matches}
            getKey={(m) => m.game.id}
            className="space-y-3"
            skeleton={<Skeleton className="h-40 w-full" />}
            renderItem={(m) => <GameCard game={m.game} score={m.score} />}
            errorTitle="Couldn't load games for you"
            empty={{
              icon: <Search />,
              title: onboarded ? "No open games match you right now" : "We don't know your sports yet",
              description: onboarded ? "Try a wider time window or radius, or join the waitlist and we'll ping you." : "Finish setup and we'll show games at your level near you.",
              action: (
                <Button asChild>
                  <Link href={onboarded ? "/play/find" : "/play/onboarding"}>{onboarded ? "Find me a game" : "Finish setup"}</Link>
                </Button>
              ),
            }}
          />
        </section>

        <section aria-labelledby="courts-near">
          <SectionTitle
            id="courts-near"
            title="Courts near you"
            action={
              <Link href="/play/explore" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-dark">
                Explore
              </Link>
            }
          />
          <AsyncList
            listKey="home-courts"
            items={nearby}
            getKey={(v) => v.id}
            className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1"
            skeleton={<Skeleton className="h-52 w-64" />}
            skeletonCount={2}
            renderItem={(v) => <VenueCard venue={v} />}
            errorTitle="Couldn't load courts"
            empty={{ icon: <MapPin />, title: "No courts in your area yet", description: "We're onboarding venues across Cairo every week." }}
          />
        </section>
      </div>
    </div>
  );
}
