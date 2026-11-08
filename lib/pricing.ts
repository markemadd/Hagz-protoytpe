import { SERVICE_FEE } from "./constants";
import { isWeekend } from "./format";
import type { Court, SlotOverride } from "./types";

/**
 * Peak hours: weekday evenings from 5 PM, and weekend (Fri/Sat) from noon.
 * Peak/off-peak pricing is the simplest form of revenue management for
 * perishable capacity (Talluri & van Ryzin, 2004): an unsold court-hour is lost forever.
 */
export function isPeak(date: string, hour: number) {
  return hour >= 17 || (isWeekend(date) && hour >= 12);
}

/** List price for one hour on a court, before owner overrides. */
export function basePrice(court: Court, date: string, hour: number) {
  return isPeak(date, hour) ? court.pricePeak : court.priceOffPeak;
}

/** Stable key for a single court-hour, used by owner overrides and availability indexes. */
export function slotKey(courtId: string, date: string, hour: number) {
  return `${courtId}|${date}|${hour}`;
}

export type SlotPrice = {
  price: number; // what a player pays per hour
  base: number; // list price before discount
  discountPct: number; // 0 when not promoted
  promoted: boolean;
};

/** Final hourly price after owner price edits and promotions. O(1). */
export function slotPrice(court: Court, date: string, hour: number, override?: SlotOverride): SlotPrice {
  // An explicit owner price replaces the peak/off-peak list price.
  const base = override?.price ?? basePrice(court, date, hour);
  // Promotions apply a percentage discount on top of the base price.
  const discountPct = override?.promoted ? override.discountPct ?? 0 : 0;
  // Round to the nearest 10 EGP so prices look like real menu prices.
  const price = Math.round((base * (1 - discountPct / 100)) / 10) * 10;
  return { price, base, discountPct, promoted: Boolean(override?.promoted) };
}

/** Total court cost for a multi-hour slot: sum of each hour's price (half hours pro-rated). */
export function slotTotal(
  court: Court,
  date: string,
  startHour: number,
  duration: number,
  overrides: Record<string, SlotOverride>,
) {
  let total = 0;
  // Walk the slot hour by hour; a 1.5h slot = 1 full hour + half of the next.
  for (let t = startHour; t < startHour + duration; t += 1) {
    const hour = Math.floor(t);
    const fraction = Math.min(1, startHour + duration - t);
    total += slotPrice(court, date, hour, overrides[slotKey(court.id, date, hour)]).price * fraction;
  }
  return Math.round(total);
}

/** Round a share up to the nearest 5 EGP so nobody pays odd piastres. */
function roundUp5(amount: number) {
  return Math.ceil(amount / 5) * 5;
}

/** Court share per player when the game is full. */
export function sharePerPlayer(courtTotal: number, players: number) {
  return roundUp5(courtTotal / Math.max(1, players));
}

/** Breakdown shown on game cards, details and checkout. */
export function priceSplit(courtTotal: number, capacity: number, minPlayers: number) {
  const shareFull = sharePerPlayer(courtTotal, capacity); // everyone shows up
  const shareMax = sharePerPlayer(courtTotal, minPlayers); // only the minimum joins
  return {
    shareFull,
    shareMax,
    fee: SERVICE_FEE,
    perPerson: shareFull + SERVICE_FEE, // headline "price per person"
    maxPerPerson: shareMax + SERVICE_FEE, // the most a player can ever be charged (the hold)
  };
}
