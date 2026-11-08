"use client";

import { Banknote, CalendarPlus, CheckCircle2, CreditCard, FastForward, Hourglass, MessageCircle, Receipt, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CourtArt } from "@/components/kora/court-art";
import { EmptyState } from "@/components/kora/list-state";
import { SpotsBar } from "@/components/kora/spots-bar";
import { PrototypeBox, ScreenHeader, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HOLD_RELEASE_HOURS, SPORTS } from "@/lib/constants";
import { dayLabel, formatDuration, formatEGP, formatTimeRange, longDate } from "@/lib/format";
import { neededToConfirm, spotsLeft, statusSentence } from "@/lib/games";
import { downloadIcs } from "@/lib/ics";
import { priceSplit, slotTotal } from "@/lib/pricing";
import { useKora } from "@/lib/store";
import type { Booking, PaymentMethod } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const WALLET_BALANCE = 350; // EGP, mock

const METHODS: Array<{ id: PaymentMethod; title: string; detail: string; Icon: typeof CreditCard }> = [
  { id: "card", title: "Card · Visa •••• 4242", detail: "Held now, charged only when the game confirms.", Icon: CreditCard },
  { id: "wallet", title: "Kora Wallet", detail: `Balance ${formatEGP(WALLET_BALANCE)}. Refunds land here instantly.`, Icon: Wallet },
  { id: "fawry", title: "Fawry", detail: "Pay at any Fawry outlet within 24 h using a reference code.", Icon: Receipt },
  { id: "cash", title: "Cash at venue", detail: "Pay on arrival. No-shows lower your reliability score.", Icon: Banknote },
];

export default function CheckoutScreen() {
  const { state, dispatch, me, gamesById, courtsById, venuesById, hydrated } = useKora();
  const draft = state.checkout;
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  if (!draft) {
    return (
      <div>
        <ScreenHeader title="Checkout" backHref="/play" />
        <div className="p-4">
          {hydrated && (
            <EmptyState icon={<ShoppingCart />} title="Nothing to pay for" description="Pick a game to join or a court slot to book first." action={<Button asChild><Link href="/play/find">Find a game</Link></Button>} />
          )}
        </div>
      </div>
    );
  }

  /* ---------- Work out what is being bought ---------- */
  const game = draft.kind === "game" ? gamesById.get(draft.gameId) : undefined;
  const court = courtsById.get(draft.kind === "game" ? game?.courtId ?? "" : draft.courtId);
  const venue = court ? venuesById.get(court.venueId) : undefined;
  if (!court || !venue || (draft.kind === "game" && !game)) return null;

  const date = game ? game.date : draft.kind === "court" ? draft.date : "";
  const startHour = game ? game.startHour : draft.kind === "court" ? draft.startHour : 0;
  const duration = game ? game.duration : draft.kind === "court" ? draft.duration : 1;
  const split = game ? priceSplit(game.courtTotal, game.capacity, game.minPlayers) : null;
  const courtTotal = draft.kind === "court" ? slotTotal(court, date, startHour, duration, state.slotOverrides) : 0;
  const amount = split ? split.perPerson : courtTotal;
  const holdAmount = split ? split.maxPerPerson : courtTotal;
  const needsApproval = draft.kind === "court" && state.ownerSettings.manualApproval && !!venue.ownerId;

  // Already paid? (covers page refreshes after a successful payment)
  const joined = game ? game.playerIds.includes(me.id) : false;
  const booking = bookingId ? state.bookings.find((b) => b.id === bookingId) : undefined;
  const done = joined || !!booking;

  function pay() {
    setPaying(true);
    // Simulated payment gateway latency.
    window.setTimeout(() => {
      if (game) {
        dispatch({ type: "joinGame", gameId: game.id, playerId: me.id, method });
      } else if (draft?.kind === "court") {
        const b: Booking = {
          id: uid("b"),
          courtId: court!.id,
          venueId: venue!.id,
          date,
          startHour,
          duration,
          status: needsApproval ? "requested" : "confirmed",
          source: "kora_private",
          playerId: me.id,
          organizerName: me.name,
          organizerPhone: "+20 100 555 0101",
          amount: courtTotal,
          createdAt: Date.now(),
        };
        dispatch({ type: "bookCourt", booking: b, method });
        setBookingId(b.id);
      }
      setPaying(false);
    }, 700);
  }

  function addToCalendar() {
    downloadIcs({
      title: game ? `${SPORTS[game.sport].label} · Kora` : `${court!.name} booking · Kora`,
      date,
      startHour,
      duration,
      location: `${venue!.name}, ${venue!.address}`,
      description: "Booked with Kora.",
    });
    toast.success("Calendar file downloaded");
  }

  const fawryCode = `${(date.replaceAll("-", "").slice(2) + String(startHour)).slice(0, 4)} ${String(court.id.length * 1373).padStart(4, "0")}`;

  /* ---------- Confirmation ---------- */
  if (done) {
    const confirmed = game ? game.status === "confirmed" : booking?.status === "confirmed";
    return (
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Payment complete" backHref={game ? `/play/games/${game.id}` : "/play/explore"} />
        <div className="flex-1 space-y-5 px-4 pb-6 pt-6">
          <div className="text-center">
            <span className={cn("mx-auto flex size-20 items-center justify-center rounded-full", confirmed ? "bg-brand text-white" : "bg-amber-100 text-amber-800")}>
              {confirmed ? <CheckCircle2 className="size-10" aria-hidden /> : <Hourglass className="size-10" aria-hidden />}
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight" role="status">
              {game ? (confirmed ? "Game confirmed!" : "You're in! Spot held") : confirmed ? "Court booked!" : "Request sent"}
            </h1>
            <p className="mx-auto mt-1 max-w-xs text-sm text-slate-600">
              {game
                ? confirmed
                  ? "The court is booked and your share has been charged. See you there."
                  : `Pending: ${neededToConfirm(game)} more ${neededToConfirm(game) === 1 ? "player" : "players"} needed. We'll only charge you when the game confirms.`
                : confirmed
                  ? "Your court is booked. You'll get a reminder 2 hours before."
                  : `${venue.name} approves private bookings manually, usually within an hour. You won't be charged until they accept.`}
            </p>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="font-bold">{game ? SPORTS[game.sport].label : court.name} · {venue.name}</p>
            <p className="text-sm text-slate-600">{longDate(date)} · {formatTimeRange(startHour, duration)}</p>
            {game && (
              <>
                <p className={cn("mt-3 text-sm font-bold", confirmed ? "text-brand-dark" : "text-amber-900")}>{statusSentence(game)}</p>
                <SpotsBar game={game} className="mt-2" />
              </>
            )}
            <p className="mt-3 text-sm text-slate-600">
              Paid with <strong className="text-slate-900">{METHODS.find((m) => m.id === (state.payments[`${game?.id}|${me.id}`] ?? method))?.title}</strong>
            </p>
            {method === "fawry" && (
              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Fawry reference: <strong className="font-mono text-base tracking-wider">{fawryCode}</strong> · pay within 24 h
              </p>
            )}
          </div>

          {game && game.status === "filling" && (
            <PrototypeBox title="Prototype: fast-forward time">
              <Button variant="dark" className="w-full" onClick={() => dispatch({ type: "simulateJoins", gameId: game.id, count: spotsLeft(game) })}>
                <FastForward aria-hidden /> Fast-forward: game fills
              </Button>
            </PrototypeBox>
          )}

          <div className="grid gap-2">
            <Button variant="outline" size="lg" onClick={addToCalendar}>
              <CalendarPlus aria-hidden /> Add to calendar
            </Button>
            {game && (
              <Button asChild size="lg">
                <Link href={`/play/chat/${game.id}`}>
                  <MessageCircle aria-hidden /> Open game chat
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="lg">
              <Link href="/play/my-games">Go to My Games</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Payment form ---------- */
  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader title="Checkout" backHref={game ? `/play/games/${game.id}` : `/play/courts/${venue.id}`} />
      <div className="flex-1 space-y-5 px-4 pb-6 pt-4">
        {/* Summary */}
        <div className="flex gap-3 rounded-2xl border p-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-xl">
            <CourtArt sport={court.sport} />
          </div>
          <div className="min-w-0">
            <p className="font-bold">{game ? SPORTS[game.sport].label : `${court.name} · private booking`}</p>
            <p className="truncate text-sm text-slate-600">{venue.name}</p>
            <p className="text-sm font-semibold">{dayLabel(date)} · {formatTimeRange(startHour, duration)}</p>
          </div>
        </div>

        {/* Amount */}
        <section aria-labelledby="amount" className="rounded-2xl bg-slate-50 p-4">
          <h2 id="amount" className="font-bold">{game ? "Your share" : "Court total"}</h2>
          <dl className="mt-2 space-y-1.5 text-sm">
            {split ? (
              <>
                <div className="flex justify-between"><dt className="text-slate-600">Court share (÷{game!.capacity})</dt><dd className="font-semibold">{formatEGP(split.shareFull)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">Kora booking fee</dt><dd className="font-semibold">{formatEGP(split.fee)}</dd></div>
              </>
            ) : (
              <div className="flex justify-between"><dt className="text-slate-600">{court.name} · {formatDuration(duration)}</dt><dd className="font-semibold">{formatEGP(courtTotal)}</dd></div>
            )}
            <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatEGP(amount)}</dd></div>
          </dl>
        </section>

        {/* Payment methods */}
        <section aria-labelledby="pay-with">
          <h2 id="pay-with" className="mb-2 font-bold">Pay with</h2>
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} aria-labelledby="pay-with" className="gap-2">
            {METHODS.map(({ id, title, detail, Icon }) => {
              const insufficient = id === "wallet" && WALLET_BALANCE < amount;
              return (
                <Label
                  key={id}
                  htmlFor={`pm-${id}`}
                  className={cn(
                    "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 font-normal",
                    method === id ? "border-primary bg-brand-soft" : "border-slate-200",
                    insufficient && "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem id={`pm-${id}`} value={id} disabled={insufficient} />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-800 shadow-xs">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{title}</span>
                    <span className="text-xs leading-snug text-slate-600">{insufficient ? "Not enough balance for this payment." : detail}</span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </section>

        {/* Hold my spot explainer */}
        <section aria-labelledby="hold" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 id="hold" className="flex items-center gap-2 font-bold text-slate-900">
            <Hourglass className="size-5 text-amber-700" aria-hidden /> {game ? "How “Hold my spot” works" : needsApproval ? "How booking requests work" : "Instant booking"}
          </h2>
          {game ? (
            <ol className="mt-2 space-y-1.5 text-sm text-slate-800">
              <li><strong>1. Hold now.</strong> We reserve up to {formatEGP(holdAmount)} (your max share if only {game!.minPlayers} join).</li>
              <li><strong>2. Charge on confirm.</strong> When {game!.minPlayers} players join, the court is booked and you pay your final share ({formatEGP(amount)} if full).</li>
              <li><strong>3. Auto-refund.</strong> If it doesn&apos;t fill {HOLD_RELEASE_HOURS} h before kick-off, the hold is released in full.</li>
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-800">
              {needsApproval
                ? "The venue confirms private bookings manually. We hold the amount and only charge it if they accept; otherwise the hold is released."
                : "This venue confirms instantly. You'll get a booking reference right away."}
            </p>
          )}
        </section>
      </div>

      <StickyFooter>
        <Button size="xl" className="w-full" onClick={pay} disabled={paying}>
          {paying ? "Processing…" : game ? `Hold my spot · ${formatEGP(amount)}` : needsApproval ? `Request booking · ${formatEGP(amount)}` : `Pay ${formatEGP(amount)}`}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-600">Prototype: no real payment is made.</p>
      </StickyFooter>
    </div>
  );
}
