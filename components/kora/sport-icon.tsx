import type { SportId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Bold custom sport glyphs drawn on lucide's 24px grid (2px stroke) so they sit
 * naturally next to lucide UI icons. Lucide has no football/padel/tennis set.
 */
export function SportIcon({ sport, className, title }: { sport: SportId; className?: string; title?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("size-5", className),
    "aria-hidden": title ? undefined : true,
    role: title ? "img" : undefined,
  };

  if (sport === "football5" || sport === "football7") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8.2 15.4 10.7 14.1 14.7H9.9L8.6 10.7Z" fill="currentColor" />
        <path d="M12 8.2V2.5M15.4 10.7l5.8-1.9M14.1 14.7l3.4 4.9M9.9 14.7l-3.4 4.9M8.6 10.7 2.8 8.8" />
      </svg>
    );
  }
  if (sport === "basketball") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20M5 4.9c3.2 3.6 3.2 10.6 0 14.2M19 4.9c-3.2 3.6-3.2 10.6 0 14.2" />
      </svg>
    );
  }
  if (sport === "tennis") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <circle cx="12" cy="12" r="10" />
        <path d="M5.2 4.6c3.9 3.3 3.9 11.5 0 14.8M18.8 4.6c-3.9 3.3-3.9 11.5 0 14.8" />
      </svg>
    );
  }
  // Padel: perforated paddle + ball
  return (
    <svg {...common}>
      {title && <title>{title}</title>}
      <path d="M11 1.8c4 0 6.6 2.8 6.6 6.4 0 3.9-2.7 6.3-6.6 6.3S4.4 12.1 4.4 8.2c0-3.6 2.6-6.4 6.6-6.4Z" />
      <path d="M9.8 14.4v6.2a1.2 1.2 0 0 0 2.4 0v-6.2" />
      <circle cx="9" cy="6.6" r=".6" fill="currentColor" />
      <circle cx="13" cy="6.6" r=".6" fill="currentColor" />
      <circle cx="11" cy="9.6" r=".6" fill="currentColor" />
      <circle cx="19.6" cy="18.4" r="2.2" />
    </svg>
  );
}
