"use client";

import { BatteryFull, Signal, Wifi } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PortalContainerContext } from "@/components/ui/portal-context";
import { Toaster } from "@/components/ui/sonner";
import { BottomTabs } from "./bottom-tabs";
import { DemoPanel } from "./demo-panel";

/** Root tab screens show the bottom bar; flows (wizards, details, checkout) hide it for focus. */
const TAB_SCREENS = new Set(["/play", "/play/explore", "/play/my-games", "/play/chat", "/play/profile", "/play/notifications"]);

/**
 * Renders the player app inside a 390px phone on desktop and full-screen on phones.
 * `transform` on the frame makes it the containing block for `position: fixed`
 * children, so sheets, dialogs and toasts stay inside the device.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  // Each navigation starts at the top, like a native screen push.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh justify-center bg-slate-100 sm:items-center sm:gap-10 sm:py-6 lg:bg-[radial-gradient(circle_at_20%_20%,#e7f4ec,transparent_45%),radial-gradient(circle_at_80%_80%,#f3fcd6,transparent_40%)] lg:px-8">
      <DemoPanel className="hidden lg:flex" />
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-white [transform:translateZ(0)] sm:h-[min(844px,calc(100dvh-3rem))] sm:w-[390px] sm:shrink-0 sm:rounded-[46px] sm:border-[10px] sm:border-slate-900 sm:shadow-2xl sm:shadow-slate-900/30">
        {/* Fake iOS status bar, desktop frame only */}
        <div aria-hidden className="relative hidden h-9 shrink-0 items-center justify-between bg-white px-7 text-[13px] font-bold sm:flex">
          <span>5:30</span>
          <span className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
          <span className="flex items-center gap-1">
            <Signal className="size-3.5" /> <Wifi className="size-3.5" /> <BatteryFull className="size-4" />
          </span>
        </div>
        <PortalContainerContext.Provider value={portalEl}>
          <main ref={scrollRef} id="phone-scroll" className="relative flex-1 overflow-y-auto overscroll-contain">
            {children}
          </main>
          {TAB_SCREENS.has(pathname) && <BottomTabs />}
        </PortalContainerContext.Provider>
        {/* Radix portals mount here, inside the transformed frame */}
        <div ref={setPortalEl} />
        <Toaster position="top-center" offset={48} mobileOffset={16} />
      </div>
    </div>
  );
}
