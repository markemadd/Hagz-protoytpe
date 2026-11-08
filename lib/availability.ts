import { DEMO_NOW_HOUR, DEMO_TODAY } from "./constants";
import { daysBetween } from "./format";
import { slotKey, slotPrice, type SlotPrice } from "./pricing";
import type { Booking, BookingStatus, Court, SlotOverride } from "./types";

/* =========================================================================
   Court availability, shared by the player app (book / create game) and the
   owner app (calendar). We index bookings by court-hour once (O(B)) so every
   later lookup is O(1) instead of scanning all bookings per cell.
   ========================================================================= */

/** Statuses that occupy a court-hour. Declined/cancelled bookings free the slot again. */
const OCCUPYING: ReadonlySet<BookingStatus> = new Set(["requested", "held", "confirmed", "completed", "no_show"]);

export function isOccupying(status: BookingStatus) {
  return OCCUPYING.has(status);
}

/** Map every occupied court-hour to the booking that occupies it. O(B · duration). */
export function indexBookings(bookings: Booking[]) {
  const index = new Map<string, Booking>();
  for (const b of bookings) {
    if (!isOccupying(b.status)) continue;
    // A 1.5 h booking from 19:00 occupies the 19:00 and 20:00 cells.
    for (let t = b.startHour; t < b.startHour + b.duration; t += 1) {
      index.set(slotKey(b.courtId, b.date, Math.floor(t)), b);
    }
  }
  return index;
}

export type SlotState = "past" | "booked" | "held" | "requested" | "blocked" | "free";

export type SlotInfo = {
  hour: number;
  state: SlotState;
  booking?: Booking;
  price: SlotPrice;
};

/** True when the hour has already started on the demo clock. */
export function isPastHour(date: string, hour: number) {
  const diff = daysBetween(DEMO_TODAY, date);
  return diff < 0 || (diff === 0 && hour < Math.ceil(DEMO_NOW_HOUR));
}

/** Resolve one court-hour into a display state. O(1). */
export function slotInfo(
  court: Court,
  date: string,
  hour: number,
  index: Map<string, Booking>,
  overrides: Record<string, SlotOverride>,
): SlotInfo {
  const key = slotKey(court.id, date, hour);
  const override = overrides[key];
  const booking = index.get(key);
  const price = slotPrice(court, date, hour, override);
  if (booking) {
    const state: SlotState =
      booking.status === "held" ? "held" : booking.status === "requested" ? "requested" : "booked";
    return { hour, state, booking, price };
  }
  if (override?.blocked) return { hour, state: "blocked", price };
  if (isPastHour(date, hour)) return { hour, state: "past", price };
  return { hour, state: "free", price };
}

/** Is a multi-hour window free on a court? O(duration). */
export function isWindowFree(
  court: Court,
  date: string,
  startHour: number,
  duration: number,
  index: Map<string, Booking>,
  overrides: Record<string, SlotOverride>,
) {
  for (let t = startHour; t < startHour + duration; t += 1) {
    if (slotInfo(court, date, Math.floor(t), index, overrides).state !== "free") return false;
  }
  return true;
}

/** Hours a venue is open, as a list: [7, 8, …, 23]. */
export function openHours(openHour: number, closeHour: number) {
  return Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);
}
