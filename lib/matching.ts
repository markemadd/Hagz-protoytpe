/* =========================================================================
   Kora matching engine (prototype version)

   A player is matched to an open game with a weighted multi-attribute score
   over three criteria the persona research surfaced (time, distance, level):

     score = 0.40 · timeFit + 0.30 · distanceFit + 0.30 · levelFit

   - Matching people to games is a *reciprocal* problem: the game (and its
     organiser) also has preferences, chiefly skill level. Reciprocal
     recommender literature (Pizzato et al., 2010; Palomares et al., 2021)
     recommends scoring both sides' fit, which is why level is a first-class
     term rather than a filter.
   - Skill uses three self-rated buckets for now. A production system would
     replace them with a Bayesian rating such as TrueSkill 2 (Minka et al., 2018)
     updated from post-game "level accurate" feedback.

   Complexity: scoring is O(1) per game, so ranking n games is O(n log n)
   (dominated by the sort). Venue lookups use a Map, so they are O(1).
   ========================================================================= */

import { AREAS, LEVEL_RANK, TIME_RANGES } from "./constants";
import { isWeekend } from "./format";
import { isInPast, spotsLeft } from "./games";
import type { AreaId, Availability, Game, Player, SkillLevel, SportId, Venue } from "./types";

export type LatLng = { lat: number; lng: number };

const WEIGHTS = { time: 0.4, distance: 0.3, level: 0.3 } as const;

/** Great-circle distance in km (haversine formula). O(1). */
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371; // Earth radius, km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance from an area's centre to a venue, rounded to 0.1 km. */
export function distanceFromArea(area: AreaId, venue: LatLng) {
  return Math.round(haversineKm(AREAS[area], venue) * 10) / 10;
}

/** Share of the game that falls inside the [from, to) window (0–1). */
export function timeFit(start: number, duration: number, from: number, to: number) {
  const overlap = Math.max(0, Math.min(start + duration, to) - Math.max(start, from));
  return overlap / duration;
}

/** Same as timeFit, but against a player's usual availability buckets for that day type. */
export function availabilityFit(game: Pick<Game, "date" | "startHour" | "duration">, availability: Availability) {
  const ranges = isWeekend(game.date) ? availability.weekend : availability.weekday;
  // Buckets are non-overlapping, so summing per-bucket overlap is exact. O(4).
  let covered = 0;
  for (const id of ranges) covered += timeFit(game.startHour, game.duration, TIME_RANGES[id].from, TIME_RANGES[id].to);
  return Math.min(1, covered);
}

/** 1 inside your doorstep, falling linearly to 0.5 at the edge of your radius; 0 beyond. */
export function distanceFit(km: number, radiusKm: number) {
  return km > radiusKm ? 0 : 1 - 0.5 * (km / radiusKm);
}

/** Same level = 1, one level apart = 0.5, two apart = 0. */
export function levelFit(a: SkillLevel, b: SkillLevel) {
  return [1, 0.5, 0][Math.abs(LEVEL_RANK[a] - LEVEL_RANK[b])];
}

export type MatchResult = {
  game: Game;
  venue: Venue;
  score: number; // 0–100
  distanceKm: number;
  fit: { time: number; distance: number; level: number };
};

/** Combine the three fits into a 0–100 score. */
function combine(time: number, distance: number, level: number) {
  return Math.round((WEIGHTS.time * time + WEIGHTS.distance * distance + WEIGHTS.level * level) * 100);
}

/** Can this player see and join this game at all? */
function isJoinable(game: Game, playerId: string) {
  return (
    game.status === "filling" &&
    spotsLeft(game) > 0 &&
    !game.playerIds.includes(playerId) &&
    !isInPast(game) &&
    (game.visibility === "public" || game.invitedIds.includes(playerId))
  );
}

export type FindQuery = {
  sport: SportId;
  date: string;
  fromHour: number;
  toHour: number;
  area: AreaId;
  radiusKm: number;
  level: SkillLevel;
};

/** "Find me a game": explicit query from the wizard. Returns best matches first. O(n log n). */
export function findMatches(
  games: Game[],
  venuesById: Map<string, Venue>,
  query: FindQuery,
  playerId: string,
): MatchResult[] {
  const origin = AREAS[query.area];
  const results: MatchResult[] = [];
  for (const game of games) {
    // Hard filters first: cheapest checks reject most games.
    if (game.sport !== query.sport || game.date !== query.date) continue;
    if (!isJoinable(game, playerId)) continue;
    const time = timeFit(game.startHour, game.duration, query.fromHour, query.toHour);
    if (time === 0) continue; // completely outside the player's window
    const venue = venuesById.get(game.venueId);
    if (!venue) continue;
    const km = Math.round(haversineKm(origin, venue) * 10) / 10;
    const distance = distanceFit(km, query.radiusKm);
    if (distance === 0) continue; // beyond travel radius
    const level = levelFit(query.level, game.level);
    results.push({ game, venue, distanceKm: km, score: combine(time, distance, level), fit: { time, distance, level } });
  }
  // Highest score first; ties broken by earliest kick-off.
  return results.sort((a, b) => b.score - a.score || a.game.startHour - b.game.startHour);
}

/** "Games for you" on Home: implicit query built from the player's profile. O(n log n). */
export function gamesForPlayer(
  games: Game[],
  venuesById: Map<string, Venue>,
  player: Player,
  limit = 5,
): MatchResult[] {
  const results: MatchResult[] = [];
  for (const game of games) {
    const myLevel = player.sports[game.sport];
    if (!myLevel || !isJoinable(game, player.id)) continue; // only sports the player plays
    const venue = venuesById.get(game.venueId);
    if (!venue) continue;
    const km = distanceFromArea(player.area, venue);
    const distance = distanceFit(km, player.radiusKm);
    if (distance === 0) continue;
    // Fall back to a neutral 0.5 when the player hasn't told us their availability yet.
    const hasAvailability = player.availability.weekday.length + player.availability.weekend.length > 0;
    const time = hasAvailability ? availabilityFit(game, player.availability) : 0.5;
    const level = levelFit(myLevel, game.level);
    const score = combine(time, distance, level);
    if (score < 45) continue; // weak matches are noise on the home feed
    results.push({ game, venue, distanceKm: km, score, fit: { time, distance, level } });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Players likely to want a given court-hour (used by owners' "Fill idle slots"). O(P). */
export function interestedPlayers(
  players: Player[],
  sport: SportId,
  venue: Venue,
  date: string,
  hour: number,
): Player[] {
  return players.filter((p) => {
    if (!p.sports[sport]) return false; // must play the sport
    if (distanceFromArea(p.area, venue) > p.radiusKm) return false; // must be willing to travel
    return availabilityFit({ date, startHour: hour, duration: 1 }, p.availability) > 0; // usually free then
  });
}
