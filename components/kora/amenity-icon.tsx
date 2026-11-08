import { Car, Coffee, Droplets, Lightbulb, Shirt, ShowerHead, Snowflake, Package } from "lucide-react";
import { AMENITIES } from "@/lib/constants";
import type { Amenity } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = { parking: Car, lighting: Lightbulb, changing: Shirt, showers: ShowerHead, cafe: Coffee, rental: Package, ac: Snowflake, water: Droplets };

export function AmenityIcon({ amenity, className }: { amenity: Amenity; className?: string }) {
  const Icon = ICONS[amenity];
  return <Icon aria-hidden className={cn("size-4", className)} />;
}

/** Icon + label pills. `compact` shows icons only (labels stay in sr-only text). */
export function AmenityList({ amenities, compact = false, className }: { amenities: Amenity[]; compact?: boolean; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {amenities.map((a) => (
        <li key={a} className={cn("inline-flex items-center gap-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700", compact ? "size-7 justify-center" : "px-2.5 py-1")} title={AMENITIES[a]}>
          <AmenityIcon amenity={a} className="size-3.5" />
          <span className={compact ? "sr-only" : undefined}>{AMENITIES[a]}</span>
        </li>
      ))}
    </ul>
  );
}
