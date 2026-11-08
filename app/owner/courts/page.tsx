"use client";

import { CalendarDays, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CourtArt } from "@/components/kora/court-art";
import { SportIcon } from "@/components/kora/sport-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SPORTS } from "@/lib/constants";
import { formatEGP } from "@/lib/format";
import { idleSlots, ownerCourts, utilizationHeatmap, weekDates } from "@/lib/owner";
import { useKora } from "@/lib/store";
import type { Court } from "@/lib/types";

export default function OwnerCourts() {
  const { state } = useKora();
  const courts = ownerCourts(state);
  const idle = idleSlots(state);
  const promoted = idle.filter((s) => s.promoted).length;

  return (
    <div className="space-y-6">
      <Link href="/owner/courts/fill" className="flex flex-wrap items-center gap-4 rounded-3xl bg-brand-dark p-5 text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-volt text-slate-900"><Sparkles className="size-6" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold">Fill idle slots</span>
          <span className="text-sm text-emerald-50">{idle.length} off-peak hours are still free in the next 7 days · {promoted} promoted</span>
        </span>
        <span className="rounded-xl bg-volt px-4 py-2.5 text-sm font-bold text-slate-900">See suggestions</span>
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Your courts ({courts.length})</h2>
        <Button asChild variant="outline">
          <Link href="/owner/onboarding"><Plus aria-hidden /> Add court</Link>
        </Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courts.map((c) => <CourtCard key={c.id} court={c} />)}
      </div>
    </div>
  );
}

function CourtCard({ court }: { court: Court }) {
  const { state, dispatch } = useKora();
  const [peak, setPeak] = useState(String(court.pricePeak));
  const [offPeak, setOffPeak] = useState(String(court.priceOffPeak));

  // This court's utilization this week (booked so far ÷ open hours).
  const util = useMemo(() => {
    const heat = utilizationHeatmap({ ...state, courts: [court] }, weekDates(0));
    const cells = heat.rows.flatMap((r) => r.cells);
    return Math.round((cells.filter((c) => c.booked > 0).length / cells.length) * 100);
  }, [state, court]);

  function save() {
    const p = Number(peak), o = Number(offPeak);
    if (!(p >= 100 && o >= 100 && o <= p)) {
      toast.error("Prices must be at least EGP 100, and off-peak can't exceed peak.");
      return;
    }
    dispatch({ type: "updateCourt", courtId: court.id, patch: { pricePeak: p, priceOffPeak: o } });
    toast.success(`${court.name} prices saved`, { description: "Players see the new prices immediately." });
  }

  return (
    <article className="overflow-hidden rounded-2xl border bg-white">
      <div className="relative h-32">
        <CourtArt sport={court.sport} label={court.name} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold">
          <SportIcon sport={court.sport} className="size-4 text-brand" /> {SPORTS[court.sport].label}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-extrabold">{court.name}</h3>
          <p className="text-sm text-slate-600">{court.indoor ? "Indoor" : "Outdoor"} · {court.surface} · {court.size} · up to {court.capacity} players</p>
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="font-semibold">Utilization this week</span><span className="font-bold">{util}%</span></div>
          <Progress value={util} className="mt-1.5" aria-label={`${court.name} utilization ${util}%`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`peak-${court.id}`}>Peak (EGP/h)</Label>
            <Input id={`peak-${court.id}`} type="number" inputMode="numeric" value={peak} onChange={(e) => setPeak(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`off-${court.id}`}>Off-peak (EGP/h)</Label>
            <Input id={`off-${court.id}`} type="number" inputMode="numeric" value={offPeak} onChange={(e) => setOffPeak(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={save}>Save prices</Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/owner/calendar"><CalendarDays aria-hidden /> Calendar</Link>
          </Button>
        </div>
        <p className="text-xs text-slate-600">Currently {formatEGP(court.priceOffPeak)} off-peak · {formatEGP(court.pricePeak)} peak.</p>
      </div>
    </article>
  );
}
