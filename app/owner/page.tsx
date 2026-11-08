"use client";

import { ArrowRight, Banknote, CalendarCheck, Check, FastForward, Gauge, Inbox, Sparkles, UserX, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { AsyncList } from "@/components/kora/list-state";
import { SpotsBar } from "@/components/kora/spots-bar";
import { SportIcon } from "@/components/kora/sport-icon";
import { BookingStatusChip } from "@/components/kora/status-chip";
import { SourceBadge } from "@/components/owner/booking-row";
import { KpiTile } from "@/components/owner/kpi-tile";
import { UtilizationHeatmap } from "@/components/owner/utilization-heatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { compactNumber, dayLabel, formatEGP, formatTimeRange } from "@/lib/format";
import { neededToConfirm } from "@/lib/games";
import { OWNER_VENUE_ID, computeKpis, omarDemoGame, omarGameAtClub, upcomingBookings, utilizationHeatmap, weekDates } from "@/lib/owner";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function OwnerDashboard() {
  const { state, dispatch, courtsById } = useKora();

  // All analytics are derived from the shared bookings, so player actions show up instantly.
  const kpis = useMemo(() => computeKpis(state), [state]);
  const heat = useMemo(() => utilizationHeatmap(state, weekDates(0)), [state]);
  const upcoming = useMemo(() => upcomingBookings(state, 7), [state]);
  const liveGames = state.games.filter((g) => g.venueId === OWNER_VENUE_ID && g.status === "filling");
  const requests = state.bookings.filter((b) => b.venueId === OWNER_VENUE_ID && b.status === "requested");
  const omarGame = omarGameAtClub(state);

  const revenueDelta = kpis.revenueLastWeek ? Math.round(((kpis.revenueWeek - kpis.revenueLastWeek) / kpis.revenueLastWeek) * 100) : 0;
  const utilPct = Math.round(kpis.utilization * 100);
  const utilLastPct = Math.round(kpis.utilizationLastWeek * 100);

  const steps = [
    { label: "Omar's booking appears as Held", done: !!omarGame },
    { label: "It turns Confirmed when his game fills", done: omarGame?.status === "confirmed" },
    { label: "Block a slot on the calendar", done: !!state.flags["owner-blocked"] },
    { label: "Promote an idle off-peak slot", done: !!state.flags["owner-promoted"] },
  ];

  return (
    <div className="space-y-6">
      {/* Prototype guide */}
      <section aria-labelledby="karim-flow" className="rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800">Prototype guide</p>
            <h2 id="karim-flow" className="text-lg font-extrabold">Karim&apos;s flow</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {!omarGame ? (
              <Button variant="dark" onClick={() => { dispatch({ type: "createGame", game: omarDemoGame(state), method: "card" }); toast.success("Omar published a 5-a-side game", { description: "Pitch 1 · Wed 11 Nov, 8 PM is now held while it fills." }); }}>
                <Zap aria-hidden /> Simulate: Omar books Pitch 1
              </Button>
            ) : omarGame.status === "filling" ? (
              <Button variant="dark" onClick={() => { dispatch({ type: "simulateJoins", gameId: omarGame.id, count: neededToConfirm(omarGame) }); toast.success("Omar's game filled", { description: "The held slot is now a confirmed booking." }); }}>
                <FastForward aria-hidden /> Simulate: Omar&apos;s game fills
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/owner/calendar">Open calendar <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-primary text-white" : "bg-slate-100 text-slate-700")}>
                {s.done ? <Check className="size-4" aria-label="Done" /> : i + 1}
              </span>
              <span className={cn(s.done ? "text-slate-500 line-through" : "font-semibold")}>{s.label}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* KPIs */}
      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Today's bookings" value={String(kpis.todayBookings)} icon={<CalendarCheck />} delta={kpis.todayDelta} deltaLabel={`${kpis.todayDelta >= 0 ? "+" : ""}${kpis.todayDelta} vs last Sunday`} />
        <KpiTile label="Utilization this week" value={`${utilPct}%`} icon={<Gauge />} delta={utilPct - utilLastPct} deltaLabel={`Last week ${utilLastPct}%`} hint="Court-hours booked so far ÷ open court-hours." />
        <KpiTile label="Revenue this week" value={`EGP ${compactNumber(kpis.revenueWeek)}`} icon={<Banknote />} delta={revenueDelta} deltaLabel={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs last week`} hint={kpis.heldValue ? `+ ${formatEGP(kpis.heldValue)} held in filling Kora games` : undefined} />
        <KpiTile label="No-show rate" value={`${(kpis.noShowRate * 100).toFixed(1)}%`} icon={<UserX />} delta={kpis.noShows} upIsGood={false} deltaLabel={`${kpis.noShows} no-shows · last 7 days`} hint="Kora games are pre-paid, so no-shows there cost you nothing." />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Heatmap */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Utilization by day & hour</CardTitle>
              <CardDescription>This week, all 3 courts. Hover a cell for details.</CardDescription>
            </div>
            <Button asChild variant="volt">
              <Link href="/owner/courts/fill"><Sparkles aria-hidden /> Fill idle slots</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <UtilizationHeatmap rows={heat.rows} hours={heat.hours} courtCount={heat.courtCount} />
          </CardContent>
        </Card>

        {/* Upcoming bookings */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming bookings</CardTitle>
            <Link href="/owner/bookings" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-dark">View all</Link>
          </CardHeader>
          <CardContent>
            <AsyncList
              listKey="owner-upcoming"
              items={upcoming}
              getKey={(b) => b.id}
              className="divide-y"
              skeleton={<Skeleton className="my-2 h-14" />}
              errorTitle="Couldn't load bookings"
              empty={{ icon: <Inbox />, title: "No upcoming bookings", description: "Promote an idle slot to get players in." }}
              renderItem={(b) => {
                const court = courtsById.get(b.courtId);
                return (
                  <div className={cn("flex items-center gap-3 py-3", b.status === "held" && "rounded-xl bg-amber-50 px-2")}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                      {court && <SportIcon sport={court.sport} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{dayLabel(b.date)} · {formatTimeRange(b.startHour, b.duration)}</p>
                      <p className="truncate text-xs text-slate-600">{court?.name} · {b.organizerName}</p>
                      <div className="mt-1"><SourceBadge booking={b} /></div>
                    </div>
                    <BookingStatusChip status={b.status} />
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kora games filling */}
        <Card>
          <CardHeader>
            <CardTitle>Kora games filling at your club</CardTitle>
            <CardDescription>Slots are held for free while players join; they become paid bookings at the threshold.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveGames.length === 0 ? (
              <p className="text-sm text-slate-600">No games filling right now.</p>
            ) : (
              liveGames.map((g) => (
                <div key={g.id} className="rounded-2xl border p-3">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <SportIcon sport={g.sport} className="size-4 text-brand" />
                    {courtsById.get(g.courtId)?.name} · {dayLabel(g.date)}, {formatTimeRange(g.startHour, g.duration)}
                  </p>
                  <SpotsBar game={g} className="mt-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Requests waiting ({requests.length})</CardTitle>
              <CardDescription>Manual approval is on for private bookings.</CardDescription>
            </div>
            <Link href="/owner/bookings" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-dark">Manage</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-600">You&apos;re all caught up.</p>
            ) : (
              requests.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border p-3">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold">{b.organizerName}</p>
                    <p className="text-slate-600">{courtsById.get(b.courtId)?.name} · {dayLabel(b.date)}, {formatTimeRange(b.startHour, b.duration)} · {formatEGP(b.amount)}</p>
                  </div>
                  <Button size="xs" className="h-11 px-3" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "confirmed" }); toast.success("Booking accepted"); }}>Accept</Button>
                  <Button size="xs" variant="outline" className="h-11 px-3" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "declined" }); toast("Booking declined", { description: "The player's hold was released." }); }}>Decline</Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
