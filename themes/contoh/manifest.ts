import type { SectionSchema, ThemeManifestSource } from "@sellosy/theme";

/**
 * Tema contoh berkontrak (sdk/THEME-CONTRACT.md): skema section dan preset, tanpa komponen, supaya
 * `pnpm theme:manifest contoh` bisa membuat theme.json. Komponennya dipasangkan di index.tsx.
 */

export const heroBanner = {
  type: "hero-banner",
  name: "Banner pembuka",
  templates: ["home"],
  settings: [
    { id: "image", type: "image", label: "Gambar", default: "theme://hero.png", accept: ["jpg", "png", "webp"], recommended: "1600 × 700" },
    { id: "eyebrow", type: "text", label: "Teks kecil", default: "Koleksi baru", maxLength: 40 },
    { id: "title", type: "text", label: "Judul", default: "Belanja yang lebih menyenangkan", maxLength: 80 },
    { id: "subtitle", type: "textarea", label: "Keterangan", default: "Produk pilihan, dikirim cepat ke rumah Anda.", maxLength: 200, rows: 3 },
    { id: "button", type: "text", label: "Teks tombol", default: "Lihat produk", maxLength: 30 },
    { id: "link", type: "link", label: "Tautan tombol", default: "/products" },
  ],
} as const satisfies SectionSchema;

export const featuredProducts = {
  type: "featured-products",
  name: "Produk pilihan",
  templates: ["home", "collection", "product"],
  settings: [
    { id: "title", type: "text", label: "Judul", default: "Produk terbaru", maxLength: 60 },
    { id: "products", type: "product-source", label: "Produk", default: { source: "latest", limit: 8 }, max: 12 },
    {
      id: "columns", type: "select", label: "Kolom", default: "4",
      options: [{ value: "2", label: "2 kolom" }, { value: "3", label: "3 kolom" }, { value: "4", label: "4 kolom" }],
    },
  ],
} as const satisfies SectionSchema;

export const richText = {
  type: "rich-text",
  name: "Teks",
  settings: [
    { id: "title", type: "text", label: "Judul", default: "Tentang kami", maxLength: 80 },
    { id: "body", type: "richtext", label: "Isi", default: "<p>Ceritakan toko Anda di sini.</p>" },
  ],
} as const satisfies SectionSchema;

export const manifest: ThemeManifestSource = {
  id: "contoh",
  name: "Contoh Kontrak",
  version: "1.0.0",
  description: "Tema contoh untuk pengembang: bukti alur kontrak tema dari kode sampai storefront.",
  sections: [heroBanner, featuredProducts, richText],
  presets: {
    utama: {
      name: "Utama",
      templates: {
        home: { sections: [{ type: "hero-banner" }, { type: "featured-products" }, { type: "rich-text" }] },
      },
    },
  },
};
