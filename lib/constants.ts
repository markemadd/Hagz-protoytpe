import type { Amenity, AreaId, SkillLevel, SportId, TimeRangeId } from "./types";

/* -------------------------------------------------------------------------
   Demo clock. The prototype is frozen to Sunday 8 Nov 2026, 5:30 PM Cairo
   (UTC+2, no DST in November) so mock data and "Thu 6–10 PM" scenarios
   always line up, no matter when the prototype is opened.
   ------------------------------------------------------------------------- */
export const DEMO_TODAY = "2026-11-08";
export const DEMO_NOW_HOUR = 17.5;
export const DEMO_NOW = Date.UTC(2026, 10, 8, 15, 30); // 17:30 Cairo time

/** Wall-clock time the module booted; lets the demo clock tick forward naturally. */
const BOOTED_AT = Date.now();

/** Current demo timestamp (ms): frozen start + real time elapsed since page load. */
export function demoNow() {
  return DEMO_NOW + (Date.now() - BOOTED_AT);
}

/* ------------------------------- Sports -------------------------------- */
export type SportMeta = {
  label: string;
  short: string;
  capacity: number; // default max players
  minPlayers: number; // default confirmation threshold
  duration: number; // default slot length in hours
};

export const SPORTS: Record<SportId, SportMeta> = {
  football5: { label: "5-a-side Football", short: "5-a-side", capacity: 10, minPlayers: 8, duration: 1 },
  football7: { label: "7-a-side Football", short: "7-a-side", capacity: 14, minPlayers: 12, duration: 1.5 },
  padel: { label: "Padel", short: "Padel", capacity: 4, minPlayers: 4, duration: 1.5 },
  basketball: { label: "Basketball", short: "Basketball", capacity: 10, minPlayers: 8, duration: 1 },
  tennis: { label: "Tennis", short: "Tennis", capacity: 4, minPlayers: 4, duration: 1.5 },
};

export const SPORT_IDS = Object.keys(SPORTS) as SportId[];

/* ---------------------------- Skill levels ----------------------------- */
export const LEVELS: Record<SkillLevel, { label: string; description: string }> = {
  beginner: {
    label: "Beginner",
    description: "New or casual. Still learning the rules and basic shots.",
  },
  intermediate: {
    label: "Intermediate",
    description: "Play regularly. Solid basics and comfortable in a real match.",
  },
  advanced: {
    label: "Advanced",
    description: "Competitive. Strong technique and tactics, league or tournament experience.",
  },
};

export const LEVEL_IDS = Object.keys(LEVELS) as SkillLevel[];

/** Ordinal position of each level, used for "how far apart are two levels". */
export const LEVEL_RANK: Record<SkillLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/* ------------------------------- Areas --------------------------------- */
export const AREAS: Record<AreaId, { label: string; lat: number; lng: number }> = {
  "new-cairo": { label: "New Cairo", lat: 30.03, lng: 31.47 },
  maadi: { label: "Maadi", lat: 29.96, lng: 31.257 },
  zamalek: { label: "Zamalek", lat: 30.061, lng: 31.22 },
  "sheikh-zayed": { label: "Sheikh Zayed", lat: 30.044, lng: 30.98 },
  "nasr-city": { label: "Nasr City", lat: 30.056, lng: 31.33 },
  heliopolis: { label: "Heliopolis", lat: 30.09, lng: 31.325 },
};

export const AREA_IDS = Object.keys(AREAS) as AreaId[];

/* ---------------------------- Time ranges ------------------------------ */
export const TIME_RANGES: Record<TimeRangeId, { label: string; from: number; to: number }> = {
  morning: { label: "Morning", from: 7, to: 12 },
  afternoon: { label: "Afternoon", from: 12, to: 17 },
  evening: { label: "Evening", from: 17, to: 21 },
  late: { label: "Late night", from: 21, to: 24 },
};

export const TIME_RANGE_IDS = Object.keys(TIME_RANGES) as TimeRangeId[];

/* ------------------------------ Amenities ------------------------------ */
export const AMENITIES: Record<Amenity, string> = {
  parking: "Parking",
  lighting: "Floodlights",
  changing: "Changing rooms",
  showers: "Showers",
  cafe: "Café",
  rental: "Gear rental",
  ac: "Air-conditioned",
  water: "Free water",
};

/* ------------------------------ Business ------------------------------- */
export const SERVICE_FEE = 10; // EGP Kora booking fee per player
export const KORA_COMMISSION = 0.1; // 10% of Kora-sourced court revenue
export const HOLD_RELEASE_HOURS = 6; // unfilled games are cancelled & refunded this long before kickoff

/** The three personas and the ids they map to in mock data. */
export const PERSONAS = {
  omar: { playerId: "p-omar", name: "Omar" },
  salma: { playerId: "p-salma", name: "Salma" },
  karim: { ownerId: "o-karim", venueId: "v-nasr", name: "Karim" },
} as const;
