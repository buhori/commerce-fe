import { DM_Sans, DM_Serif_Display, Fraunces, Inter, Lora, Manrope, Playfair_Display, Plus_Jakarta_Sans, Poppins, Space_Grotesk } from "next/font/google";
import type { StoreFontKey, StoreStyle } from "./store-style";

/*
 * Font yang bisa dipilih toko di panel (daftar tetap, lihat STORE_FONT_KEYS). next/font harus
 * dipanggil di level modul, jadi semuanya dideklarasikan di sini; @font-face-nya ikut di CSS, tetapi
 * browser baru mengunduh berkasnya bila font itu benar-benar dipakai teks di halaman. preload: false
 * supaya toko yang tidak memilihnya tidak ikut mengunduh. Variabel CSS-nya harus sama dengan
 * STORE_FONT_VARIABLES di lib/store-style.ts.
 */

// Font dasar semua tema; satu-satunya yang di-preload.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Judul serif tema Boutique; tidak di-preload karena tema lain tidak memakainya.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  preload: false,
});

// Font variabel: semua ketebalan yang dipakai tema (300–700) sudah tercakup.
const inter = Inter({ variable: "--font-store-inter", subsets: ["latin"], display: "swap", preload: false });
const dmSans = DM_Sans({ variable: "--font-store-dm-sans", subsets: ["latin"], display: "swap", preload: false });
const manrope = Manrope({ variable: "--font-store-manrope", subsets: ["latin"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-store-space-grotesk", subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ variable: "--font-store-playfair-display", subsets: ["latin"], display: "swap", preload: false });
const lora = Lora({ variable: "--font-store-lora", subsets: ["latin"], display: "swap", preload: false });
// Bukan font variabel: ketebalan yang dipakai tema didaftarkan satu per satu.
const poppins = Poppins({
  variable: "--font-store-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
// Hanya ada satu ketebalan (400); judul tebal disintesis browser, wajar untuk font display.
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-store-dm-serif-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const fonts: Record<StoreFontKey, { variable: string }> = {
  inter,
  "plus-jakarta-sans": jakarta,
  "dm-sans": dmSans,
  manrope,
  poppins,
  "space-grotesk": spaceGrotesk,
  fraunces,
  "playfair-display": playfair,
  lora,
  "dm-serif-display": dmSerifDisplay,
};

/**
 * Kelas variabel font untuk <html>: Jakarta dan Fraunces (dipakai token tema) selalu, ditambah font
 * yang dipilih toko. Kelas yang tidak dipasang membuat variabelnya tidak ada, jadi font itu tidak terunduh.
 */
export function htmlFontClassName(style: StoreStyle | null): string {
  const selected = [style?.fonts.heading, style?.fonts.body].flatMap((key) => (key && Object.hasOwn(fonts, key) ? [fonts[key].variable] : []));
  return [...new Set([jakarta.variable, fraunces.variable, ...selected])].join(" ");
}
