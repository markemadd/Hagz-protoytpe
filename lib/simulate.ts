import { LEVEL_RANK, PERSONAS } from "./constants";
import type { Game, Player } from "./types";

/* =========================================================================
   Prototype-only helpers that "fast-forward" the marketplace: they pick which
   community players join a game so reviewers can watch it fill and confirm.
   ========================================================================= */

const PERSONA_IDS = new Set<string>([PERSONAS.omar.playerId, PERSONAS.salma.playerId]);

/**
 * Choose up to `count` players to join `game`.
 * Priority: invited friends → players of that sport with the closest level → anyone else.
 * O(P log P) for P players (P = 20 here).
 */
export function pickJoiners(game: Game, players: Player[], count: number): string[] {
  if (count <= 0) return [];
  const inGame = new Set(game.playerIds);
  // People who are not already in and are not one of the demo personas.
  const pool = players.filter((p) => !inGame.has(p.id) && !PERSONA_IDS.has(p.id));

  // 1) Invited friends accept first (that's what invites are for).
  const invited = pool.filter((p) => game.invitedIds.includes(p.id));
  // 2) Then players of the right sport, closest level first, most reliable first.
  const sporty = pool
    .filter((p) => !game.invitedIds.includes(p.id) && p.sports[game.sport])
    .sort((a, b) => {
      const gapA = Math.abs(LEVEL_RANK[a.sports[game.sport]!] - LEVEL_RANK[game.level]);
      const gapB = Math.abs(LEVEL_RANK[b.sports[game.sport]!] - LEVEL_RANK[game.level]);
      return gapA - gapB || b.reliability - a.reliability;
    });
  // 3) Finally anyone else, so a game can always be demoed to "full".
  const rest = pool.filter((p) => !game.invitedIds.includes(p.id) && !p.sports[game.sport]);

  return [...invited, ...sporty, ...rest].slice(0, count).map((p) => p.id);
}
