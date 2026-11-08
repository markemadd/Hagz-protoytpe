import { PhoneShell } from "@/components/player/phone-shell";

/** Player app (Omar & Salma): mobile-first, rendered inside a phone frame on desktop. */
export default function PlayLayout({ children }: LayoutProps<"/play">) {
  return <PhoneShell>{children}</PhoneShell>;
}
