"use client";

import { createContext, useContext } from "react";

/**
 * Where Radix portals (dialogs, sheets) should mount.
 * The player app sets this to an element inside the phone frame so overlays
 * stay inside the 390px device instead of covering the whole desktop page.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined;
}
