import { Progress } from "@/components/ui/progress";
import { neededToConfirm, spotsLeft } from "@/lib/games";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "7/10 joined" meter with a tick at the confirmation threshold.
 * Always states spots left in words so the bar is never the only signal.
 */
export function SpotsBar({ game, className, compact = false }: { game: Game; className?: string; compact?: boolean }) {
  const joined = game.playerIds.length;
  const pct = Math.round((joined / game.capacity) * 100);
  const minPct = (game.minPlayers / game.capacity) * 100;
  const left = spotsLeft(game);
  const need = neededToConfirm(game);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-slate-900">
          {joined}/{game.capacity} joined
        </span>
        <span className="font-medium text-slate-600">
          {left === 0 ? "Full" : `${left} ${left === 1 ? "spot" : "spots"} left`}
          {!compact && game.status === "filling" && need > 0 && ` · ${need} to confirm`}
        </span>
      </div>
      <div className="relative">
        <Progress value={pct} aria-label={`${joined} of ${game.capacity} players joined`} />
        {game.minPlayers < game.capacity && (
          <span
            aria-hidden
            title={`Confirms at ${game.minPlayers}`}
            className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-slate-900"
            style={{ left: `calc(${minPct}% - 1px)` }}
          />
        )}
      </div>
    </div>
  );
}
