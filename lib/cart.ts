import type { Product, ProductVariant } from "./store-api";
import { preorderDays } from "./store-shared";

export type CartVariant = ProductVariant;

export interface CartItem {
  id: number;
  product_id: number;
  amount: number;
  product_variant_id?: number | null;
  variant?: CartVariant | null;
  product: Product | null;
  /** Harga satuan setelah diskon, dihitung backend; backend lama tidak mengirimnya. */
  unit_price?: number | null;
  /** Harga satuan sebelum diskon, untuk dicoret. */
  original_unit_price?: number | null;
}

export function getCartVariantId(item: CartItem): number | undefined {
  return item.product_variant_id ?? item.variant?.id;
}

// Ready items cannot exceed stock; pre-orders are only capped by the backend limit.
export function getCartStockLimit(item: CartItem): number | null {
  if (preorderDays(item.product) > 0) return null;
  const stock = item.variant?.stock ?? item.product?.stock;
  return typeof stock === "number" && Number.isFinite(stock) ? Math.max(0, stock) : null;
}

const isMoney = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function getCartUnitPrice(item: CartItem): number | null {
  // Harga dari backend sudah termasuk diskon dan sama dengan yang ditagihkan saat checkout.
  if (isMoney(item.unit_price)) return item.unit_price;
  // A selected variant whose details cannot be loaded has an unknown price.
  if (getCartVariantId(item) != null && !item.variant) return null;
  const price = item.variant?.price ?? item.product?.price;
  return typeof price === "number" && Number.isFinite(price) && price >= 0
    ? price
    : null;
}

/** Harga satuan normal untuk dicoret; null bila barang ini tidak sedang diskon. */
export function getCartOriginalUnitPrice(item: CartItem): number | null {
  const unit = getCartUnitPrice(item);
  return unit !== null && isMoney(item.original_unit_price) && item.original_unit_price > unit ? item.original_unit_price : null;
}
