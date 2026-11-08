/* =========================================================================
   Pure read-side helpers ("selectors") shared by screens. Keeping them out of
   components makes the rules easy to find and unit-test.
   ========================================================================= */

import { DEMO_NOW } from "./constants";
import { isInPast, kickoffKey } from "./games";
import type { AppNotification, ChatMessage, Court, Game, SlotOverride, SportId } from "./types";

/** Courts belonging to a venue. O(C). */
export function venueCourts(courts: Court[], venueId: string) {
  return courts.filter((c) => c.venueId === venueId);
}

/** Cheapest hourly list price at a venue ("from EGP 350/h"). */
export function venueFromPrice(courts: Court[]) {
  return Math.min(...courts.map((c) => c.priceOffPeak));
}

/** Distinct sports offered by a set of courts, in a stable order. */
export function venueSports(courts: Court[]): SportId[] {
  return Array.from(new Set(courts.map((c) => c.sport)));
}

/** Does any court at the venue have a promoted (discounted) slot? O(K) over overrides. */
export function venueHasDeal(overrides: Record<string, SlotOverride>, courts: Court[]) {
  const ids = new Set(courts.map((c) => c.id));
  return Object.entries(overrides).some(([key, o]) => o.promoted && ids.has(key.split("|")[0]));
}

/** Split a player's games into the three My Games tabs. O(G log G). */
export function myGames(games: Game[], playerId: string) {
  const mine = games.filter((g) => g.playerIds.includes(playerId)).sort((a, b) => kickoffKey(a).localeCompare(kickoffKey(b)));
  return {
    upcoming: mine.filter((g) => g.status === "confirmed" && !isInPast(g)),
    pending: mine.filter((g) => g.status === "filling" && !isInPast(g)),
    // Past tab: newest first.
    past: mine.filter((g) => g.status === "completed" || g.status === "cancelled" || isInPast(g)).reverse(),
  };
}

export function unreadCount(notifications: AppNotification[], userId: string) {
  let n = 0;
  for (const x of notifications) if (x.userId === userId && !x.read) n++;
  return n;
}

export type ChatThread = { game: Game; last: ChatMessage | undefined; unread: number };

/**
 * One chat per game the player is in. Messages are grouped in a single O(M)
 * pass instead of filtering all messages once per game (O(G·M)).
 */
export function chatThreads(games: Game[], messages: ChatMessage[], reads: Record<string, number>, playerId: string): ChatThread[] {
  const byGame = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    const list = byGame.get(m.gameId);
    if (list) list.push(m);
    else byGame.set(m.gameId, [m]);
  }
  return games
    .filter((g) => g.playerIds.includes(playerId))
    .map((game) => {
      const list = byGame.get(game.id) ?? [];
      // Seeded history (older than 30 min before the demo starts) counts as already read.
      const lastRead = reads[`${playerId}|${game.id}`] ?? DEMO_NOW - 30 * 60_000;
      const unread = list.filter((m) => m.at > lastRead && m.authorId !== playerId).length;
      return { game, last: list[list.length - 1], unread };
    })
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
}
