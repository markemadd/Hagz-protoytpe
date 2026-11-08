"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

/* =========================================================================
   Every list in Kora goes through <AsyncList>, which owns the four UX states:
   loading (skeleton) → ready | empty | error. The demo panel can force any
   state globally so reviewers can inspect each design.
   ========================================================================= */

// Lists that already "loaded" this session skip the skeleton on revisit.
const loadedOnce = new Set<string>();

type Phase = "loading" | "ready" | "error";

function useListPhase(listKey: string) {
  const [phase, setPhase] = useState<Phase>(() => (loadedOnce.has(listKey) ? "ready" : "loading"));
  useEffect(() => {
    if (phase !== "loading") return;
    // Simulated network latency so the skeleton is visible.
    const t = window.setTimeout(() => {
      loadedOnce.add(listKey);
      setPhase("ready");
    }, 550);
    return () => window.clearTimeout(t);
  }, [phase, listKey]);
  return { phase, retry: () => setPhase("loading") };
}

export type EmptyConfig = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AsyncList<T>({
  listKey,
  items,
  renderItem,
  getKey,
  skeleton,
  skeletonCount = 3,
  empty,
  errorTitle = "Couldn't load this list",
  className,
}: {
  listKey: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  skeleton?: React.ReactNode;
  skeletonCount?: number;
  empty: EmptyConfig;
  errorTitle?: string;
  className?: string;
}) {
  const { state } = useKora();
  const { phase, retry } = useListPhase(listKey);
  const forced = state.listState;

  // Forced states from the demo panel win over the simulated fetch.
  const effective = forced === "auto" ? (phase === "ready" && items.length === 0 ? "empty" : phase) : forced;

  if (effective === "loading") {
    return (
      <div className={className} aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading…</span>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i}>{skeleton ?? <Skeleton className="h-24 w-full" />}</div>
        ))}
      </div>
    );
  }
  if (effective === "error") return <ErrorState title={errorTitle} onRetry={retry} />;
  if (effective === "empty") return <EmptyState {...empty} />;

  return (
    <div className={className}>
      {items.map((item, i) => (
        <div key={getKey(item)}>{renderItem(item, i)}</div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: EmptyConfig & { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center", className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-sm [&_svg]:size-6">{icon}</div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-rose-700 shadow-sm">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-700">Check your connection and try again. Nothing you did was lost.</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        <RefreshCw aria-hidden /> Try again
      </Button>
    </div>
  );
}
