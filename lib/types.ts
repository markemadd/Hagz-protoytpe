/* =========================================================================
   Domain model for the Kora prototype.
   Two sides of the marketplace: players (demand) and court owners (supply).
   A Game is the matching unit: individual players join it and it is booked
   onto a Court. A Booking is the owner-side view of a court reservation.
   ========================================================================= */

export type SportId = "football5" | "football7" | "padel" | "basketball" | "tennis";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type AreaId =
  | "new-cairo"
  | "maadi"
  | "zamalek"
  | "sheikh-zayed"
  | "nasr-city"
  | "heliopolis";

/** Coarse time-of-day buckets a player is usually free in. */
export type TimeRangeId = "morning" | "afternoon" | "evening" | "late";

export type Availability = {
  weekday: TimeRangeId[]; // Sun–Thu in Egypt
  weekend: TimeRangeId[]; // Fri–Sat in Egypt
};

export type Player = {
  id: string;
  name: string;
  age: number;
  area: AreaId;
  radiusKm: number; // how far the player is happy to travel
  sports: Partial<Record<SportId, SkillLevel>>;
  reliability: number; // % of joined games actually attended (0–100)
  gamesPlayed: number;
  rating: number; // average peer rating (1–5)
  availability: Availability;
  avatarColor: string; // Tailwind classes for the initials avatar
};

export type Amenity =
  | "parking"
  | "lighting"
  | "changing"
  | "showers"
  | "cafe"
  | "rental"
  | "ac"
  | "water";

export type Venue = {
  id: string;
  name: string;
  area: AreaId;
  address: string;
  lat: number;
  lng: number;
  ownerId?: string;
  rating: number;
  reviewCount: number;
  amenities: Amenity[];
  openHour: number; // 24h clock, e.g. 7
  closeHour: number; // exclusive, e.g. 24 = midnight
  phone: string;
  description: string;
};

export type Court = {
  id: string;
  venueId: string;
  name: string;
  sport: SportId;
  indoor: boolean;
  surface: string;
  size: string;
  capacity: number;
  pricePeak: number; // EGP per hour
  priceOffPeak: number; // EGP per hour
};

/** Player-facing game lifecycle. "completed" = played, in the past. */
export type GameStatus = "filling" | "confirmed" | "cancelled" | "completed";

export type Game = {
  id: string;
  sport: SportId;
  courtId: string;
  venueId: string;
  date: string; // YYYY-MM-DD
  startHour: number; // 19 = 7:00 PM, 19.5 = 7:30 PM
  duration: number; // hours
  capacity: number; // max players
  minPlayers: number; // game confirms (court is booked) at this many
  level: SkillLevel;
  visibility: "public" | "invite";
  organizerId: string;
  playerIds: string[];
  invitedIds: string[];
  status: GameStatus;
  courtTotal: number; // EGP for the whole slot
  createdAt: number;
};

/** Owner-facing reservation lifecycle. */
export type BookingStatus =
  | "requested" // waiting for owner approval
  | "held" // slot reserved for a Kora game that is still filling
  | "confirmed"
  | "completed"
  | "no_show"
  | "declined"
  | "cancelled";

export type BookingSource = "kora_game" | "kora_private" | "phone";

export type Booking = {
  id: string;
  courtId: string;
  venueId: string;
  date: string;
  startHour: number;
  duration: number;
  status: BookingStatus;
  source: BookingSource;
  gameId?: string;
  playerId?: string; // set when a Kora player made a private booking
  organizerName: string;
  organizerPhone: string;
  amount: number; // EGP
  createdAt: number;
};

/** Owner overrides on a single court-hour: block it, re-price it, or promote it. */
export type SlotOverride = {
  blocked?: boolean;
  price?: number;
  promoted?: boolean;
  discountPct?: number;
};

export type ChatMessage = {
  id: string;
  gameId: string;
  kind: "user" | "system";
  authorId?: string;
  text: string;
  at: number;
};

export type NotificationType =
  | "match"
  | "spots"
  | "confirmed"
  | "reminder"
  | "joined"
  | "cancelled"
  | "waitlist"
  | "deal"
  | "rate"
  | "booking";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  at: number;
  read: boolean;
  href?: string;
};

export type WaitlistEntry = {
  id: string;
  playerId: string;
  sport: SportId;
  date: string;
  fromHour: number;
  toHour: number;
  area: AreaId;
  radiusKm: number;
  level: SkillLevel;
};

export type CourtReview = {
  id: string;
  venueId: string;
  courtId?: string;
  authorName: string;
  rating: number; // 1–5
  text: string;
  tags: string[];
  at: number;
  reply?: string;
};

export type PlayerRating = {
  gameId: string;
  raterId: string;
  targetId: string;
  showedUp: boolean;
  sportsmanship: number; // 1–5
  levelAccurate: "lower" | "accurate" | "higher";
};

export type PaymentMethod = "card" | "wallet" | "fawry" | "cash";

/** What the checkout screen is paying for (kept in context instead of the URL). */
export type CheckoutDraft =
  | { kind: "game"; gameId: string }
  | { kind: "court"; courtId: string; date: string; startHour: number; duration: number };

export type OwnerSettings = {
  manualApproval: boolean; // private (full-court) bookings need Karim's approval
  autoHoldGames: boolean; // Kora games instantly hold the slot while filling
  depositForPhone: boolean;
  cancellationHours: number;
};

/** Forces every list into one UX state so reviewers can see empty/loading/error designs. */
export type ListStateOverride = "auto" | "loading" | "empty" | "error";
