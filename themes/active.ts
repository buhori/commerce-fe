import { cookies } from "next/headers";
import { cache } from "react";
import { getStore, getThemePreview, storeThemeKey } from "@/lib/store-api";
import type { ThemeComponents, ThemeDefinition } from "@/sdk";
import editorial from "./editorial";
import { isThemeId, resolveTheme, THEME_PREVIEW_COOKIE, THEME_PREVIEW_TOKEN_COOKIE, type ThemeId } from "./registry";

/**
 * Tema yang punya komponen sendiri. Tema yang hanya mengubah token CSS (natural, minimal,
 * boutique) cukup terdaftar di registry.ts dan memakai tampilan bawaan.
 */
const definitions: Partial<Record<ThemeId, ThemeDefinition>> = { editorial };

const NO_COMPONENTS: ThemeComponents = {};

/** Pratinjau lewat ?theme= hanya untuk developer; produksi selalu memakai tema dari panel. */
export const themePreviewEnabled = () => process.env.THEME_PREVIEW === "true";

export const getActiveTheme = cache(async () => {
  const [store, jar] = await Promise.all([getStore().catch(() => null), cookies()]);
  const configured = resolveTheme(storeThemeKey(store), process.env.STORE_THEME);
  const devPreview = themePreviewEnabled() ? jar.get(THEME_PREVIEW_COOKIE)?.value : undefined;
  // Pratinjau pemilik toko: token dari panel, berlaku hanya di browser yang membukanya.
  const ownerPreview = devPreview ? null : await getThemePreview(jar.get(THEME_PREVIEW_TOKEN_COOKIE)?.value);
  const id = resolveTheme(devPreview ?? ownerPreview?.key, configured);
  const definition = definitions[id];
  return {
    id,
    className: definition?.className ?? "",
    components: definition?.components ?? NO_COMPONENTS,
    /** Nama tema yang sedang dipratinjau pemilik toko, untuk bar "Mode pratinjau". */
    previewing: ownerPreview && isThemeId(ownerPreview.key) ? ownerPreview.name : null,
  };
});
