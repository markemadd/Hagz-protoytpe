"use client";

import { CalendarCheck2, Compass, House, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKora } from "@/lib/store";
import { chatThreads } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/play", label: "Home", Icon: House },
  { href: "/play/explore", label: "Explore", Icon: Compass },
  { href: "/play/my-games", label: "My Games", Icon: CalendarCheck2 },
  { href: "/play/chat", label: "Chat", Icon: MessageCircle },
  { href: "/play/profile", label: "Profile", Icon: UserRound },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { state, me } = useKora();
  // Total unread chat messages for the Chat badge.
  const unread = chatThreads(state.games, state.messages, state.chatReads, me.id).reduce((n, t) => n + t.unread, 0);

  return (
    <nav aria-label="Main" className="shrink-0 border-t bg-white/95 pb-[max(env(safe-area-inset-bottom),6px)] pt-1 backdrop-blur">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/play" ? pathname === "/play" || pathname === "/play/notifications" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative mx-auto flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                  active ? "text-brand-dark" : "text-slate-600",
                )}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-volt")}>
                  <Icon className="size-5" aria-hidden strokeWidth={active ? 2.5 : 2} />
                </span>
                {label}
                {label === "Chat" && unread > 0 && (
                  <span className="absolute right-3 top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unread}
                    <span className="sr-only"> unread messages</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
