export interface CartCount {
  cart_id?: number;
  count: number;
}

export async function getCartCount(): Promise<CartCount> {
  const response = await cartFetch("/api/cart/count");
  if (!response.ok) throw new Error("Jumlah keranjang belum dapat dimuat.");
  const data: CartCount = await response.json();
  if (!Number.isSafeInteger(data?.count) || data.count < 0) {
    throw new Error("Respons jumlah keranjang tidak valid.");
  }
  return data;
}

export function cartFetch(path: `/api/cart/${string}`, init?: RequestInit) {
  // HttpOnly guest_token cookies stay in the browser. The proxy forwards them
  // as X-Guest-Token; TanStack Query owns caching and request deduplication.
  return fetch(path, { ...init, credentials: "same-origin", cache: "no-store" });
}
