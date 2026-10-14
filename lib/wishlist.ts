import { queryOptions } from "@tanstack/react-query";
import { jsonHeaders } from "./checkout";
import type { ProductSummary } from "./store-api";
import { readProductPage } from "./store-shared";

export const wishlistIdsKey = ["wishlist", "ids"] as const;
export const wishlistProductsKey = ["wishlist", "products"] as const;

export interface WishlistState {
  // False when the store's plan has no buyer accounts: no heart buttons at all.
  available: boolean;
  authenticated: boolean;
  // Encoded product ids, newest first.
  ids: number[];
}

/** Which products the buyer has saved, for the heart buttons on cards and product pages. */
export const wishlistIdsQuery = queryOptions({
  queryKey: wishlistIdsKey,
  queryFn: async (): Promise<WishlistState> => {
    const response = await fetch("/api/wishlist/ids", { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } });
    if (response.status === 403) return { available: false, authenticated: false, ids: [] };
    if (!response.ok) throw new Error("Wishlist request failed");
    const body = (await response.json()) as { data?: unknown; authenticated?: unknown };
    return {
      available: true,
      authenticated: body.authenticated === true,
      ids: Array.isArray(body.data) ? body.data.filter((id): id is number => Number.isSafeInteger(id) && id > 0) : [],
    };
  },
  staleTime: 60_000,
  retry: false,
});

/** The saved products themselves, for /profile/wishlist. Null for guests. */
export const wishlistProductsQuery = queryOptions({
  queryKey: wishlistProductsKey,
  queryFn: async (): Promise<ProductSummary[] | null> => {
    const response = await fetch("/api/wishlist", { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Wishlist request failed");
    return readProductPage(await response.json()).data;
  },
  retry: false,
});

export class WishlistLoginRequired extends Error {}

/** Save or unsave one product. Throws WishlistLoginRequired for guests. */
export async function setWishlisted(productId: number, saved: boolean): Promise<void> {
  const response = await fetch(`/api/wishlist/${productId}`, {
    method: saved ? "POST" : "DELETE", credentials: "same-origin", headers: jsonHeaders(),
  });
  if (response.status === 401) throw new WishlistLoginRequired();
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    throw new Error(response.status < 500 && typeof body?.message === "string" ? body.message : "Wishlist belum dapat diperbarui.");
  }
}
