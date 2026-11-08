import { ShieldCheck, Sparkles } from "lucide-react";
import { LEVELS, LEVEL_RANK } from "@/lib/constants";
import type { Player, SkillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Three ascending bars + label, so level never depends on colour. */
export function LevelBadge({ level, className }: { level: SkillLevel; className?: string }) {
  const rank = LEVEL_RANK[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700", className)}>
      <span aria-hidden className="flex items-end gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-sm", i <= rank ? "bg-brand" : "bg-slate-300")} style={{ height: 5 + i * 3 }} />
        ))}
      </span>
      {LEVELS[level].label}
    </span>
  );
}

/** Reliability = % of joined games the player actually showed up to. */
export function ReliabilityBadge({ player, className }: { player: Pick<Player, "reliability" | "gamesPlayed">; className?: string }) {
  if (player.gamesPlayed < 3) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-900", className)}>
        <Sparkles aria-hidden className="size-3" /> New player
      </span>
    );
  }
  const tone =
    player.reliability >= 95 ? "bg-brand-soft text-brand-dark" : player.reliability >= 85 ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-900";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tone, className)} title="Shows up to games they join">
      <ShieldCheck aria-hidden className="size-3" /> {player.reliability}% reliable
    </span>
  );
}

/** Lime chip with the match score from the matching engine. */
export function MatchScoreChip({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-volt px-2.5 py-1 text-xs font-extrabold text-slate-900", className)}>
      <Sparkles aria-hidden className="size-3.5" /> {score}% match
    </span>
  );
}
