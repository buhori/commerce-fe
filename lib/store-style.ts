/**
 * Gaya toko dari panel (warna + font) di atas token tema. Modul murni tanpa impor runtime
 * supaya bisa diuji langsung (tests/store-style.test.mjs).
 *
 * Toko hanya memilih empat warna; turunan (hover, permukaan, garis, teks redup, teks di atas
 * tombol) dihitung di sini dari nilai hex yang sudah pasti, bukan color-mix, supaya kontras
 * bisa dijamin sebelum dikirim ke browser.
 */

export const STORE_FONT_KEYS = [
  "inter",
  "plus-jakarta-sans",
  "dm-sans",
  "manrope",
  "poppins",
  "space-grotesk",
  "fraunces",
  "playfair-display",
  "lora",
  "dm-serif-display",
] as const;

export type StoreFontKey = (typeof STORE_FONT_KEYS)[number];

export interface StoreStyle {
  /** "#rrggbb" (huruf kecil) atau null = warna bawaan tema. */
  colors: { primary: string | null; background: string | null; text: string | null; accent: string | null };
  /** Kunci font kurasi atau null = font bawaan tema. */
  fonts: { heading: StoreFontKey | null; body: StoreFontKey | null };
}

const HEX = /^#[0-9a-f]{6}$/i;
const SERIF_FONTS: readonly StoreFontKey[] = ["fraunces", "playfair-display", "lora", "dm-serif-display"];

/**
 * Variabel CSS font per kunci (diisi kelas next/font di lib/store-fonts.ts). Jakarta dan Fraunces
 * memakai variabel yang sudah selalu ada di <html>, jadi tidak ada berkas font ganda.
 */
export const STORE_FONT_VARIABLES: Record<StoreFontKey, string> = {
  inter: "--font-store-inter",
  "plus-jakarta-sans": "--font-jakarta",
  "dm-sans": "--font-store-dm-sans",
  manrope: "--font-store-manrope",
  poppins: "--font-store-poppins",
  "space-grotesk": "--font-store-space-grotesk",
  fraunces: "--font-fraunces",
  "playfair-display": "--font-store-playfair-display",
  lora: "--font-store-lora",
  "dm-serif-display": "--font-store-dm-serif-display",
};

const hex = (value: unknown): string | null => (typeof value === "string" && HEX.test(value) ? value.toLowerCase() : null);
const fontKey = (value: unknown): StoreFontKey | null =>
  typeof value === "string" && (STORE_FONT_KEYS as readonly string[]).includes(value) ? (value as StoreFontKey) : null;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/**
 * `style` dari GET /store. Nilai yang bukan "#rrggbb" atau font di luar daftar diabaikan (= bawaan
 * tema); null bila tidak ada satu pun yang berlaku, termasuk backend lama yang belum mengirimnya.
 */
export function readStoreStyle(value: unknown): StoreStyle | null {
  const raw = record(value);
  const colors = record(raw.colors);
  const fonts = record(raw.fonts);
  const style: StoreStyle = {
    colors: { primary: hex(colors.primary), background: hex(colors.background), text: hex(colors.text), accent: hex(colors.accent) },
    fonts: { heading: fontKey(fonts.heading), body: fontKey(fonts.body) },
  };
  const used = [...Object.values(style.colors), ...Object.values(style.fonts)].some((entry) => entry !== null);
  return used ? style : null;
}

// ---------------------------------------------------------------- Warna

type Rgb = [number, number, number];

const WHITE = "#ffffff";
/** Hampir hitam: lebih lembut dari #000 tapi tetap kontras tinggi di atas warna terang. */
const NEAR_BLACK = "#111111";

export function hexToRgb(value: string): Rgb {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Sama dengan color-mix(in srgb, a weight, b): weight 0..1 adalah porsi `a`. */
export function mix(a: string, b: string, weight: number): string {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return rgbToHex([0, 1, 2].map((i) => x[i] * weight + y[i] * (1 - weight)) as Rgb);
}

/** Luminans relatif WCAG 2.x. */
export function luminance(value: string): number {
  const [r, g, b] = hexToRgb(value).map((n) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Latar gelap: teks putih lebih terbaca daripada teks hitam. */
export const isDark = (value: string) => contrast(value, WHITE) > contrast(value, "#000000");

/**
 * Teks di atas warna isi (tombol, lencana): putih bila cukup kontras (4.5:1, teks normal WCAG AA),
 * lalu hampir hitam; warna tengah yang tidak cukup untuk keduanya memakai hitam murni bila itu yang
 * lebih kontras (putih atau hitam selalu mencapai ±4.6:1).
 */
export function readableOn(background: string): string {
  if (contrast(WHITE, background) >= 4.5) return WHITE;
  if (contrast(NEAR_BLACK, background) >= 4.5) return NEAR_BLACK;
  return contrast("#000000", background) > contrast(WHITE, background) ? "#000000" : WHITE;
}

/** Hover tombol utama: sedikit lebih gelap; warna yang sudah hampir hitam dibuat sedikit lebih terang. */
export function hoverShade(value: string): string {
  return luminance(value) < 0.01 ? mix(WHITE, value, 0.15) : mix("#000000", value, 0.2);
}

/** Campur teks ke latar mulai `weight`, ditambah sampai kontrasnya minimal `min` (teks redup tetap terbaca). */
function readableMix(text: string, page: string, weight: number, min = 4.5): string {
  for (let w = weight; w < 1; w += 0.04) {
    const color = mix(text, page, w);
    if (contrast(color, page) >= min) return color;
  }
  return text;
}

/** Warna aksen sebagai teks: digeser ke arah warna teks sampai terbaca di latar (mis. kuning di latar terang). */
function readableAccent(accent: string, ink: string, page: string): string {
  for (let w = 0; w < 1; w += 0.05) {
    const color = mix(ink, accent, w);
    if (contrast(color, page) >= 4.5) return color;
  }
  return ink;
}

/**
 * Nilai bawaan tema (sama dengan styles.css masing-masing; dicek di tes) yang dibutuhkan untuk
 * menurunkan warna bila toko hanya mengganti sebagian. accent tidak null berarti hover tombol
 * tema itu memakai accent (Editorial).
 */
export const THEME_COLORS: Record<string, { primary: string; page: string; text: string; accent: string | null }> = {
  natural: { primary: "#2e4038", page: "#fdfcfb", text: "#292824", accent: null },
  minimal: { primary: "#1f2328", page: "#ffffff", text: "#18181b", accent: null },
  boutique: { primary: "#9a3f2c", page: "#fbf6f0", text: "#3a2a22", accent: null },
  editorial: { primary: "#1d1b18", page: "#f6f2ec", text: "#1d1b18", accent: "#8a4b32" },
};

/** Token CSS yang ditimpa untuk tema `themeId`; kosong bila toko tidak mengubah apa pun. */
export function storeStyleTokens(style: StoreStyle | null, themeId: string): Record<string, string> {
  // Dibaca ulang: hanya hex tervalidasi dan kunci font kurasi yang bisa sampai ke <style>.
  const parsed = readStoreStyle(style);
  if (!parsed) return {};
  const base = THEME_COLORS[themeId] ?? THEME_COLORS.natural;
  const { primary, background, text, accent } = parsed.colors;
  const tokens: Record<string, string> = {};
  const editorial = themeId === "editorial";

  const page = background ?? base.page;
  // Latar gelap dengan teks tema yang gelap tidak terbaca: teks dipilih otomatis bila toko tidak mengisinya.
  // Diberi sedikit warna latar supaya menyatu; bila tidak cukup kontras, putih/hitam murni.
  const autoText = !text && background && contrast(base.text, background) < 4.5
    ? [mix(WHITE, background, 0.92), mix("#000000", background, 0.88)].find((color) => contrast(color, background) >= 7) ?? readableOn(background)
    : null;
  const ink = text ?? autoText ?? base.text;
  const fill = primary ?? base.primary;

  if (primary || accent) {
    const hover = accent ?? base.accent ?? hoverShade(fill);
    tokens["--primary"] = fill;
    tokens["--primary-hover"] = hover;
    tokens["--on-primary"] = readableOn(fill);
    tokens["--on-primary-hover"] = readableOn(hover);
    if (accent) {
      tokens["--accent"] = accent;
      // Teks di atas latar aksen (mis. bagian builder berlatar aksen): terbaca walau aksennya terang.
      tokens["--on-accent"] = readableOn(accent);
    }
    // Editorial memakai --ink sebagai warna isi (tombol, topbar, footer) dan --text: var(--ink).
    if (editorial && primary) tokens["--ink"] = primary;
  }

  if (background) {
    const dark = isDark(background);
    tokens["--page"] = background;
    tokens["--canvas"] = mix(ink, background, dark ? 0.04 : 0.025);
    tokens["--surface"] = mix(ink, background, dark ? 0.08 : 0.05);
    tokens["--surface-hover"] = mix(ink, background, dark ? 0.13 : 0.09);
    tokens["--line"] = mix(ink, background, dark ? 0.14 : 0.11);
    tokens["--line-strong"] = mix(ink, background, dark ? 0.28 : 0.24);
    tokens["--glass-rgb"] = hexToRgb(background).join(" ");
    if (dark) tokens["color-scheme"] = "dark";
  }

  // Aksen juga dipakai sebagai teks (harga coret, stok menipis di Editorial); tetap terbaca di latar baru.
  const accentColor = accent ?? base.accent;
  if (accentColor && (accent || background)) tokens["--accent-text"] = readableAccent(accentColor, ink, page);

  // Teks redup diturunkan dari teks + latar, jadi ikut berubah bila salah satunya diganti.
  if (text || autoText || background || (editorial && primary)) tokens["--text"] = ink;
  if (text || autoText || background) {
    tokens["--muted"] = readableMix(ink, page, 0.7);
    tokens["--text-soft"] = readableMix(ink, page, 0.9);
    tokens["--text-softer"] = readableMix(ink, page, 0.82);
    tokens["--on-text"] = readableOn(ink);
  }

  // Editorial: teks di atas --ink (topbar, tombol, footer) memakai warna halaman bila cukup kontras.
  if (editorial && (primary || background)) {
    const onInk = contrast(page, fill) >= 4.5 ? page : readableOn(fill);
    tokens["--on-ink"] = onInk;
    tokens["--ed-on-ink-soft"] = readableMix(onInk, fill, 0.86);
    tokens["--ed-on-ink-muted"] = readableMix(onInk, fill, 0.53);
    tokens["--ed-ink-line"] = mix(onInk, fill, 0.12);
    // Logo "dibuat dengan" di footer putih polos; di atas --ink terang dibuat hitam.
    if (isDark(onInk)) tokens["--ed-logo-filter"] = "brightness(0)";
  }

  const { heading, body } = parsed.fonts;
  if (heading) {
    tokens["--font-heading"] = fontStack(heading);
    if (editorial) tokens["--ed-serif"] = `var(${STORE_FONT_VARIABLES[heading]})`;
  }
  if (body) {
    tokens["--font-body"] = fontStack(body);
    if (editorial) tokens["--ed-sans"] = `var(${STORE_FONT_VARIABLES[body]})`;
  }
  return tokens;
}

function fontStack(key: StoreFontKey): string {
  const fallback = SERIF_FONTS.includes(key) ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  return `var(${STORE_FONT_VARIABLES[key]}), ${fallback}`;
}

/**
 * Selektor (0,2,1) mengalahkan token tema (`:root[data-theme="…"]`, 0,2,0) dan kelas variabel
 * next/font di <html> (0,1,0), di mana pun <style> ini berada di dokumen.
 */
export const STORE_STYLE_SELECTOR = "html:root[data-theme]";

const SAFE_NAME = /^(--[a-z0-9-]+|color-scheme)$/;
const SAFE_VALUE = /^[a-z0-9#(),.\- "]+$/i;

/** Isi <style> untuk gaya toko; string kosong bila tidak ada yang ditimpa (tampilan tema apa adanya). */
export function storeStyleCss(style: StoreStyle | null, themeId: string): string {
  const declarations = Object.entries(storeStyleTokens(style, themeId))
    // Semua nilai berasal dari hex tervalidasi dan string konstan; tetap disaring supaya tidak ada
    // yang bisa menutup blok CSS atau tag </style>.
    .filter(([name, value]) => SAFE_NAME.test(name) && SAFE_VALUE.test(value))
    .map(([name, value]) => `${name}:${value};`);
  return declarations.length ? `${STORE_STYLE_SELECTOR}{${declarations.join("")}}` : "";
}
