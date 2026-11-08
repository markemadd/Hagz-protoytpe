"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { OWNER_VENUE_ID } from "@/lib/owner";
import { useKora } from "@/lib/store";
import type { OwnerSettings } from "@/lib/types";

export default function OwnerSettingsPage() {
  const { state, dispatch } = useKora();
  const s = state.ownerSettings;
  const venue = state.venues.find((v) => v.id === OWNER_VENUE_ID)!;
  const [name, setName] = useState(venue.name);
  const [phone, setPhone] = useState(venue.phone);
  const set = (patch: Partial<OwnerSettings>) => dispatch({ type: "updateOwnerSettings", patch });

  const toggles: Array<{ key: "manualApproval" | "autoHoldGames" | "depositForPhone"; title: string; text: string }> = [
    { key: "manualApproval", title: "Manual approval for private bookings", text: "Full-court bookings wait for you to accept. Players are only charged once you do." },
    { key: "autoHoldGames", title: "Auto-hold slots for Kora games", text: "A filling game holds the slot instantly; it becomes a paid booking when enough players join, or is released if it doesn't." },
    { key: "depositForPhone", title: "Require a deposit for phone bookings", text: "Send a Kora payment link for 30% upfront. Cuts no-shows on phone bookings." },
  ];

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader><CardTitle>Booking rules</CardTitle><CardDescription>Changes apply to new bookings immediately.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={t.key}>{t.title}</Label>
                <p className="mt-1 text-sm text-slate-600">{t.text}</p>
              </div>
              <Switch id={t.key} checked={s[t.key]} onCheckedChange={(v) => { set({ [t.key]: v }); toast.success("Setting saved"); }} />
            </div>
          ))}
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="cancel">Free cancellation window</Label>
            <NativeSelect id="cancel" value={s.cancellationHours} onChange={(e) => set({ cancellationHours: Number(e.target.value) })}>
              {[6, 12, 24, 48].map((h) => <option key={h} value={h}>Up to {h} h before</option>)}
            </NativeSelect>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Venue profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="v-name">Venue name</Label><Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="v-phone">Phone</Label><Input id="v-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button disabled={!name.trim()} onClick={() => { dispatch({ type: "updateVenue", venueId: venue.id, patch: { name: name.trim(), phone } }); toast.success("Venue profile saved"); }}>Save</Button>
            <Button asChild variant="outline"><Link href="/owner/onboarding">Re-run venue setup</Link></Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payout account</CardTitle><CardDescription>Weekly payouts every Thursday.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm">CIB · EG38 •••• •••• •••• 0921</p>
          <Button variant="outline" onClick={() => toast("Bank change requires verification — we'll email you.")}>Change account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
