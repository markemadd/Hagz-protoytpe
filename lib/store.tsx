"use client";

/* =========================================================================
   Kora prototype store: a single React context + reducer.
   - All state is mock data; every action is a pure state transition, so a
     join on the player side immediately shows up on the owner's calendar.
   - State is persisted to localStorage (best effort) so a page refresh does
     not lose demo progress. "Reset demo" restores the seed.
   ========================================================================= */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { indexBookings } from "./availability";
import { AREAS, PERSONAS, SPORTS, demoNow } from "./constants";
import { dayLabel, firstName, formatHour } from "./format";
import { neededToConfirm } from "./games";
import { availabilityFit, distanceFromArea, haversineKm, timeFit } from "./matching";
import { BOOKINGS, COURTS, GAMES, MESSAGES, NOTIFICATIONS, PLAYERS, REVIEWS, VENUES, bookingForGame } from "./mock-data";
import { pickJoiners } from "./simulate";
import type {
  AppNotification,
  Availability,
  Booking,
  BookingStatus,
  ChatMessage,
  CheckoutDraft,
  Court,
  CourtReview,
  Game,
  ListStateOverride,
  OwnerSettings,
  PaymentMethod,
  Player,
  PlayerRating,
  SkillLevel,
  SlotOverride,
  SportId,
  AreaId,
  Venue,
  WaitlistEntry,
} from "./types";
import { uid } from "./utils";

/* -------------------------------- State --------------------------------- */
export type KoraState = {
  version: number;
  currentPlayerId: string;
  onboarded: Record<string, boolean>;
  players: Player[];
  venues: Venue[];
  courts: Court[];
  games: Game[];
  bookings: Booking[];
  slotOverrides: Record<string, SlotOverride>;
  messages: ChatMessage[];
  notifications: AppNotification[];
  waitlist: WaitlistEntry[];
  reviews: CourtReview[];
  ratings: PlayerRating[];
  ownerSettings: OwnerSettings;
  checkout: CheckoutDraft | null;
  payments: Record<string, PaymentMethod>; // "gameId|playerId" -> how they paid
  flags: Record<string, boolean>; // demo-progress checkpoints
  chatReads: Record<string, number>; // "playerId|gameId" -> last read timestamp
  listState: ListStateOverride;
};

const STATE_VERSION = 3;
const STORAGE_KEY = "kora-prototype-state";

export function createInitialState(): KoraState {
  return {
    version: STATE_VERSION,
    currentPlayerId: PERSONAS.omar.playerId,
    onboarded: { [PERSONAS.omar.playerId]: true, [PERSONAS.salma.playerId]: false },
    players: PLAYERS,
    venues: VENUES,
    courts: COURTS,
    games: GAMES,
    bookings: BOOKINGS,
    slotOverrides: {},
    messages: MESSAGES,
    notifications: NOTIFICATIONS,
    waitlist: [],
    reviews: REVIEWS,
    ratings: [],
    ownerSettings: { manualApproval: true, autoHoldGames: true, depositForPhone: false, cancellationHours: 24 },
    checkout: null,
    payments: {},
    flags: {},
    chatReads: {},
    listState: "auto",
  };
}

/* ------------------------------- Actions -------------------------------- */
export type KoraAction =
  | { type: "hydrate"; state: KoraState }
  | { type: "reset" }
  | { type: "setPersona"; playerId: string }
  | { type: "completeOnboarding"; playerId: string; sports: Partial<Record<SportId, SkillLevel>>; area: AreaId; radiusKm: number; availability: Availability }
  | { type: "updatePlayer"; playerId: string; patch: Partial<Player> }
  | { type: "joinGame"; gameId: string; playerId: string; method: PaymentMethod }
  | { type: "leaveGame"; gameId: string; playerId: string }
  | { type: "simulateJoins"; gameId: string; count: number }
  | { type: "createGame"; game: Game; method: PaymentMethod }
  | { type: "inviteFriends"; gameId: string; friendIds: string[] }
  | { type: "completeGame"; gameId: string }
  | { type: "submitRatings"; gameId: string; raterId: string; ratings: PlayerRating[]; review: CourtReview | null }
  | { type: "sendMessage"; message: ChatMessage }
  | { type: "markChatRead"; playerId: string; gameId: string }
  | { type: "markNotificationsRead"; userId: string }
  | { type: "markNotificationRead"; id: string }
  | { type: "joinWaitlist"; entry: WaitlistEntry }
  | { type: "setCheckout"; draft: CheckoutDraft | null }
  | { type: "bookCourt"; booking: Booking; method: PaymentMethod }
  | { type: "setSlotOverride"; key: string; patch: SlotOverride | null; notify?: { userIds: string[]; title: string; body: string; href: string } }
  | { type: "setBookingStatus"; bookingId: string; status: BookingStatus }
  | { type: "updateOwnerSettings"; patch: Partial<OwnerSettings> }
  | { type: "updateVenue"; venueId: string; patch: Partial<Venue> }
  | { type: "updateCourt"; courtId: string; patch: Partial<Court> }
  | { type: "addCourt"; court: Court }
  | { type: "replyReview"; reviewId: string; reply: string }
  | { type: "setFlag"; key: string; value: boolean }
  | { type: "setListState"; value: ListStateOverride };

/* ------------------------------- Helpers -------------------------------- */
function notification(userId: string, type: AppNotification["type"], title: string, body: string, href?: string): AppNotification {
  return { id: uid("n"), userId, type, title, body, href, at: demoNow(), read: false };
}

function systemMessage(gameId: string, text: string): ChatMessage {
  return { id: uid("m"), gameId, kind: "system", text, at: demoNow() };
}

function playerName(state: KoraState, id: string) {
  return state.players.find((p) => p.id === id)?.name ?? "A player";
}

function gameTitle(state: KoraState, game: Game) {
  const venue = state.venues.find((v) => v.id === game.venueId);
  return `${SPORTS[game.sport].short} · ${dayLabel(game.date)}, ${formatHour(game.startHour)}${venue ? ` at ${venue.name}` : ""}`;
}

/** Replace one game by id (immutable update). O(G). */
function patchGame(games: Game[], id: string, patch: Partial<Game>) {
  return games.map((g) => (g.id === id ? { ...g, ...patch } : g));
}

/** Owner-side booking mirroring a game moves with the game's status. O(B). */
function patchGameBooking(bookings: Booking[], gameId: string, status: BookingStatus) {
  return bookings.map((b) => (b.gameId === gameId ? { ...b, status } : b));
}

/**
 * Add players to a game and run the confirmation rule:
 * once `minPlayers` have joined, the game is confirmed and the held court is booked.
 * This all-or-nothing threshold is an assurance contract (Tabarrok, 1998):
 * nobody pays unless enough people commit, which removes the organiser's risk.
 */
function addPlayers(state: KoraState, gameId: string, newIds: string[]): KoraState {
  const game = state.games.find((g) => g.id === gameId);
  if (!game || game.status !== "filling") return state;
  // Respect capacity and ignore anyone already in.
  const room = game.capacity - game.playerIds.length;
  const joiners = newIds.filter((id) => !game.playerIds.includes(id)).slice(0, room);
  if (joiners.length === 0) return state;

  const updated: Game = { ...game, playerIds: [...game.playerIds, ...joiners] };
  const messages = [...state.messages, ...joiners.map((id) => systemMessage(gameId, `${firstName(playerName(state, id))} joined`))];
  const notifications = [...state.notifications];
  let bookings = state.bookings;

  if (updated.playerIds.length >= updated.minPlayers) {
    // Threshold reached: confirm the game and turn the held slot into a real booking.
    updated.status = "confirmed";
    bookings = patchGameBooking(bookings, gameId, "confirmed");
    messages.push(systemMessage(gameId, "Game confirmed, court booked ✅"));
    for (const pid of updated.playerIds) {
      notifications.push(notification(pid, "confirmed", "Your game is confirmed", `${gameTitle(state, updated)} is on. Your share has been charged.`, `/play/games/${gameId}`));
    }
    const venue = state.venues.find((v) => v.id === updated.venueId);
    if (venue?.ownerId) {
      notifications.push(notification(venue.ownerId, "confirmed", "Kora game confirmed", `${firstName(playerName(state, updated.organizerId))}'s ${SPORTS[updated.sport].short} on ${dayLabel(updated.date)} is now a confirmed booking.`, "/owner/calendar"));
    }
  } else {
    // Still filling: tell the organiser who joined and how many are still needed.
    const need = neededToConfirm(updated);
    if (!joiners.includes(updated.organizerId)) {
      notifications.push(notification(updated.organizerId, need <= 2 ? "spots" : "joined", `${firstName(playerName(state, joiners[joiners.length - 1]))} joined your game`, `${need} more ${need === 1 ? "player" : "players"} to confirm · ${gameTitle(state, updated)}`, `/play/games/${gameId}`));
    }
  }

  return { ...state, games: state.games.map((g) => (g.id === gameId ? updated : g)), bookings, messages, notifications };
}

/** Personas (and waitlisted players) who should hear about a newly created game. */
function notifyMatchingPlayers(state: KoraState, game: Game): AppNotification[] {
  const venue = state.venues.find((v) => v.id === game.venueId);
  if (!venue || game.visibility !== "public") return [];
  const out: AppNotification[] = [];
  const title = gameTitle(state, game);
  for (const p of state.players) {
    if (p.id === game.organizerId || !p.sports[game.sport]) continue;
    // Only personas get "match" pushes in the prototype, to keep the inbox readable.
    if (p.id !== PERSONAS.omar.playerId && p.id !== PERSONAS.salma.playerId) continue;
    if (distanceFromArea(p.area, venue) > p.radiusKm) continue;
    if (availabilityFit(game, p.availability) === 0) continue;
    out.push(notification(p.id, "match", "A game matching your availability was created", `${title} · ${game.capacity - game.playerIds.length} spots left`, `/play/games/${game.id}`));
  }
  // Waitlist entries are explicit requests, so they always get notified on a fit.
  for (const w of state.waitlist) {
    if (w.sport !== game.sport || w.date !== game.date) continue;
    if (timeFit(game.startHour, game.duration, w.fromHour, w.toHour) === 0) continue;
    if (haversineKm(AREAS[w.area], venue) > w.radiusKm) continue;
    out.push(notification(w.playerId, "waitlist", "A game you waitlisted for just formed", `${title} · tap to grab a spot`, `/play/games/${game.id}`));
  }
  return out;
}

/* ------------------------------- Reducer -------------------------------- */
export function koraReducer(state: KoraState, action: KoraAction): KoraState {
  switch (action.type) {
    case "hydrate":
      // Ignore saved state from an older data model.
      return action.state.version === STATE_VERSION ? action.state : state;

    case "reset":
      return { ...createInitialState(), currentPlayerId: state.currentPlayerId };

    case "setPersona":
      return { ...state, currentPlayerId: action.playerId };

    case "completeOnboarding":
      return {
        ...state,
        onboarded: { ...state.onboarded, [action.playerId]: true },
        players: state.players.map((p) =>
          p.id === action.playerId
            ? { ...p, sports: action.sports, area: action.area, radiusKm: action.radiusKm, availability: action.availability }
            : p,
        ),
      };

    case "updatePlayer":
      return { ...state, players: state.players.map((p) => (p.id === action.playerId ? { ...p, ...action.patch } : p)) };

    case "joinGame": {
      const next = addPlayers(state, action.gameId, [action.playerId]);
      return {
        ...next,
        payments: { ...next.payments, [`${action.gameId}|${action.playerId}`]: action.method },
        flags: { ...next.flags, [`joined:${action.playerId}`]: true },
      };
    }

    case "leaveGame": {
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game || game.status !== "filling") return state;
      return {
        ...state,
        games: patchGame(state.games, game.id, { playerIds: game.playerIds.filter((id) => id !== action.playerId) }),
        messages: [...state.messages, systemMessage(game.id, `${firstName(playerName(state, action.playerId))} left · hold released`)],
      };
    }

    case "simulateJoins": {
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game) return state;
      return addPlayers(state, game.id, pickJoiners(game, state.players, action.count));
    }

    case "createGame": {
      const { game } = action;
      const court = state.courts.find((c) => c.id === game.courtId);
      const organizer = playerName(state, game.organizerId);
      // Kora games hold the slot instantly (if the owner allows it) so the organiser never fronts the fee.
      const booking: Booking = { ...bookingForGame(game, organizer), id: uid("b"), status: state.ownerSettings.autoHoldGames ? "held" : "requested" };
      const venue = state.venues.find((v) => v.id === game.venueId);
      const notifications = [...state.notifications, ...notifyMatchingPlayers(state, game)];
      if (venue?.ownerId) {
        notifications.push(notification(venue.ownerId, "booking", "New Kora game at your club", `${organizer} · ${court?.name} · ${dayLabel(game.date)}, ${formatHour(game.startHour)} · slot held while it fills`, "/owner/calendar"));
      }
      let next: KoraState = {
        ...state,
        games: [...state.games, game],
        bookings: [...state.bookings, booking],
        messages: [...state.messages, systemMessage(game.id, `${firstName(organizer)} created this game · ${court?.name ?? "court"} held`)],
        notifications,
        payments: { ...state.payments, [`${game.id}|${game.organizerId}`]: action.method },
        flags: { ...state.flags, [`created:${game.organizerId}`]: true, [`created-at:${game.venueId}`]: true },
      };
      // The game may already be confirmed if the organiser brought enough friends.
      if (game.playerIds.length >= game.minPlayers) next = addPlayers({ ...next, games: patchGame(next.games, game.id, { playerIds: [] }) }, game.id, game.playerIds);
      return next;
    }

    case "inviteFriends": {
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game) return state;
      const invitedIds = Array.from(new Set([...game.invitedIds, ...action.friendIds]));
      return {
        ...state,
        games: patchGame(state.games, game.id, { invitedIds }),
        messages: [...state.messages, systemMessage(game.id, `${action.friendIds.length} ${action.friendIds.length === 1 ? "friend" : "friends"} invited`)],
        flags: { ...state.flags, [`invited:${game.organizerId}`]: true },
      };
    }

    case "completeGame": {
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game || game.status !== "confirmed") return state;
      const venue = state.venues.find((v) => v.id === game.venueId);
      return {
        ...state,
        games: patchGame(state.games, game.id, { status: "completed" }),
        bookings: patchGameBooking(state.bookings, game.id, "completed"),
        players: state.players.map((p) => (game.playerIds.includes(p.id) ? { ...p, gamesPlayed: p.gamesPlayed + 1 } : p)),
        messages: [...state.messages, systemMessage(game.id, "Game played · Rate your teammates and the court")],
        notifications: [
          ...state.notifications,
          ...game.playerIds.map((pid) => notification(pid, "rate", "How was your game?", `Rate your teammates and ${venue?.name ?? "the court"} — takes 30 seconds.`, `/play/games/${game.id}/rate`)),
        ],
      };
    }

    case "submitRatings": {
      // Reputation update: no-shows cost reliability, attendance slowly rebuilds it (Tadelis, 2016).
      const delta = new Map<string, number>();
      for (const r of action.ratings) delta.set(r.targetId, (delta.get(r.targetId) ?? 0) + (r.showedUp ? 0.5 : -5));
      const players = state.players.map((p) =>
        delta.has(p.id) ? { ...p, reliability: Math.max(0, Math.min(100, Math.round(p.reliability + delta.get(p.id)!))) } : p,
      );
      let venues = state.venues;
      const reviews = action.review ? [action.review, ...state.reviews] : state.reviews;
      if (action.review) {
        // Running average keeps the venue rating update O(1).
        const r = action.review;
        venues = venues.map((v) =>
          v.id === r.venueId
            ? { ...v, rating: Math.round(((v.rating * v.reviewCount + r.rating) / (v.reviewCount + 1)) * 10) / 10, reviewCount: v.reviewCount + 1 }
            : v,
        );
      }
      return {
        ...state,
        players,
        venues,
        reviews,
        ratings: [...state.ratings, ...action.ratings],
        flags: { ...state.flags, [`rated:${action.gameId}:${action.raterId}`]: true },
      };
    }

    case "sendMessage":
      return { ...state, messages: [...state.messages, action.message] };

    case "markChatRead":
      return { ...state, chatReads: { ...state.chatReads, [`${action.playerId}|${action.gameId}`]: demoNow() } };

    case "markNotificationsRead":
      return { ...state, notifications: state.notifications.map((n) => (n.userId === action.userId ? { ...n, read: true } : n)) };

    case "markNotificationRead":
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) };

    case "joinWaitlist":
      return {
        ...state,
        waitlist: [...state.waitlist, action.entry],
        notifications: [
          ...state.notifications,
          notification(action.entry.playerId, "waitlist", "You're on the waitlist", `We'll notify you the moment a ${SPORTS[action.entry.sport].short.toLowerCase()} game forms on ${dayLabel(action.entry.date)}, ${formatHour(action.entry.fromHour)}–${formatHour(action.entry.toHour)}.`, "/play/notifications"),
        ],
      };

    case "setCheckout":
      return { ...state, checkout: action.draft };

    case "bookCourt": {
      const { booking } = action;
      const venue = state.venues.find((v) => v.id === booking.venueId);
      const court = state.courts.find((c) => c.id === booking.courtId);
      const label = `${court?.name} at ${venue?.name} · ${dayLabel(booking.date)}, ${formatHour(booking.startHour)}`;
      const notifications = [...state.notifications];
      if (booking.playerId) {
        notifications.push(
          booking.status === "requested"
            ? notification(booking.playerId, "booking", "Booking request sent", `${label}. The venue usually replies within an hour.`, "/play/my-games")
            : notification(booking.playerId, "confirmed", "Court booked", label, "/play/my-games"),
        );
      }
      if (venue?.ownerId) {
        notifications.push(notification(venue.ownerId, "booking", booking.status === "requested" ? "New booking request" : "New booking", `${booking.organizerName} · ${court?.name} · ${dayLabel(booking.date)}, ${formatHour(booking.startHour)}`, "/owner/bookings"));
      }
      return { ...state, bookings: [...state.bookings, booking], notifications };
    }

    case "setSlotOverride": {
      const overrides = { ...state.slotOverrides };
      if (action.patch === null) delete overrides[action.key];
      else {
        const merged = { ...overrides[action.key], ...action.patch };
        // Drop empty overrides so the map stays small.
        const isEmpty = !merged.blocked && !merged.promoted && merged.price === undefined;
        if (isEmpty) delete overrides[action.key];
        else overrides[action.key] = merged;
      }
      const extra = action.notify
        ? action.notify.userIds.map((id) => notification(id, "deal", action.notify!.title, action.notify!.body, action.notify!.href))
        : [];
      return { ...state, slotOverrides: overrides, notifications: [...state.notifications, ...extra], flags: { ...state.flags, ...(action.patch?.blocked ? { "owner-blocked": true } : {}), ...(action.patch?.promoted ? { "owner-promoted": true } : {}) } };
    }

    case "setBookingStatus": {
      const booking = state.bookings.find((b) => b.id === action.bookingId);
      if (!booking) return state;
      const notifications = [...state.notifications];
      if (booking.playerId && (action.status === "confirmed" || action.status === "declined")) {
        notifications.push(notification(booking.playerId, action.status === "confirmed" ? "confirmed" : "cancelled", action.status === "confirmed" ? "Booking accepted" : "Booking declined — not charged", `${dayLabel(booking.date)}, ${formatHour(booking.startHour)}`, "/play/my-games"));
      }
      return { ...state, bookings: state.bookings.map((b) => (b.id === booking.id ? { ...b, status: action.status } : b)), notifications };
    }

    case "updateOwnerSettings":
      return { ...state, ownerSettings: { ...state.ownerSettings, ...action.patch } };

    case "updateVenue":
      return { ...state, venues: state.venues.map((v) => (v.id === action.venueId ? { ...v, ...action.patch } : v)) };

    case "updateCourt":
      return { ...state, courts: state.courts.map((c) => (c.id === action.courtId ? { ...c, ...action.patch } : c)) };

    case "addCourt":
      return { ...state, courts: [...state.courts, action.court] };

    case "replyReview":
      return { ...state, reviews: state.reviews.map((r) => (r.id === action.reviewId ? { ...r, reply: action.reply } : r)) };

    case "setFlag":
      return { ...state, flags: { ...state.flags, [action.key]: action.value } };

    case "setListState":
      return { ...state, listState: action.value };

    default:
      return state;
  }
}

/* ------------------------------- Context -------------------------------- */
type KoraContextValue = {
  state: KoraState;
  dispatch: React.Dispatch<KoraAction>;
  hydrated: boolean;
  me: Player; // the active player persona (Omar or Salma)
  playersById: Map<string, Player>;
  venuesById: Map<string, Venue>;
  courtsById: Map<string, Court>;
  gamesById: Map<string, Game>;
  bookingIndex: Map<string, Booking>;
  sendMessage: (gameId: string, authorId: string, text: string) => void;
};

const KoraContext = createContext<KoraContextValue | null>(null);

export function KoraProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(koraReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);

  // Load saved demo progress once, after the first (server-matching) render.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as KoraState });
    } catch {
      // Storage can be blocked (private mode); the prototype still works in memory.
    }
    // Syncing with an external system (localStorage) is the intended use of an effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // Save progress (debounced) whenever state changes after hydration.
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Quota or privacy errors are non-fatal for a prototype.
      }
    }, 300);
    // Also flush immediately if the tab is closed or reloaded before the debounce fires.
    const flush = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Non-fatal.
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
    };
  }, [state, hydrated]);

  // Id -> record maps make every lookup O(1); rebuilt only when that slice changes.
  const playersById = useMemo(() => new Map(state.players.map((p) => [p.id, p])), [state.players]);
  const venuesById = useMemo(() => new Map(state.venues.map((v) => [v.id, v])), [state.venues]);
  const courtsById = useMemo(() => new Map(state.courts.map((c) => [c.id, c])), [state.courts]);
  const gamesById = useMemo(() => new Map(state.games.map((g) => [g.id, g])), [state.games]);
  const bookingIndex = useMemo(() => indexBookings(state.bookings), [state.bookings]);
  const me = playersById.get(state.currentPlayerId) ?? state.players[0];

  const sendMessage = useCallback((gameId: string, authorId: string, text: string) => {
    dispatch({ type: "sendMessage", message: { id: uid("m"), gameId, kind: "user", authorId, text, at: demoNow() } });
  }, []);

  const value = useMemo<KoraContextValue>(
    () => ({ state, dispatch, hydrated, me, playersById, venuesById, courtsById, gamesById, bookingIndex, sendMessage }),
    [state, hydrated, me, playersById, venuesById, courtsById, gamesById, bookingIndex, sendMessage],
  );

  return <KoraContext.Provider value={value}>{children}</KoraContext.Provider>;
}

/** Access the Kora store from any client component. */
export function useKora() {
  const ctx = useContext(KoraContext);
  if (!ctx) throw new Error("useKora must be used inside <KoraProvider>");
  return ctx;
}
