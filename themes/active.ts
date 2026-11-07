import { cookies } from "next/headers";
import { cache } from "react";
import { getPreviewState } from "@/lib/preview";
import { getStore, storeThemeKey } from "@/lib/store-api";
import type { ThemeComponents, ThemeDefinition } from "@/sdk";
import { contractComponents } from "./contract";
import ambaz from "./ambaz";
import contoh from "./contoh";
import editorial from "./editorial";
import { resolveTheme, THEME_PREVIEW_COOKIE, type ThemeId } from "./registry";

/**
 * Tema yang punya komponen sendiri. Tema yang hanya mengubah token CSS (natural, minimal,
 * boutique) cukup terdaftar di registry.ts dan memakai tampilan bawaan.
 */
const definitions: Partial<Record<ThemeId, ThemeDefinition>> = { editorial, contoh, ambaz };

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
  const contract = definition?.contract ?? null;
  return {
    id,
    className: definition?.className ?? "",
    // Tema berkontrak: template dari preset dirender platform; komponen yang ditulis tema sendiri tetap menang.
    components: contract ? { ...contractComponents(contract), ...definition?.components } : definition?.components ?? NO_COMPONENTS,
    contract,
  };
});
