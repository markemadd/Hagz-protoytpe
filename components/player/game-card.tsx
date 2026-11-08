"use client";

import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { LevelBadge, MatchScoreChip } from "@/components/kora/badges";
import { CourtArt } from "@/components/kora/court-art";
import { SpotsBar } from "@/components/kora/spots-bar";
import { SportIcon } from "@/components/kora/sport-icon";
import { GameStatusChip } from "@/components/kora/status-chip";
import { SPORTS } from "@/lib/constants";
import { dayLabel, formatEGP, formatTimeRange } from "@/lib/format";
import { distanceFromArea } from "@/lib/matching";
import { priceSplit } from "@/lib/pricing";
import { useKora } from "@/lib/store";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Game summary card: sport, court, when, distance, level, fill progress, price per person. */
export function GameCard({ game, score, showStatus = false, className }: { game: Game; score?: number; showStatus?: boolean; className?: string }) {
  const { venuesById, courtsById, me } = useKora();
  const venue = venuesById.get(game.venueId);
  const court = courtsById.get(game.courtId);
  if (!venue || !court) return null;
  const km = distanceFromArea(me.area, venue);
  const { perPerson } = priceSplit(game.courtTotal, game.capacity, game.minPlayers);

  return (
    <Link
      href={`/play/games/${game.id}`}
      className={cn("block rounded-2xl border bg-white p-3 shadow-xs transition-colors outline-none hover:border-slate-300 focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
    >
      <div className="flex gap-3">
        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl">
          <CourtArt sport={game.sport} />
          <span className="absolute bottom-1 left-1 rounded-lg bg-white/95 p-1 text-brand-dark">
            <SportIcon sport={game.sport} className="size-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold leading-tight">{SPORTS[game.sport].label}</p>
            {score !== undefined ? <MatchScoreChip score={score} /> : showStatus ? <GameStatusChip status={game.status} /> : null}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-600">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{venue.name}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{km} km</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
            <CalendarDays className="size-3.5" aria-hidden /> {dayLabel(game.date)} · {formatTimeRange(game.startHour, game.duration)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <LevelBadge level={game.level} />
        {game.visibility === "invite" && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Invite-only</span>}
        <p className="ml-auto text-right leading-none">
          <span className="text-lg font-extrabold">{formatEGP(perPerson)}</span>
          <span className="text-xs font-medium text-slate-600"> /person</span>
        </p>
      </div>
      <SpotsBar game={game} className="mt-3" compact />
    </Link>
  );
}
