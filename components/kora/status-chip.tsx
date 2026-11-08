import { Ban, CheckCircle2, Flag, Hourglass, Inbox, UserX, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus, GameStatus } from "@/lib/types";

/* Status is always icon + words, never colour alone (WCAG 1.4.1). */

const GAME = {
  filling: { label: "Filling", variant: "amber", Icon: Hourglass },
  confirmed: { label: "Confirmed", variant: "soft", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled · refunded", variant: "rose", Icon: XCircle },
  completed: { label: "Played", variant: "secondary", Icon: Flag },
} as const;

const BOOKING = {
  requested: { label: "Request", variant: "sky", Icon: Inbox },
  held: { label: "Held · filling", variant: "amber", Icon: Hourglass },
  confirmed: { label: "Confirmed", variant: "soft", Icon: CheckCircle2 },
  completed: { label: "Completed", variant: "secondary", Icon: Flag },
  no_show: { label: "No-show", variant: "rose", Icon: UserX },
  declined: { label: "Declined", variant: "secondary", Icon: Ban },
  cancelled: { label: "Cancelled", variant: "secondary", Icon: XCircle },
} as const;

export function GameStatusChip({ status, className }: { status: GameStatus; className?: string }) {
  const s = GAME[status];
  return (
    <Badge variant={s.variant} className={className}>
      <s.Icon aria-hidden /> {s.label}
    </Badge>
  );
}

export function BookingStatusChip({ status, className }: { status: BookingStatus; className?: string }) {
  const s = BOOKING[status];
  return (
    <Badge variant={s.variant} className={className}>
      <s.Icon aria-hidden /> {s.label}
    </Badge>
  );
}
