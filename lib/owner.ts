/* =========================================================================
   Owner-side analytics for Karim's club. Pure functions over shared state,
   so anything a player does (join, create, book) is reflected immediately.

   Complexity: every function walks the venue's bookings once (O(B)) or the
   court × day × hour grid once (O(C · D · H) = 3 × 7 × 17 cells), using the
   O(1) booking index for cell lookups.
   ========================================================================= */

import { indexBookings, isOccupying, isPastHour, openHours } from "./availability";
import { DEMO_TODAY, KORA_COMMISSION, PERSONAS, SPORTS, demoNow } from "./constants";
import { addDays, dayLabel, formatHour } from "./format";
import { distanceFromArea, interestedPlayers } from "./matching";
import { OMAR_FRIENDS } from "./mock-data";
import { isPeak, slotKey, slotPrice, slotTotal } from "./pricing";
import type { KoraState } from "./store";
import type { Booking, Court, Game, Player, Venue } from "./types";
import { uid } from "./utils";

export const OWNER_VENUE_ID = PERSONAS.karim.venueId;

/** The 7 dates of a calendar week starting Sunday; offset 0 = this week. */
export function weekDates(offset: number) {
  return Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, offset * 7 + i));
}

export function ownerCourts(state: KoraState) {
  return state.courts.filter((c) => c.venueId === OWNER_VENUE_ID);
}

export function ownerBookings(state: KoraState) {
  return state.bookings.filter((b) => b.venueId === OWNER_VENUE_ID);
}

/** Bookings that generate revenue for the owner. */
const PAID = new Set(["confirmed", "completed"]);

export type Kpis = {
  todayBookings: number;
  todayDelta: number; // vs same day last week
  utilization: number; // 0–1, this week (booked so far)
  utilizationLastWeek: number;
  revenueWeek: number;
  revenueLastWeek: number;
  heldValue: number; // EGP sitting in held (still filling) Kora games
  noShowRate: number; // 0–1, last 7 days
  noShows: number;
};

/** Headline numbers for the dashboard. O(B + C·D·H). */
export function computeKpis(state: KoraState): Kpis {
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const courts = ownerCourts(state);
  const bookings = ownerBookings(state);
  const thisWeek = new Set(weekDates(0));
  const lastWeek = new Set(weekDates(-1));
  const lastWeekToday = addDays(DEMO_TODAY, -7);

  let todayBookings = 0, todayLastWeek = 0, revenueWeek = 0, revenueLastWeek = 0, heldValue = 0, noShows = 0, pastTotal = 0;
  for (const b of bookings) {
    const active = isOccupying(b.status) && b.status !== "requested";
    if (b.date === DEMO_TODAY && active) todayBookings++;
    if (b.date === lastWeekToday && active) todayLastWeek++;
    if (thisWeek.has(b.date) && PAID.has(b.status)) revenueWeek += b.amount;
    if (lastWeek.has(b.date) && PAID.has(b.status)) revenueLastWeek += b.amount;
    if (b.status === "held") heldValue += b.amount;
    if (lastWeek.has(b.date) || (b.date === DEMO_TODAY && isPastHour(b.date, b.startHour))) {
      if (b.status === "no_show") noShows++;
      if (b.status === "no_show" || b.status === "completed") pastTotal++;
    }
  }

  const capacity = courts.length * (venue.closeHour - venue.openHour) * 7; // court-hours per week
  return {
    todayBookings,
    todayDelta: todayBookings - todayLastWeek,
    utilization: occupiedHours(state, courts, weekDates(0)) / capacity,
    utilizationLastWeek: occupiedHours(state, courts, weekDates(-1)) / capacity,
    revenueWeek,
    revenueLastWeek,
    heldValue,
    noShowRate: pastTotal ? noShows / pastTotal : 0,
    noShows,
  };
}

/** Count occupied court-hours across the given dates. */
function occupiedHours(state: KoraState, courts: Court[], dates: string[]) {
  const index = indexBookings(ownerBookings(state));
  let n = 0;
  for (const c of courts) for (const d of dates) for (let h = 0; h < 24; h++) {
    const b = index.get(slotKey(c.id, d, h));
    if (b && b.status !== "requested") n++;
  }
  return n;
}

/** Heatmap matrix: rows = days of the week, cols = open hours, value = courts booked (0…courts). */
export function utilizationHeatmap(state: KoraState, dates: string[]) {
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const courts = ownerCourts(state);
  const index = indexBookings(ownerBookings(state));
  const hours = openHours(venue.openHour, venue.closeHour);
  const rows = dates.map((date) => ({
    date,
    cells: hours.map((hour) => {
      let booked = 0;
      for (const c of courts) {
        const b = index.get(slotKey(c.id, date, hour));
        if (b && b.status !== "requested") booked++;
      }
      return { hour, booked };
    }),
  }));
  return { rows, hours, courtCount: courts.length };
}

/** Next bookings from "now", soonest first. */
export function upcomingBookings(state: KoraState, limit = 8) {
  return ownerBookings(state)
    .filter((b) => ["held", "confirmed", "requested"].includes(b.status) && !isPastHour(b.date, b.startHour))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour)
    .slice(0, limit);
}

/* ------------------------------ Idle slots ------------------------------ */
export type IdleSlot = {
  key: string;
  court: Court;
  date: string;
  hour: number;
  listPrice: number;
  suggestedPct: number;
  suggestedPrice: number;
  interested: Player[]; // players likely to book it (sport, distance, usual availability)
  promoted: boolean;
  discountPct: number;
};

/**
 * Free off-peak hours in the next 7 days with a suggested discount.
 * Rule of thumb from revenue management: discount more where expected demand
 * is lower, because an unsold hour earns nothing (Talluri & van Ryzin, 2004).
 * O(C · D · H · P) with P = 20 players — tiny for one club.
 */
export function idleSlots(state: KoraState): IdleSlot[] {
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const index = indexBookings(state.bookings);
  const out: IdleSlot[] = [];
  for (const court of ownerCourts(state)) {
    for (let day = 0; day < 7; day++) {
      const date = addDays(DEMO_TODAY, day);
      for (const hour of openHours(venue.openHour, venue.closeHour)) {
        const key = slotKey(court.id, date, hour);
        const override = state.slotOverrides[key];
        if (isPeak(date, hour) || index.has(key) || override?.blocked || isPastHour(date, hour)) continue;
        const interested = interestedPlayers(state.players, court.sport, venue, date, hour);
        const suggestedPct = interested.length >= 3 ? 15 : interested.length >= 1 ? 20 : 30;
        const listPrice = slotPrice(court, date, hour, { price: override?.price }).price;
        out.push({
          key,
          court,
          date,
          hour,
          listPrice,
          suggestedPct,
          suggestedPrice: Math.round((listPrice * (1 - suggestedPct / 100)) / 10) * 10,
          interested,
          promoted: !!override?.promoted,
          discountPct: override?.discountPct ?? suggestedPct,
        });
      }
    }
  }
  // Most demand first, then soonest.
  return out.sort((a, b) => b.interested.length - a.interested.length || a.date.localeCompare(b.date) || a.hour - b.hour);
}

/** Who gets the "deal" push: interested players + personas who play that sport within their radius. */
export function dealRecipients(state: KoraState, slot: IdleSlot, venue: Venue) {
  const ids = new Set(slot.interested.map((p) => p.id));
  for (const p of state.players) {
    const isPersona = p.id === PERSONAS.omar.playerId || p.id === PERSONAS.salma.playerId;
    if (isPersona && p.sports[slot.court.sport] && distanceFromArea(p.area, venue) <= p.radiusKm) ids.add(p.id);
  }
  return Array.from(ids);
}

export function dealMessage(slot: IdleSlot, venue: Venue, pct: number) {
  const price = Math.round((slot.listPrice * (1 - pct / 100)) / 10) * 10;
  return {
    title: `Off-peak deal: −${pct}% ${SPORTS[slot.court.sport].short.toLowerCase()} near you`,
    body: `${slot.court.name} at ${venue.name} · ${dayLabel(slot.date)}, ${formatHour(slot.hour)} · EGP ${price}/h`,
    href: `/play/courts/${venue.id}`,
  };
}

/* --------------------------- Payout summaries --------------------------- */
/** Kora-sourced revenue (phone bookings are paid at the desk, not via Kora). */
export function koraRevenue(bookings: Booking[], dates: string[]) {
  const set = new Set(dates);
  let gross = 0, count = 0;
  for (const b of bookings) {
    if (b.source === "phone" || !set.has(b.date) || !PAID.has(b.status)) continue;
    gross += b.amount;
    count++;
  }
  const fee = Math.round(gross * KORA_COMMISSION);
  return { gross, fee, net: gross - fee, count };
}

/* ------------------------- Demo: Omar's booking ------------------------- */
/** The game Omar creates in his scripted flow, used by the owner-side simulator. */
export function omarDemoGame(state: KoraState): Game {
  const court = state.courts.find((c) => c.id === "c-nasr-1")!;
  const date = addDays(DEMO_TODAY, 3);
  return {
    id: uid("g"),
    sport: "football5",
    courtId: court.id,
    venueId: court.venueId,
    date,
    startHour: 20,
    duration: 1,
    capacity: 10,
    minPlayers: 8,
    level: "intermediate",
    visibility: "public",
    organizerId: PERSONAS.omar.playerId,
    playerIds: [PERSONAS.omar.playerId, ...OMAR_FRIENDS.slice(0, 4)],
    invitedIds: [],
    status: "filling",
    courtTotal: slotTotal(court, date, 20, 1, state.slotOverrides),
    createdAt: demoNow(),
  };
}

/** Omar's newest game at Karim's club created during the demo (ids from uid start with "g-"). */
export function omarGameAtClub(state: KoraState) {
  return [...state.games].reverse().find((g) => g.organizerId === PERSONAS.omar.playerId && g.venueId === OWNER_VENUE_ID && g.id.startsWith("g-"));
}
