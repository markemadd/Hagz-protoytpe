"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Sticky top bar for pushed screens: back link + title + optional actions. */
export function ScreenHeader({
  title,
  backHref,
  onBack,
  right,
  className,
  transparent = false,
}: {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}) {
  const backClass =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
    (transparent ? "bg-white/90 text-slate-900 shadow-sm" : "hover:bg-slate-100");
  return (
    <header className={cn("sticky top-0 z-20 flex h-14 items-center gap-1 px-2", transparent ? "absolute inset-x-0 bg-transparent" : "border-b bg-white/95 backdrop-blur", className)}>
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass} aria-label="Back">
          <ChevronLeft className="size-6" aria-hidden />
        </button>
      ) : backHref ? (
        <Link href={backHref} className={backClass} aria-label="Back">
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      ) : (
        <span className="w-2" />
      )}
      {title && <h1 className={cn("flex-1 truncate text-base font-bold", transparent && "sr-only")}>{title}</h1>}
      {!title && <span className="flex-1" />}
      {right}
    </header>
  );
}

/** Sticky bottom action area (e.g. price + Join). */
export function StickyFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("sticky bottom-0 z-20 border-t bg-white/95 px-4 pb-4 pt-3 backdrop-blur", className)}>{children}</div>;
}

/** Section title row used on Home and detail screens. */
export function SectionTitle({ title, action, className, id }: { title: string; action?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 id={id} className="text-lg font-extrabold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/** Small "Prototype" box for simulate buttons, visually distinct from real UI. */
export function PrototypeBox({ children, className, title = "Prototype controls" }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={cn("rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 p-3", className)}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-violet-800">{title}</p>
      {children}
    </div>
  );
}
