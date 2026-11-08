# Kora — clickable prototype

Kora is a two-sided marketplace for Cairo. It forms sports games from individual players and books them onto courts at partner venues. This repo is a high-fidelity, clickable UI/UX prototype. It has no backend: all data is mock data held in React context.

```bash
npm install
npm run dev      # http://localhost:3000
```

Stack: Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui components written by hand on Radix (the shadcn registry was unreachable from the build box), lucide-react, sonner.

## Personas and scripted flows

| Persona | Starts at | Flow |
|---|---|---|
| Salma, the solo player | `/play/onboarding` | Onboarding → Find me a game (padel, Thu 6–10 PM, Maadi) → top match (score 100) → Join → pay → "Waiting for 2 more" → **Fast-forward: game fills** → Confirmed + notification + chat message → Fast-forward: game played → rate |
| Omar, the organiser | `/play/create` | 5-a-side, Wed 8 PM → Pitch 1 at Nasr Arena (the closer New Cairo pitches are taken) → bring 4 friends → publish → "Waiting for 3 more" → invite → **Play it out** → Confirmed |
| Karim, the court owner | `/owner` | Omar's booking shows as **Held**, then **Confirmed** on the calendar → click a slot to block / re-price / promote → Fill idle slots |

The landing page (`/`) switches persona. On desktop, a demo guide next to the phone has a self-checking checklist, simulators, and a **Force list state** control (Auto / Loading / Empty / Error) so reviewers can inspect every list's states. On phones, the same controls are under Profile. The demo clock is frozen at **Sun 8 Nov 2026, 5:30 PM Cairo**. Progress is saved to `localStorage`; use "Reset demo" to start over.

## Code map

```
app/page.tsx              Persona switcher
app/play/**               Player app (Home, Onboarding, Find, Game, Create, Published, Explore,
                          Court detail, Checkout, My Games, Chat, Notifications, Profile, Rate)
app/owner/**              Owner app (Dashboard, Calendar, Bookings, Courts, Fill idle slots,
                          Payouts & reviews, Settings, Venue onboarding)
lib/types.ts              Domain model (Player, Venue, Court, Game, Booking, …)
lib/mock-data.ts          6 venues / 19 courts / 20 players / 10 open games + seeded bookings
lib/store.tsx             Context + reducer; every action updates both sides of the market
lib/matching.ts           Match score + "games for you" + interested players
lib/availability.ts       O(1) court-hour index shared by both apps
lib/pricing.ts            Peak/off-peak, owner overrides, cost split
lib/owner.ts              KPIs, heatmap, idle-slot suggestions, payouts
components/ui/*           shadcn/ui primitives
components/kora/*         Shared Kora components (sport icons, court art, map, chips, list states)
```

## Key design decisions (and the literature behind them)

- **Match score** = 0.40 · time fit + 0.30 · distance fit + 0.30 · level fit (`lib/matching.ts`). Matching people to games is a *reciprocal* recommendation problem: both the player and the game/organiser have preferences (Pizzato et al., 2010, *RECON*, ACM RecSys; Palomares et al., 2021, "Reciprocal recommender systems", *Information Fusion* 69). Ranking is O(n log n); each score is O(1).
- **Skill levels** are three self-rated buckets, corrected by post-game "level accurate?" ratings. A production version should use a Bayesian skill model such as TrueSkill 2 (Minka, Cleven & Zaykov, 2018, Microsoft Research TR).
- **"Game confirms at 8/10, full refund otherwise"** is an assurance contract: nobody pays unless enough people commit, which removes the organiser's upfront-fee risk (Tabarrok, 1998, *Public Choice* 96).
- **Reliability score and ratings.** Reputation systems reduce no-shows and information asymmetry in platform markets (Tadelis, 2016, *Annual Review of Economics* 8).
- **Off-peak discounts / "Promote this slot".** Court-hours are perishable inventory, so this is revenue management: discount more where expected demand is lower (Talluri & van Ryzin, 2004, *The Theory and Practice of Revenue Management*).
- **Two-sided design.** Instant holds for Kora games plus deals pushed to players subsidise the side that is harder to attract early (Rochet & Tirole, 2003, *JEEA*; Parker, Van Alstyne & Choudary, 2016, *Platform Revolution*).
- **Accessibility** targets WCAG 2.2 AA. Brand green on white is 5.3:1. Lime is only ever a background with slate-900 text (13.9:1). Status is always shown with icon + words, not colour alone. Interactive targets are at least 44px. All inputs have labels, the heatmap has a table view, and reduced motion is respected.
