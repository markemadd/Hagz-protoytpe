"use client";

import { Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { SportIcon } from "@/components/kora/sport-icon";
import { Stepper } from "@/components/kora/stepper";
import { ScreenHeader, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { AREAS, AREA_IDS, LEVELS, LEVEL_IDS, PERSONAS, SPORTS, SPORT_IDS, TIME_RANGES, TIME_RANGE_IDS } from "@/lib/constants";
import { formatHour } from "@/lib/format";
import { useKora } from "@/lib/store";
import type { AreaId, Availability, SkillLevel, SportId, TimeRangeId } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Your sports", "Your level", "Where & when"];

export default function OnboardingScreen() {
  const router = useRouter();
  const { me, dispatch } = useKora();
  const isSalma = me.id === PERSONAS.salma.playerId;
  const hasProfile = Object.keys(me.sports).length > 0;

  // Start from the saved profile; for a brand-new Salma, pre-fill her persona to keep the demo fast.
  const [step, setStep] = useState(1);
  const [sports, setSports] = useState<SportId[]>(hasProfile ? (Object.keys(me.sports) as SportId[]) : isSalma ? ["padel", "basketball"] : []);
  const [levels, setLevels] = useState<Partial<Record<SportId, SkillLevel>>>(
    hasProfile ? me.sports : isSalma ? { padel: "intermediate", basketball: "beginner" } : {},
  );
  const [area, setArea] = useState<AreaId>(me.area);
  const [radius, setRadius] = useState(me.radiusKm);
  const [availability, setAvailability] = useState<Availability>(
    me.availability.weekday.length + me.availability.weekend.length > 0
      ? me.availability
      : { weekday: ["evening"], weekend: ["afternoon", "evening"] },
  );

  const toggleSport = (s: SportId) =>
    setSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleTime = (kind: keyof Availability, id: TimeRangeId) =>
    setAvailability((prev) => ({
      ...prev,
      [kind]: prev[kind].includes(id) ? prev[kind].filter((x) => x !== id) : [...prev[kind], id],
    }));

  const hasTimes = availability.weekday.length + availability.weekend.length > 0;
  const canContinue = step === 1 ? sports.length > 0 : step === 3 ? hasTimes : true;

  function next() {
    if (step < 3) return setStep(step + 1);
    // Every selected sport gets a level (default intermediate if untouched).
    const finalSports = Object.fromEntries(sports.map((s) => [s, levels[s] ?? "intermediate"])) as Partial<Record<SportId, SkillLevel>>;
    dispatch({ type: "completeOnboarding", playerId: me.id, sports: finalSports, area, radiusKm: radius, availability });
    toast.success("You're all set!", { description: "We'll match you into games that fit your time, place and level." });
    router.push("/play");
  }

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader title="Set up your profile" onBack={step > 1 ? () => setStep(step - 1) : undefined} backHref={step === 1 ? "/" : undefined} />
      <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
        <Stepper step={step} total={3} label={STEP_LABELS[step - 1]} />

        {isSalma && step === 1 && !hasProfile && (
          <p className="flex gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Pre-filled from Salma&apos;s persona to speed up the demo. Change anything.
          </p>
        )}

        {step === 1 && (
          <section aria-labelledby="q-sports">
            <h2 id="q-sports" className="text-2xl font-extrabold tracking-tight">What do you play?</h2>
            <p className="mt-1 text-sm text-slate-600">Pick all that apply. You can change this later.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {SPORT_IDS.map((s) => {
                const selected = sports.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSport(s)}
                    className={cn(
                      "relative flex min-h-28 flex-col items-start justify-between rounded-2xl border-2 p-4 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
                      selected ? "border-primary bg-brand-soft" : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <span className={cn("flex size-11 items-center justify-center rounded-xl", selected ? "bg-primary text-white" : "bg-slate-100 text-slate-800")}>
                      <SportIcon sport={s} className="size-6" />
                    </span>
                    <span>
                      <span className="block font-bold leading-tight">{SPORTS[s].label}</span>
                      <span className="text-xs text-slate-600">{SPORTS[s].capacity} players · {SPORTS[s].duration * 60} min</span>
                    </span>
                    {selected && (
                      <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="size-4" aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {sports.length === 0 && <p className="mt-3 text-sm font-medium text-slate-700">Pick at least one sport to continue.</p>}
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="q-level" className="space-y-4">
            <div>
              <h2 id="q-level" className="text-2xl font-extrabold tracking-tight">How do you play?</h2>
              <p className="mt-1 text-sm text-slate-600">Be honest — you&apos;ll be matched with similar players.</p>
            </div>
            {sports.map((s) => (
              <fieldset key={s} className="rounded-2xl border p-4">
                <legend className="flex items-center gap-2 px-1 font-bold">
                  <SportIcon sport={s} className="size-5 text-brand" /> {SPORTS[s].label}
                </legend>
                <RadioGroup
                  value={levels[s] ?? "intermediate"}
                  onValueChange={(v) => setLevels((prev) => ({ ...prev, [s]: v as SkillLevel }))}
                  className="mt-2 gap-2"
                  aria-label={`${SPORTS[s].label} level`}
                >
                  {LEVEL_IDS.map((lvl) => {
                    const id = `${s}-${lvl}`;
                    const checked = (levels[s] ?? "intermediate") === lvl;
                    return (
                      <Label
                        key={lvl}
                        htmlFor={id}
                        className={cn(
                          "flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal",
                          checked ? "border-primary bg-brand-soft" : "border-slate-200",
                        )}
                      >
                        <RadioGroupItem id={id} value={lvl} className="mt-0.5" />
                        <span>
                          <span className="block font-bold">{LEVELS[lvl].label}</span>
                          <span className="text-xs leading-snug text-slate-600">{LEVELS[lvl].description}</span>
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </fieldset>
            ))}
            <p className="flex gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Not sure? Pick the lower level. After each game, players rate whether your level was accurate, so it self-corrects.
            </p>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="q-where" className="space-y-6">
            <div>
              <h2 id="q-where" className="text-2xl font-extrabold tracking-tight">Where and when?</h2>
              <p className="mt-1 text-sm text-slate-600">We only suggest games you can actually make.</p>
            </div>

            <div>
              <p id="area-label" className="text-sm font-bold">Home area</p>
              <div role="group" aria-labelledby="area-label" className="mt-2 flex flex-wrap gap-2">
                {AREA_IDS.map((a) => (
                  <ChoiceChip key={a} selected={area === a} onClick={() => setArea(a)}>
                    {AREAS[a].label}
                  </ChoiceChip>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="radius">Travel radius</Label>
                <span className="text-sm font-bold text-brand-dark">{radius} km</span>
              </div>
              <Slider id="radius" aria-label="Travel radius in kilometres" min={2} max={25} step={1} value={[radius]} onValueChange={([v]) => setRadius(v)} />
              <p className="text-xs text-slate-600">About {Math.round(radius * 2.5)} min by car in evening traffic.</p>
            </div>

            {(["weekday", "weekend"] as const).map((kind) => (
              <div key={kind}>
                <p id={`${kind}-label`} className="text-sm font-bold">
                  {kind === "weekday" ? "Weekdays (Sun–Thu)" : "Weekends (Fri–Sat)"}
                </p>
                <div role="group" aria-labelledby={`${kind}-label`} className="mt-2 grid grid-cols-2 gap-2">
                  {TIME_RANGE_IDS.map((id) => (
                    <ChoiceChip key={id} selected={availability[kind].includes(id)} onClick={() => toggleTime(kind, id)} className="rounded-xl">
                      <span className="flex flex-col leading-tight">
                        <span>{TIME_RANGES[id].label}</span>
                        <span className="text-[11px] font-medium opacity-80">
                          {formatHour(TIME_RANGES[id].from)}–{formatHour(TIME_RANGES[id].to)}
                        </span>
                      </span>
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            ))}
            {!hasTimes && <p className="text-sm font-medium text-rose-700">Choose at least one time you&apos;re usually free.</p>}
          </section>
        )}
      </div>

      <StickyFooter>
        <Button size="lg" className="w-full" disabled={!canContinue} onClick={next}>
          {step < 3 ? "Continue" : "Finish & see my matches"}
        </Button>
      </StickyFooter>
    </div>
  );
}
