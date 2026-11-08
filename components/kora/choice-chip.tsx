"use client";

import { cn } from "@/lib/utils";

/** Toggle chip with aria-pressed and a 44px target. Used for filters and multi-selects. */
export function ChoiceChip({
  selected,
  onClick,
  children,
  className,
  disabled,
  ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4",
        selected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        className,
      )}
    >
      {children}
    </button>
  );
}
