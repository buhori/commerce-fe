export const themes = {
  natural: { name: "Natural", description: "Halaman gading, aksen hijau, sudut tipis." },
  minimal: { name: "Minimal", description: "Putih bersih, aksen hitam, sudut siku, label kapital." },
  boutique: { name: "Boutique", description: "Krem hangat, aksen terakota, judul serif, tombol pil." },
  // Tema dengan komponen sendiri (themes/editorial) dibuat dengan SDK @sellosy/theme.
  editorial: { name: "Editorial", description: "Majalah mode: logo di tengah, judul serif, foto besar." },
} as const;

export type ThemeId = keyof typeof themes;
export const defaultTheme: ThemeId = "natural";

/** Cookie pratinjau tema; hanya dibaca bila THEME_PREVIEW=true (lingkungan developer). */
export const THEME_PREVIEW_COOKIE = "theme_preview";
/** Token pratinjau dari panel toko (tombol "Pratinjau"); diperiksa ke backend di setiap halaman. */
export const THEME_PREVIEW_TOKEN_COOKIE = "theme_preview_token";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.hasOwn(themes, value);
}

// Only registered themes can be selected; API values never become import paths.
export function resolveTheme(storeTheme?: unknown, fallback?: unknown): ThemeId {
  if (isThemeId(storeTheme)) return storeTheme;
  if (isThemeId(fallback)) return fallback;
  return defaultTheme;
}
