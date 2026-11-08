import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// All sizes keep a 44px minimum target (WCAG 2.5.5 / Apple HIG) except `xs`, used only for dense desktop rows.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-brand-dark",
        volt: "bg-volt text-slate-900 shadow-sm hover:bg-[#b5e61f]",
        destructive: "bg-destructive text-white shadow-sm hover:bg-red-700",
        outline: "border border-input bg-background shadow-xs hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-slate-200",
        ghost: "hover:bg-muted",
        link: "text-brand-dark underline-offset-4 hover:underline",
        dark: "bg-slate-900 text-white hover:bg-slate-800",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-11 px-3 text-[13px]",
        xs: "h-9 rounded-lg px-2.5 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-14 rounded-2xl px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
