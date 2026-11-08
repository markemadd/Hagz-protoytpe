import { cn } from "@/lib/utils";

/** Kora wordmark: a lime "ball" with a green K + lowercase name. */
export function KoraLogo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="relative inline-flex size-8 items-center justify-center rounded-full bg-volt shadow-sm">
        <span className="text-lg font-black leading-none text-brand-dark">K</span>
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-brand" />
      </span>
      <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-white" : "text-slate-900")}>kora</span>
    </span>
  );
}
