import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Text/background pairs are all >= 4.5:1 contrast.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        soft: "bg-brand-soft text-brand-dark",
        volt: "bg-volt text-slate-900",
        secondary: "bg-slate-100 text-slate-700",
        outline: "border border-slate-300 text-slate-700",
        amber: "bg-amber-100 text-amber-900",
        sky: "bg-sky-100 text-sky-900",
        rose: "bg-rose-100 text-rose-900",
        dark: "bg-slate-900 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
