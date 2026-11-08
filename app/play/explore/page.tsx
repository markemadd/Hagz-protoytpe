"use client";

import { List, Map as MapIcon, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ChoiceChip } from "@/components/kora/choice-chip";
import { AsyncList, EmptyState } from "@/components/kora/list-state";
import { MiniMap } from "@/components/kora/mini-map";
import { SportIcon } from "@/components/kora/sport-icon";
import { VenueCard } from "@/components/player/venue-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AREAS, AREA_IDS, SPORTS, SPORT_IDS } from "@/lib/constants";
import { formatEGP } from "@/lib/format";
import { distanceFromArea } from "@/lib/matching";
import { venueHasDeal } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import type { AreaId, SportId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filters = {
  sport: SportId | null;
  area: AreaId | null;
  maxPrice: number;
  setting: "any" | "indoor" | "outdoor";
  lighting: boolean;
  parking: boolean;
  deals: boolean;
};

const DEFAULTS: Filters = { sport: null, area: null, maxPrice: 1200, setting: "any", lighting: false, parking: false, deals: false };

export default function ExploreScreen() {
  const { state, me } = useKora();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  // Number of non-default filters, shown on the Filters button.
  const activeCount =
    Number(!!filters.sport) + Number(!!filters.area) + Number(filters.maxPrice < 1200) + Number(filters.setting !== "any") + Number(filters.lighting) + Number(filters.parking) + Number(filters.deals);

  // Venue passes if it has at least one court matching the court-level filters. O(V · C).
  const venues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.venues
      .filter((v) => {
        const courts = state.courts.filter((c) => c.venueId === v.id);
        const courtOk = courts.some(
          (c) =>
            (!filters.sport || c.sport === filters.sport) &&
            c.priceOffPeak <= filters.maxPrice &&
            (filters.setting === "any" || (filters.setting === "indoor") === c.indoor),
        );
        return (
          courtOk &&
          (!filters.area || v.area === filters.area) &&
          (!filters.lighting || v.amenities.includes("lighting")) &&
          (!filters.parking || v.amenities.includes("parking")) &&
          (!filters.deals || venueHasDeal(state.slotOverrides, courts)) &&
          (!q || v.name.toLowerCase().includes(q) || AREAS[v.area].label.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => distanceFromArea(me.area, a) - distanceFromArea(me.area, b));
  }, [state.venues, state.courts, state.slotOverrides, filters, query, me.area]);

  const selected = venues.find((v) => v.id === selectedVenue) ?? null;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 space-y-3 border-b bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Explore courts</h1>
          <div role="group" aria-label="View" className="flex rounded-xl bg-slate-100 p-1">
            {(["list", "map"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} aria-label={`${v} view`} onClick={() => setView(v)} className={cn("flex size-10 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", view === v && "bg-white shadow-sm")}>
                {v === "list" ? <List className="size-5" aria-hidden /> : <MapIcon className="size-5" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Label htmlFor="court-search" className="sr-only">Search courts or areas</Label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input id="court-search" placeholder="Search courts or areas" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <FilterSheet filters={filters} setFilters={setFilters} activeCount={activeCount} />
        </div>
        <div role="group" aria-label="Sport" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <ChoiceChip selected={!filters.sport} onClick={() => setFilters((f) => ({ ...f, sport: null }))}>All</ChoiceChip>
          {SPORT_IDS.map((s) => (
            <ChoiceChip key={s} selected={filters.sport === s} onClick={() => setFilters((f) => ({ ...f, sport: s }))}>
              <SportIcon sport={s} /> {SPORTS[s].short}
            </ChoiceChip>
          ))}
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {view === "map" && (
          <>
            <MiniMap
              className="h-72"
              home={me.area}
              pins={venues.map((v) => ({ id: v.id, venue: v, label: v.name, tone: venueHasDeal(state.slotOverrides, state.courts.filter((c) => c.venueId === v.id)) ? "deal" : "default" }))}
              selectedId={selectedVenue ?? undefined}
              onSelect={setSelectedVenue}
            />
            {selected ? (
              <VenueCard venue={selected} layout="list" />
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <MapPinned className="size-4" aria-hidden /> Tap a pin to preview the venue. Lime pins have off-peak deals.
              </p>
            )}
          </>
        )}
        {view === "list" && (
          <>
            <p className="text-sm text-slate-600" aria-live="polite">{venues.length} venues · nearest first</p>
            <AsyncList
              listKey="explore-venues"
              items={venues}
              getKey={(v) => v.id}
              className="space-y-3"
              skeleton={<Skeleton className="h-60 w-full" />}
              skeletonCount={2}
              renderItem={(v) => <VenueCard venue={v} layout="list" />}
              errorTitle="Couldn't load courts"
              empty={{
                icon: <Search />,
                title: "No courts match",
                description: "Try removing a filter or searching another area.",
                action: <Button variant="outline" onClick={() => { setFilters(DEFAULTS); setQuery(""); }}>Clear all filters</Button>,
              }}
            />
          </>
        )}
        {view === "map" && venues.length === 0 && <EmptyState icon={<Search />} title="No courts on the map" description="Clear filters to see all venues." />}
      </div>
    </div>
  );
}

function FilterSheet({ filters, setFilters, activeCount }: { filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; activeCount: number }) {
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`} className="relative px-3">
          <SlidersHorizontal aria-hidden /> Filters
          {activeCount > 0 && <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">{activeCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Results update as you change filters.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5">
          <div>
            <p id="fs-area" className="text-sm font-bold">Area</p>
            <div role="group" aria-labelledby="fs-area" className="mt-2 flex flex-wrap gap-2">
              <ChoiceChip selected={!filters.area} onClick={() => set({ area: null })}>Anywhere</ChoiceChip>
              {AREA_IDS.map((a) => (
                <ChoiceChip key={a} selected={filters.area === a} onClick={() => set({ area: a })}>{AREAS[a].label}</ChoiceChip>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="fs-price">Max off-peak price</Label>
              <span className="text-sm font-bold text-brand-dark">{formatEGP(filters.maxPrice)}/h</span>
            </div>
            <Slider id="fs-price" aria-label="Maximum price per hour" min={300} max={1200} step={50} value={[filters.maxPrice]} onValueChange={([v]) => set({ maxPrice: v })} />
          </div>
          <div>
            <p id="fs-setting" className="text-sm font-bold">Setting</p>
            <div role="group" aria-labelledby="fs-setting" className="mt-2 grid grid-cols-3 gap-2">
              {(["any", "indoor", "outdoor"] as const).map((s) => (
                <ChoiceChip key={s} selected={filters.setting === s} onClick={() => set({ setting: s })} className="rounded-xl capitalize">{s}</ChoiceChip>
              ))}
            </div>
          </div>
          {([
            { key: "lighting", label: "Floodlights for night games" },
            { key: "parking", label: "Parking on site" },
            { key: "deals", label: "Off-peak deals only" },
          ] as const).map(({ key, label }) => (
            <div key={key} className="flex min-h-11 items-center justify-between gap-3">
              <Label htmlFor={`fs-${key}`} className="font-semibold">{label}</Label>
              <Switch id={`fs-${key}`} checked={filters[key]} onCheckedChange={(v) => set({ [key]: v } as Partial<Filters>)} />
            </div>
          ))}
        </div>
        <SheetFooter className="flex-row">
          <Button variant="outline" className="flex-1" onClick={() => setFilters(DEFAULTS)}>Reset</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
