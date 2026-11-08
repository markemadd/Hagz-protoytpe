"use client";

import { Phone, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { SportIcon } from "@/components/kora/sport-icon";
import { BookingStatusChip } from "@/components/kora/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { dayLabel, formatEGP, formatTimeRange } from "@/lib/format";
import { useKora } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceBadge({ booking }: { booking: Booking }) {
  if (booking.source === "kora_game") return <Badge variant="volt">Kora game</Badge>;
  if (booking.source === "kora_private") return <Badge variant="soft">Kora</Badge>;
  return <Badge variant="secondary"><Phone aria-hidden /> Phone</Badge>;
}

/** One booking: when · court · who · players (for Kora games) · amount · status · actions. */
export function BookingRow({ booking, actions, className }: { booking: Booking; actions?: React.ReactNode; className?: string }) {
  const { courtsById, gamesById } = useKora();
  const court = courtsById.get(booking.courtId);
  const game = booking.gameId ? gamesById.get(booking.gameId) : undefined;
  return (
    <div className={cn("grid items-center gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[150px_1fr_140px_auto] md:gap-4", className)}>
      <div>
        <p className="font-bold">{dayLabel(booking.date)}</p>
        <p className="text-sm text-slate-600">{formatTimeRange(booking.startHour, booking.duration)}</p>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold">
          {court && <SportIcon sport={court.sport} className="size-4 text-brand" />}
          <span className="truncate">{court?.name}</span>
          <span className="text-slate-400" aria-hidden>·</span>
          <span className="truncate text-slate-700">{booking.organizerName}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <SourceBadge booking={booking} />
          {game && (
            <span className="text-xs font-semibold text-slate-700">
              {game.playerIds.length}/{game.capacity} players{game.status === "filling" ? ` · confirms at ${game.minPlayers}` : ""}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 md:block">
        <p className="font-extrabold">{formatEGP(booking.amount)}</p>
        <BookingStatusChip status={booking.status} className="md:mt-1" />
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
    </div>
  );
}

/** Contact the organiser: call, WhatsApp or in-app message (mocked). */
export function ContactButton({ booking }: { booking: Booking }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs" className="h-11 px-3">Contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact {booking.organizerName}</DialogTitle>
          <DialogDescription>{booking.source === "phone" ? "Booked by phone" : "Booked on Kora"} · {dayLabel(booking.date)}, {formatTimeRange(booking.startHour, booking.duration)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button asChild variant="outline" size="lg">
            <a href={`tel:${booking.organizerPhone.replace(/\s/g, "")}`}><Phone aria-hidden /> Call {booking.organizerPhone}</a>
          </Button>
          <Button variant="outline" size="lg" onClick={() => toast("Opening WhatsApp…")}><Smartphone aria-hidden /> WhatsApp</Button>
          {booking.source !== "phone" && (
            <Button size="lg" onClick={() => toast.success("Message sent via Kora", { description: "They'll get it as a push notification." })}>
              <MessageCircle aria-hidden /> Message on Kora
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
