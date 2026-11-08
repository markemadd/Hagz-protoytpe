import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { KoraProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Kora Prototype",
  description: "Clickable prototype of Kora: a two-sided marketplace that forms sports games from individual players and books them onto courts in Cairo.",
};

export const viewport: Viewport = {
  themeColor: "#0F7B4F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900">
        {/* One shared store, so player and owner apps see the same marketplace. */}
        <KoraProvider>{children}</KoraProvider>
      </body>
    </html>
  );
}
