"use client";

import { Bell, CheckCheck } from "lucide-react";
import { NOTIFICATION_STYLE } from "@/components/kora/notification-style";
import { useRouter } from "next/navigation";
import { AsyncList } from "@/components/kora/list-state";
import { ScreenHeader } from "@/components/player/screen-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { relativeTime } from "@/lib/format";
import { useKora } from "@/lib/store";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";


export default function NotificationsScreen() {
  const router = useRouter();
  const { state, dispatch, me } = useKora();
  // Newest first.
  const items = state.notifications.filter((n) => n.userId === me.id).sort((a, b) => b.at - a.at);
  const unread = items.filter((n) => !n.read).length;

  function open(n: AppNotification) {
    dispatch({ type: "markNotificationRead", id: n.id });
    if (n.href) router.push(n.href);
  }

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Notifications"
        backHref="/play"
        right={
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => dispatch({ type: "markNotificationsRead", userId: me.id })}>
            <CheckCheck aria-hidden /> Mark all read
          </Button>
        }
      />
      <AsyncList
        listKey={`notifs-${me.id}`}
        items={items}
        getKey={(n) => n.id}
        className="divide-y"
        skeleton={<Skeleton className="m-4 h-16" />}
        errorTitle="Couldn't load notifications"
        empty={{ icon: <Bell />, title: "You're all caught up", description: "We'll notify you when a game matching your availability forms." }}
        renderItem={(n) => {
          const { Icon, tint } = NOTIFICATION_STYLE[n.type];
          return (
            <button type="button" onClick={() => open(n)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left outline-none hover:bg-slate-50 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40", !n.read && "bg-brand-soft/40")}>
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tint)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", n.read ? "font-semibold text-slate-800" : "font-bold text-slate-900")}>{n.title}</span>
                <span className="block text-sm text-slate-600">{n.body}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{relativeTime(n.at)}</span>
              </span>
              {!n.read && (
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary">
                  <span className="sr-only">Unread</span>
                </span>
              )}
            </button>
          );
        }}
      />
    </div>
  );
}
