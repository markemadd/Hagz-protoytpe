"use client";

import { ChevronLeft, ImagePlus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { CourtArt } from "@/components/kora/court-art";
import { KoraLogo } from "@/components/kora/kora-logo";
import { Stepper } from "@/components/kora/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { AMENITIES, AREAS, AREA_IDS, SPORTS, SPORT_IDS } from "@/lib/constants";
import { formatHour } from "@/lib/format";
import { OWNER_VENUE_ID, ownerCourts } from "@/lib/owner";
import { useKora } from "@/lib/store";
import type { Amenity, AreaId, Court } from "@/lib/types";
import { uid } from "@/lib/utils";

const STEPS = ["Venue", "Courts", "Availability & pricing"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Three-step venue setup, pre-filled with Karim's club (edits save to the shared store). */
export default function OwnerOnboarding() {
  const router = useRouter();
  const { state, dispatch } = useKora();
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const [step, setStep] = useState(1);
  const [name, setName] = useState(venue.name);
  const [area, setArea] = useState<AreaId>(venue.area);
  const [address, setAddress] = useState(venue.address);
  const [amenities, setAmenities] = useState<Amenity[]>(venue.amenities);
  const [courts, setCourts] = useState<Array<Court & { isNew?: boolean }>>(ownerCourts(state));
  const [openHour, setOpenHour] = useState(venue.openHour);
  const [closeHour, setCloseHour] = useState(venue.closeHour);
  const [openDays, setOpenDays] = useState<string[]>(DAYS);

  const patchCourt = (id: string, patch: Partial<Court>) => setCourts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const valid = step === 1 ? name.trim() && address.trim() : step === 2 ? courts.length > 0 && courts.every((c) => c.name.trim()) : openHour < closeHour && courts.every((c) => c.priceOffPeak >= 100 && c.pricePeak >= c.priceOffPeak);

  function finish() {
    dispatch({ type: "updateVenue", venueId: venue.id, patch: { name: name.trim(), area, address, amenities, openHour, closeHour } });
    for (const c of courts) {
      const { isNew, ...court } = c;
      dispatch(isNew ? { type: "addCourt", court } : { type: "updateCourt", courtId: c.id, patch: court });
    }
    toast.success(`${name} is live on Kora`, { description: "Players can now find and book your courts." });
    router.push("/owner");
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
        <KoraLogo />
        <Link href="/owner" className="text-sm font-semibold text-brand-dark">Skip to dashboard</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Stepper step={step} total={3} label={STEPS[step - 1]} />

        {step === 1 && (
          <section className="space-y-5 rounded-3xl border bg-white p-6">
            <h1 className="text-2xl font-extrabold">Tell players about your venue</h1>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="o-name">Venue name</Label><Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!name.trim()} /></div>
              <div className="space-y-1.5"><Label htmlFor="o-area">Area</Label><NativeSelect id="o-area" value={area} onChange={(e) => setArea(e.target.value as AreaId)}>{AREA_IDS.map((a) => <option key={a} value={a}>{AREAS[a].label}</option>)}</NativeSelect></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="o-address">Street address</Label><Input id="o-address" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            </div>
            <div>
              <p className="text-sm font-bold">Photos</p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {courts.slice(0, 3).map((c) => <div key={c.id} className="h-24 overflow-hidden rounded-xl"><CourtArt sport={c.sport} label={`${c.name} photo`} /></div>)}
                <button type="button" onClick={() => toast("Photo picker would open here")} className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-700 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"><ImagePlus className="size-5" aria-hidden /> Add photo</button>
              </div>
            </div>
            <div>
              <p id="o-amen" className="text-sm font-bold">Amenities</p>
              <div role="group" aria-labelledby="o-amen" className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(AMENITIES) as Amenity[]).map((a) => (
                  <ChoiceChip key={a} selected={amenities.includes(a)} onClick={() => setAmenities((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))}>{AMENITIES[a]}</ChoiceChip>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-3xl border bg-white p-6">
            <h1 className="text-2xl font-extrabold">Add your courts</h1>
            {courts.map((c, i) => (
              <fieldset key={c.id} className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
                <legend className="px-1 text-sm font-bold">Court {i + 1}</legend>
                <div className="space-y-1.5"><Label htmlFor={`cn-${c.id}`}>Name</Label><Input id={`cn-${c.id}`} value={c.name} onChange={(e) => patchCourt(c.id, { name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor={`cs-${c.id}`}>Sport</Label><NativeSelect id={`cs-${c.id}`} value={c.sport} onChange={(e) => patchCourt(c.id, { sport: e.target.value as Court["sport"], capacity: SPORTS[e.target.value as Court["sport"]].capacity })}>{SPORT_IDS.map((s) => <option key={s} value={s}>{SPORTS[s].label}</option>)}</NativeSelect></div>
                <div className="space-y-1.5"><Label htmlFor={`cz-${c.id}`}>Size</Label><Input id={`cz-${c.id}`} value={c.size} onChange={(e) => patchCourt(c.id, { size: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor={`cc-${c.id}`}>Max players</Label><Input id={`cc-${c.id}`} type="number" min={2} value={c.capacity} onChange={(e) => patchCourt(c.id, { capacity: Number(e.target.value) })} /></div>
                <div role="group" aria-label={`Court ${i + 1} setting`} className="flex gap-2 sm:col-span-2">
                  <ChoiceChip selected={c.indoor} onClick={() => patchCourt(c.id, { indoor: true })}>Indoor</ChoiceChip>
                  <ChoiceChip selected={!c.indoor} onClick={() => patchCourt(c.id, { indoor: false })}>Outdoor</ChoiceChip>
                  {c.isNew && <Button variant="ghost" className="ml-auto text-rose-800" onClick={() => setCourts((cs) => cs.filter((x) => x.id !== c.id))}><Trash2 aria-hidden /> Remove</Button>}
                </div>
              </fieldset>
            ))}
            <Button variant="outline" onClick={() => setCourts((cs) => [...cs, { id: uid("c"), venueId: venue.id, name: `Court ${cs.length + 1}`, sport: "padel", indoor: true, surface: "Glass", size: "20 × 10 m", capacity: 4, pricePeak: 600, priceOffPeak: 400, isNew: true }])}>
              <Plus aria-hidden /> Add another court
            </Button>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5 rounded-3xl border bg-white p-6">
            <h1 className="text-2xl font-extrabold">Weekly availability & pricing</h1>
            <div>
              <p id="o-days" className="text-sm font-bold">Open days</p>
              <div role="group" aria-labelledby="o-days" className="mt-2 flex flex-wrap gap-2">
                {DAYS.map((d) => <ChoiceChip key={d} selected={openDays.includes(d)} onClick={() => setOpenDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))}>{d}</ChoiceChip>)}
              </div>
            </div>
            <div className="grid max-w-md grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="o-open">Opens</Label><NativeSelect id="o-open" value={openHour} onChange={(e) => setOpenHour(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}</NativeSelect></div>
              <div className="space-y-1.5"><Label htmlFor="o-close">Closes</Label><NativeSelect id="o-close" value={closeHour} onChange={(e) => setCloseHour(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => i + 17).map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}</NativeSelect></div>
            </div>
            <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">Peak hours: weekdays from 5 PM and Fri–Sat from noon. Everything else is off-peak — Kora can promote those hours for you.</p>
            <div className="space-y-3">
              {courts.map((c) => (
                <div key={c.id} className="grid items-end gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_140px_140px]">
                  <p className="font-bold">{c.name} <span className="font-normal text-slate-600">· {SPORTS[c.sport].label}</span></p>
                  <div className="space-y-1.5"><Label htmlFor={`op-${c.id}`}>Off-peak EGP/h</Label><Input id={`op-${c.id}`} type="number" value={c.priceOffPeak} onChange={(e) => patchCourt(c.id, { priceOffPeak: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label htmlFor={`pk-${c.id}`}>Peak EGP/h</Label><Input id={`pk-${c.id}`} type="number" value={c.pricePeak} onChange={(e) => patchCourt(c.id, { pricePeak: Number(e.target.value) })} /></div>
                </div>
              ))}
            </div>
            {!valid && <p role="alert" className="text-sm font-medium text-rose-700">Check hours and prices: off-peak must be at least EGP 100 and not above peak.</p>}
          </section>
        )}

        <div className="flex justify-between gap-3">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}><ChevronLeft aria-hidden /> Back</Button>
          {step < 3 ? <Button disabled={!valid} onClick={() => setStep(step + 1)}>Continue</Button> : <Button disabled={!valid} onClick={finish}>Publish venue</Button>}
        </div>
      </main>
    </div>
  );
}
