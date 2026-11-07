import { formatPrice as platformFormatPrice } from "@sellosy/theme";

/**
 * formatPrice Ambaz, memakai format harga platform (Rp, tanpa desimal). Toko selalu memakai IDR (tidak ada
 * pengaturan mata uang di panel), jadi pemanggilan Ambaz tanpa mata uang tetap benar.
 */
export function formatPrice(price: number, currency: string = "IDR"): string {
  return platformFormatPrice(price, currency);
}
