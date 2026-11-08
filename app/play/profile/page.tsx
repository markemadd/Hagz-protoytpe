"use client";

import { LayoutDashboard, LogOut, MapPin, RotateCcw, Settings2, ShieldCheck, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { SportIcon } from "@/components/kora/sport-icon";
import { PrototypeBox, SectionTitle } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { AREAS, LEVELS, LEVEL_IDS, PERSONAS, SPORTS, TIME_RANGES, TIME_RANGE_IDS } from "@/lib/constants";
import { useKora } from "@/lib/store";
import type { Availability, ListStateOverride, Player, SkillLevel, SportId, TimeRangeId } from "@/lib/types";

export default function ProfileScreen() {
  const { state, dispatch, me } = useKora();
  const sports = Object.entries(me.sports) as Array<[SportId, SkillLevel]>;
  // Profile edits apply instantly to the shared store.
  const update = (patch: Partial<Player>) => dispatch({ type: "updatePlayer", playerId: me.id, patch });

  function toggleTime(kind: keyof Availability, id: TimeRangeId) {
    const list = me.availability[kind];
    update({ availability: { ...me.availability, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } });
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-4">
      {/* Identity */}
      <header className="flex items-center gap-4">
        <PlayerAvatar player={me} size="xl" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{me.name}</h1>
          <p className="flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="size-4" aria-hidden /> {AREAS[me.area].label} · {me.age}
          </p>
        </div>
      </header>

      {/* Stats */}
      <section aria-label="Stats" className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-2xl border p-3 text-center">
          <ReliabilityRing value={me.reliability} />
          <p className="mt-1 text-xs font-semibold text-slate-600">Reliability</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border p-3 text-center">
          <Trophy className="size-5 text-brand" aria-hidden />
          <p className="mt-1 text-2xl font-extrabold">{me.gamesPlayed}</p>
          <p className="text-xs font-semibold text-slate-600">Games played</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border p-3 text-center">
          <Star className="size-5 fill-amber-400 text-amber-500" aria-hidden />
          <p className="mt-1 text-2xl font-extrabold">{me.rating ? me.rating.toFixed(1) : "—"}</p>
          <p className="text-xs font-semibold text-slate-600">Peer rating</p>
        </div>
      </section>
      <p className="-mt-3 flex gap-2 text-xs text-slate-600">
        <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden /> Reliability is the share of joined games you actually showed up to. Organisers see it before accepting players.
      </p>

      {/* Sports & levels */}
      <section aria-labelledby="sports">
        <SectionTitle id="sports" title="Sports & levels" action={<Link href="/play/onboarding" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-dark">Edit sports</Link>} />
        {sports.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">No sports yet. <Link className="font-semibold text-brand-dark underline" href="/play/onboarding">Finish setup</Link></p>
        ) : (
          <ul className="space-y-2">
            {sports.map(([sport, level]) => (
              <li key={sport} className="flex items-center gap-3 rounded-2xl border p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                  <SportIcon sport={sport} />
                </span>
                <Label htmlFor={`lvl-${sport}`} className="flex-1">{SPORTS[sport].label}</Label>
                <div className="w-40">
                  <NativeSelect id={`lvl-${sport}`} value={level} onChange={(e) => update({ sports: { ...me.sports, [sport]: e.target.value as SkillLevel } })}>
                    {LEVEL_IDS.map((l) => <option key={l} value={l}>{LEVELS[l].label}</option>)}
                  </NativeSelect>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Availability */}
      <section aria-labelledby="avail" className="space-y-4">
        <SectionTitle id="avail" title="Availability" className="mb-0" />
        {(["weekday", "weekend"] as const).map((kind) => (
          <div key={kind}>
            <p id={`p-${kind}`} className="text-sm font-bold">{kind === "weekday" ? "Weekdays (Sun–Thu)" : "Weekends (Fri–Sat)"}</p>
            <div role="group" aria-labelledby={`p-${kind}`} className="mt-2 flex flex-wrap gap-2">
              {TIME_RANGE_IDS.map((id) => (
                <ChoiceChip key={id} selected={me.availability[kind].includes(id)} onClick={() => toggleTime(kind, id)}>
                  {TIME_RANGES[id].label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="p-radius">Travel radius</Label>
            <span className="text-sm font-bold text-brand-dark">{me.radiusKm} km</span>
          </div>
          <Slider id="p-radius" aria-label="Travel radius in kilometres" min={2} max={25} step={1} value={[me.radiusKm]} onValueChange={([v]) => update({ radiusKm: v })} />
        </div>
        <p className="text-xs text-slate-600">Changes save instantly and re-rank your “Games for you”.</p>
      </section>

      {/* Prototype controls (also reachable on phones, where the side panel is hidden) */}
      <PrototypeBox>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Switch persona</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[PERSONAS.omar, PERSONAS.salma].map((p) => (
                <ChoiceChip key={p.playerId} selected={me.id === p.playerId} onClick={() => dispatch({ type: "setPersona", playerId: p.playerId })}>
                  {p.name}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Force list state</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(["auto", "loading", "empty", "error"] as ListStateOverride[]).map((s) => (
                <ChoiceChip key={s} selected={state.listState === s} onClick={() => dispatch({ type: "setListState", value: s })} className="px-2 text-xs capitalize">
                  {s}
                </ChoiceChip>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Button asChild variant="outline">
              <Link href="/owner"><LayoutDashboard aria-hidden /> Open Karim&apos;s owner app</Link>
            </Button>
            <Button variant="outline" onClick={() => { dispatch({ type: "reset" }); toast("Demo data reset"); }}>
              <RotateCcw aria-hidden /> Reset demo
            </Button>
            <Button asChild variant="ghost">
              <Link href="/"><LogOut aria-hidden /> Back to personas</Link>
            </Button>
          </div>
        </div>
      </PrototypeBox>
      <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><Settings2 className="size-3.5" aria-hidden /> Kora prototype · v0.1</p>
    </div>
  );
}

/** Circular meter for reliability; the number is always printed, so the ring is decorative. */
function ReliabilityRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-14" role="img" aria-label={`${value}% reliable`}>
      <svg viewBox="0 0 56 56" className="size-14 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e7f4ec" strokeWidth="6" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#0f7b4f" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{value}%</span>
    </div>
  );
}
