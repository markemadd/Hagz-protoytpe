"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** App-wide toast host styled with Kora tokens. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors={false}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-slate-200 !shadow-lg !font-sans",
          title: "!font-semibold !text-slate-900",
          description: "!text-slate-600",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
