"use client";

import { CalendarCheck2, CalendarX2, Hourglass, Search, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AsyncList } from "@/components/kora/list-state";
import { BookingStatusChip } from "@/components/kora/status-chip";
import { GameCard } from "@/components/player/game-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dayLabel, formatEGP, formatTimeRange } from "@/lib/format";
import { isInPast, statusSentence } from "@/lib/games";
import { myGames } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import type { Booking, Game } from "@/lib/types";

type Tab = "upcoming" | "pending" | "past";

export default function MyGamesScreen() {
  const { state, me, courtsById, venuesById } = useKora();
  const { upcoming, pending, past } = myGames(state.games, me.id);
  // Private full-court bookings this player made (shown alongside games).
  const myBookings = state.bookings.filter((b) => b.playerId === me.id);
  const bookingsFor = (tab: Tab) =>
    myBookings.filter((b) => (tab === "pending" ? b.status === "requested" : tab === "upcoming" ? b.status === "confirmed" && !isInPast(b) : b.status === "declined" || b.status === "completed"));

  const [tab, setTab] = useState<Tab>(pending.length > 0 && upcoming.length === 0 ? "pending" : "upcoming");

  const lists: Record<Tab, Game[]> = { upcoming, pending, past };
  const empties: Record<Tab, { icon: React.ReactNode; title: string; description: string }> = {
    upcoming: { icon: <CalendarCheck2 />, title: "No confirmed games yet", description: "Games move here as soon as enough players join and the court is booked." },
    pending: { icon: <Hourglass />, title: "Nothing waiting to fill", description: "Games you join or create show here while they fill up." },
    past: { icon: <CalendarX2 />, title: "No past games", description: "After you play, you can rate your teammates and the court here." },
  };

  return (
    <div className="pb-6">
      <header className="px-4 pb-2 pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">My Games</h1>
      </header>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="px-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length + bookingsFor("upcoming").length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length + bookingsFor("pending").length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        {(["upcoming", "pending", "past"] as const).map((t) => (
          <TabsContent key={t} value={t} className="space-y-3">
            {t === "pending" && pending.length > 0 && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Not confirmed yet: your card is only held. If a game doesn&apos;t fill, you&apos;re refunded automatically.</p>
            )}
            <AsyncList
              listKey={`mygames-${t}-${me.id}`}
              items={lists[t]}
              getKey={(g) => g.id}
              className="space-y-3"
              skeleton={<Skeleton className="h-40 w-full" />}
              skeletonCount={2}
              errorTitle="Couldn't load your games"
              renderItem={(g) => <MyGameRow game={g} />}
              empty={{
                ...empties[t],
                action: t !== "past" ? (
                  <Button asChild>
                    <Link href="/play/find"><Search aria-hidden /> Find me a game</Link>
                  </Button>
                ) : undefined,
              }}
            />
            {bookingsFor(t).map((b) => (
              <BookingRow key={b.id} booking={b} courtName={courtsById.get(b.courtId)?.name ?? ""} venueName={venuesById.get(b.venueId)?.name ?? ""} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MyGameRow({ game }: { game: Game }) {
  const { state, me } = useKora();
  const rated = !!state.flags[`rated:${game.id}:${me.id}`];
  return (
    <div className="space-y-2">
      <GameCard game={game} showStatus />
      {game.status === "filling" && <p className="px-1 text-sm font-semibold text-amber-900">{statusSentence(game)}</p>}
      {game.status === "completed" && !rated && (
        <Button asChild variant="volt" className="w-full">
          <Link href={`/play/games/${game.id}/rate`}><Star aria-hidden /> Rate players & court</Link>
        </Button>
      )}
    </div>
  );
}

function BookingRow({ booking, courtName, venueName }: { booking: Booking; courtName: string; venueName: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{courtName} · private booking</p>
          <p className="text-sm text-slate-600">{venueName}</p>
          <p className="text-sm font-semibold">{dayLabel(booking.date)} · {formatTimeRange(booking.startHour, booking.duration)}</p>
        </div>
        <BookingStatusChip status={booking.status} />
      </div>
      <p className="mt-2 text-sm text-slate-600">Total {formatEGP(booking.amount)}{booking.status === "requested" && " · held until the venue accepts"}</p>
    </div>
  );
}
