/**
 * Tombol "Tanya via WhatsApp" di halaman produk. Modul murni tanpa impor, supaya bisa dites dan
 * dipakai di server (pembaca respons API) maupun browser (URL dengan varian yang sedang dipilih).
 */

/** product.whatsapp dari backend: nomor tujuan chat, hanya angka dengan kode negara. */
export interface WhatsappChat {
  number: string;
  /** Tombol baru aktif bila jumlah yang dipilih lebih dari ini (mis. pembelian grosir); null berarti selalu. */
  quantityAbove: number | null;
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
  /** Jumlah yang dipilih pembeli; disebut di pesan bila lebih dari satu. */
  quantity?: number | null;
}

/**
 * Opsi `whatsapp` untuk useAddToCart()/<AddToCart>: varian dan jumlah diisi hook dari pilihan
 * pembeli; `quantityAbove` dari product.whatsapp.
 */
export type WhatsappProductChat = Omit<WhatsappChatInput, "variantLabel" | "quantity"> & { quantityAbove?: number | null };

// Panjang nomor E.164 tanpa "+": backend sudah memvalidasi, ini hanya penjaga bila responsnya rusak.
const NUMBER = /^\d{8,15}$/;

/**
 * Backend hanya mengirim `whatsapp` bila toko menyalakannya untuk produk ini, paketnya mencakup
 * fitur ini, dan nomornya ada. Field yang tidak ada atau rusak berarti tanpa tombol (null).
 */
export function readWhatsapp(value: unknown): WhatsappChat | null {
  if (!value || typeof value !== "object") return null;
  const { number, quantity_above: above } = value as { number?: unknown; quantity_above?: unknown };
  if (typeof number !== "string" || !NUMBER.test(number.trim())) return null;
  // Batas yang rusak dianggap tidak ada: tombolnya tetap tampil seperti biasa.
  const quantityAbove = typeof above === "number" && Number.isInteger(above) && above > 0 ? above : null;
  return { number: number.trim(), quantityAbove };
}

/** Tombol chat bisa dipakai pada jumlah ini: tanpa batas, atau jumlahnya melebihi batas. */
export function whatsappAvailable(quantityAbove: number | null | undefined, quantity: number): boolean {
  return !quantityAbove || quantity > quantityAbove;
}

/** Tautan wa.me dengan pesan pembuka berisi nama toko, produk, varian dan jumlah terpilih, dan URL produk. */
export function whatsappChatUrl({ number, storeName, productName, variantLabel, productUrl, quantity }: WhatsappChatInput): string {
  const variant = variantLabel?.trim() ? ` (${variantLabel.trim()})` : "";
  const amount = quantity && quantity > 1 ? ` sebanyak ${quantity} barang` : "";
  const message = `Halo ${storeName}, saya ingin bertanya tentang ${productName}${variant}${amount}.\n${productUrl}`;
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
}
