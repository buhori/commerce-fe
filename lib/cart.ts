import { preorderDays, type Product, type ProductVariant } from "./store-api";

export type CartVariant = ProductVariant;

export interface CartItem {
  id: number;
  product_id: number;
  amount: number;
  product_variant_id?: number | null;
  variant?: CartVariant | null;
  product: Product | null;
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

export function getCartUnitPrice(item: CartItem): number | null {
  // A selected variant whose details cannot be loaded has an unknown price.
  if (getCartVariantId(item) != null && !item.variant) return null;
  const price = item.variant?.price ?? item.product?.price;
  return typeof price === "number" && Number.isFinite(price) && price >= 0
    ? price
    : null;
}
