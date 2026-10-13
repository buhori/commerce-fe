import { cookies } from "next/headers";
import { cache } from "react";
import { getPreviewState } from "@/lib/preview";
import { getStore, storeThemeKey } from "@/lib/store-api";
import type { ThemeComponents, ThemeDefinition } from "@/sdk";
import editorial from "./editorial";
import { resolveTheme, THEME_PREVIEW_COOKIE, type ThemeId } from "./registry";

/**
 * Tema yang punya komponen sendiri. Tema yang hanya mengubah token CSS (natural, minimal,
 * boutique) cukup terdaftar di registry.ts dan memakai tampilan bawaan.
 */
const definitions: Partial<Record<ThemeId, ThemeDefinition>> = { editorial };

const NO_COMPONENTS: ThemeComponents = {};

/** Pratinjau lewat ?theme= hanya untuk developer; produksi selalu memakai tema dari panel. */
export const themePreviewEnabled = () => process.env.THEME_PREVIEW === "true";

export const getActiveTheme = cache(async () => {
  const [store, jar, preview] = await Promise.all([getStore().catch(() => null), cookies(), getPreviewState()]);
  const configured = resolveTheme(storeThemeKey(store), process.env.STORE_THEME);
  const devPreview = themePreviewEnabled() ? jar.get(THEME_PREVIEW_COOKIE)?.value : undefined;
  // Pratinjau pemilik toko (token dari panel) hanya berlaku di browser yang membukanya.
  const id = resolveTheme(devPreview ?? preview?.theme?.key, configured);
  const definition = definitions[id];
  return {
    id,
    className: definition?.className ?? "",
    components: definition?.components ?? NO_COMPONENTS,
  };
});
