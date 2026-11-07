/**
 * Tes tipe kontrak tema (dijalankan oleh `tsc --noEmit`, tidak di-bundle): props komponen section harus
 * diturunkan tepat dari skemanya. Baris `@ts-expect-error` gagal dikompilasi bila inferensinya rusak.
 */
import type { Category, ProductSummary } from "@/lib/store-api";
import { defineSection, type ImageValue, type LinkValue, type SectionRenderProps } from "./schema";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>(value: T) => value;

const schema = {
  type: "promo-banners",
  name: "Banner promo",
  settings: [
    { id: "title", type: "text", label: "Judul", default: "" },
    { id: "columns", type: "select", label: "Kolom", options: [{ value: "2", label: "Dua" }, { value: "3", label: "Tiga" }], default: "2" },
    { id: "rounded", type: "checkbox", label: "Sudut bulat" },
    { id: "gap", type: "range", label: "Jarak", min: 0, max: 64, default: 24 },
    { type: "heading", content: "Produk" },
    { id: "products", type: "product-source", label: "Produk" },
    { id: "category", type: "category", label: "Kategori" },
  ],
  blocks: {
    banner: {
      name: "Banner",
      settings: [
        { id: "image", type: "image", label: "Gambar" },
        { id: "link", type: "link", label: "Tautan" },
      ],
    },
    note: { name: "Catatan", settings: [{ id: "text", type: "textarea", label: "Teks" }] },
  },
} as const;

type Props = SectionRenderProps<typeof schema>;

expectType<Equal<Props["settings"]["title"], string>>(true);
expectType<Equal<Props["settings"]["columns"], "2" | "3">>(true);
expectType<Equal<Props["settings"]["rounded"], boolean>>(true);
expectType<Equal<Props["settings"]["gap"], number>>(true);
expectType<Equal<Props["data"]["products"], ProductSummary[]>>(true);
expectType<Equal<Props["data"]["category"], Category | null>>(true);
expectType<Equal<keyof Props["settings"], "title" | "columns" | "rounded" | "gap">>(true);

function PromoBanners({ settings, data, blocks }: Props) {
  // @ts-expect-error: setting yang tidak dideklarasikan tidak ada.
  void settings.subtitle;
  // @ts-expect-error: input sumber daya ada di `data`, bukan di `settings`.
  void settings.products;
  void data.products.length;

  for (const block of blocks) {
    if (block.type === "banner") {
      expectType<Equal<typeof block.settings.image, ImageValue | null>>(true);
      expectType<Equal<typeof block.settings.link, LinkValue | null>>(true);
    } else {
      expectType<Equal<typeof block.type, "note">>(true);
      expectType<Equal<typeof block.settings.text, string>>(true);
    }
  }
  return null;
}

export const promoBanners = defineSection(schema, PromoBanners);
