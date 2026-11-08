"use client";

import { CheckCircle2, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { EmptyState } from "@/components/kora/list-state";
import { PlayerAvatar } from "@/components/kora/player-avatar";
import { ScreenHeader, StickyFooter } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SPORTS, demoNow } from "@/lib/constants";
import { dayLabel, firstName } from "@/lib/format";
import { useKora } from "@/lib/store";
import type { PlayerRating } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

const COURT_TAGS = ["Clean", "Good lighting", "Started on time", "Great surface", "Friendly staff", "Good value"];

type Draft = Omit<PlayerRating, "gameId" | "raterId" | "targetId">;

export default function RateScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch, me, gamesById, playersById, venuesById, courtsById, hydrated } = useKora();
  const game = gamesById.get(id);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [courtStars, setCourtStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  if (!game) {
    return (
      <div>
        <ScreenHeader title="Rate game" backHref="/play/my-games" />
        <div className="p-4">{hydrated ? <EmptyState icon={<Star />} title="Game not found" description="Nothing to rate here." /> : <Skeleton className="h-60" />}</div>
      </div>
    );
  }

  const venue = venuesById.get(game.venueId)!;
  const court = courtsById.get(game.courtId)!;
  const others = game.playerIds.filter((p) => p !== me.id).map((p) => playersById.get(p)!).filter(Boolean);
  const alreadyRated = !!state.flags[`rated:${game.id}:${me.id}`];
  // Defaults: showed up, 5-star sportsmanship, level accurate (most games go fine).
  const get = (pid: string): Draft => drafts[pid] ?? { showedUp: true, sportsmanship: 5, levelAccurate: "accurate" };
  const set = (pid: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [pid]: { ...get(pid), ...patch } }));

  function submit() {
    const ratings: PlayerRating[] = others.map((p) => ({ gameId: game!.id, raterId: me.id, targetId: p.id, ...get(p.id) }));
    dispatch({
      type: "submitRatings",
      gameId: game!.id,
      raterId: me.id,
      ratings,
      review: { id: uid("r"), venueId: venue.id, courtId: court.id, authorName: `${firstName(me.name)} ${me.name.split(" ")[1]?.[0] ?? ""}.`, rating: courtStars, text: comment.trim(), tags, at: demoNow() },
    });
    toast.success("Thanks for rating!", { description: "Ratings keep levels fair and no-shows rare." });
    router.push("/play/my-games");
  }

  if (alreadyRated) {
    return (
      <div>
        <ScreenHeader title="Rate game" backHref="/play/my-games" />
        <div className="p-4">
          <EmptyState icon={<CheckCircle2 />} title="Already rated" description="Thanks — your ratings for this game are in." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader title="Rate your game" backHref={`/play/games/${game.id}`} />
      <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">How was it?</h1>
          <p className="text-sm text-slate-600">
            {SPORTS[game.sport].label} · {dayLabel(game.date)} · {venue.name}. Ratings are private and only used to keep games fair.
          </p>
        </div>

        <section aria-labelledby="rate-players" className="space-y-3">
          <h2 id="rate-players" className="text-lg font-extrabold">Players</h2>
          {others.map((p) => {
            const d = get(p.id);
            return (
              <fieldset key={p.id} className="space-y-3 rounded-2xl border p-3">
                <legend className="sr-only">{p.name}</legend>
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={p} size="sm" />
                  <p className="flex-1 font-bold">{p.name}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" id={`su-${p.id}`}>Showed up?</span>
                  <div role="group" aria-labelledby={`su-${p.id}`} className="flex gap-1.5">
                    <ChoiceChip selected={d.showedUp} onClick={() => set(p.id, { showedUp: true })} className="px-3">Yes</ChoiceChip>
                    <ChoiceChip selected={!d.showedUp} onClick={() => set(p.id, { showedUp: false })} className={cn("px-3", !d.showedUp && "border-rose-700 bg-rose-700")}>No-show</ChoiceChip>
                  </div>
                </div>
                {d.showedUp && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" id={`sp-${p.id}`}>Sportsmanship</span>
                      <Stars labelledBy={`sp-${p.id}`} value={d.sportsmanship} onChange={(v) => set(p.id, { sportsmanship: v })} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold" id={`la-${p.id}`}>Was their level accurate?</span>
                      <div role="group" aria-labelledby={`la-${p.id}`} className="mt-2 grid grid-cols-3 gap-1.5">
                        {(["lower", "accurate", "higher"] as const).map((v) => (
                          <ChoiceChip key={v} selected={d.levelAccurate === v} onClick={() => set(p.id, { levelAccurate: v })} className="rounded-xl px-2 text-xs">
                            {v === "lower" ? "Played lower" : v === "accurate" ? "Accurate" : "Played higher"}
                          </ChoiceChip>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </fieldset>
            );
          })}
        </section>

        <section aria-labelledby="rate-court" className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <h2 id="rate-court" className="text-lg font-extrabold">{court.name} at {venue.name}</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" id="court-stars">Overall</span>
            <Stars labelledBy="court-stars" value={courtStars} onChange={setCourtStars} size="lg" />
          </div>
          <div role="group" aria-label="What stood out" className="flex flex-wrap gap-2">
            {COURT_TAGS.map((t) => (
              <ChoiceChip key={t} selected={tags.includes(t)} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>
                {t}
              </ChoiceChip>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea id="comment" placeholder="Anything the venue should know?" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </section>
      </div>
      <StickyFooter>
        {courtStars === 0 && <p className="mb-2 text-center text-sm text-slate-600">Give the court a star rating to submit.</p>}
        <Button size="lg" className="w-full" disabled={courtStars === 0} onClick={submit}>Submit ratings</Button>
      </StickyFooter>
    </div>
  );
}

/** 1–5 star input built from toggle buttons (each a 44px target with its own label). */
function Stars({ value, onChange, labelledBy, size = "md" }: { value: number; onChange: (v: number) => void; labelledBy: string; size?: "md" | "lg" }) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={value === n} onClick={() => onChange(n)} className="inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <Star aria-hidden className={cn(size === "lg" ? "size-7" : "size-5", n <= value ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
        </button>
      ))}
    </div>
  );
}
