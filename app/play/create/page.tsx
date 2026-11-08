"use client";

import { Check, CheckCircle2, Globe, Info, List, Lock, Map as MapIcon, Minus, Plus, Star, Tag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AmenityList } from "@/components/kora/amenity-icon";
import { LevelBadge } from "@/components/kora/badges";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { CourtArt } from "@/components/kora/court-art";
import { EmptyState } from "@/components/kora/list-state";
import { MiniMap } from "@/components/kora/mini-map";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { SportIcon } from "@/components/kora/sport-icon";
import { Stepper } from "@/components/kora/stepper";
import { ScreenHeader, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { AREAS, DEMO_TODAY, LEVELS, LEVEL_IDS, PERSONAS, SPORTS, SPORT_IDS, demoNow } from "@/lib/constants";
import { isWindowFree } from "@/lib/availability";
import { addDays, dayLabel, dayMonth, formatDuration, formatEGP, formatHour, formatTimeRange, weekdayShort } from "@/lib/format";
import { distanceFromArea } from "@/lib/matching";
import { OMAR_FRIENDS } from "@/lib/mock-data";
import { priceSplit, slotKey, slotTotal } from "@/lib/pricing";
import { useKora } from "@/lib/store";
import type { Court, Game, SkillLevel, SportId, Venue } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const STEPS = ["Sport", "Date & time", "Court", "Players", "Review"];
const START_HOURS = Array.from({ length: 16 }, (_, i) => 8 + i); // 8 AM … 11 PM
const DURATIONS = [1, 1.5, 2];

type CourtOption = {
  court: Court;
  venue: Venue;
  km: number;
  free: boolean;
  total: number; // EGP for the chosen window, after owner discounts
  deal: boolean; // any promoted hour in the window
  alternatives: number[]; // nearby free start hours if the chosen one is taken
};

export default function CreateGameScreen() {
  const router = useRouter();
  const { state, me, dispatch, bookingIndex, playersById } = useKora();
  const isOmar = me.id === PERSONAS.omar.playerId;

  // Defaults reproduce Omar's scenario: 5-a-side on Wednesday at 8 PM, bringing 4 friends.
  const [step, setStep] = useState(1);
  const [sport, setSport] = useState<SportId>((Object.keys(me.sports)[0] as SportId) ?? "football5");
  const [date, setDate] = useState(addDays(DEMO_TODAY, 3));
  const [startHour, setStartHour] = useState(20);
  const [duration, setDuration] = useState(SPORTS[sport].duration);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState({ nearMe: false, indoor: false, lighting: false, deals: false });
  const [capacity, setCapacity] = useState(SPORTS[sport].capacity);
  const [friends, setFriends] = useState<string[]>(isOmar ? OMAR_FRIENDS.slice(0, 4) : []);
  const [level, setLevel] = useState<SkillLevel>(me.sports[sport] ?? "intermediate");
  const [visibility, setVisibility] = useState<"public" | "invite">("public");

  const meta = SPORTS[sport];
  // Confirmation threshold scales with capacity (8 of 10 for 5-a-side).
  const minPlayers = Math.min(capacity, Math.max(2, Math.round((capacity * meta.minPlayers) / meta.capacity)));
  const friendList = isOmar ? OMAR_FRIENDS : [];

  function chooseSport(s: SportId) {
    setSport(s);
    setDuration(SPORTS[s].duration);
    setCapacity(SPORTS[s].capacity);
    setLevel(me.sports[s] ?? "intermediate");
    setCourtId(null);
    setFriends((f) => f.slice(0, SPORTS[s].capacity - 1));
  }

  /* ---------- Court options: O(C · duration) over courts of this sport ---------- */
  const options = useMemo<CourtOption[]>(() => {
    const venueById = new Map(state.venues.map((v) => [v.id, v]));
    const list: CourtOption[] = [];
    for (const court of state.courts) {
      if (court.sport !== sport) continue;
      const venue = venueById.get(court.venueId)!;
      const withinHours = (h: number) => h >= venue.openHour && h + duration <= venue.closeHour;
      const freeAt = (h: number) => withinHours(h) && isWindowFree(court, date, h, duration, bookingIndex, state.slotOverrides);
      const free = freeAt(startHour);
      // Suggest the closest free start times (±3 h) when the chosen time is taken.
      const alternatives = free ? [] : [1, -1, 2, -2, 3, -3].map((d) => startHour + d).filter(freeAt).slice(0, 2).sort((a, b) => a - b);
      let deal = false;
      for (let t = startHour; t < startHour + duration; t += 1) if (state.slotOverrides[slotKey(court.id, date, Math.floor(t))]?.promoted) deal = true;
      list.push({ court, venue, km: distanceFromArea(me.area, venue), free, total: slotTotal(court, date, startHour, duration, state.slotOverrides), deal, alternatives });
    }
    // Recommended order: available first, then deals, then closest.
    return list.sort((a, b) => Number(b.free) - Number(a.free) || Number(b.deal) - Number(a.deal) || a.km - b.km);
  }, [state.courts, state.venues, state.slotOverrides, sport, date, startHour, duration, bookingIndex, me.area]);

  const filtered = options.filter(
    (o) =>
      (!filters.nearMe || o.km <= me.radiusKm) &&
      (!filters.indoor || o.court.indoor) &&
      (!filters.lighting || o.venue.amenities.includes("lighting")) &&
      (!filters.deals || o.deal),
  );
  const selected = options.find((o) => o.court.id === courtId);
  const selectedIsFree = selected?.free ?? false;
  const split = selected ? priceSplit(selected.total, capacity, minPlayers) : null;
  const openSpots = capacity - 1 - friends.length;
  const needToConfirm = Math.max(0, minPlayers - 1 - friends.length);

  const canContinue = step === 3 ? selectedIsFree : step === 4 ? openSpots >= 0 : true;

  function publish() {
    if (!selected) return;
    const game: Game = {
      id: uid("g"),
      sport,
      courtId: selected.court.id,
      venueId: selected.venue.id,
      date,
      startHour,
      duration,
      capacity,
      minPlayers,
      level,
      visibility,
      organizerId: me.id,
      playerIds: [me.id, ...friends],
      invitedIds: [],
      status: "filling",
      courtTotal: selected.total,
      createdAt: demoNow(),
    };
    dispatch({ type: "createGame", game, method: "card" });
    router.push(`/play/games/${game.id}/published`);
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, i));

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader title="Create a game" onBack={step > 1 ? () => setStep(step - 1) : undefined} backHref={step === 1 ? "/play" : undefined} />
      <div className="flex-1 space-y-5 px-4 pb-6 pt-4">
        <Stepper step={step} total={STEPS.length} label={STEPS[step - 1]} />

        {/* 1. Sport */}
        {step === 1 && (
          <section aria-labelledby="c-sport">
            <h2 id="c-sport" className="text-2xl font-extrabold tracking-tight">What are you playing?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {SPORT_IDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sport === s}
                  onClick={() => chooseSport(s)}
                  className={cn(
                    "flex min-h-24 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    sport === s ? "border-primary bg-brand-soft" : "border-slate-200",
                  )}
                >
                  <SportIcon sport={s} className={cn("size-7", sport === s ? "text-brand" : "text-slate-700")} />
                  <span>
                    <span className="block font-bold leading-tight">{SPORTS[s].label}</span>
                    <span className="text-xs text-slate-600">{SPORTS[s].capacity} players</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 2. Date & time */}
        {step === 2 && (
          <section aria-labelledby="c-when" className="space-y-5">
            <h2 id="c-when" className="text-2xl font-extrabold tracking-tight">When?</h2>
            <div>
              <p id="c-day" className="text-sm font-bold">Day</p>
              <div role="group" aria-labelledby="c-day" className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={date === d}
                    onClick={() => { setDate(d); setCourtId(null); }}
                    className={cn("flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", date === d ? "border-primary bg-primary text-white" : "border-slate-300")}
                  >
                    <span className={cn("text-xs font-semibold", date === d ? "text-emerald-50" : "text-slate-600")}>{weekdayShort(d)}</span>
                    <span className="text-lg font-extrabold">{dayMonth(d).split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p id="c-start" className="text-sm font-bold">Kick-off</p>
              <div role="group" aria-labelledby="c-start" className="mt-2 grid grid-cols-4 gap-2">
                {START_HOURS.map((h) => (
                  <ChoiceChip key={h} selected={startHour === h} onClick={() => { setStartHour(h); setCourtId(null); }} className="rounded-xl px-2">
                    {formatHour(h)}
                  </ChoiceChip>
                ))}
              </div>
            </div>
            <div>
              <p id="c-dur" className="text-sm font-bold">Duration</p>
              <div role="group" aria-labelledby="c-dur" className="mt-2 grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <ChoiceChip key={d} selected={duration === d} onClick={() => { setDuration(d); setCourtId(null); }} className="rounded-xl">
                    {formatDuration(d)}
                  </ChoiceChip>
                ))}
              </div>
            </div>
            <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              {dayLabel(date)}, {formatTimeRange(startHour, duration)}. Peak pricing applies after 5 PM and on weekend afternoons.
            </p>
          </section>
        )}

        {/* 3. Court */}
        {step === 3 && (
          <section aria-labelledby="c-court" className="space-y-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 id="c-court" className="text-2xl font-extrabold tracking-tight">Pick a court</h2>
                <p className="text-sm text-slate-600">{meta.label} · {dayLabel(date)}, {formatTimeRange(startHour, duration)}</p>
              </div>
              <div role="group" aria-label="View" className="flex rounded-xl bg-slate-100 p-1">
                {(["list", "map"] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} aria-label={`${v} view`} onClick={() => setView(v)} className={cn("flex size-10 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", view === v && "bg-white shadow-sm")}>
                    {v === "list" ? <List className="size-5" aria-hidden /> : <MapIcon className="size-5" aria-hidden />}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-label="Filters" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              <ChoiceChip selected={filters.nearMe} onClick={() => setFilters((f) => ({ ...f, nearMe: !f.nearMe }))}>Within {me.radiusKm} km</ChoiceChip>
              <ChoiceChip selected={filters.deals} onClick={() => setFilters((f) => ({ ...f, deals: !f.deals }))}><Tag aria-hidden /> Deals</ChoiceChip>
              <ChoiceChip selected={filters.indoor} onClick={() => setFilters((f) => ({ ...f, indoor: !f.indoor }))}>Indoor</ChoiceChip>
              <ChoiceChip selected={filters.lighting} onClick={() => setFilters((f) => ({ ...f, lighting: !f.lighting }))}>Floodlights</ChoiceChip>
            </div>

            {view === "map" && (
              <MiniMap
                className="h-56"
                home={me.area}
                pins={filtered.map((o) => ({ id: o.court.id, venue: o.venue, label: `${o.venue.name}, ${o.court.name}${o.free ? "" : " (taken)"}`, tone: !o.free ? "muted" : o.deal ? "deal" : "default" }))}
                selectedId={courtId ?? undefined}
                onSelect={(id) => setCourtId(id)}
              />
            )}

            {filtered.length === 0 ? (
              <EmptyState icon={<MapIcon />} title="No courts match these filters" description="Remove a filter or try another time." action={<Button variant="outline" onClick={() => setFilters({ nearMe: false, indoor: false, lighting: false, deals: false })}>Clear filters</Button>} />
            ) : (
              <ul className="space-y-3" aria-label="Courts">
                {(view === "map" && selected ? [selected] : filtered).map((o) => (
                  <li key={o.court.id}>
                    <CourtOptionCard
                      option={o}
                      duration={duration}
                      selected={o.court.id === courtId}
                      onSelect={() => setCourtId(o.court.id)}
                      onPickTime={(h) => { setStartHour(h); setCourtId(o.court.id); }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 4. Players */}
        {step === 4 && selected && (
          <section aria-labelledby="c-players" className="space-y-6">
            <h2 id="c-players" className="text-2xl font-extrabold tracking-tight">Who&apos;s playing?</h2>

            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div>
                <p className="font-bold">Total players</p>
                <p className="text-sm text-slate-600">Confirms at {minPlayers}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" aria-label="Fewer players" disabled={capacity <= Math.max(2, friends.length + 1)} onClick={() => setCapacity((c) => c - 1)}>
                  <Minus aria-hidden />
                </Button>
                <span className="w-8 text-center text-xl font-extrabold" aria-live="polite">{capacity}</span>
                <Button size="icon" variant="outline" aria-label="More players" disabled={capacity >= selected.court.capacity} onClick={() => setCapacity((c) => c + 1)}>
                  <Plus aria-hidden />
                </Button>
              </div>
            </div>

            <div>
              <p id="c-friends" className="text-sm font-bold">Friends coming with you</p>
              {friendList.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600">No friends on Kora yet — invite them after publishing.</p>
              ) : (
                <ul aria-labelledby="c-friends" className="mt-2 grid grid-cols-2 gap-2">
                  {friendList.map((fid) => {
                    const p = playersById.get(fid)!;
                    const on = friends.includes(fid);
                    const full = !on && friends.length >= capacity - 1;
                    return (
                      <li key={fid}>
                        <button
                          type="button"
                          aria-pressed={on}
                          disabled={full}
                          onClick={() => setFriends((f) => (on ? f.filter((x) => x !== fid) : [...f, fid]))}
                          className={cn("flex min-h-12 w-full items-center gap-2 rounded-xl border-2 px-2 text-left text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40", on ? "border-primary bg-brand-soft" : "border-slate-200")}
                        >
                          <PlayerAvatar player={p} size="xs" />
                          <span className="flex-1 truncate">{p.name.split(" ")[0]}</span>
                          {on && <Check className="size-4 text-brand" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-2 text-sm font-semibold text-slate-900" aria-live="polite">
                You + {friends.length} = {friends.length + 1} · <span className="text-brand-dark">{openSpots} open {openSpots === 1 ? "spot" : "spots"} for Kora players</span>
              </p>
            </div>

            <div>
              <p id="c-level" className="text-sm font-bold">Skill level</p>
              <div role="group" aria-labelledby="c-level" className="mt-2 grid grid-cols-3 gap-2">
                {LEVEL_IDS.map((l) => (
                  <ChoiceChip key={l} selected={level === l} onClick={() => setLevel(l)} className="rounded-xl px-2">
                    {LEVELS[l].label}
                  </ChoiceChip>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-600">{LEVELS[level].description}</p>
            </div>

            <div>
              <p id="c-vis" className="text-sm font-bold">Who can join?</p>
              <div role="group" aria-labelledby="c-vis" className="mt-2 grid gap-2">
                {([
                  { id: "public", Icon: Globe, title: "Public", text: "Matched players at your level can find and join it." },
                  { id: "invite", Icon: Lock, title: "Invite-only", text: "Only people with your link can join." },
                ] as const).map(({ id, Icon, title, text }) => (
                  <button key={id} type="button" aria-pressed={visibility === id} onClick={() => setVisibility(id)} className={cn("flex items-start gap-3 rounded-2xl border-2 p-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", visibility === id ? "border-primary bg-brand-soft" : "border-slate-200")}>
                    <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="text-sm text-slate-600">{text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. Review */}
        {step === 5 && selected && split && (
          <section aria-labelledby="c-review" className="space-y-4">
            <h2 id="c-review" className="text-2xl font-extrabold tracking-tight">Review & publish</h2>
            <div className="overflow-hidden rounded-2xl border">
              <div className="h-24">
                <CourtArt sport={sport} />
              </div>
              <div className="space-y-1 p-4">
                <p className="font-bold">{meta.label} · {selected.venue.name}</p>
                <p className="text-sm text-slate-600">{selected.court.name} · {dayLabel(date)}, {formatTimeRange(startHour, duration)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <LevelBadge level={level} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{visibility === "public" ? "Public" : "Invite-only"}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{capacity} players · confirms at {minPlayers}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold">Cost split preview</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-600">Court total</dt><dd className="font-semibold">{formatEGP(selected.total)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">If all {capacity} join</dt><dd className="font-semibold">{formatEGP(split.perPerson)} each</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">If only {minPlayers} join</dt><dd className="font-semibold">{formatEGP(split.maxPerPerson)} each</dd></div>
              </dl>
              {/* Visual split: one segment per player, filled = already committed */}
              <div className="mt-3 flex gap-1" aria-hidden>
                {Array.from({ length: capacity }, (_, i) => (
                  <span key={i} className={cn("h-2 flex-1 rounded-full", i < friends.length + 1 ? "bg-primary" : i < minPlayers ? "bg-amber-300" : "bg-slate-200")} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-600">Green: you + friends · Amber: needed to confirm · Grey: optional spots</p>
            </div>

            <p className="flex gap-2 rounded-xl border border-brand/30 bg-brand-soft p-3 text-sm text-slate-800">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                You don&apos;t front the court fee. We hold <strong>your share only</strong> ({formatEGP(split.maxPerPerson)} max) on Visa •••• 4242.
                The court is held now and booked once {minPlayers} join; if it doesn&apos;t fill, everyone is refunded.
              </span>
            </p>
            <p className="text-center text-sm font-semibold text-amber-900">After publishing: waiting for {needToConfirm} more {needToConfirm === 1 ? "player" : "players"}</p>
          </section>
        )}
      </div>

      <StickyFooter>
        {step === 3 && !selected && <p className="mb-2 text-center text-sm text-slate-600">Select an available court to continue.</p>}
        {step < 5 ? (
          <Button size="lg" className="w-full" disabled={!canContinue} onClick={() => setStep(step + 1)}>
            {step === 3 && selected ? `Continue with ${selected.court.name} · ${formatEGP(selected.total)}` : "Continue"}
          </Button>
        ) : (
          <Button size="xl" className="w-full" onClick={publish}>
            <Zap aria-hidden /> Publish game
          </Button>
        )}
      </StickyFooter>
    </div>
  );
}

/** Selectable court row for the create flow. */
function CourtOptionCard({ option, duration, selected, onSelect, onPickTime }: { option: CourtOption; duration: number; selected: boolean; onSelect: () => void; onPickTime: (h: number) => void }) {
  const { court, venue, km, free, total, deal, alternatives } = option;
  const perHour = Math.round(total / duration);
  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 bg-white", selected ? "border-primary" : "border-slate-200", !free && "bg-slate-50")}>
      <button type="button" aria-pressed={selected} disabled={!free} onClick={onSelect} className="flex w-full gap-3 p-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 disabled:cursor-not-allowed">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
          <CourtArt sport={court.sport} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold leading-tight">{venue.name}</p>
            {selected && <CheckCircle2 className="size-5 shrink-0 text-brand" aria-label="Selected" />}
          </div>
          <p className="text-sm text-slate-600">{court.name} · {AREAS[venue.area].label} · {km} km</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-extrabold">{formatEGP(perHour)}<span className="font-medium text-slate-600">/h</span></span>
            {deal && <span className="inline-flex items-center gap-1 rounded-full bg-volt px-2 py-0.5 text-[11px] font-bold text-slate-900"><Tag className="size-3" aria-hidden /> Off-peak deal</span>}
            {venue.ownerId && <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-dark"><Zap className="size-3" aria-hidden /> Instant hold</span>}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-700"><Star className="size-3 fill-amber-400 text-amber-500" aria-hidden />{venue.rating}</span>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <AmenityList amenities={venue.amenities.slice(0, 5)} compact />
        {free ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark"><CheckCircle2 className="size-3.5" aria-hidden /> Available</span>
        ) : (
          <span className="text-xs font-semibold text-slate-700">Taken</span>
        )}
      </div>
      {!free && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-white px-3 py-2">
          <Info className="size-4 text-slate-500" aria-hidden />
          {alternatives.length > 0 ? (
            <>
              <span className="text-xs text-slate-700">Free at</span>
              {alternatives.map((h) => (
                <button key={h} type="button" onClick={() => onPickTime(h)} className="min-h-11 rounded-full border border-primary px-3 text-xs font-bold text-brand-dark outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {formatHour(h)}
                </button>
              ))}
            </>
          ) : (
            <span className="text-xs text-slate-700">Fully booked around this time</span>
          )}
        </div>
      )}
    </div>
  );
}
