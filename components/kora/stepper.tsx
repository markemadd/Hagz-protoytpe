import { cn } from "@/lib/utils";

/** Segmented wizard progress: "Step 2 of 4" + bars. */
export function Stepper({ step, total, label, className }: { step: number; total: number; label?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Step {step} of {total}
        {label && <span className="text-slate-900"> · {label}</span>}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-slate-200")} />
        ))}
      </div>
    </div>
  );
}
