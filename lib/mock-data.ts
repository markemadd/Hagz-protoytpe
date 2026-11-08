import { DEMO_NOW, DEMO_NOW_HOUR, DEMO_TODAY, PERSONAS } from "./constants";
import { addDays, isWeekend } from "./format";
import { slotKey, slotTotal } from "./pricing";
import type {
  AppNotification,
  Availability,
  Booking,
  ChatMessage,
  Court,
  CourtReview,
  Game,
  Player,
  Venue,
} from "./types";

/* =========================================================================
   Realistic mock data for Cairo. Everything is deterministic (seeded RNG),
   so the server render and the browser render produce identical markup.
   ========================================================================= */

const MIN = 60_000; // one minute in ms
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Day offset helper: d(3) = Wednesday 11 Nov 2026. */
const d = (offset: number) => addDays(DEMO_TODAY, offset);

/* -------------------------------- Venues -------------------------------- */
export const VENUES: Venue[] = [
  {
    id: "v-nasr",
    name: "Nasr Arena Sports Club",
    area: "nasr-city",
    address: "14 Abbas El Akkad St, Nasr City",
    lat: 30.0561,
    lng: 31.3417,
    ownerId: PERSONAS.karim.ownerId,
    rating: 4.6,
    reviewCount: 128,
    amenities: ["parking", "lighting", "changing", "showers", "cafe", "water"],
    openHour: 7,
    closeHour: 24,
    phone: "+20 100 412 7788",
    description: "Family-run club with two floodlit football pitches and an indoor panoramic padel court.",
  },
  {
    id: "v-maadi-padel",
    name: "Maadi Padel Park",
    area: "maadi",
    address: "Road 233, Degla, Maadi",
    lat: 29.9625,
    lng: 31.2585,
    rating: 4.8,
    reviewCount: 214,
    amenities: ["parking", "lighting", "ac", "rental", "cafe", "changing"],
    openHour: 7,
    closeHour: 24,
    phone: "+20 122 908 1144",
    description: "Four padel courts, two of them indoor and air-conditioned. Racket rental at the desk.",
  },
  {
    id: "v-degla",
    name: "Degla Hoops Center",
    area: "maadi",
    address: "Road 250, Degla, Maadi",
    lat: 29.959,
    lng: 31.278,
    rating: 4.5,
    reviewCount: 86,
    amenities: ["lighting", "changing", "water", "rental"],
    openHour: 8,
    closeHour: 24,
    phone: "+20 111 330 2290",
    description: "Indoor hardwood court plus an outdoor court under floodlights. Pick-up runs every evening.",
  },
  {
    id: "v-zamalek",
    name: "Zamalek Riverside Courts",
    area: "zamalek",
    address: "Abu El Feda St, Zamalek",
    lat: 30.0626,
    lng: 31.2165,
    rating: 4.7,
    reviewCount: 173,
    amenities: ["lighting", "changing", "showers", "cafe"],
    openHour: 7,
    closeHour: 23,
    phone: "+20 102 551 6070",
    description: "Nile-side clay and hard tennis courts with a single outdoor padel court.",
  },
  {
    id: "v-newcairo",
    name: "Kickoff Arena New Cairo",
    area: "new-cairo",
    address: "90th St, Fifth Settlement, New Cairo",
    lat: 30.0131,
    lng: 31.43,
    rating: 4.4,
    reviewCount: 302,
    amenities: ["parking", "lighting", "changing", "showers", "cafe", "rental"],
    openHour: 8,
    closeHour: 24,
    phone: "+20 109 776 4420",
    description: "Busy football hub: two 5-a-side pitches, a 7-a-side stadium pitch and an indoor padel court.",
  },
  {
    id: "v-zayed",
    name: "Zayed Sports Village",
    area: "sheikh-zayed",
    address: "Central Axis, Sheikh Zayed City",
    lat: 30.039,
    lng: 30.985,
    rating: 4.3,
    reviewCount: 95,
    amenities: ["parking", "lighting", "changing", "cafe"],
    openHour: 8,
    closeHour: 24,
    phone: "+20 115 220 9031",
    description: "Spacious multi-sport village with a 7-a-side pitch, tennis and an indoor basketball hall.",
  },
];

/* -------------------------------- Courts -------------------------------- */
export const COURTS: Court[] = [
  // Karim's club (3 courts)
  { id: "c-nasr-1", venueId: "v-nasr", name: "Pitch 1", sport: "football5", indoor: false, surface: "Artificial turf", size: "40 × 20 m", capacity: 10, pricePeak: 750, priceOffPeak: 500 },
  { id: "c-nasr-2", venueId: "v-nasr", name: "Pitch 2", sport: "football7", indoor: false, surface: "Artificial turf", size: "60 × 35 m", capacity: 14, pricePeak: 1100, priceOffPeak: 800 },
  { id: "c-nasr-3", venueId: "v-nasr", name: "Padel Court", sport: "padel", indoor: true, surface: "Panoramic glass", size: "20 × 10 m", capacity: 4, pricePeak: 600, priceOffPeak: 400 },
  // Maadi Padel Park (4 courts)
  { id: "c-mp-1", venueId: "v-maadi-padel", name: "Court 1 · Panoramic", sport: "padel", indoor: true, surface: "Panoramic glass", size: "20 × 10 m", capacity: 4, pricePeak: 650, priceOffPeak: 450 },
  { id: "c-mp-2", venueId: "v-maadi-padel", name: "Court 2", sport: "padel", indoor: true, surface: "Glass", size: "20 × 10 m", capacity: 4, pricePeak: 600, priceOffPeak: 420 },
  { id: "c-mp-3", venueId: "v-maadi-padel", name: "Court 3", sport: "padel", indoor: false, surface: "Glass", size: "20 × 10 m", capacity: 4, pricePeak: 500, priceOffPeak: 350 },
  { id: "c-mp-4", venueId: "v-maadi-padel", name: "Court 4", sport: "padel", indoor: false, surface: "Glass", size: "20 × 10 m", capacity: 4, pricePeak: 500, priceOffPeak: 350 },
  // Degla Hoops Center (2 courts)
  { id: "c-dg-1", venueId: "v-degla", name: "Main Court", sport: "basketball", indoor: true, surface: "Hardwood", size: "28 × 15 m", capacity: 10, pricePeak: 700, priceOffPeak: 500 },
  { id: "c-dg-2", venueId: "v-degla", name: "Outdoor Court", sport: "basketball", indoor: false, surface: "Acrylic", size: "28 × 15 m", capacity: 10, pricePeak: 400, priceOffPeak: 300 },
  // Zamalek Riverside (3 courts)
  { id: "c-zm-1", venueId: "v-zamalek", name: "Clay Court", sport: "tennis", indoor: false, surface: "Red clay", size: "Full size", capacity: 4, pricePeak: 550, priceOffPeak: 400 },
  { id: "c-zm-2", venueId: "v-zamalek", name: "Hard Court", sport: "tennis", indoor: false, surface: "Hard court", size: "Full size", capacity: 4, pricePeak: 500, priceOffPeak: 350 },
  { id: "c-zm-3", venueId: "v-zamalek", name: "Padel Court", sport: "padel", indoor: false, surface: "Glass", size: "20 × 10 m", capacity: 4, pricePeak: 700, priceOffPeak: 500 },
  // Kickoff Arena New Cairo (4 courts)
  { id: "c-nc-1", venueId: "v-newcairo", name: "Pitch A", sport: "football5", indoor: false, surface: "Artificial turf", size: "40 × 20 m", capacity: 10, pricePeak: 800, priceOffPeak: 550 },
  { id: "c-nc-2", venueId: "v-newcairo", name: "Pitch B", sport: "football5", indoor: false, surface: "Artificial turf", size: "40 × 20 m", capacity: 10, pricePeak: 800, priceOffPeak: 550 },
  { id: "c-nc-3", venueId: "v-newcairo", name: "Stadium Pitch", sport: "football7", indoor: false, surface: "Hybrid grass", size: "65 × 40 m", capacity: 14, pricePeak: 1200, priceOffPeak: 900 },
  { id: "c-nc-4", venueId: "v-newcairo", name: "Padel 1", sport: "padel", indoor: true, surface: "Panoramic glass", size: "20 × 10 m", capacity: 4, pricePeak: 650, priceOffPeak: 450 },
  // Zayed Sports Village (3 courts)
  { id: "c-zy-1", venueId: "v-zayed", name: "7-a-side Pitch", sport: "football7", indoor: false, surface: "Artificial turf", size: "60 × 35 m", capacity: 14, pricePeak: 1000, priceOffPeak: 700 },
  { id: "c-zy-2", venueId: "v-zayed", name: "Tennis Court", sport: "tennis", indoor: false, surface: "Hard court", size: "Full size", capacity: 4, pricePeak: 450, priceOffPeak: 300 },
  { id: "c-zy-3", venueId: "v-zayed", name: "Basketball Hall", sport: "basketball", indoor: true, surface: "Hardwood", size: "28 × 15 m", capacity: 10, pricePeak: 600, priceOffPeak: 400 },
];

/* -------------------------------- Players ------------------------------- */
const EVENINGS: Availability = { weekday: ["evening", "late"], weekend: ["afternoon", "evening"] };
const AFTER_WORK: Availability = { weekday: ["evening"], weekend: ["morning", "afternoon", "evening"] };
const FLEXIBLE: Availability = { weekday: ["afternoon", "evening"], weekend: ["morning", "afternoon"] };
const LATE: Availability = { weekday: ["late"], weekend: ["evening", "late"] };

export const PLAYERS: Player[] = [
  // Persona 1: the organiser
  { id: "p-omar", name: "Omar Hassan", age: 27, area: "new-cairo", radiusKm: 15, sports: { football5: "intermediate", football7: "intermediate", padel: "beginner" }, reliability: 96, gamesPlayed: 48, rating: 4.7, availability: { weekday: ["evening", "late"], weekend: ["evening"] }, avatarColor: "bg-emerald-100 text-emerald-900" },
  // Persona 2: the solo player (fills her profile during onboarding)
  { id: "p-salma", name: "Salma Adel", age: 24, area: "maadi", radiusKm: 10, sports: {}, reliability: 100, gamesPlayed: 0, rating: 0, availability: { weekday: [], weekend: [] }, avatarColor: "bg-violet-100 text-violet-900" },
  // Omar's regular friends
  { id: "p-youssef", name: "Youssef Mahmoud", age: 28, area: "new-cairo", radiusKm: 15, sports: { football5: "intermediate", football7: "advanced" }, reliability: 92, gamesPlayed: 61, rating: 4.5, availability: EVENINGS, avatarColor: "bg-sky-100 text-sky-900" },
  { id: "p-ahmed", name: "Ahmed Fathy", age: 29, area: "nasr-city", radiusKm: 12, sports: { football5: "intermediate" }, reliability: 88, gamesPlayed: 37, rating: 4.3, availability: AFTER_WORK, avatarColor: "bg-amber-100 text-amber-900" },
  { id: "p-mostafa", name: "Mostafa Kamal", age: 26, area: "new-cairo", radiusKm: 15, sports: { football5: "advanced" }, reliability: 97, gamesPlayed: 74, rating: 4.8, availability: EVENINGS, avatarColor: "bg-rose-100 text-rose-900" },
  { id: "p-ali", name: "Ali Samir", age: 27, area: "heliopolis", radiusKm: 15, sports: { football5: "intermediate", basketball: "intermediate" }, reliability: 90, gamesPlayed: 29, rating: 4.4, availability: EVENINGS, avatarColor: "bg-teal-100 text-teal-900" },
  { id: "p-khaled", name: "Khaled Ibrahim", age: 31, area: "nasr-city", radiusKm: 12, sports: { football7: "intermediate", football5: "intermediate" }, reliability: 85, gamesPlayed: 52, rating: 4.1, availability: AFTER_WORK, avatarColor: "bg-orange-100 text-orange-900" },
  // Wider community
  { id: "p-nour", name: "Nour El-Din Ashraf", age: 25, area: "maadi", radiusKm: 10, sports: { padel: "intermediate", tennis: "intermediate" }, reliability: 94, gamesPlayed: 33, rating: 4.6, availability: FLEXIBLE, avatarColor: "bg-indigo-100 text-indigo-900" },
  { id: "p-hana", name: "Hana Mostafa", age: 23, area: "maadi", radiusKm: 8, sports: { padel: "intermediate", basketball: "intermediate" }, reliability: 98, gamesPlayed: 41, rating: 4.9, availability: EVENINGS, avatarColor: "bg-fuchsia-100 text-fuchsia-900" },
  { id: "p-mariam", name: "Mariam Tarek", age: 26, area: "zamalek", radiusKm: 12, sports: { padel: "intermediate", tennis: "advanced" }, reliability: 95, gamesPlayed: 58, rating: 4.7, availability: FLEXIBLE, avatarColor: "bg-cyan-100 text-cyan-900" },
  { id: "p-laila", name: "Laila Sherif", age: 30, area: "zamalek", radiusKm: 10, sports: { tennis: "intermediate", padel: "beginner" }, reliability: 91, gamesPlayed: 22, rating: 4.4, availability: { weekday: ["morning", "evening"], weekend: ["morning"] }, avatarColor: "bg-lime-100 text-lime-900" },
  { id: "p-farida", name: "Farida Hossam", age: 22, area: "maadi", radiusKm: 8, sports: { basketball: "intermediate", padel: "beginner" }, reliability: 89, gamesPlayed: 17, rating: 4.2, availability: FLEXIBLE, avatarColor: "bg-pink-100 text-pink-900" },
  { id: "p-tarek", name: "Tarek Nabil", age: 33, area: "sheikh-zayed", radiusKm: 15, sports: { football7: "advanced", tennis: "intermediate" }, reliability: 93, gamesPlayed: 66, rating: 4.6, availability: AFTER_WORK, avatarColor: "bg-emerald-100 text-emerald-900" },
  { id: "p-ziad", name: "Ziad Ashraf", age: 24, area: "new-cairo", radiusKm: 20, sports: { padel: "advanced", football5: "intermediate" }, reliability: 87, gamesPlayed: 45, rating: 4.3, availability: LATE, avatarColor: "bg-sky-100 text-sky-900" },
  { id: "p-hassan", name: "Hassan Reda", age: 35, area: "nasr-city", radiusKm: 10, sports: { football5: "beginner", football7: "intermediate" }, reliability: 80, gamesPlayed: 19, rating: 4.0, availability: { weekday: ["afternoon"], weekend: ["afternoon", "evening"] }, avatarColor: "bg-amber-100 text-amber-900" },
  { id: "p-amr", name: "Amr Wagdy", age: 29, area: "sheikh-zayed", radiusKm: 15, sports: { basketball: "advanced", football7: "intermediate" }, reliability: 92, gamesPlayed: 54, rating: 4.5, availability: EVENINGS, avatarColor: "bg-rose-100 text-rose-900" },
  { id: "p-nadine", name: "Nadine Fouad", age: 27, area: "maadi", radiusKm: 10, sports: { padel: "intermediate", basketball: "beginner" }, reliability: 96, gamesPlayed: 31, rating: 4.7, availability: EVENINGS, avatarColor: "bg-violet-100 text-violet-900" },
  { id: "p-yasmin", name: "Yasmin Gamal", age: 25, area: "heliopolis", radiusKm: 15, sports: { padel: "beginner", tennis: "beginner" }, reliability: 90, gamesPlayed: 12, rating: 4.4, availability: { weekday: ["afternoon", "evening"], weekend: ["afternoon"] }, avatarColor: "bg-teal-100 text-teal-900" },
  { id: "p-seif", name: "Seif Eldin Magdy", age: 28, area: "maadi", radiusKm: 10, sports: { basketball: "intermediate", football5: "intermediate" }, reliability: 86, gamesPlayed: 39, rating: 4.3, availability: EVENINGS, avatarColor: "bg-orange-100 text-orange-900" },
  { id: "p-rana", name: "Rana Magdy", age: 26, area: "new-cairo", radiusKm: 15, sports: { padel: "intermediate", tennis: "intermediate" }, reliability: 97, gamesPlayed: 27, rating: 4.8, availability: { weekday: ["afternoon", "evening"], weekend: ["morning", "evening"] }, avatarColor: "bg-indigo-100 text-indigo-900" },
];

/** Omar's friends list used by "Friends joining" and "Invite friends". */
export const OMAR_FRIENDS = ["p-youssef", "p-ahmed", "p-mostafa", "p-ali", "p-khaled", "p-ziad"];

/* --------------------------------- Games -------------------------------- */
const courtById = new Map(COURTS.map((c) => [c.id, c])); // O(1) lookups while building seeds

type GameSeed = Omit<Game, "venueId" | "courtTotal" | "createdAt" | "invitedIds"> & { createdAgo: number };

/** Fill derived fields (venue, price) so the seed list stays short and readable. */
function buildGame(seed: GameSeed): Game {
  const court = courtById.get(seed.courtId)!;
  const { createdAgo, ...rest } = seed;
  return {
    ...rest,
    venueId: court.venueId,
    invitedIds: [],
    courtTotal: slotTotal(court, seed.date, seed.startHour, seed.duration, {}),
    createdAt: DEMO_NOW - createdAgo,
  };
}

const GAME_SEEDS: GameSeed[] = [
  // ---- 10 open games (status "filling") ----
  // g1: Salma's best match: padel, Thu 7 PM, Maadi, intermediate, 1/4 -> after she joins "2 more"
  { id: "g1", sport: "padel", courtId: "c-mp-2", date: d(4), startHour: 19, duration: 1.5, capacity: 4, minPlayers: 4, level: "intermediate", visibility: "public", organizerId: "p-hana", playerIds: ["p-hana"], status: "filling", createdAgo: 3 * HOUR },
  // g2: padel in Zamalek, just outside Salma's default 10 km radius
  { id: "g2", sport: "padel", courtId: "c-zm-3", date: d(4), startHour: 20, duration: 1.5, capacity: 4, minPlayers: 4, level: "intermediate", visibility: "public", organizerId: "p-mariam", playerIds: ["p-mariam", "p-laila", "p-nour"], status: "filling", createdAgo: 9 * HOUR },
  // g3: basketball pick-up in Degla, beginner-friendly
  { id: "g3", sport: "basketball", courtId: "c-dg-1", date: d(4), startHour: 18, duration: 1, capacity: 10, minPlayers: 8, level: "beginner", visibility: "public", organizerId: "p-seif", playerIds: ["p-seif", "p-farida", "p-hana", "p-ali", "p-nadine"], status: "filling", createdAgo: 1 * DAY },
  // g4: advanced padel late Thursday (level mismatch for Salma -> lower match score)
  { id: "g4", sport: "padel", courtId: "c-mp-3", date: d(4), startHour: 21, duration: 1.5, capacity: 4, minPlayers: 4, level: "advanced", visibility: "public", organizerId: "p-ziad", playerIds: ["p-ziad", "p-rana"], status: "filling", createdAgo: 5 * HOUR },
  // g5: the "7/10" football game in New Cairo (Omar's feed)
  { id: "g5", sport: "football5", courtId: "c-nc-1", date: d(1), startHour: 21, duration: 1, capacity: 10, minPlayers: 8, level: "intermediate", visibility: "public", organizerId: "p-mostafa", playerIds: ["p-mostafa", "p-ziad", "p-youssef", "p-hassan", "p-ali", "p-seif", "p-ahmed"], status: "filling", createdAgo: 40 * MIN },
  // g6: 7-a-side at Karim's club -> "Held" on his calendar
  { id: "g6", sport: "football7", courtId: "c-nasr-2", date: d(5), startHour: 17, duration: 1.5, capacity: 14, minPlayers: 12, level: "intermediate", visibility: "public", organizerId: "p-khaled", playerIds: ["p-khaled", "p-hassan", "p-ahmed", "p-ali", "p-seif", "p-youssef", "p-tarek", "p-amr", "p-mostafa"], status: "filling", createdAgo: 2 * DAY },
  // g7: tennis doubles in Zamalek on Saturday morning
  { id: "g7", sport: "tennis", courtId: "c-zm-1", date: d(6), startHour: 10, duration: 1.5, capacity: 4, minPlayers: 4, level: "intermediate", visibility: "public", organizerId: "p-laila", playerIds: ["p-laila", "p-mariam"], status: "filling", createdAgo: 20 * HOUR },
  // g8: advanced basketball run in Sheikh Zayed
  { id: "g8", sport: "basketball", courtId: "c-zy-3", date: d(6), startHour: 18, duration: 1, capacity: 10, minPlayers: 8, level: "advanced", visibility: "public", organizerId: "p-amr", playerIds: ["p-amr", "p-tarek", "p-ali", "p-seif", "p-khaled", "p-ziad"], status: "filling", createdAgo: 1 * DAY },
  // g9: 7-a-side in Zayed, 2 short of confirming
  { id: "g9", sport: "football7", courtId: "c-zy-1", date: d(5), startHour: 20, duration: 1.5, capacity: 14, minPlayers: 12, level: "advanced", visibility: "public", organizerId: "p-tarek", playerIds: ["p-tarek", "p-amr", "p-youssef", "p-mostafa", "p-khaled", "p-hassan", "p-ahmed", "p-ziad", "p-seif", "p-ali"], status: "filling", createdAgo: 2 * HOUR },
  // g10: off-peak beginner padel at Karim's club -> another "Held" slot
  { id: "g10", sport: "padel", courtId: "c-nasr-3", date: d(2), startHour: 16, duration: 1.5, capacity: 4, minPlayers: 4, level: "beginner", visibility: "public", organizerId: "p-yasmin", playerIds: ["p-yasmin"], status: "filling", createdAgo: 6 * HOUR },

  // ---- Omar's history ----
  // g11: his weekly game next Sunday, already confirmed
  { id: "g11", sport: "football5", courtId: "c-nc-2", date: d(7), startHour: 21, duration: 1, capacity: 10, minPlayers: 8, level: "intermediate", visibility: "invite", organizerId: "p-omar", playerIds: ["p-omar", "p-youssef", "p-ahmed", "p-mostafa", "p-ali", "p-khaled", "p-ziad", "p-hassan", "p-seif", "p-tarek"], status: "confirmed", createdAgo: 3 * DAY },
  // g12: last Sunday, played, not yet rated
  { id: "g12", sport: "football5", courtId: "c-nc-1", date: d(-7), startHour: 21, duration: 1, capacity: 10, minPlayers: 8, level: "intermediate", visibility: "invite", organizerId: "p-omar", playerIds: ["p-omar", "p-youssef", "p-ahmed", "p-mostafa", "p-ali", "p-khaled", "p-ziad", "p-seif", "p-hassan"], status: "completed", createdAgo: 10 * DAY },
  // g13: last Thursday's 7-a-side that never filled -> cancelled & refunded
  { id: "g13", sport: "football7", courtId: "c-nasr-2", date: d(-3), startHour: 20, duration: 1.5, capacity: 14, minPlayers: 12, level: "intermediate", visibility: "public", organizerId: "p-khaled", playerIds: ["p-khaled", "p-omar", "p-ahmed", "p-hassan", "p-youssef", "p-ali", "p-amr", "p-tarek", "p-seif"], status: "cancelled", createdAgo: 6 * DAY },
];

export const GAMES: Game[] = GAME_SEEDS.map(buildGame);

/* ------------------------------- Bookings ------------------------------- */
/** Mulberry32: tiny deterministic PRNG so seeded bookings never change between renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const ORGANIZER_NAMES = [
  "Mahmoud Adel", "Sherif Mounir", "Ramy Hany", "Bassem Fawzy", "Dina Samy", "Omneya Kamal",
  "Hesham Said", "Wael Ezzat", "Mona Lotfy", "Islam Gaber", "Reem Ashour", "Sameh Rizk",
];

/** Probability a court-hour is already booked: busy evenings, empty weekday afternoons. */
function demandProbability(date: string, hour: number, isKarim: boolean) {
  const weekend = isWeekend(date);
  if (hour < 10) return weekend ? 0.25 : 0.08;
  if (hour < 12) return weekend ? 0.35 : 0.1;
  if (hour < 16) return weekend ? 0.5 : isKarim ? 0.06 : 0.15; // Karim's pain point
  if (hour < 17) return weekend ? 0.55 : isKarim ? 0.15 : 0.3;
  if (hour < 19) return 0.65;
  if (hour < 23) return 0.85;
  return 0.45;
}

/** Slots that must stay free so the scripted demo flows always work. */
const KEEP_FREE = new Set<string>([
  // Omar's target slot at Karim's club: Wed 11 Nov, 8–10 PM on Pitch 1
  slotKey("c-nasr-1", d(3), 20),
  slotKey("c-nasr-1", d(3), 21),
]);

/** Slots that must be taken so the demo nudges Omar to Karim's club. */
const FORCE_BOOKED = new Set<string>([
  slotKey("c-nc-1", d(3), 20),
  slotKey("c-nc-2", d(3), 20),
  slotKey("c-nc-1", d(3), 21),
]);

/** Booking that mirrors a Kora game on the owner's side. */
export function bookingForGame(game: Game, organizerName: string): Booking {
  const statusMap = { filling: "held", confirmed: "confirmed", completed: "completed", cancelled: "cancelled" } as const;
  return {
    id: `b-${game.id}`,
    courtId: game.courtId,
    venueId: game.venueId,
    date: game.date,
    startHour: game.startHour,
    duration: game.duration,
    status: statusMap[game.status],
    source: "kora_game",
    gameId: game.id,
    organizerName,
    organizerPhone: "+20 10 0000 0000",
    amount: game.courtTotal,
    createdAt: game.createdAt,
  };
}

/** Build every seeded booking: one per game + randomly generated walk-in/phone/app bookings. */
function buildBookings(): Booking[] {
  const rand = mulberry32(20261108);
  const playerName = new Map(PLAYERS.map((p) => [p.id, p.name]));
  const bookings: Booking[] = GAMES.map((g) => bookingForGame(g, playerName.get(g.organizerId) ?? "Kora player"));

  // Index hours already taken by games so generated bookings never overlap them. O(G).
  const taken = new Set<string>();
  for (const g of GAMES) {
    if (g.status === "cancelled") continue;
    for (let t = g.startHour; t < g.startHour + g.duration; t += 1) taken.add(slotKey(g.courtId, g.date, Math.floor(t)));
  }

  const venueById = new Map(VENUES.map((v) => [v.id, v]));
  let n = 0;
  for (const court of COURTS) {
    const venue = venueById.get(court.venueId)!;
    const isKarim = venue.id === PERSONAS.karim.venueId;
    // Karim's club gets last week too (for history, no-shows and payouts).
    const firstDay = isKarim ? -7 : 0;
    const lastDay = isKarim ? 13 : 7;
    for (let offset = firstDay; offset <= lastDay; offset++) {
      const date = d(offset);
      for (let hour = venue.openHour; hour < venue.closeHour; hour++) {
        const key = slotKey(court.id, date, hour);
        if (taken.has(key) || KEEP_FREE.has(key)) continue;
        // Far-future days are only partly booked yet.
        const horizon = offset >= 7 ? 0.45 : 1;
        const booked = FORCE_BOOKED.has(key) || rand() < demandProbability(date, hour, isKarim) * horizon;
        if (!booked) continue;
        const isPast = offset < 0 || (offset === 0 && hour + 1 <= DEMO_NOW_HOUR);
        const source = rand() < 0.45 ? "phone" : "kora_private";
        const noShow = isPast && isKarim && rand() < 0.06;
        bookings.push({
          id: `b-seed-${n++}`,
          courtId: court.id,
          venueId: court.venueId,
          date,
          startHour: hour,
          duration: 1,
          status: isPast ? (noShow ? "no_show" : "completed") : "confirmed",
          source,
          organizerName: ORGANIZER_NAMES[Math.floor(rand() * ORGANIZER_NAMES.length)],
          organizerPhone: `+20 1${Math.floor(rand() * 3)}${Math.floor(rand() * 10)} ${String(Math.floor(rand() * 9000) + 1000)} ${String(Math.floor(rand() * 9000) + 1000)}`,
          amount: hour >= 17 || (isWeekend(date) && hour >= 12) ? court.pricePeak : court.priceOffPeak,
          createdAt: DEMO_NOW - Math.floor(rand() * 6 * DAY),
        });
      }
    }
  }

  // Three private requests waiting for Karim's approval (manual approval is on for private bookings).
  const requests: Array<[string, number, number, string]> = [
    ["c-nasr-2", 2, 18, "Sherif Mounir"],
    ["c-nasr-1", 3, 15, "Dina Samy"],
    ["c-nasr-3", 6, 11, "Reem Ashour"],
  ];
  for (const [courtId, offset, hour, name] of requests) {
    const court = courtById.get(courtId)!;
    // Drop any generated booking on the same hour so the request has a free slot.
    const date = d(offset);
    for (let i = bookings.length - 1; i >= 0; i--) {
      const b = bookings[i];
      if (b.courtId === courtId && b.date === date && b.startHour === hour) bookings.splice(i, 1);
    }
    bookings.push({
      id: `b-req-${courtId}-${offset}`,
      courtId,
      venueId: court.venueId,
      date,
      startHour: hour,
      duration: 1,
      status: "requested",
      source: "kora_private",
      organizerName: name,
      organizerPhone: "+20 101 223 4455",
      amount: hour >= 17 || (isWeekend(date) && hour >= 12) ? court.pricePeak : court.priceOffPeak,
      createdAt: DEMO_NOW - (offset + 1) * HOUR,
    });
  }
  return bookings;
}

export const BOOKINGS: Booking[] = buildBookings();

/* --------------------------------- Chat --------------------------------- */
const sys = (gameId: string, text: string, ago: number): ChatMessage => ({
  id: `m-${gameId}-${ago}`, gameId, kind: "system", text, at: DEMO_NOW - ago,
});
const say = (gameId: string, authorId: string, text: string, ago: number): ChatMessage => ({
  id: `m-${gameId}-${authorId}-${ago}`, gameId, kind: "user", authorId, text, at: DEMO_NOW - ago,
});

export const MESSAGES: ChatMessage[] = [
  sys("g1", "Hana created this game · Court 2 held", 3 * HOUR),
  say("g1", "p-hana", "Hi all! Looking for 3 more for Thursday padel 🎾 Friendly but competitive.", 3 * HOUR - 5 * MIN),
  sys("g3", "Seif created this game · Main Court held", 1 * DAY),
  say("g3", "p-seif", "All levels welcome — we rotate teams every 10 minutes.", 1 * DAY - 10 * MIN),
  say("g3", "p-farida", "Bringing a friend next time!", 6 * HOUR),
  sys("g5", "Mostafa created this game · Pitch A held", 40 * MIN),
  say("g5", "p-mostafa", "We're 7, need 3 more for Monday. Intermediate pace.", 38 * MIN),
  say("g5", "p-youssef", "I'll bring a ball ⚽", 20 * MIN),
  sys("g6", "Khaled created this game · Pitch 2 held", 2 * DAY),
  say("g6", "p-khaled", "Bibs provided. Bring a white and a dark top.", 2 * DAY - HOUR),
  sys("g9", "Tarek created this game · 7-a-side Pitch held", 2 * HOUR),
  sys("g10", "Yasmin created this game · Padel Court held", 6 * HOUR),
  say("g10", "p-yasmin", "First time organising — total beginners very welcome!", 6 * HOUR - 2 * MIN),
  sys("g11", "Game confirmed, court booked ✅", 2 * DAY),
  say("g11", "p-youssef", "See you Sunday 💪", 1 * DAY),
  say("g11", "p-omar", "Same time next week too? I'll set it up.", 20 * HOUR),
  sys("g12", "Game played · Rate your teammates", 7 * DAY - 2 * HOUR),
  say("g12", "p-omar", "Great game everyone! Rate each other so the levels stay fair.", 7 * DAY - 3 * HOUR),
  sys("g13", "Game cancelled — only 9/14 joined. Everyone was refunded in full.", 3 * DAY + 6 * HOUR),
];

/* ----------------------------- Notifications ---------------------------- */
export const NOTIFICATIONS: AppNotification[] = [
  // Omar
  { id: "n1", userId: "p-omar", type: "match", title: "A game matching your availability was created", body: "5-a-side · Mon 9 Nov, 9 PM at Kickoff Arena · 3 spots left", at: DEMO_NOW - 38 * MIN, read: false, href: "/play/games/g5" },
  { id: "n2", userId: "p-omar", type: "spots", title: "2 spots left to confirm", body: "7-a-side at Zayed Sports Village · Fri 13 Nov, 8 PM", at: DEMO_NOW - 2 * HOUR, read: false, href: "/play/games/g9" },
  { id: "n3", userId: "p-omar", type: "confirmed", title: "Your game is confirmed", body: "Sunday 5-a-side at Kickoff Arena is on. Court booked.", at: DEMO_NOW - 2 * DAY, read: true, href: "/play/games/g11" },
  { id: "n4", userId: "p-omar", type: "cancelled", title: "Game cancelled — refunded", body: "Thursday 7-a-side didn't reach 12 players. EGP 115 refunded to your card.", at: DEMO_NOW - 3 * DAY, read: true, href: "/play/games/g13" },
  { id: "n5", userId: "p-omar", type: "rate", title: "How was last Sunday's game?", body: "Rate your teammates and Kickoff Arena — takes 30 seconds.", at: DEMO_NOW - 6 * DAY, read: true, href: "/play/games/g12/rate" },
  // Salma
  { id: "n6", userId: "p-salma", type: "match", title: "A game matching your availability was created", body: "Padel · Thu 12 Nov, 7 PM at Maadi Padel Park · 3 spots left", at: DEMO_NOW - 25 * MIN, read: false, href: "/play/games/g1" },
  { id: "n7", userId: "p-salma", type: "reminder", title: "Welcome to Kora, Salma 👋", body: "Tell us when you're free and we'll match you into a game nearby.", at: DEMO_NOW - 2 * HOUR, read: false, href: "/play/find" },
  // Karim (owner)
  { id: "n8", userId: "o-karim", type: "booking", title: "New booking request", body: "Sherif Mounir requested Pitch 2 · Tue 10 Nov, 6 PM", at: DEMO_NOW - 3 * HOUR, read: false, href: "/owner/bookings" },
  { id: "n9", userId: "o-karim", type: "joined", title: "Kora game filling at your club", body: "Khaled's 7-a-side (Fri 5 PM) is 9/14 · slot held", at: DEMO_NOW - 5 * HOUR, read: false, href: "/owner/calendar" },
];

/* -------------------------------- Reviews ------------------------------- */
export const REVIEWS: CourtReview[] = [
  { id: "r1", venueId: "v-nasr", courtId: "c-nasr-1", authorName: "Youssef M.", rating: 5, text: "Turf is in great shape and the lights are bright. Staff had bibs ready.", tags: ["Great turf", "Good lighting"], at: DEMO_NOW - 2 * DAY },
  { id: "r2", venueId: "v-nasr", courtId: "c-nasr-2", authorName: "Khaled I.", rating: 4, text: "Big pitch, fair price. Changing rooms could be cleaner.", tags: ["Fair price"], at: DEMO_NOW - 4 * DAY, reply: "Thanks Khaled — we've added an evening cleaning round." },
  { id: "r3", venueId: "v-nasr", courtId: "c-nasr-3", authorName: "Yasmin G.", rating: 5, text: "Lovely indoor padel court, AC worked well even in the afternoon.", tags: ["Clean", "On time"], at: DEMO_NOW - 5 * DAY },
  { id: "r4", venueId: "v-nasr", courtId: "c-nasr-1", authorName: "Ahmed F.", rating: 4, text: "Easy parking. Previous group overran by 10 minutes.", tags: ["Parking"], at: DEMO_NOW - 8 * DAY },
  { id: "r5", venueId: "v-nasr", courtId: "c-nasr-2", authorName: "Tarek N.", rating: 3, text: "Booking by phone was confusing, glad it's on Kora now.", tags: [], at: DEMO_NOW - 12 * DAY },
  { id: "r6", venueId: "v-nasr", courtId: "c-nasr-1", authorName: "Mostafa K.", rating: 5, text: "Best 5-a-side pitch in Nasr City.", tags: ["Great turf"], at: DEMO_NOW - 15 * DAY },
  { id: "r7", venueId: "v-maadi-padel", authorName: "Nadine F.", rating: 5, text: "Indoor courts are spotless, rackets for rent are decent.", tags: ["Clean"], at: DEMO_NOW - 3 * DAY },
  { id: "r8", venueId: "v-newcairo", authorName: "Omar H.", rating: 4, text: "Always busy — book early. Pitch B is the better one.", tags: ["Busy"], at: DEMO_NOW - 9 * DAY },
  { id: "r9", venueId: "v-degla", authorName: "Seif M.", rating: 5, text: "Real hardwood, proper hoops. Great vibe at night.", tags: ["Good lighting"], at: DEMO_NOW - 6 * DAY },
];
