export const themes = {
  natural: { name: "Natural", description: "Aksen hijau." },
  minimal: { name: "Minimal", description: "Aksen hitam." },
  boutique: { name: "Boutique", description: "Aksen terakota." },
} as const;

export type ThemeId = keyof typeof themes;
export const defaultTheme: ThemeId = "natural";

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.hasOwn(themes, value);
}

// Only registered themes can be selected; API values never become import paths.
export function resolveTheme(storeTheme?: unknown, fallback?: unknown): ThemeId {
  if (isThemeId(storeTheme)) return storeTheme;
  if (isThemeId(fallback)) return fallback;
  return defaultTheme;
}
