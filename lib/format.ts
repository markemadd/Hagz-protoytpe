import { DEMO_TODAY, demoNow } from "./constants";

/* All dates are "YYYY-MM-DD" strings interpreted in UTC, so no timezone drift. */

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a date string at UTC midnight. */
function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

/** Shift a date string by n days. O(1). */
export function addDays(date: string, n: number) {
  const d = toDate(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: string, b: string) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: string) {
  return toDate(date).getUTCDay();
}

/** Egypt's weekend is Friday + Saturday. */
export function isWeekend(date: string) {
  const dow = dayOfWeek(date);
  return dow === 5 || dow === 6;
}

/** "Thu" */
export function weekdayShort(date: string) {
  return DAY_SHORT[dayOfWeek(date)];
}

/** "12 Nov" */
export function dayMonth(date: string) {
  const d = toDate(date);
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

/** "Today" / "Tomorrow" / "Thu 12 Nov" relative to the demo clock. */
export function dayLabel(date: string) {
  const diff = daysBetween(DEMO_TODAY, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return `${weekdayShort(date)} ${dayMonth(date)}`;
}

/** "Thursday, 12 November 2026" */
export function longDate(date: string) {
  const d = toDate(date);
  return `${DAY_LONG[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** 19.5 -> { h: 7, m: "30", ampm: "PM" } */
function splitHour(hour: number) {
  const whole = Math.floor(hour) % 24; // 24 -> midnight
  const minutes = Math.round((hour - Math.floor(hour)) * 60);
  const ampm = whole >= 12 ? "PM" : "AM";
  const h12 = whole % 12 === 0 ? 12 : whole % 12;
  return { h12, minutes, ampm };
}

/** 19 -> "7 PM", 19.5 -> "7:30 PM" */
export function formatHour(hour: number) {
  const { h12, minutes, ampm } = splitHour(hour);
  return minutes ? `${h12}:${String(minutes).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
}

/** Compact hour for dense grids: 19 -> "7p" */
export function formatHourCompact(hour: number) {
  const { h12, ampm } = splitHour(hour);
  return `${h12}${ampm === "AM" ? "a" : "p"}`;
}

/** (19, 1.5) -> "7:00–8:30 PM"; crosses meridiem -> "11:00 AM–12:30 PM" */
export function formatTimeRange(start: number, duration: number) {
  const a = splitHour(start);
  const b = splitHour(start + duration);
  const fmt = (x: { h12: number; minutes: number }) => `${x.h12}:${String(x.minutes).padStart(2, "0")}`;
  return a.ampm === b.ampm
    ? `${fmt(a)}–${fmt(b)} ${b.ampm}`
    : `${fmt(a)} ${a.ampm}–${fmt(b)} ${b.ampm}`;
}

/** "1.5" -> "90 min", "1" -> "60 min", "2" -> "2 h" */
export function formatDuration(hours: number) {
  return hours >= 2 && Number.isInteger(hours) ? `${hours} h` : `${Math.round(hours * 60)} min`;
}

const egp = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 });

/** 1200 -> "EGP 1,200" */
export function formatEGP(amount: number) {
  return `EGP ${egp.format(Math.round(amount))}`;
}

/** 12850 -> "12.9K" for KPI tiles. */
export function compactNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return egp.format(n);
}

/** "just now", "5m ago", "3h ago", "2d ago" relative to the demo clock. */
export function relativeTime(at: number) {
  const seconds = Math.max(0, Math.floor((demoNow() - at) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Clock time for chat bubbles: "5:42 PM" in Cairo (UTC+2). */
export function clockTime(at: number) {
  const d = new Date(at + 2 * 3_600_000);
  return formatHour(d.getUTCHours() + d.getUTCMinutes() / 60);
}

/** "Omar Hassan" -> "OH" */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** "Omar Hassan" -> "Omar" */
export function firstName(name: string) {
  return name.split(" ")[0];
}

/** Pluralise: (3, "player") -> "3 players" */
export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
