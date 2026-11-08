"use client";

import { ArrowRight, CalendarCheck, Frown, MapPin, RotateCcw, Target, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourtArt } from "@/components/kora/court-art";
import { KoraLogo } from "@/components/kora/kora-logo";
import { Button } from "@/components/ui/button";
import { PERSONAS } from "@/lib/constants";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

/* =========================================================================
   Entry screen: persona switcher. Each card opens that persona's journey.
   ========================================================================= */

type PersonaCard = {
  key: "omar" | "salma" | "karim";
  name: string;
  tag: string;
  meta: string;
  initials: string;
  avatar: string;
  band: string;
  summary: string;
  goals: string[];
  pains: string[];
  journey: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const CARDS: PersonaCard[] = [
  {
    key: "omar",
    name: "Omar",
    tag: "The Organizer",
    meta: "27 · Software engineer · New Cairo",
    initials: "OH",
    avatar: "bg-emerald-100 text-emerald-900",
    band: "bg-brand",
    summary: "Plays football every week and is almost always the one organising.",
    goals: ["Create a game in a couple of minutes", "Fill missing spots with strangers at his level", "Split the court cost fairly"],
    pains: ["Chasing friends on WhatsApp", "Games cancelled when 2–3 people are short", "Paying the full court fee upfront himself"],
    journey: ["Create game", "Pick court slot", "Publish & invite", "Players join", "Confirmed"],
    primary: { label: "Start Omar's journey", href: "/play/create" },
    secondary: { label: "Open Omar's home", href: "/play" },
  },
  {
    key: "salma",
    name: "Salma",
    tag: "The Solo Player",
    meta: "24 · Recently moved to Maadi",
    initials: "SA",
    avatar: "bg-violet-100 text-violet-900",
    band: "bg-volt",
    summary: "Wants to play padel and basketball, but doesn't have a group in Cairo yet.",
    goals: ["Say when she's free and get matched nearby", "Play with people at her level", "Discover courts around Maadi"],
    pains: ["Doesn't know anyone yet", "Unsure whether her level fits", "Doesn't know where the courts are"],
    journey: ["Onboarding", "Find me a game", "Join & pay", "Game fills", "Rate"],
    primary: { label: "Start Salma's journey", href: "/play/onboarding" },
    secondary: { label: "Skip to Find me a game", href: "/play/find" },
  },
  {
    key: "karim",
    name: "Karim",
    tag: "The Court Owner",
    meta: "40 · Owns Nasr Arena (3 courts) · Nasr City",
    initials: "KS",
    avatar: "bg-slate-200 text-slate-900",
    band: "bg-slate-900",
    summary: "Runs a family sports club with two football pitches and an indoor padel court.",
    goals: ["List courts with prices and availability", "Receive bookings without the phone", "Fill idle off-peak slots"],
    pains: ["Empty weekday afternoons", "No-shows that cost him the slot", "Manual bookings by phone and WhatsApp"],
    journey: ["Dashboard", "Omar's booking: Held", "Confirmed", "Block a slot", "Promote idle slot"],
    primary: { label: "Open owner dashboard", href: "/owner" },
    secondary: { label: "Venue onboarding", href: "/owner/onboarding" },
  },
];

export default function PersonaSwitcher() {
  const router = useRouter();
  const { dispatch } = useKora();

  // Player personas share one app; set who is "logged in" before navigating.
  function open(card: PersonaCard, href: string) {
    if (card.key === "omar") dispatch({ type: "setPersona", playerId: PERSONAS.omar.playerId });
    if (card.key === "salma") dispatch({ type: "setPersona", playerId: PERSONAS.salma.playerId });
    router.push(href);
  }

  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-dark text-white">
        <div aria-hidden className="absolute inset-0 opacity-25">
          <CourtArt sport="football5" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6">
          <KoraLogo light />
          <p className="mt-10 flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-volt">
            <Zap className="size-3.5" aria-hidden /> Clickable prototype · Cairo
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Kora Prototype
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50">
            Kora forms games from individual players and books them onto real courts. Players stop chasing a full squad;
            court owners fill the hours that used to sit empty.
          </p>
          <ol className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { Icon: Users, text: "Players say when they're free and at what level" },
              { Icon: Target, text: "Kora matches them into a game at a nearby court" },
              { Icon: CalendarCheck, text: "The slot is held, then booked once the game fills" },
            ].map(({ Icon, text }, i) => (
              <li key={text} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 text-sm text-white">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-volt text-sm font-black text-slate-900">{i + 1}</span>
                <span className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-volt" aria-hidden />
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Persona cards */}
      <section aria-labelledby="personas" className="relative mx-auto -mt-20 max-w-6xl px-4 pb-12 sm:px-6">
        <h2 id="personas" className="sr-only">Choose a persona</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {CARDS.map((card) => (
            <article key={card.key} className="flex flex-col overflow-hidden rounded-3xl border bg-white shadow-lg shadow-slate-900/5">
              <div className={cn("h-2", card.band)} />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-4">
                  <span aria-hidden className={cn("flex size-16 items-center justify-center rounded-2xl text-xl font-extrabold", card.avatar)}>
                    {card.initials}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">{card.tag}</p>
                    <h3 className="text-2xl font-extrabold">{card.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="size-3.5" aria-hidden /> {card.meta}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-700">{card.summary}</p>

                <div className="mt-5 grid gap-4">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-900">
                      <Target className="size-4 text-brand" aria-hidden /> Goals
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {card.goals.map((g) => (
                        <li key={g} className="flex gap-2">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-900">
                      <Frown className="size-4 text-rose-700" aria-hidden /> Pain points
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {card.pains.map((p) => (
                        <li key={p} className="flex gap-2">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-900">Clickable journey</p>
                  <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-700">
                    {card.journey.map((step, i) => (
                      <li key={step} className="flex items-center gap-1">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{step}</span>
                        {i < card.journey.length - 1 && <ArrowRight className="size-3 text-slate-400" aria-hidden />}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-6 flex flex-col gap-2 pt-1 sm:mt-auto">
                  <Button size="lg" variant={card.key === "salma" ? "volt" : card.key === "karim" ? "dark" : "default"} onClick={() => open(card, card.primary.href)}>
                    {card.primary.label} <ArrowRight aria-hidden />
                  </Button>
                  <Button variant="ghost" onClick={() => open(card, card.secondary.href)}>
                    {card.secondary.label}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white p-5 text-sm text-slate-600 sm:flex-row sm:items-center">
          <p>
            Mock data only — 6 venues, 19 courts, 20 players. The demo clock is frozen at{" "}
            <strong className="text-slate-900">Sunday 8 Nov 2026, 5:30 PM (Cairo)</strong>. Progress is saved in this browser.
          </p>
          <ResetButton />
        </footer>
        <p className="mt-4 text-center text-xs text-slate-500">
          Tip: actions are shared across apps — book as Omar, then open{" "}
          <Link href="/owner/calendar" className="font-semibold text-brand-dark underline">Karim&apos;s calendar</Link>.
        </p>
      </section>
    </main>
  );
}

function ResetButton() {
  const { dispatch } = useKora();
  return (
    <Button variant="outline" onClick={() => dispatch({ type: "reset" })}>
      <RotateCcw aria-hidden /> Reset demo data
    </Button>
  );
}
