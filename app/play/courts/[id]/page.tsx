"use client";

import { MapPin, Phone, SearchX, Star, Tag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AmenityList } from "@/components/kora/amenity-icon";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { CourtArt } from "@/components/kora/court-art";
import { EmptyState } from "@/components/kora/list-state";
import { MiniMap } from "@/components/kora/mini-map";
import { SportIcon } from "@/components/kora/sport-icon";
import { ScreenHeader, SectionTitle, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AREAS, DEMO_TODAY, SPORTS } from "@/lib/constants";
import { isWindowFree, openHours, slotInfo, type SlotInfo } from "@/lib/availability";
import { addDays, dayLabel, dayMonth, formatDuration, formatEGP, formatHour, formatTimeRange, relativeTime, weekdayShort } from "@/lib/format";
import { distanceFromArea } from "@/lib/matching";
import { slotTotal } from "@/lib/pricing";
import { venueCourts } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function CourtDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, me, venuesById, bookingIndex, hydrated } = useKora();
  const venue = venuesById.get(id);
  const courts = useMemo(() => venueCourts(state.courts, id), [state.courts, id]);

  const [courtId, setCourtId] = useState<string | null>(null);
  const [date, setDate] = useState(DEMO_TODAY);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);

  const court = courts.find((c) => c.id === courtId) ?? courts[0];

  // One O(1) lookup per hour via the booking index: O(H) for the whole grid.
  const slots: SlotInfo[] = useMemo(
    () => (venue && court ? openHours(venue.openHour, venue.closeHour).map((h) => slotInfo(court, date, h, bookingIndex, state.slotOverrides)) : []),
    [venue, court, date, bookingIndex, state.slotOverrides],
  );

  if (!venue || !court) {
    return (
      <div>
        <ScreenHeader title="Venue" backHref="/play/explore" />
        <div className="p-4">{hydrated ? <EmptyState icon={<SearchX />} title="Venue not found" description="It may no longer be on Kora." /> : <Skeleton className="h-60 w-full" />}</div>
      </div>
    );
  }

  const km = distanceFromArea(me.area, venue);
  const reviews = state.reviews.filter((r) => r.venueId === venue.id).slice(0, 2);
  const windowOk = startHour !== null && startHour + duration <= venue.closeHour && isWindowFree(court, date, startHour, duration, bookingIndex, state.slotOverrides);
  const total = startHour !== null ? slotTotal(court, date, startHour, duration, state.slotOverrides) : 0;
  const days = Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, i));

  function book() {
    if (startHour === null) return;
    dispatch({ type: "setCheckout", draft: { kind: "court", courtId: court.id, date, startHour, duration } });
    router.push("/play/checkout");
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative h-52 shrink-0">
        <CourtArt sport={court.sport} label={`${court.name} at ${venue.name}`} />
        <ScreenHeader title={venue.name} backHref="/play/explore" transparent />
      </div>

      <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
        <section>
          <h1 className="text-2xl font-extrabold tracking-tight">{venue.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="size-4" aria-hidden /> {AREAS[venue.area].label} · {km} km · {venue.address}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-500" aria-hidden /> <strong>{venue.rating}</strong>
            <span className="text-slate-600">({venue.reviewCount} reviews) · Open {formatHour(venue.openHour)}–{formatHour(venue.closeHour)}</span>
          </p>
          <p className="mt-3 text-sm text-slate-700">{venue.description}</p>
          <AmenityList amenities={venue.amenities} className="mt-3" />
        </section>

        <MiniMap pins={[{ id: venue.id, venue, label: venue.name }]} focus={venue} className="h-32" />

        {/* Court picker */}
        <section aria-labelledby="courts">
          <SectionTitle id="courts" title={`Courts (${courts.length})`} />
          <div role="group" aria-labelledby="courts" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {courts.map((c) => (
              <ChoiceChip key={c.id} selected={c.id === court.id} onClick={() => { setCourtId(c.id); setStartHour(null); }}>
                <SportIcon sport={c.sport} /> {c.name}
              </ChoiceChip>
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ["Sport", SPORTS[court.sport].label],
              ["Setting", `${court.indoor ? "Indoor" : "Outdoor"} · ${court.surface}`],
              ["Size", `${court.size} · up to ${court.capacity}`],
              ["Price", `${formatEGP(court.priceOffPeak)} off-peak · ${formatEGP(court.pricePeak)} peak`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold text-slate-600">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Slot availability grid */}
        <section aria-labelledby="availability">
          <SectionTitle id="availability" title="Availability" />
          <div role="group" aria-label="Date" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={date === d}
                onClick={() => { setDate(d); setStartHour(null); }}
                className={cn("flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", date === d ? "border-primary bg-primary text-white" : "border-slate-300")}
              >
                <span className={cn("text-xs font-semibold", date === d ? "text-emerald-50" : "text-slate-600")}>{weekdayShort(d)}</span>
                <span className="text-lg font-extrabold">{dayMonth(d).split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <ul className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-700" aria-label="Legend">
            <li className="flex items-center gap-1.5"><span className="size-3 rounded border border-slate-300 bg-white" /> Free</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-volt" /> Deal</li>
            <li className="flex items-center gap-1.5"><span className="hatch-slate size-3 rounded" /> Booked</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> Selected</li>
          </ul>

          <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label={`Start times on ${dayLabel(date)}`}>
            {slots.map((s) => {
              const free = s.state === "free";
              const inSelection = startHour !== null && s.hour >= startHour && s.hour < startHour + duration;
              const label = free ? `${formatHour(s.hour)}, ${formatEGP(s.price.price)}${s.price.promoted ? `, ${s.price.discountPct}% off` : ""}` : `${formatHour(s.hour)}, ${s.state === "past" ? "past" : "unavailable"}`;
              return (
                <button
                  key={s.hour}
                  type="button"
                  disabled={!free}
                  aria-pressed={inSelection}
                  aria-label={label}
                  onClick={() => setStartHour(s.hour)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    inSelection
                      ? "border-primary bg-primary text-white"
                      : free
                        ? s.price.promoted
                          ? "border-lime-500 bg-volt text-slate-900"
                          : "border-slate-300 bg-white text-slate-900 hover:border-primary"
                        : "hatch-slate cursor-not-allowed border-slate-200 text-slate-500",
                  )}
                >
                  <span className="font-bold">{formatHour(s.hour)}</span>
                  <span className={cn("text-[11px]", !free && "line-through")}>
                    {free ? (s.price.promoted ? `−${s.price.discountPct}%` : `${s.price.price}`) : s.state === "past" ? "Past" : s.state === "blocked" ? "Closed" : "Booked"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <p id="dur" className="text-sm font-bold">Duration</p>
            <div role="group" aria-labelledby="dur" className="mt-2 grid grid-cols-3 gap-2">
              {[1, 1.5, 2].map((d) => (
                <ChoiceChip key={d} selected={duration === d} onClick={() => setDuration(d)} className="rounded-xl">{formatDuration(d)}</ChoiceChip>
              ))}
            </div>
            {startHour !== null && !windowOk && (
              <p className="mt-2 text-sm font-medium text-rose-700" role="alert">The next hour is taken — choose a shorter duration or another start time.</p>
            )}
          </div>
        </section>

        {/* Reviews */}
        <section aria-labelledby="reviews">
          <SectionTitle id="reviews" title="Reviews" />
          {reviews.length === 0 ? (
            <EmptyState icon={<Star />} title="No reviews yet" description="Play here and be the first to rate it." />
          ) : (
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border p-3 text-sm">
                  <p className="flex items-center justify-between font-bold">
                    {r.authorName}
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden /> {r.rating} · {relativeTime(r.at)}</span>
                  </p>
                  <p className="mt-1 text-slate-700">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
          <Button variant="link" className="mt-1 px-0" onClick={() => router.push("/play/create")}>Want to split the cost? Create a game instead →</Button>
        </section>

        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="size-4" aria-hidden /> {venue.phone}
        </p>
      </div>

      <StickyFooter>
        {startHour !== null && windowOk ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{dayLabel(date)} · {formatTimeRange(startHour, duration)}</p>
              <p className="text-xl font-extrabold">{formatEGP(total)}</p>
            </div>
            <Button size="lg" className="flex-1" onClick={book}>Book court</Button>
          </div>
        ) : (
          <Button size="lg" className="w-full" disabled>
            <Tag aria-hidden /> Pick a start time to book
          </Button>
        )}
        <p className="mt-2 text-center text-xs text-slate-600">
          Full-court booking for your own group. <Link className="font-semibold text-brand-dark underline" href="/play/find">Looking for players?</Link>
        </p>
      </StickyFooter>
    </div>
  );
}
