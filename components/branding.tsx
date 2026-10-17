"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whitelabel: whether the store hides the "Built with Sellosy" badge (store.hide_branding).
 * SiteFooter provides it around every footer, so <BuiltWith /> decides on its own and themes keep
 * rendering it unconditionally. Outside a provider the badge shows.
 */
const BrandingContext = createContext(false);

export function BrandingProvider({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return <BrandingContext.Provider value={hidden}>{children}</BrandingContext.Provider>;
}

/** Renders the badge unless the store hides it. */
export function BrandingGate({ children }: { children: ReactNode }) {
  return useContext(BrandingContext) ? null : children;
}
