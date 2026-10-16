/**
 * Aturan harga coret, dipakai tampilan bawaan dan tema lewat SDK supaya semua toko menghitungnya sama.
 * Modul murni agar bisa dites dan dipakai di server maupun browser.
 */
import { readDiscount } from "./store-shared";

/** Harga siap tampil untuk satu produk atau varian. */
export interface PriceView {
  /** Harga yang dibayar pembeli. */
  final: number;
  /** Harga normal untuk dicoret; null bila tidak ada potongan. */
  original: number | null;
  /** Lencana diskon, mis. "-20%"; null bila tidak ada potongan. */
  label: string | null;
  /** Akhir masa diskon apa adanya dari backend; null bila tidak ada. */
  endsAt: string | null;
}

/** Bentuk minimal produk, varian, atau baris keranjang yang punya harga. */
export interface Priced {
  price?: number | null;
  final_price?: number | null;
  /** Discount dari backend; isinya dibaca ulang dengan readDiscount(), bukan dipercaya begitu saja. */
  discount?: unknown;
}

const money = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * Harga akhir dan harga coret untuk produk, atau varian bila `parent` (produknya) diberikan.
 * Backend lama tanpa `final_price` berarti tanpa diskon. Harga normal hanya dicoret bila memang
 * lebih tinggi dari harga akhir, sehingga diskon nol atau data janggal tidak menampilkan coretan.
 */
export function priceView(item: Priced | null | undefined, parent?: Priced | null): PriceView {
  const ownPrice = money(item?.price);
  const price = ownPrice ? (item!.price as number) : money(parent?.price) ? (parent!.price as number) : 0;
  // Varian tanpa harga sendiri memakai harga produk, termasuk potongannya.
  const final = money(item?.final_price)
    ? item!.final_price as number
    : !ownPrice && money(parent?.final_price) ? parent!.final_price as number : price;
  if (final >= price) return { final, original: null, label: null, endsAt: null };
  const discount = readDiscount(item?.discount) ?? readDiscount(parent?.discount);
  return { final, original: price, label: discount?.label ?? null, endsAt: discount?.ends_at ?? null };
}

/**
 * Tanggal berakhirnya diskon untuk teks "Berakhir …". Hanya bagian tanggal yang dipakai, karena
 * backend mengirimnya dalam zona waktu toko; server dan browser pun menampilkan tanggal yang sama.
 */
export function discountEndDate(endsAt: string | null | undefined): Date | null {
  const day = typeof endsAt === "string" ? /^(\d{4}-\d{2}-\d{2})/.exec(endsAt.trim())?.[1] : undefined;
  if (!day) return null;
  const date = new Date(`${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
