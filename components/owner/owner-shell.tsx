"use client";

import { Bell, CalendarDays, CheckCheck, Grid2x2, Inbox, LayoutDashboard, LogOut, Menu, Settings, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { KoraLogo } from "@/components/kora/kora-logo";
import { NOTIFICATION_STYLE } from "@/components/kora/notification-style";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { PERSONAS } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { unreadCount } from "@/lib/selectors";
import { useKora } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/owner", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/owner/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/owner/bookings", label: "Bookings", Icon: Inbox },
  { href: "/owner/courts", label: "Courts", Icon: Grid2x2 },
  { href: "/owner/payouts", label: "Payouts", Icon: Wallet },
  { href: "/owner/settings", label: "Settings", Icon: Settings },
];

const TITLES: Record<string, string> = {
  "/owner": "Dashboard",
  "/owner/calendar": "Calendar",
  "/owner/bookings": "Bookings",
  "/owner/courts": "Courts",
  "/owner/courts/fill": "Fill idle slots",
  "/owner/payouts": "Payouts & reviews",
  "/owner/settings": "Settings",
};

/** Desktop sidebar + top bar for Karim's dashboard. Onboarding renders full-bleed without it. */
export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  if (pathname.startsWith("/owner/onboarding")) {
    return (
      <>
        {children}
        <Toaster position="bottom-right" />
      </>
    );
  }
  return (
    <div className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-white lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-white/90 px-4 backdrop-blur lg:px-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarContent pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="flex-1 truncate text-lg font-extrabold tracking-tight lg:text-xl">{TITLES[pathname] ?? "Dashboard"}</h1>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/play">
              <Smartphone aria-hidden /> Player app
            </Link>
          </Button>
          <OwnerNotifications />
          <span aria-hidden className="hidden size-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white sm:flex">KS</span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { state } = useKora();
  const venue = state.venues.find((v) => v.id === PERSONAS.karim.venueId)!;
  const requests = state.bookings.filter((b) => b.venueId === venue.id && b.status === "requested").length;
  return (
    <div className="flex h-full flex-col p-4">
      <Link href="/" className="rounded-xl px-2 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" onClick={onNavigate}>
        <KoraLogo />
        <span className="ml-10 block text-[11px] font-bold uppercase tracking-wider text-brand-dark">for venues</span>
      </Link>
      <div className="mt-5 rounded-2xl bg-slate-50 p-3">
        <p className="truncate text-sm font-bold">{venue.name}</p>
        <p className="text-xs text-slate-600">Nasr City · 3 courts · Karim S.</p>
      </div>
      <nav aria-label="Owner" className="mt-5 flex-1">
        <ul className="space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = href === "/owner" ? pathname === "/owner" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    active ? "bg-brand text-white" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {label === "Bookings" && requests > 0 && (
                    <span className={cn("flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold", active ? "bg-volt text-slate-900" : "bg-sky-100 text-sky-900")}>
                      {requests}<span className="sr-only"> requests</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link href="/" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <LogOut className="size-5" aria-hidden /> Switch persona
      </Link>
    </div>
  );
}

function OwnerNotifications() {
  const router = useRouter();
  const { state, dispatch } = useKora();
  const userId = PERSONAS.karim.ownerId;
  const items = state.notifications.filter((n) => n.userId === userId).sort((a, b) => b.at - a.at);
  const unread = unreadCount(state.notifications, userId);
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell aria-hidden />
          {unread > 0 && <span aria-hidden className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Bookings, Kora games and requests at your club.</SheetDescription>
        </SheetHeader>
        <Button variant="ghost" size="sm" className="self-start" disabled={!unread} onClick={() => dispatch({ type: "markNotificationsRead", userId })}>
          <CheckCheck aria-hidden /> Mark all read
        </Button>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No notifications yet.</p>
        ) : (
          <ul className="-mx-2 divide-y">
            {items.map((n) => {
              const { Icon, tint } = NOTIFICATION_STYLE[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => { dispatch({ type: "markNotificationRead", id: n.id }); setOpen(false); if (n.href) router.push(n.href); }}
                    className={cn("flex w-full items-start gap-3 rounded-xl p-2 text-left outline-none hover:bg-slate-50 focus-visible:ring-[3px] focus-visible:ring-ring/40", !n.read && "bg-brand-soft/40")}
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tint)}><Icon className="size-4" aria-hidden /></span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-bold">{n.title}</span>
                      <span className="block text-slate-600">{n.body}</span>
                      <span className="text-xs text-slate-600">{relativeTime(n.at)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
