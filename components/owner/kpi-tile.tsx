import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat tile: label · value · signed delta vs a named period.
 * Delta colour = direction × whether "up" is good, and always carries an arrow + words.
 */
export function KpiTile({
  label,
  value,
  delta,
  deltaLabel,
  upIsGood = true,
  hint,
  icon,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  upIsGood?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const good = delta === undefined || delta === 0 ? null : delta > 0 === upIsGood;
  const Arrow = !delta ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        {icon && <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark [&_svg]:size-5">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
      {deltaLabel && (
        <p className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", good === null ? "bg-slate-100 text-slate-700" : good ? "bg-brand-soft text-brand-dark" : "bg-rose-100 text-rose-900")}>
          <Arrow className="size-3.5" aria-hidden /> {deltaLabel}
        </p>
      )}
      {hint && <p className="mt-2 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}
