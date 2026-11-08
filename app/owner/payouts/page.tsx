"use client";

import { MessageSquareReply, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AsyncList } from "@/components/kora/list-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { KORA_COMMISSION } from "@/lib/constants";
import { dayMonth, formatEGP, relativeTime } from "@/lib/format";
import { OWNER_VENUE_ID, koraRevenue, ownerBookings, ownerCourts, weekDates } from "@/lib/owner";
import { useKora } from "@/lib/store";
import type { CourtReview } from "@/lib/types";

// Older weeks are static history (seeded); the last two rows come from live bookings.
const HISTORY = [
  { offset: -6, gross: 14200, count: 21 },
  { offset: -5, gross: 15950, count: 24 },
  { offset: -4, gross: 13100, count: 19 },
  { offset: -3, gross: 17400, count: 26 },
  { offset: -2, gross: 18650, count: 27 },
];

export default function OwnerPayouts() {
  const { state } = useKora();
  const bookings = ownerBookings(state);
  const lastWeek = koraRevenue(bookings, weekDates(-1));
  const thisWeek = koraRevenue(bookings, weekDates(0));

  const rows = [
    { period: weekDates(0), ...thisWeek, status: "Scheduled · Thu" },
    { period: weekDates(-1), ...lastWeek, status: "Paid" },
    ...HISTORY.slice().reverse().map((h) => {
      const fee = Math.round(h.gross * KORA_COMMISSION);
      return { period: weekDates(h.offset), gross: h.gross, count: h.count, fee, net: h.gross - fee, status: "Paid" };
    }),
  ];
  const maxNet = Math.max(...rows.map((r) => r.net));

  const reviews = state.reviews.filter((r) => r.venueId === OWNER_VENUE_ID);
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  // Rating distribution, O(R).
  const dist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[r.rating - 1]++;
    return counts;
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-brand-dark p-5 text-white md:col-span-1">
          <p className="text-sm font-semibold text-emerald-50">Next payout · Thu {dayMonth(weekDates(0)[4])}</p>
          <p className="mt-2 text-4xl font-extrabold">{formatEGP(thisWeek.net)}</p>
          <p className="mt-1 text-sm text-emerald-50">{thisWeek.count} Kora bookings so far · to CIB •••• 0921</p>
        </div>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>How payouts work</CardTitle>
            <CardDescription>
              Kora collects from players, keeps a {KORA_COMMISSION * 100}% fee on Kora-sourced bookings, and pays you weekly. Phone bookings are paid at your desk and aren&apos;t included.
              Held games are paid only once they confirm.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payout history</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Weekly payouts</caption>
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th scope="col" className="py-2 font-semibold">Week</th>
                <th scope="col" className="py-2 font-semibold">Kora bookings</th>
                <th scope="col" className="py-2 text-right font-semibold">Gross</th>
                <th scope="col" className="py-2 text-right font-semibold">Kora fee</th>
                <th scope="col" className="py-2 pl-6 font-semibold">Net</th>
                <th scope="col" className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period[0]} className="border-b last:border-0">
                  <td className="py-3 font-semibold">{dayMonth(r.period[0])} – {dayMonth(r.period[6])}</td>
                  <td className="py-3 tabular-nums">{r.count}</td>
                  <td className="py-3 text-right tabular-nums">{formatEGP(r.gross)}</td>
                  <td className="py-3 text-right tabular-nums text-slate-600">−{formatEGP(r.fee)}</td>
                  <td className="py-3 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-bold tabular-nums">{formatEGP(r.net)}</span>
                      <span aria-hidden className="h-2 rounded-r-full bg-brand" style={{ width: `${(r.net / maxNet) * 120}px` }} />
                    </div>
                  </td>
                  <td className="py-3">{r.status === "Paid" ? <Badge variant="soft">Paid</Badge> : <Badge variant="amber">{r.status}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Ratings</CardTitle></CardHeader>
          <CardContent>
            <p className="flex items-end gap-2"><span className="text-5xl font-extrabold">{venue.rating.toFixed(1)}</span><span className="pb-1 text-sm text-slate-600">/ 5 · {venue.reviewCount} reviews</span></p>
            <ul className="mt-4 space-y-1.5" aria-label="Rating distribution (recent reviews)">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="flex items-center gap-2 text-sm">
                  <span className="w-8 font-semibold">{n}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-soft"><span className="block h-full rounded-full bg-brand" style={{ width: `${reviews.length ? (dist[n - 1] / reviews.length) * 100 : 0}%` }} /></span>
                  <span className="w-6 text-right tabular-nums text-slate-600">{dist[n - 1]}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1 text-sm">
              {ownerCourts(state).map((c) => {
                const rs = reviews.filter((r) => r.courtId === c.id);
                const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
                return <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="font-bold">{avg ? `${avg.toFixed(1)}★` : "—"}</span></li>;
              })}
            </ul>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Reviews</CardTitle><CardDescription>Players rate courts after each Kora game.</CardDescription></CardHeader>
          <CardContent>
            <AsyncList
              listKey="owner-reviews"
              items={reviews}
              getKey={(r) => r.id}
              className="space-y-3"
              skeleton={<Skeleton className="h-20" />}
              errorTitle="Couldn't load reviews"
              empty={{ icon: <Star />, title: "No reviews yet", description: "They'll appear after your first Kora games." }}
              renderItem={(r) => <ReviewItem review={r} courtName={state.courts.find((c) => c.id === r.courtId)?.name} />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewItem({ review, courtName }: { review: CourtReview; courtName?: string }) {
  const { dispatch } = useKora();
  const [reply, setReply] = useState("");
  return (
    <div className="rounded-2xl border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{review.authorName} <span className="font-normal text-slate-600">· {courtName ?? "Venue"} · {relativeTime(review.at)}</span></p>
        <p className="font-bold" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span className="text-slate-300">{"★".repeat(5 - review.rating)}</span></p>
      </div>
      {review.text && <p className="mt-1 text-slate-700">{review.text}</p>}
      {review.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{review.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>}
      {review.reply ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-700"><strong>Your reply:</strong> {review.reply}</p>
      ) : (
        <Dialog>
          <DialogTrigger asChild><Button variant="ghost" size="xs" className="mt-2 h-11"><MessageSquareReply aria-hidden /> Reply</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Reply to {review.authorName}</DialogTitle><DialogDescription>Replies are public on your venue page.</DialogDescription></DialogHeader>
            <Label htmlFor={`reply-${review.id}`}>Your reply</Label>
            <Textarea id={`reply-${review.id}`} value={reply} onChange={(e) => setReply(e.target.value)} />
            <DialogFooter>
              <DialogClose asChild><Button disabled={!reply.trim()} onClick={() => { dispatch({ type: "replyReview", reviewId: review.id, reply: reply.trim() }); toast.success("Reply posted"); }}>Post reply</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

