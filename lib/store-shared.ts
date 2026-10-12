import type { ProductSummary } from "./store-api";

// Pure helpers shared with client components. lib/store-api.ts reads request headers, so it is server-only.

export function preorderDays(product: Pick<ProductSummary, "preorder_duration" | "spreorder_duration"> | null | undefined) {
  const days = product?.preorder_duration ?? product?.spreorder_duration ?? 0;
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export interface ProductQuery {
  categoryId?: number;
  // Encoded id of the last product already shown; the next page continues after it.
  lastProductId?: number;
  q?: string;
  sort?: string;
}

export interface ProductPage {
  data: ProductSummary[];
  hasMore: boolean;
  lastProductId: number | null;
}

export const PRODUCTS_PER_PAGE = 20;

export function productQueryString({ categoryId, lastProductId, q, sort }: ProductQuery) {
  const params = new URLSearchParams({ per_page: String(PRODUCTS_PER_PAGE) });
  if (categoryId) params.set("category_id", String(categoryId));
  if (lastProductId) params.set("last_product_id", String(lastProductId));
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  return params.toString();
}

/** Shared by the server render and the browser's "load more", so both read pages the same way. */
export function readProductPage(result: unknown): ProductPage {
  const body = result as { data?: unknown; meta?: { has_more?: unknown; last_product_id?: unknown } } | null;
  if (!body || !Array.isArray(body.data)) throw new Error("Invalid product response");
  const last = body.meta?.last_product_id;
  const lastProductId = Number.isSafeInteger(last) && (last as number) > 0 ? (last as number) : null;
  return {
    data: (body.data as ProductSummary[]).filter(
      (product) => product && (!product.status || product.status === "published") && !product.deleted_at,
    ),
    // Without a position to continue from there is nothing more to load.
    hasMore: body.meta?.has_more === true && lastProductId !== null,
    lastProductId,
  };
}
