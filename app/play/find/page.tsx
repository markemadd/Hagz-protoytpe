"use client";

import { BellRing, CheckCircle2, Clock, Info, MapPin, Pencil, Plus, SearchX, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { AsyncList } from "@/components/kora/list-state";
import { SportIcon } from "@/components/kora/sport-icon";
import { Stepper } from "@/components/kora/stepper";
import { GameCard } from "@/components/player/game-card";
import { ScreenHeader, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { AREAS, AREA_IDS, DEMO_TODAY, LEVELS, LEVEL_IDS, SPORTS, SPORT_IDS } from "@/lib/constants";
import { addDays, dayLabel, dayMonth, formatHour, weekdayShort } from "@/lib/format";
import { findMatches, type FindQuery, type MatchResult } from "@/lib/matching";
import { useKora } from "@/lib/store";
import type { SportId } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const STEPS = ["Sport", "Day & time", "Where", "Level"];
const HOURS = Array.from({ length: 18 }, (_, i) => 7 + i); // 7 AM … midnight
const PRESETS = [
  { label: "Morning", from: 7, to: 12 },
  { label: "Afternoon", from: 12, to: 17 },
  { label: "After work", from: 18, to: 22 },
  { label: "Late", from: 21, to: 24 },
];

export default function FindGameScreen() {
  const { state, me, venuesById, dispatch } = useKora();
  const mySports = Object.keys(me.sports) as SportId[];
  const firstSport = mySports[0] ?? "padel";

  // Wizard state (defaults reproduce Salma's scenario: padel, Thu 6–10 PM, Maadi).
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState<FindQuery>({
    sport: firstSport,
    date: addDays(DEMO_TODAY, 4),
    fromHour: 18,
    toHour: 22,
    area: me.area,
    radiusKm: me.radiusKm,
    level: me.sports[firstSport] ?? "intermediate",
  });
  const set = (patch: Partial<FindQuery>) => setQuery((q) => ({ ...q, ...patch }));
  const showResults = step > STEPS.length;

  // Ranking is O(n log n) over open games; recomputed only when inputs change.
  const results = useMemo(
    () => (showResults ? findMatches(state.games, venuesById, query, me.id) : []),
    [showResults, state.games, venuesById, query, me.id],
  );

  // Mark the demo checkpoint once results are shown.
  useEffect(() => {
    if (showResults && !state.flags[`searched:${me.id}`]) dispatch({ type: "setFlag", key: `searched:${me.id}`, value: true });
  }, [showResults, state.flags, me.id, dispatch]);

  const onWaitlist = state.waitlist.some((w) => w.playerId === me.id && w.sport === query.sport && w.date === query.date);

  function joinWaitlist() {
    dispatch({ type: "joinWaitlist", entry: { id: uid("w"), playerId: me.id, ...query } });
    toast.success("You're on the waitlist", { description: "We'll notify you the moment a matching game forms." });
  }

  const validWindow = query.toHour > query.fromHour;
  const days = Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, i));

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader
        title={showResults ? "Your matches" : "Find me a game"}
        onBack={step > 1 ? () => setStep(showResults ? 1 : step - 1) : undefined}
        backHref={step === 1 ? "/play" : undefined}
      />

      {!showResults ? (
        <>
          <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
            <Stepper step={step} total={STEPS.length} label={STEPS[step - 1]} />

            {step === 1 && (
              <section aria-labelledby="f-sport">
                <h2 id="f-sport" className="text-2xl font-extrabold tracking-tight">What do you want to play?</h2>
                <div className="mt-5 grid gap-2">
                  {SPORT_IDS.map((s) => {
                    const selected = query.sport === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => set({ sport: s, level: me.sports[s] ?? query.level })}
                        className={cn(
                          "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                          selected ? "border-primary bg-brand-soft" : "border-slate-200 bg-white",
                        )}
                      >
                        <span className={cn("flex size-10 items-center justify-center rounded-xl", selected ? "bg-primary text-white" : "bg-slate-100")}>
                          <SportIcon sport={s} className="size-5" />
                        </span>
                        <span className="flex-1 font-bold">{SPORTS[s].label}</span>
                        {me.sports[s] && <span className="text-xs font-semibold text-brand-dark">Your sport</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="f-when" className="space-y-5">
                <h2 id="f-when" className="text-2xl font-extrabold tracking-tight">When are you free?</h2>
                <div>
                  <p id="day-label" className="text-sm font-bold">Day</p>
                  <div role="group" aria-labelledby="day-label" className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
                    {days.map((day) => {
                      const selected = query.date === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => set({ date: day })}
                          className={cn(
                            "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                            selected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white",
                          )}
                        >
                          <span className={cn("text-xs font-semibold", selected ? "text-emerald-50" : "text-slate-600")}>{weekdayShort(day)}</span>
                          <span className="text-lg font-extrabold">{dayMonth(day).split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p id="window-label" className="text-sm font-bold">Flexible time window</p>
                  <div role="group" aria-labelledby="window-label" className="mt-2 flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <ChoiceChip key={p.label} selected={query.fromHour === p.from && query.toHour === p.to} onClick={() => set({ fromHour: p.from, toHour: p.to })}>
                        {p.label}
                      </ChoiceChip>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="from">From</Label>
                      <NativeSelect id="from" value={query.fromHour} onChange={(e) => set({ fromHour: Number(e.target.value) })}>
                        {HOURS.slice(0, -1).map((h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="to">To</Label>
                      <NativeSelect id="to" value={query.toHour} onChange={(e) => set({ toHour: Number(e.target.value) })} aria-invalid={!validWindow}>
                        {HOURS.slice(1).map((h) => (
                          <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>
                  <p className={cn("mt-2 text-sm", validWindow ? "text-slate-600" : "font-medium text-rose-700")} role={validWindow ? undefined : "alert"}>
                    {validWindow
                      ? `${dayLabel(query.date)}, ${formatHour(query.fromHour)}–${formatHour(query.toHour)}. Wider windows find more games.`
                      : "End time must be after start time."}
                  </p>
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="f-where" className="space-y-5">
                <h2 id="f-where" className="text-2xl font-extrabold tracking-tight">Where should we look?</h2>
                <div>
                  <p id="farea-label" className="text-sm font-bold">Area</p>
                  <div role="group" aria-labelledby="farea-label" className="mt-2 flex flex-wrap gap-2">
                    {AREA_IDS.map((a) => (
                      <ChoiceChip key={a} selected={query.area === a} onClick={() => set({ area: a })}>
                        {AREAS[a].label}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="fradius">Radius</Label>
                    <span className="text-sm font-bold text-brand-dark">{query.radiusKm} km</span>
                  </div>
                  <Slider id="fradius" aria-label="Search radius in kilometres" min={2} max={25} step={1} value={[query.radiusKm]} onValueChange={([v]) => set({ radiusKm: v })} />
                </div>
              </section>
            )}

            {step === 4 && (
              <section aria-labelledby="f-level">
                <h2 id="f-level" className="text-2xl font-extrabold tracking-tight">Your level in {SPORTS[query.sport].short.toLowerCase()}</h2>
                <p className="mt-1 text-sm text-slate-600">Games at your level rank first; one level apart still shows.</p>
                <div className="mt-5 grid gap-2">
                  {LEVEL_IDS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      aria-pressed={query.level === lvl}
                      onClick={() => set({ level: lvl })}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                        query.level === lvl ? "border-primary bg-brand-soft" : "border-slate-200 bg-white",
                      )}
                    >
                      <span className="block font-bold">{LEVELS[lvl].label}</span>
                      <span className="text-sm text-slate-600">{LEVELS[lvl].description}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <StickyFooter>
            <Button size="lg" className="w-full" disabled={step === 2 && !validWindow} onClick={() => setStep(step + 1)}>
              {step < STEPS.length ? "Continue" : "Show my matches"}
            </Button>
          </StickyFooter>
        </>
      ) : (
        <div className="space-y-5 px-4 pb-8 pt-4">
          {/* Query summary */}
          <div className="flex items-start gap-3 rounded-2xl bg-slate-900 p-4 text-white">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-volt text-slate-900">
              <SportIcon sport={query.sport} />
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold">{SPORTS[query.sport].label} · {LEVELS[query.level].label}</p>
              <p className="text-slate-300">
                {dayLabel(query.date)}, {formatHour(query.fromHour)}–{formatHour(query.toHour)} · {AREAS[query.area].label} +{query.radiusKm} km
              </p>
            </div>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" aria-label="Edit search" onClick={() => setStep(1)}>
              <Pencil aria-hidden />
            </Button>
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="size-4 shrink-0" aria-hidden /> Ranked by match score: time fit 40%, distance 30%, level 30%.
          </p>

          <AsyncList
            listKey={`find-${JSON.stringify(query)}`}
            items={results}
            getKey={(r) => r.game.id}
            className="space-y-4"
            skeleton={<Skeleton className="h-52 w-full" />}
            renderItem={(r) => <MatchCard result={r} radiusKm={query.radiusKm} />}
            errorTitle="Couldn't search games"
            empty={{
              icon: <SearchX />,
              title: "No open games match yet",
              description: "Widen your time window or radius — or join the waitlist below and we'll notify you when a game forms.",
            }}
          />

          {/* Waitlist fallback */}
          <section aria-labelledby="waitlist" className="rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/50 p-4">
            <h2 id="waitlist" className="flex items-center gap-2 font-bold">
              <BellRing className="size-5 text-brand" aria-hidden /> No match you love?
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Add me to the waitlist and notify me when a {SPORTS[query.sport].short.toLowerCase()} game forms on {dayLabel(query.date)}.
            </p>
            {onWaitlist ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-dark" role="status">
                <CheckCircle2 className="size-5" aria-hidden /> You&apos;re on the waitlist
              </p>
            ) : (
              <Button className="mt-3 w-full" variant="outline" onClick={joinWaitlist}>
                <BellRing aria-hidden /> Add me to the waitlist
              </Button>
            )}
            <Button asChild variant="link" className="mt-1 w-full">
              <Link href="/play/create">
                <Plus aria-hidden /> Or create a game yourself
              </Link>
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}

/** Result card: the game card plus the "why it matched" breakdown. */
function MatchCard({ result, radiusKm }: { result: MatchResult; radiusKm: number }) {
  const { fit } = result;
  const levelText = fit.level === 1 ? "Same level" : fit.level === 0.5 ? "1 level apart" : "Level mismatch";
  return (
    <div className="space-y-2">
      <GameCard game={result.game} score={result.score} />
      <ul className="flex flex-wrap gap-1.5 px-1 text-xs font-semibold" aria-label="Why this matched">
        <li className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1", fit.time === 1 ? "bg-brand-soft text-brand-dark" : "bg-amber-100 text-amber-900")}>
          <Clock className="size-3.5" aria-hidden /> {fit.time === 1 ? "Fits your window" : `${Math.round(fit.time * 100)}% in window`}
        </li>
        <li className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-brand-dark">
          <MapPin className="size-3.5" aria-hidden /> {result.distanceKm} km of {radiusKm}
        </li>
        <li className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1", fit.level === 1 ? "bg-brand-soft text-brand-dark" : "bg-amber-100 text-amber-900")}>
          <Target className="size-3.5" aria-hidden /> {levelText}
        </li>
      </ul>
    </div>
  );
}
