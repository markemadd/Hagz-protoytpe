"use client";

import { useId } from "react";
import type { SportId } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Top-down court illustrations used as venue "photos" (no external images needed). */

const PALETTE: Record<SportId, { from: string; to: string; stripe: string }> = {
  football5: { from: "#16a067", to: "#0b6a43", stripe: "#ffffff" },
  football7: { from: "#139a5f", to: "#0a5c3b", stripe: "#ffffff" },
  padel: { from: "#2b6fd6", to: "#1a4fa3", stripe: "#ffffff" },
  basketball: { from: "#d1843f", to: "#a85a22", stripe: "#3b1d08" },
  tennis: { from: "#c9643a", to: "#9f4524", stripe: "#ffffff" },
};

export function CourtArt({ sport, className, label }: { sport: SportId; className?: string; label?: string }) {
  const p = PALETTE[sport];
  // useId keeps gradient ids unique when many cards render on one page.
  const id = `grad-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const line = { stroke: "#ffffff", strokeOpacity: 0.85, strokeWidth: 3, fill: "none" };
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.from} />
          <stop offset="1" stopColor={p.to} />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.3" cy="0.1" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id})`} />

      {(sport === "football5" || sport === "football7") && (
        <g>
          {/* mowing stripes */}
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={i * 40} y="0" width="20" height="220" fill={p.stripe} fillOpacity="0.06" />
          ))}
          <rect x="20" y="20" width="360" height="180" rx="2" {...line} />
          <line x1="200" y1="20" x2="200" y2="200" {...line} />
          <circle cx="200" cy="110" r="32" {...line} />
          <circle cx="200" cy="110" r="3" fill="#fff" />
          <rect x="20" y="65" width="52" height="90" {...line} />
          <rect x="328" y="65" width="52" height="90" {...line} />
          <rect x="8" y="90" width="12" height="40" {...line} />
          <rect x="380" y="90" width="12" height="40" {...line} />
        </g>
      )}

      {sport === "padel" && (
        <g>
          <rect x="34" y="22" width="332" height="176" rx="4" stroke="#bfdbfe" strokeOpacity="0.9" strokeWidth="8" fill="none" />
          <rect x="44" y="32" width="312" height="156" {...line} />
          <line x1="200" y1="24" x2="200" y2="196" stroke="#fff" strokeWidth="5" strokeDasharray="6 4" />
          <line x1="116" y1="32" x2="116" y2="188" {...line} />
          <line x1="284" y1="32" x2="284" y2="188" {...line} />
          <line x1="116" y1="110" x2="284" y2="110" {...line} />
        </g>
      )}

      {sport === "basketball" && (
        <g>
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1="0" y1={i * 22} x2="400" y2={i * 22} stroke={p.stripe} strokeOpacity="0.12" strokeWidth="1.5" />
          ))}
          <rect x="20" y="20" width="360" height="180" {...line} />
          <line x1="200" y1="20" x2="200" y2="200" {...line} />
          <circle cx="200" cy="110" r="28" {...line} />
          <rect x="20" y="80" width="70" height="60" {...line} fill="#ffffff" fillOpacity="0.12" />
          <rect x="310" y="80" width="70" height="60" {...line} fill="#ffffff" fillOpacity="0.12" />
          <path d="M20 34 A 100 100 0 0 1 20 186" {...line} />
          <path d="M380 34 A 100 100 0 0 0 380 186" {...line} />
        </g>
      )}

      {sport === "tennis" && (
        <g>
          <rect x="28" y="24" width="344" height="172" {...line} />
          <line x1="28" y1="44" x2="372" y2="44" {...line} />
          <line x1="28" y1="176" x2="372" y2="176" {...line} />
          <line x1="200" y1="18" x2="200" y2="202" stroke="#fff" strokeWidth="5" />
          <line x1="112" y1="44" x2="112" y2="176" {...line} />
          <line x1="288" y1="44" x2="288" y2="176" {...line} />
          <line x1="112" y1="110" x2="288" y2="110" {...line} />
        </g>
      )}

      <rect width="400" height="220" fill={`url(#${id}-light)`} />
    </svg>
  );
}
