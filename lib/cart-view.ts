import type { CartItem } from "./cart";
import type { Product } from "./store-api";

// Adapt data for rendering only; the API response remains untouched.
export async function prepareCartItems(data: unknown): Promise<CartItem[]> {
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "data" in data ? data.data : null;
  if (!Array.isArray(items) || !items.every((item) =>
    item && Number.isSafeInteger(item.id) && item.id > 0 &&
    Number.isSafeInteger(item.product_id) && item.product_id > 0 &&
    Number.isSafeInteger(item.amount) && item.amount >= 0,
  )) throw new Error("Respons isi keranjang tidak valid.");

  const active = items.filter((item) => item.amount > 0 && !item.deleted_at);
  const products = new Map(await Promise.all(
    [...new Set<number>(active.filter((item) => !item.product).map((item) => item.product_id))]
      .map(async (id) => {
        try {
          const response = await fetch(`/api/products/${id}`, { cache: "no-store", credentials: "same-origin" });
          if (!response.ok) return [id, null] as const;
          const { data: product }: { data: Product } = await response.json();
          return [id, product?.id === id && product.status === "published" && !product.deleted_at ? product : null] as const;
        } catch {
          return [id, null] as const;
        }
      }),
  ));
  return active.map((item) => {
    const product: Product | null = item.product ?? products.get(item.product_id) ?? null;
    const relation = item.variant && typeof item.variant === "object"
      ? item.variant : item.product_variant;
    const variantId = item.product_variant_id ?? (typeof item.variant === "number" ? item.variant : relation?.id);
    const variant = relation && (variantId == null || relation.id === variantId)
      ? relation
      : product?.variants?.find((candidate) => candidate.id === variantId) ?? null;
    return { ...item, product_variant_id: variantId ?? null, variant, product };
  });
}

export async function responseError(response: Response, fallback: string): Promise<Error> {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return new Error(typeof data?.message === "string" ? data.message : fallback);
  } catch {
    // Plain text can be shown as text; HTML error pages stay in the network response.
    return new Error(response.headers.get("content-type")?.includes("text/plain") && text ? text : fallback);
  }
}
