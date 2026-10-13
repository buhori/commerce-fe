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
/** Token pratinjau dari panel toko (tema dan/atau draf beranda); diperiksa ke backend di setiap halaman. */
export const PREVIEW_COOKIE = "preview_token";
/** Iframe builder memakai ?preview=…; proxy.ts meneruskannya lewat header ini (tanpa cookie). */
export const PREVIEW_HEADER = "x-sellosy-preview";

/**
 * Halaman pratinjau membawa token di URL: jangan disimpan cache, jangan diindeks, dan jangan
 * bocor ke situs lain lewat header Referer (mis. saat gambar atau video pihak ketiga dimuat).
 */
export const PREVIEW_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.hasOwn(themes, value);
}

// Only registered themes can be selected; API values never become import paths.
export function resolveTheme(storeTheme?: unknown, fallback?: unknown): ThemeId {
  if (isThemeId(storeTheme)) return storeTheme;
  if (isThemeId(fallback)) return fallback;
  return defaultTheme;
}
