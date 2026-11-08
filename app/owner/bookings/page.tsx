"use client";

import { Inbox, RotateCcw, Search, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AsyncList } from "@/components/kora/list-state";
import { BookingRow, ContactButton } from "@/components/owner/booking-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPastHour } from "@/lib/availability";
import { ownerBookings, ownerCourts } from "@/lib/owner";
import { useKora } from "@/lib/store";
import type { Booking } from "@/lib/types";

type Tab = "requests" | "upcoming" | "past";
const PAGE = 12;

export default function OwnerBookings() {
  const { state, dispatch } = useKora();
  const courts = ownerCourts(state);
  const [tab, setTab] = useState<Tab>("requests");
  const [query, setQuery] = useState("");
  const [court, setCourt] = useState("all");
  const [limit, setLimit] = useState(PAGE);

  // Bucket and sort once per state change: O(B log B).
  const buckets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = ownerBookings(state).filter((b) => (court === "all" || b.courtId === court) && (!q || b.organizerName.toLowerCase().includes(q)));
    const byTime = (a: Booking, b: Booking) => a.date.localeCompare(b.date) || a.startHour - b.startHour;
    return {
      requests: all.filter((b) => b.status === "requested").sort(byTime),
      upcoming: all.filter((b) => (b.status === "confirmed" || b.status === "held") && !isPastHour(b.date, b.startHour)).sort(byTime),
      past: all.filter((b) => ["completed", "no_show", "declined", "cancelled"].includes(b.status) || ((b.status === "confirmed") && isPastHour(b.date, b.startHour))).sort((a, b) => -byTime(a, b)),
    };
  }, [state, query, court]);

  const set = (b: Booking, status: Booking["status"], message: string) => {
    dispatch({ type: "setBookingStatus", bookingId: b.id, status });
    toast.success(message);
  };

  function actions(b: Booking) {
    if (b.status === "requested") {
      return (
        <>
          <Button size="xs" className="h-11 px-3" onClick={() => set(b, "confirmed", `Accepted ${b.organizerName}'s booking`)}>Accept</Button>
          <Button size="xs" variant="outline" className="h-11 px-3" onClick={() => set(b, "declined", "Declined · the player's hold was released")}>Decline</Button>
          <ContactButton booking={b} />
        </>
      );
    }
    if (b.status === "no_show") {
      return <Button size="xs" variant="outline" className="h-11 px-3" onClick={() => set(b, "completed", "No-show removed")}><RotateCcw aria-hidden /> Undo</Button>;
    }
    if (b.status === "completed" || (b.status === "confirmed" && isPastHour(b.date, b.startHour))) {
      return (
        <>
          <Button size="xs" variant="outline" className="h-11 px-3 text-rose-800" onClick={() => set(b, "no_show", "Marked as no-show")}><UserX aria-hidden /> Mark no-show</Button>
          <ContactButton booking={b} />
        </>
      );
    }
    return <ContactButton booking={b} />;
  }

  const empties: Record<Tab, { title: string; description: string }> = {
    requests: { title: "No requests waiting", description: "New private-booking requests appear here while manual approval is on." },
    upcoming: { title: "No upcoming bookings", description: "Promote idle slots to bring players in." },
    past: { title: "No past bookings", description: "Completed bookings and no-shows show here." },
  };

  return (
    <div className="space-y-5">
      {state.ownerSettings.manualApproval && (
        <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
          Manual approval is <strong>on</strong> for private bookings. Kora games still hold slots instantly. <Link href="/owner/settings" className="font-semibold underline">Change in Settings</Link>
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Label htmlFor="b-search" className="sr-only">Search by organiser</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input id="b-search" placeholder="Search by organiser name" className="pl-9" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} />
        </div>
        <div className="sm:w-56">
          <Label htmlFor="b-court" className="sr-only">Court</Label>
          <NativeSelect id="b-court" value={court} onChange={(e) => { setCourt(e.target.value); setLimit(PAGE); }}>
            <option value="all">All courts</option>
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </NativeSelect>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setLimit(PAGE); }}>
        <TabsList className="max-w-lg">
          <TabsTrigger value="requests">Requests ({buckets.requests.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({buckets.upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        {(["requests", "upcoming", "past"] as const).map((t) => (
          <TabsContent key={t} value={t} className="space-y-3">
            <AsyncList
              listKey={`owner-bookings-${t}`}
              items={buckets[t].slice(0, limit)}
              getKey={(b) => b.id}
              className="space-y-3"
              skeleton={<Skeleton className="h-24 w-full" />}
              errorTitle="Couldn't load bookings"
              empty={{ icon: <Inbox />, ...empties[t] }}
              renderItem={(b) => <BookingRow booking={b} actions={actions(b)} />}
            />
            {buckets[t].length > limit && (
              <Button variant="outline" className="w-full" onClick={() => setLimit(limit + PAGE)}>
                Show more ({buckets[t].length - limit} remaining)
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
