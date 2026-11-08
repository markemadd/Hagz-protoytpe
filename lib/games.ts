import { DEMO_NOW_HOUR, DEMO_TODAY } from "./constants";
import { daysBetween } from "./format";
import type { Game } from "./types";

/* Small, pure helpers about a single game. All O(1) unless noted. */

/** Open places left before the game is full. */
export function spotsLeft(game: Game) {
  return Math.max(0, game.capacity - game.playerIds.length);
}

/** Players still needed before the court is booked and the game is confirmed. */
export function neededToConfirm(game: Game) {
  return Math.max(0, game.minPlayers - game.playerIds.length);
}

/** True once the game's start time is behind the demo clock. */
export function isInPast(game: Pick<Game, "date" | "startHour">) {
  const diff = daysBetween(DEMO_TODAY, game.date);
  return diff < 0 || (diff === 0 && game.startHour <= DEMO_NOW_HOUR);
}

/** Has this player joined? O(p) over the player list (p <= 14). */
export function hasJoined(game: Game, playerId: string) {
  return game.playerIds.includes(playerId);
}

/** Human status sentence used under progress bars. */
export function statusSentence(game: Game) {
  if (game.status === "confirmed") return "Confirmed · court booked";
  if (game.status === "cancelled") return "Cancelled · everyone refunded";
  if (game.status === "completed") return "Played";
  const need = neededToConfirm(game);
  return need > 0 ? `Waiting for ${need} more ${need === 1 ? "player" : "players"}` : "Confirming…";
}

/** Sort key: chronological order of kick-off. */
export function kickoffKey(game: Pick<Game, "date" | "startHour">) {
  return `${game.date}-${String(game.startHour.toFixed(1)).padStart(4, "0")}`;
}
