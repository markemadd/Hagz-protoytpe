import { initials } from "@/lib/format";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES = { xs: "size-7 text-[10px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-xl", xl: "size-20 text-2xl" };

/** Initials avatar; colour pairs are -100 backgrounds with -900 text (>= 7:1). */
export function PlayerAvatar({ player, size = "md", className, ring = false }: { player: Pick<Player, "name" | "avatarColor">; size?: keyof typeof SIZES; className?: string; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold",
        player.avatarColor,
        SIZES[size],
        ring && "ring-2 ring-white",
        className,
      )}
    >
      {initials(player.name)}
    </span>
  );
}

/** Overlapping avatars with a "+n" overflow bubble. */
export function AvatarStack({ players, max = 4, size = "sm" }: { players: Player[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = players.slice(0, max);
  const extra = players.length - shown.length;
  return (
    <div className="flex items-center -space-x-2" aria-label={`${players.length} players: ${players.map((p) => p.name).join(", ")}`} role="img">
      {shown.map((p) => (
        <PlayerAvatar key={p.id} player={p} size={size} ring />
      ))}
      {extra > 0 && (
        <span aria-hidden className={cn("inline-flex items-center justify-center rounded-full bg-slate-900 font-bold text-white ring-2 ring-white", SIZES[size])}>
          +{extra}
        </span>
      )}
    </div>
  );
}
