"use client";

import { MapPin } from "lucide-react";
import { useId } from "react";
import { AREAS } from "@/lib/constants";
import type { AreaId, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";

/* =========================================================================
   Stylised Cairo map (placeholder for a real map SDK). Venues are projected
   with a simple equirectangular projection, accurate enough at city scale.
   Pins are real <button>s laid over the SVG so they are keyboard accessible.
   ========================================================================= */

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const CITY: Bounds = { minLat: 29.92, maxLat: 30.12, minLng: 30.93, maxLng: 31.52 };

// Rough course of the Nile through Cairo (lat, lng), south to north.
const NILE: Array<[number, number]> = [
  [29.92, 31.236], [29.95, 31.233], [29.98, 31.229], [30.01, 31.228], [30.04, 31.226], [30.06, 31.223], [30.09, 31.228], [30.12, 31.236],
];

/** Project a coordinate into 0–100% of the current view. O(1). */
function project(b: Bounds, lat: number, lng: number) {
  return { x: ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100, y: ((b.maxLat - lat) / (b.maxLat - b.minLat)) * 100 };
}

export type MapPinData = { id: string; venue: Venue; label: string; tone?: "default" | "deal" | "muted" };

export function MiniMap({
  pins,
  selectedId,
  onSelect,
  home,
  focus,
  className,
}: {
  pins: MapPinData[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  home?: AreaId;
  focus?: { lat: number; lng: number };
  className?: string;
}) {
  const patternId = `streets-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // Zoom into a single venue when `focus` is given, otherwise show the whole city.
  const b: Bounds = focus
    ? { minLat: focus.lat - 0.025, maxLat: focus.lat + 0.025, minLng: focus.lng - 0.045, maxLng: focus.lng + 0.045 }
    : CITY;
  const nile = NILE.map(([lat, lng]) => project(b, lat, lng));
  const nilePath = nile.map((p, i) => `${i === 0 ? "M" : "L"}${p.x * 4} ${p.y * 2.6}`).join(" ");
  const homePt = home ? project(b, AREAS[home].lat, AREAS[home].lng) : null;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-[#eef2ef]", className)}>
      <svg viewBox="0 0 400 260" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id={patternId} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <path d="M0 0H34M0 0V34" stroke="#ffffff" strokeWidth="3" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill={`url(#${patternId})`} />
        {/* parks */}
        <ellipse cx="250" cy="70" rx="38" ry="18" fill="#d5ead9" />
        <ellipse cx="90" cy="190" rx="44" ry="20" fill="#d5ead9" />
        {/* ring road */}
        <ellipse cx="215" cy="130" rx="150" ry="100" fill="none" stroke="#f5d68a" strokeWidth="4" />
        {/* Nile */}
        <path d={nilePath} fill="none" stroke="#9cc7ea" strokeWidth="12" strokeLinecap="round" />
      </svg>

      {/* Area labels for orientation (city view only) */}
      {!focus &&
        (Object.keys(AREAS) as AreaId[]).map((id) => {
          const pt = project(b, AREAS[id].lat, AREAS[id].lng);
          return (
            <span key={id} aria-hidden className="pointer-events-none absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide text-slate-500" style={{ left: `${pt.x}%`, top: `calc(${pt.y}% + 14px)` }}>
              {AREAS[id].label}
            </span>
          );
        })}

      {homePt && (
        <span aria-hidden className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ left: `${homePt.x}%`, top: `${homePt.y}%` }}>
          <span className="absolute size-8 animate-ping rounded-full bg-sky-400/40" />
          <span className="relative size-4 rounded-full border-[3px] border-white bg-sky-600 shadow" />
        </span>
      )}

      {pins.map((pin) => {
        const pt = project(b, pin.venue.lat, pin.venue.lng);
        if (pt.x < 0 || pt.x > 100 || pt.y < 0 || pt.y > 100) return null; // outside view
        const selected = pin.id === selectedId;
        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => onSelect?.(pin.id)}
            aria-label={pin.label}
            aria-pressed={onSelect ? selected : undefined}
            disabled={!onSelect}
            className="absolute flex size-11 -translate-x-1/2 -translate-y-full items-end justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
            style={{ left: `${pt.x}%`, top: `${pt.y}%`, zIndex: selected ? 10 : 1 }}
          >
            <MapPin
              aria-hidden
              className={cn(
                "drop-shadow transition-transform",
                selected ? "size-10 scale-110" : "size-8",
                pin.tone === "deal" ? "fill-volt text-slate-900" : pin.tone === "muted" ? "fill-slate-300 text-slate-500" : "fill-primary text-white",
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
