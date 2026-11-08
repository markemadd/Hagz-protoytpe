"use client";

import { Ban, ChevronLeft, ChevronRight, Lock, Megaphone, Phone, RotateCcw, Tag, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AvatarStack } from "@/components/kora/player-avatar";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { SpotsBar } from "@/components/kora/spots-bar";
import { SportIcon } from "@/components/kora/sport-icon";
import { BookingStatusChip } from "@/components/kora/status-chip";
import { ContactButton, SourceBadge } from "@/components/owner/booking-row";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { DEMO_TODAY } from "@/lib/constants";
import { isPastHour, openHours, slotInfo, type SlotInfo } from "@/lib/availability";
import { dayLabel, dayMonth, formatEGP, formatHour, formatHourCompact, weekdayShort } from "@/lib/format";
import { interestedPlayers } from "@/lib/matching";
import { OWNER_VENUE_ID, dealMessage, dealRecipients, ownerCourts, weekDates, type IdleSlot } from "@/lib/owner";
import { basePrice, isPeak, slotKey } from "@/lib/pricing";
import { useKora } from "@/lib/store";
import type { Court } from "@/lib/types";
import { cn } from "@/lib/utils";

const DISCOUNTS = [10, 15, 20, 25, 30];

export default function OwnerCalendar() {
  const { state, dispatch, bookingIndex } = useKora();
  const courts = ownerCourts(state);
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const [courtId, setCourtId] = useState(courts[0].id);
  const [week, setWeek] = useState(0);
  const [selected, setSelected] = useState<{ date: string; hour: number } | null>(null);
  const court = courts.find((c) => c.id === courtId)!;
  const dates = weekDates(week);
  const hours = openHours(venue.openHour, venue.closeHour);

  // Demo checkpoint for Omar's flow ("see it on Karim's calendar").
  useEffect(() => {
    if (!state.flags["owner-viewed-calendar"]) dispatch({ type: "setFlag", key: "owner-viewed-calendar", value: true });
  }, [state.flags, dispatch]);

  // 7 × 17 grid of O(1) lookups via the booking index (cheap enough to compute each render).
  const grid = dates.map((date) => hours.map((h) => slotInfo(court, date, h, bookingIndex, state.slotOverrides)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Court" className="flex flex-wrap gap-2">
          {courts.map((c) => (
            <ChoiceChip key={c.id} selected={c.id === courtId} onClick={() => setCourtId(c.id)}>
              <SportIcon sport={c.sport} /> {c.name}
            </ChoiceChip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous week" disabled={week <= -1} onClick={() => setWeek(week - 1)}><ChevronLeft aria-hidden /></Button>
          <p className="min-w-40 text-center text-sm font-bold" aria-live="polite">
            {week === 0 ? "This week" : week < 0 ? "Last week" : "Next week"} · {dayMonth(dates[0])} – {dayMonth(dates[6])}
          </p>
          <Button variant="outline" size="icon" aria-label="Next week" disabled={week >= 1} onClick={() => setWeek(week + 1)}><ChevronRight aria-hidden /></Button>
        </div>
      </div>

      {/* Legend: colour + texture + words */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-700" aria-label="Legend">
        <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded border-l-4 border-brand bg-brand-soft" /> Booked</li>
        <li className="flex items-center gap-1.5"><span className="hatch-amber h-3.5 w-5 rounded border-l-4 border-amber-500" /> Held · game filling</li>
        <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded border-l-4 border-sky-500 bg-sky-50" /> Request</li>
        <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded border border-slate-200 bg-white" /> Free</li>
        <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded border-l-4 border-lime-600 bg-volt-soft" /> Promoted</li>
        <li className="flex items-center gap-1.5"><span className="hatch-slate h-3.5 w-5 rounded border-l-4 border-slate-400" /> Blocked</li>
        <li className="flex items-center gap-1.5"><span className="h-3.5 w-5 rounded border-l-4 border-rose-500 bg-rose-50" /> No-show</li>
      </ul>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `64px repeat(7, minmax(0, 1fr))` }}>
          <div className="sticky left-0 z-10 border-b bg-white" />
          {dates.map((d) => (
            <div key={d} className={cn("border-b border-l px-2 py-2 text-center", d === DEMO_TODAY && "bg-brand-soft")}>
              <p className="text-xs font-semibold text-slate-600">{weekdayShort(d)}</p>
              <p className={cn("text-sm font-extrabold", d === DEMO_TODAY && "text-brand-dark")}>{dayMonth(d)}{d === DEMO_TODAY && " · Today"}</p>
            </div>
          ))}
          {hours.map((h, hi) => (
            <Row key={h} hour={h}>
              {dates.map((d, di) => (
                <SlotCell key={d} info={grid[di][hi]} date={d} court={court} onOpen={() => setSelected({ date: d, hour: h })} />
              ))}
            </Row>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600">Peak pricing: weekdays from 5 PM, Fri–Sat from noon. Click any slot to block it, edit its price or promote it.</p>

      <SlotDialog key={selected ? `${court.id}|${selected.date}|${selected.hour}` : "none"} court={court} slot={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Row({ hour, children }: { hour: number; children: React.ReactNode }) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-start justify-end border-b bg-white px-2 pt-1 text-xs font-semibold text-slate-600">{formatHourCompact(hour)}</div>
      {children}
    </>
  );
}

/** One calendar cell, rendered as a button so every slot is keyboard-reachable. */
function SlotCell({ info, date, court, onOpen }: { info: SlotInfo; date: string; court: Court; onOpen: () => void }) {
  const { gamesById } = useKora();
  const b = info.booking;
  const game = b?.gameId ? gamesById.get(b.gameId) : undefined;
  const continued = b && b.startHour < info.hour; // later hour of a multi-hour booking
  const name = b?.organizerName.split(" ")[0];

  let cls = "bg-white hover:bg-slate-50";
  let text: React.ReactNode = <span className="text-slate-500">{formatEGP(info.price.price)}</span>;
  let label = `free, ${formatEGP(info.price.price)}`;

  if (b && b.status === "no_show") {
    cls = "border-l-4 border-rose-500 bg-rose-50";
    text = <span className="font-bold text-rose-900">No-show · {name}</span>;
    label = `no-show, ${b.organizerName}`;
  } else if (info.state === "booked") {
    cls = "border-l-4 border-brand bg-brand-soft";
    text = continued ? <span className="text-brand-dark">↳ {name}</span> : <span className="font-bold text-brand-dark">{name} · {b!.source === "phone" ? "Phone" : b!.source === "kora_game" ? "Kora game" : "Kora"}</span>;
    label = `booked, ${b!.organizerName}`;
  } else if (info.state === "held") {
    cls = "hatch-amber border-l-4 border-amber-500";
    text = <span className="font-bold text-amber-950">{continued ? `↳ ${name}` : `Held · ${game ? `${game.playerIds.length}/${game.capacity}` : name}`}</span>;
    label = `held, game filling${game ? `, ${game.playerIds.length} of ${game.capacity} players` : ""}, ${b!.organizerName}`;
  } else if (info.state === "requested") {
    cls = "border-l-4 border-sky-500 bg-sky-50";
    text = <span className="font-bold text-sky-900">Request · {name}</span>;
    label = `booking request from ${b!.organizerName}`;
  } else if (info.state === "blocked") {
    cls = "hatch-slate border-l-4 border-slate-400";
    text = <span className="inline-flex items-center gap-1 font-bold text-slate-700"><Lock className="size-3" aria-hidden /> Blocked</span>;
    label = "blocked";
  } else if (info.state === "past") {
    cls = "bg-slate-50";
    text = <span className="text-slate-400">—</span>;
    label = "past, unused";
  } else if (info.price.promoted) {
    cls = "border-l-4 border-lime-600 bg-volt-soft";
    text = <span className="font-bold text-slate-900">−{info.price.discountPct}% · {formatEGP(info.price.price)}</span>;
    label = `free, promoted ${info.price.discountPct}% off, ${formatEGP(info.price.price)}`;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${court.name}, ${dayLabel(date)} ${formatHour(info.hour)}: ${label}`}
      className={cn("min-h-12 border-b border-l px-2 py-1 text-left text-[11px] leading-tight outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50", cls)}
    >
      {text}
      {info.state === "free" && !info.price.promoted && isPeak(date, info.hour) && <span className="block text-[10px] font-semibold text-slate-500">peak</span>}
    </button>
  );
}

/** Slot dialog: manage a booking, or block / re-price / promote a free hour. */
function SlotDialog({ court, slot, onClose }: { court: Court; slot: { date: string; hour: number } | null; onClose: () => void }) {
  const { state, dispatch, bookingIndex, gamesById, playersById } = useKora();
  const venue = state.venues.find((v) => v.id === court.venueId)!;
  const key = slot ? slotKey(court.id, slot.date, slot.hour) : "";
  const override = state.slotOverrides[key];
  const info = slot ? slotInfo(court, slot.date, slot.hour, bookingIndex, state.slotOverrides) : null;
  // The parent re-keys this dialog per slot, so initial values come straight from props.
  const [price, setPrice] = useState(() => (slot ? String(override?.price ?? basePrice(court, slot.date, slot.hour)) : ""));
  const [discount, setDiscount] = useState(override?.discountPct ?? 20);

  if (!slot || !info) return <Dialog open={false} />;
  const b = info.booking;
  const game = b?.gameId ? gamesById.get(b.gameId) : undefined;
  const past = isPastHour(slot.date, slot.hour);
  const title = `${court.name} · ${dayLabel(slot.date)}, ${formatHour(slot.hour)}`;

  function savePrice() {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 100 || value > 3000) {
      toast.error("Enter a price between EGP 100 and EGP 3,000");
      return;
    }
    dispatch({ type: "setSlotOverride", key, patch: { price: value } });
    toast.success(`Price set to ${formatEGP(value)} for this hour`);
  }

  function setPromoted(on: boolean) {
    if (!on) {
      dispatch({ type: "setSlotOverride", key, patch: { promoted: false, discountPct: undefined } });
      toast("Promotion stopped");
      return;
    }
    // Build the same "idle slot" view the Fill idle slots page uses, to find who to push it to.
    const listPrice = override?.price ?? basePrice(court, slot!.date, slot!.hour);
    const idle: IdleSlot = { key, court, date: slot!.date, hour: slot!.hour, listPrice, suggestedPct: discount, suggestedPrice: listPrice, interested: interestedPlayers(state.players, court.sport, venue, slot!.date, slot!.hour), promoted: true, discountPct: discount };
    const recipients = dealRecipients(state, idle, venue);
    dispatch({ type: "setSlotOverride", key, patch: { promoted: true, discountPct: discount }, notify: { userIds: recipients, ...dealMessage(idle, venue, discount) } });
    toast.success(`Promoted at −${discount}%`, { description: `Pushed to ${recipients.length} matching players.` });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {b ? "Booking details" : past ? "This hour has passed." : `${isPeak(slot.date, slot.hour) ? "Peak" : "Off-peak"} hour · list price ${formatEGP(basePrice(court, slot.date, slot.hour))}`}
          </DialogDescription>
        </DialogHeader>

        {b ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusChip status={b.status} />
              <SourceBadge booking={b} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-600">Organiser</dt><dd className="font-bold">{b.organizerName}</dd></div>
              <div><dt className="text-slate-600">Amount</dt><dd className="font-bold">{formatEGP(b.amount)}</dd></div>
              <div><dt className="text-slate-600">Phone</dt><dd className="flex items-center gap-1 font-semibold"><Phone className="size-3.5" aria-hidden /> {b.organizerPhone}</dd></div>
              <div><dt className="text-slate-600">Length</dt><dd className="font-semibold">{b.duration * 60} min</dd></div>
            </dl>
            {game && (
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-bold">{game.status === "filling" ? "Kora game filling — slot held for free" : "Kora game"}</p>
                <SpotsBar game={game} className="mt-2" />
                <div className="mt-3"><AvatarStack players={game.playerIds.map((p) => playersById.get(p)!).filter(Boolean)} max={8} /></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <ContactButton booking={b} />
              {b.status === "requested" && (
                <>
                  <Button size="xs" className="h-11 px-3" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "confirmed" }); toast.success("Booking accepted"); onClose(); }}>Accept</Button>
                  <Button size="xs" variant="outline" className="h-11 px-3" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "declined" }); toast("Booking declined"); onClose(); }}>Decline</Button>
                </>
              )}
              {(b.status === "completed" || (b.status === "confirmed" && past)) && (
                <Button size="xs" variant="outline" className="h-11 px-3 text-rose-800" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "no_show" }); toast("Marked as no-show"); onClose(); }}>
                  <UserX aria-hidden /> Mark no-show
                </Button>
              )}
              {b.status === "no_show" && (
                <Button size="xs" variant="outline" className="h-11 px-3" onClick={() => { dispatch({ type: "setBookingStatus", bookingId: b.id, status: "completed" }); toast("No-show removed"); onClose(); }}>
                  <RotateCcw aria-hidden /> Undo no-show
                </Button>
              )}
            </div>
          </div>
        ) : past ? null : (
          <div className="space-y-5">
            {info.state === "blocked" ? (
              <Button variant="outline" size="lg" className="w-full" onClick={() => { dispatch({ type: "setSlotOverride", key, patch: { blocked: false } }); toast("Slot unblocked"); }}>
                <RotateCcw aria-hidden /> Unblock slot
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="slot-price">Price for this hour (EGP)</Label>
                  <div className="flex gap-2">
                    <Input id="slot-price" type="number" inputMode="numeric" min={100} max={3000} step={10} value={price} onChange={(e) => setPrice(e.target.value)} />
                    <Button variant="outline" onClick={savePrice}>Save</Button>
                  </div>
                  {override?.price !== undefined && (
                    <button type="button" className="min-h-11 text-sm font-semibold text-brand-dark underline" onClick={() => dispatch({ type: "setSlotOverride", key, patch: { price: undefined } })}>
                      Reset to list price
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="promote" className="flex items-center gap-2">
                      <Megaphone className="size-4 text-brand" aria-hidden /> Promote this slot
                    </Label>
                    <Switch id="promote" checked={!!override?.promoted} onCheckedChange={setPromoted} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Pushes a discounted deal to nearby players who are usually free at this time.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Label htmlFor="discount" className="shrink-0 text-sm">Discount</Label>
                    <NativeSelect id="discount" value={discount} disabled={!!override?.promoted} onChange={(e) => setDiscount(Number(e.target.value))}>
                      {DISCOUNTS.map((d) => <option key={d} value={d}>−{d}%</option>)}
                    </NativeSelect>
                  </div>
                  {override?.promoted && <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-dark"><Tag className="size-4" aria-hidden /> Live at {formatEGP(info.price.price)}/h</p>}
                </div>

                <Button variant="outline" size="lg" className="w-full border-slate-400" onClick={() => { dispatch({ type: "setSlotOverride", key, patch: { blocked: true, promoted: false } }); toast.success("Slot blocked", { description: "Players can't book it until you unblock it." }); onClose(); }}>
                  <Ban aria-hidden /> Block this slot
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
