"use client";

import { MapPin, Star, Tag } from "lucide-react";
import Link from "next/link";
import { AmenityList } from "@/components/kora/amenity-icon";
import { CourtArt } from "@/components/kora/court-art";
import { SportIcon } from "@/components/kora/sport-icon";
import { AREAS, SPORTS } from "@/lib/constants";
import { formatEGP } from "@/lib/format";
import { distanceFromArea } from "@/lib/matching";
import { venueCourts, venueFromPrice, venueHasDeal, venueSports } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Venue card used on Home ("Courts near you") and Explore. */
export function VenueCard({ venue, layout = "rail", className }: { venue: Venue; layout?: "rail" | "list"; className?: string }) {
  const { state, me } = useKora();
  const courts = venueCourts(state.courts, venue.id);
  const sports = venueSports(courts);
  const km = distanceFromArea(me.area, venue);
  const deal = venueHasDeal(state.slotOverrides, courts);

  return (
    <Link
      href={`/play/courts/${venue.id}`}
      className={cn(
        "block overflow-hidden rounded-2xl border bg-white shadow-xs transition-colors outline-none hover:border-slate-300 focus-visible:ring-[3px] focus-visible:ring-ring/40",
        layout === "rail" ? "w-64 shrink-0" : "w-full",
        className,
      )}
    >
      <div className={cn("relative", layout === "rail" ? "h-28" : "h-32")}>
        <CourtArt sport={sports[0]} />
        {deal && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-volt px-2.5 py-1 text-xs font-bold text-slate-900">
            <Tag className="size-3.5" aria-hidden /> Off-peak deals
          </span>
        )}
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold">
          <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden /> {venue.rating.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </span>
      </div>
      <div className="p-3">
        <p className="truncate font-bold">{venue.name}</p>
        <p className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="size-3.5" aria-hidden /> {AREAS[venue.area].label} · {km} km
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <ul className="flex gap-1" aria-label="Sports">
            {sports.map((s) => (
              <li key={s} className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-brand-dark" title={SPORTS[s].label}>
                <SportIcon sport={s} className="size-4" title={SPORTS[s].label} />
              </li>
            ))}
          </ul>
          <p className="text-sm">
            <span className="text-slate-600">from </span>
            <span className="font-extrabold">{formatEGP(venueFromPrice(courts))}</span>
            <span className="text-slate-600">/h</span>
          </p>
        </div>
        {layout === "list" && <AmenityList amenities={venue.amenities} compact className="mt-2" />}
      </div>
    </Link>
  );
}
