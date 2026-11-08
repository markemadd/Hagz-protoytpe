"use client";

import { Table2, Grid3x3 } from "lucide-react";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEMO_NOW_HOUR, DEMO_TODAY } from "@/lib/constants";
import { dayLabel, formatHour, formatHourCompact, weekdayShort } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Sequential single-hue ramp (light → dark = idle → full), per the dataviz method:
 * magnitude gets one hue; lightness is monotonic so it also reads in greyscale.
 * Step 0 (idle) is a light neutral with a hairline so empty cells stay visible.
 */
const RAMP = ["#eef2f6", "#b9e2c9", "#3fa672", "#0a5c3b"];

type Row = { date: string; cells: Array<{ hour: number; booked: number }> };

export function UtilizationHeatmap({ rows, hours, courtCount }: { rows: Row[]; hours: number[]; courtCount: number }) {
  const [hover, setHover] = useState<{ date: string; hour: number; booked: number } | null>(null);
  const [asTable, setAsTable] = useState(false);
  const step = (booked: number) => Math.round((booked / courtCount) * (RAMP.length - 1));

  // Summary sentence for screen readers and the default readout. O(D·H).
  let best = { date: "", hour: 0, booked: -1 };
  let idleAfternoons = 0;
  for (const r of rows) for (const c of r.cells) {
    if (c.booked > best.booked) best = { date: r.date, ...c };
    if (c.booked === 0 && c.hour >= 12 && c.hour < 17) idleAfternoons++;
  }
  const summary = `Busiest: ${weekdayShort(best.date)} ${formatHour(best.hour)} (${best.booked}/${courtCount} courts). ${idleAfternoons} fully idle court-hours between noon and 5 PM.`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-h-5 text-sm text-slate-700" aria-live="polite">
          {hover ? (
            <>
              <strong>{dayLabel(hover.date)}, {formatHour(hover.hour)}</strong> · {hover.booked} of {courtCount} courts booked ({Math.round((hover.booked / courtCount) * 100)}%)
            </>
          ) : (
            summary
          )}
        </p>
        <Button variant="outline" size="xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <Grid3x3 aria-hidden /> : <Table2 aria-hidden />} {asTable ? "Show heatmap" : "View as table"}
        </Button>
      </div>

      {asTable ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-center text-xs">
            <caption className="sr-only">Courts booked per hour, this week</caption>
            <thead>
              <tr>
                <th scope="col" className="p-1 text-left">Day</th>
                {hours.map((h) => <th key={h} scope="col" className="p-1 font-semibold text-slate-600">{formatHourCompact(h)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-t">
                  <th scope="row" className="p-1 text-left font-semibold">{weekdayShort(r.date)}</th>
                  {r.cells.map((c) => <td key={c.hour} className="p-1 tabular-nums">{c.booked}/{courtCount}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div role="img" aria-label={`Utilization heatmap. ${summary}`} className="min-w-[640px]" onMouseLeave={() => setHover(null)}>
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: `44px repeat(${hours.length}, minmax(0, 1fr))` }}>
              <span />
              {hours.map((h, i) => (
                <span key={h} aria-hidden className="pb-1 text-center text-[11px] font-semibold text-slate-600">{i % 2 === 0 ? formatHourCompact(h) : ""}</span>
              ))}
              {rows.map((r) => (
                <Fragment key={r.date}>
                  <span aria-hidden className={cn("flex items-center text-xs font-semibold", r.date === DEMO_TODAY ? "text-brand-dark" : "text-slate-700")}>
                    {weekdayShort(r.date)}
                  </span>
                  {r.cells.map((c) => {
                    const isNow = r.date === DEMO_TODAY && c.hour === Math.floor(DEMO_NOW_HOUR);
                    return (
                      <span
                        key={c.hour}
                        aria-hidden
                        onMouseEnter={() => setHover({ date: r.date, ...c })}
                        className={cn("h-8 rounded-[4px] transition-transform hover:scale-110 hover:shadow-md", step(c.booked) === 0 && "ring-1 ring-inset ring-slate-200", isNow && "outline-2 outline-offset-1 outline-slate-900")}
                        style={{ backgroundColor: RAMP[step(c.booked)] }}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
            {Array.from({ length: courtCount + 1 }, (_, n) => (
              <span key={n} className="flex items-center gap-1.5">
                <span className={cn("size-3.5 rounded-[3px]", step(n) === 0 && "ring-1 ring-inset ring-slate-300")} style={{ backgroundColor: RAMP[step(n)] }} />
                {n === 0 ? "Idle" : `${n}/${courtCount} courts`}
              </span>
            ))}
            <span className="flex items-center gap-1.5"><span className="size-3.5 rounded-[3px] outline-2 outline-slate-900" /> Now</span>
          </div>
        </div>
      )}
    </div>
  );
}

