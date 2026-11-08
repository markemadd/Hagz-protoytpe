"use client";

import { ArrowRight, Check, FastForward, LayoutDashboard, RotateCcw, UserPlus } from "lucide-react";
import Link from "next/link";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { KoraLogo } from "@/components/kora/kora-logo";
import { Button } from "@/components/ui/button";
import { PERSONAS } from "@/lib/constants";
import { isInPast, spotsLeft } from "@/lib/games";
import { useKora } from "@/lib/store";
import type { ListStateOverride } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = { label: string; done: boolean; href: string };

/**
 * Desktop-only guide next to the phone: persona switcher, a self-checking
 * checklist of the scripted flow, simulators, and a list-state override.
 */
export function DemoPanel({ className }: { className?: string }) {
  const { state, dispatch, me } = useKora();
  const isSalma = me.id === PERSONAS.salma.playerId;

  // Games this persona joined (not organised) and games they organised during the demo.
  const joined = state.games.filter((g) => g.playerIds.includes(me.id) && g.organizerId !== me.id);
  const created = state.games.filter((g) => g.organizerId === me.id && g.id.startsWith("g-"));
  const latestCreated = created[created.length - 1];

  const steps: Step[] = isSalma
    ? [
        { label: "Onboard: sports, level, availability", done: !!state.onboarded[me.id], href: "/play/onboarding" },
        { label: "Find me a game (padel, Thu 6–10 PM)", done: !!state.flags[`searched:${me.id}`], href: "/play/find" },
        { label: "Open the top match, join & pay", done: Object.keys(state.payments).some((k) => k.endsWith(`|${me.id}`)), href: "/play/games/g1" },
        { label: "Fast-forward: game fills → Confirmed", done: joined.some((g) => g.status === "confirmed" || g.status === "completed"), href: "/play/my-games" },
        { label: "See the notification + chat message", done: state.notifications.some((n) => n.userId === me.id && n.type === "confirmed" && n.read), href: "/play/notifications" },
        { label: "After the game: rate players & court", done: Object.keys(state.flags).some((k) => k.startsWith("rated:") && k.endsWith(`:${me.id}`)), href: "/play/my-games" },
      ]
    : [
        { label: "Create a game: 5-a-side, Wed 8 PM", done: !!state.flags[`created:${me.id}`], href: "/play/create" },
        { label: "Pick Pitch 1 at Nasr Arena (Karim's club)", done: created.some((g) => g.venueId === PERSONAS.karim.venueId), href: "/play/create" },
        { label: "Publish, then invite friends", done: !!state.flags[`invited:${me.id}`], href: latestCreated ? `/play/games/${latestCreated.id}/published` : "/play/create" },
        { label: "Watch players join → Confirmed", done: created.some((g) => g.status === "confirmed"), href: latestCreated ? `/play/games/${latestCreated.id}` : "/play/create" },
        { label: "Switch to Karim: see it on his calendar", done: !!state.flags["owner-viewed-calendar"], href: "/owner/calendar" },
      ];

  // The game the simulators act on: newest filling game this persona is in, else newest confirmed.
  const mine = state.games.filter((g) => g.playerIds.includes(me.id) && !isInPast(g));
  const filling = [...mine].reverse().find((g) => g.status === "filling");
  const confirmed = [...mine].reverse().find((g) => g.status === "confirmed" && g.id.startsWith("g-")) ?? [...mine].reverse().find((g) => g.status === "confirmed");

  const listStates: ListStateOverride[] = ["auto", "loading", "empty", "error"];

  return (
    <aside aria-label="Prototype guide" className={cn("no-scrollbar max-h-[calc(100dvh-3rem)] w-80 shrink-0 flex-col gap-4 self-center overflow-y-auto [&>*]:shrink-0", className)}>
      <div className="rounded-3xl border bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <KoraLogo />
          <Link href="/" className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline">
            All personas
          </Link>
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-600">Playing as</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[PERSONAS.omar, PERSONAS.salma].map((p) => (
            <ChoiceChip key={p.playerId} selected={me.id === p.playerId} onClick={() => dispatch({ type: "setPersona", playerId: p.playerId })}>
              {p.name}
            </ChoiceChip>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link href="/owner">
            <LayoutDashboard aria-hidden /> Karim&apos;s owner app
          </Link>
        </Button>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-600">{isSalma ? "Salma" : "Omar"}&apos;s flow</p>
        <ol className="mt-2 space-y-1">
          {steps.map((s, i) => (
            <li key={s.label}>
              <Link href={s.href} className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 text-sm outline-none hover:bg-slate-50 focus-visible:ring-[3px] focus-visible:ring-ring/40">
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-primary text-white" : "bg-slate-100 text-slate-700")}>
                  {s.done ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
                </span>
                <span className={cn("flex-1", s.done ? "text-slate-500 line-through" : "font-medium text-slate-900")}>{s.label}</span>
                <ArrowRight className="size-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50/90 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Simulate the marketplace</p>
        <div className="mt-3 grid gap-2">
          <Button variant="outline" disabled={!filling} onClick={() => filling && dispatch({ type: "simulateJoins", gameId: filling.id, count: 1 })}>
            <UserPlus aria-hidden /> A player joins
          </Button>
          <Button variant="dark" disabled={!filling} onClick={() => filling && dispatch({ type: "simulateJoins", gameId: filling.id, count: spotsLeft(filling) })}>
            <FastForward aria-hidden /> Fast-forward: game fills
          </Button>
          <Button variant="outline" disabled={!confirmed} onClick={() => confirmed && dispatch({ type: "completeGame", gameId: confirmed.id })}>
            <FastForward aria-hidden /> Fast-forward: game played
          </Button>
        </div>
        <p className="mt-2 text-xs text-violet-900">
          {filling ? `Acts on your pending game (${filling.playerIds.length}/${filling.capacity}).` : "Join or create a game to enable."}
        </p>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-violet-800">Force list state</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {listStates.map((s) => (
            <ChoiceChip key={s} selected={state.listState === s} onClick={() => dispatch({ type: "setListState", value: s })} className="capitalize">
              {s}
            </ChoiceChip>
          ))}
        </div>

        <Button variant="ghost" className="mt-4 w-full text-violet-900 hover:bg-violet-100" onClick={() => dispatch({ type: "reset" })}>
          <RotateCcw aria-hidden /> Reset demo
        </Button>
      </div>
    </aside>
  );
}
