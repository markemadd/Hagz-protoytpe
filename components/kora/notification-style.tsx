import { Bell, BellRing, CalendarClock, CheckCircle2, Inbox, Sparkles, Star, Tag, UserPlus, Users, XCircle } from "lucide-react";
import type { NotificationType } from "@/lib/types";

/** Icon + tint per notification type (tints are decorative; titles carry the meaning). */
export const NOTIFICATION_STYLE: Record<NotificationType, { Icon: typeof Bell; tint: string }> = {
  match: { Icon: Sparkles, tint: "bg-volt text-slate-900" },
  spots: { Icon: Users, tint: "bg-amber-100 text-amber-900" },
  confirmed: { Icon: CheckCircle2, tint: "bg-brand-soft text-brand-dark" },
  reminder: { Icon: CalendarClock, tint: "bg-sky-100 text-sky-900" },
  joined: { Icon: UserPlus, tint: "bg-sky-100 text-sky-900" },
  cancelled: { Icon: XCircle, tint: "bg-rose-100 text-rose-900" },
  waitlist: { Icon: BellRing, tint: "bg-violet-100 text-violet-900" },
  deal: { Icon: Tag, tint: "bg-volt text-slate-900" },
  rate: { Icon: Star, tint: "bg-amber-100 text-amber-900" },
  booking: { Icon: Inbox, tint: "bg-sky-100 text-sky-900" },
};
