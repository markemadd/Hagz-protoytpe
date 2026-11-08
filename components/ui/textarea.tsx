import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base shadow-xs outline-none placeholder:text-slate-500 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
