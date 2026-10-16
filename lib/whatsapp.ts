/**
 * Tombol "Tanya via WhatsApp" di halaman produk. Modul murni tanpa impor, supaya bisa dites dan
 * dipakai di server (pembaca respons API) maupun browser (URL dengan varian yang sedang dipilih).
 */

/** product.whatsapp dari backend: nomor tujuan chat, hanya angka dengan kode negara. */
export interface WhatsappChat {
  number: string;
}

/** Bahan pesan pembuka chat tentang satu produk. */
export interface WhatsappChatInput {
  number: string;
  storeName: string;
  productName: string;
  /** Label varian yang sedang dipilih; kosong bila produk tanpa varian atau belum dipilih. */
  variantLabel?: string | null;
  /** URL produk lengkap (dengan domain), supaya penjual langsung tahu produk mana. */
  productUrl: string;
}

/** Opsi `whatsapp` untuk useAddToCart()/<AddToCart>: varian diisi hook dari pilihan pembeli. */
export type WhatsappProductChat = Omit<WhatsappChatInput, "variantLabel">;

// Panjang nomor E.164 tanpa "+": backend sudah memvalidasi, ini hanya penjaga bila responsnya rusak.
const NUMBER = /^\d{8,15}$/;

/**
 * Backend hanya mengirim `whatsapp` bila toko menyalakannya untuk produk ini, paketnya mencakup
 * fitur ini, dan nomornya ada. Field yang tidak ada atau rusak berarti tanpa tombol (null).
 */
export function readWhatsapp(value: unknown): WhatsappChat | null {
  if (!value || typeof value !== "object") return null;
  const number = (value as { number?: unknown }).number;
  return typeof number === "string" && NUMBER.test(number.trim()) ? { number: number.trim() } : null;
}

/** Tautan wa.me dengan pesan pembuka berisi nama toko, produk, varian terpilih, dan URL produk. */
export function whatsappChatUrl({ number, storeName, productName, variantLabel, productUrl }: WhatsappChatInput): string {
  const variant = variantLabel?.trim() ? ` (${variantLabel.trim()})` : "";
  const message = `Halo ${storeName}, saya ingin bertanya tentang ${productName}${variant}.\n${productUrl}`;
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
}
