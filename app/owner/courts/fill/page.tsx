"use client";

import { ChevronLeft, Megaphone, Sparkles, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { AsyncList } from "@/components/kora/list-state";
import { AvatarStack } from "@/components/kora/player-avatar";
import { SportIcon } from "@/components/kora/sport-icon";
import { KpiTile } from "@/components/owner/kpi-tile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { dayLabel, formatEGP, formatHour, compactNumber } from "@/lib/format";
import { OWNER_VENUE_ID, dealMessage, dealRecipients, idleSlots, ownerCourts, type IdleSlot } from "@/lib/owner";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

const DISCOUNTS = [10, 15, 20, 25, 30];

export default function FillIdleSlots() {
  const { state, dispatch } = useKora();
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const courts = ownerCourts(state);
  const [court, setCourt] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  const slots = useMemo(() => idleSlots(state), [state]);
  const visible = slots.filter((s) => court === "all" || s.court.id === court);
  const shown = showAll ? visible : visible.slice(0, 12);
  const promotedCount = slots.filter((s) => s.promoted).length;
  // Potential revenue if every visible idle hour sold at its suggested price.
  const potential = visible.reduce((sum, s) => sum + s.suggestedPrice, 0);
  const withDemand = visible.filter((s) => s.interested.length > 0).length;

  function toggle(slot: IdleSlot, on: boolean) {
    if (!on) {
      dispatch({ type: "setSlotOverride", key: slot.key, patch: { promoted: false, discountPct: undefined } });
      toast("Promotion stopped");
      return;
    }
    const pct = discounts[slot.key] ?? slot.suggestedPct;
    const recipients = dealRecipients(state, slot, venue);
    dispatch({ type: "setSlotOverride", key: slot.key, patch: { promoted: true, discountPct: pct }, notify: { userIds: recipients, ...dealMessage(slot, venue, pct) } });
    toast.success(`Promoted: ${slot.court.name} · ${dayLabel(slot.date)}, ${formatHour(slot.hour)}`, { description: `−${pct}% pushed to ${recipients.length} matching players.` });
  }

  function promoteTopFive() {
    const top = visible.filter((s) => !s.promoted && s.interested.length > 0).slice(0, 5);
    for (const s of top) toggle(s, true);
    if (top.length === 0) toast("Nothing left to promote with player demand.");
  }

  return (
    <div className="space-y-6">
      <Link href="/owner/courts" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-dark"><ChevronLeft className="size-4" aria-hidden /> Courts</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Fill idle slots</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Free off-peak hours in the next 7 days, ranked by how many nearby Kora players play that sport and are usually free then.
            Promoting a slot applies the discount and pushes it to those players.
          </p>
        </div>
        <Button variant="volt" onClick={promoteTopFive}><Sparkles aria-hidden /> Promote top 5 with demand</Button>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Idle off-peak hours" value={String(visible.length)} icon={<TrendingUp />} hint={`${withDemand} have matching player demand`} />
        <KpiTile label="Potential revenue" value={`EGP ${compactNumber(potential)}`} icon={<Sparkles />} hint="If every idle hour sold at the suggested price." />
        <KpiTile label="Promoted now" value={String(promotedCount)} icon={<Megaphone />} hint="Shown with a lime “Deal” badge in the player app." />
      </section>

      <div role="group" aria-label="Court filter" className="flex flex-wrap gap-2">
        <ChoiceChip selected={court === "all"} onClick={() => setCourt("all")}>All courts</ChoiceChip>
        {courts.map((c) => (
          <ChoiceChip key={c.id} selected={court === c.id} onClick={() => setCourt(c.id)}><SportIcon sport={c.sport} /> {c.name}</ChoiceChip>
        ))}
      </div>

      <AsyncList
        listKey="owner-idle"
        items={shown}
        getKey={(s) => s.key}
        className="space-y-3"
        skeleton={<Skeleton className="h-24 w-full" />}
        errorTitle="Couldn't load suggestions"
        empty={{ icon: <Sparkles />, title: "No idle off-peak hours", description: "Every off-peak hour this week is booked or blocked. Nice." }}
        renderItem={(s) => {
          const pct = discounts[s.key] ?? s.discountPct;
          const newPrice = Math.round((s.listPrice * (1 - pct / 100)) / 10) * 10;
          return (
            <div className={cn("grid items-center gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]", s.promoted && "border-lime-500 bg-volt-soft")}>
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"><SportIcon sport={s.court.sport} /></span>
                <div>
                  <p className="font-bold">{dayLabel(s.date)} · {formatHour(s.hour)}</p>
                  <p className="text-sm text-slate-600">{s.court.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {s.interested.length > 0 ? (
                  <>
                    <AvatarStack players={s.interested} max={3} size="xs" />
                    <span className="font-semibold">{s.interested.length} players usually free</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-600"><Users className="size-4" aria-hidden /> Low demand</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`d-${s.key}`} className="sr-only">Discount for {s.court.name} {dayLabel(s.date)} {formatHour(s.hour)}</Label>
                <div className="w-28">
                  <NativeSelect id={`d-${s.key}`} value={pct} disabled={s.promoted} onChange={(e) => setDiscounts((d) => ({ ...d, [s.key]: Number(e.target.value) }))}>
                    {DISCOUNTS.map((d) => <option key={d} value={d}>−{d}%{d === s.suggestedPct ? " ★" : ""}</option>)}
                  </NativeSelect>
                </div>
                <p className="text-sm">
                  <span className="text-slate-500 line-through">{formatEGP(s.listPrice)}</span>{" "}
                  <span className="font-extrabold">{formatEGP(newPrice)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <Label htmlFor={`p-${s.key}`} className="text-sm">Promote this slot</Label>
                <Switch id={`p-${s.key}`} checked={s.promoted} onCheckedChange={(on) => toggle(s, on)} />
              </div>
            </div>
          );
        }}
      />
      {!showAll && visible.length > 12 && (
        <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>Show all {visible.length} idle hours</Button>
      )}
      <p className="text-xs text-slate-600">★ = suggested discount: deeper where fewer players are likely to book (15% with strong demand, up to 30% with none).</p>
    </div>
  );
}
