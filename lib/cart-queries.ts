import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { cartFetch, getCartCount } from "./cart-client";
import { prepareCartItems, responseError } from "./cart-view";

export type CartAction = "add" | "reduce" | "remove";
export const cartKeys = {
  all: ["cart"] as const,
  count: ["cart", "count"] as const,
  items: ["cart", "items"] as const,
  // Pre-orders are bought through their own one-product cart.
  preorder: ["cart", "preorder"] as const,
};

const cartCache = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: false,
  retryOnMount: false,
} as const;

export const cartCountOptions = queryOptions({
  ...cartCache,
  queryKey: cartKeys.count,
  queryFn: getCartCount,
  refetchOnMount: false,
});


// One builder for both carts, so the shopping and pre-order queries share a type.
function itemsQuery(cart: "items" | "preorder") {
  const queryKey: readonly ["cart", "items" | "preorder"] = ["cart", cart];
  return queryOptions({
    ...cartCache,
    queryKey,
    queryFn: async () => {
      const response = await cartFetch(cart === "preorder" ? "/api/cart/items?cart=preorder" : "/api/cart/items");
      if (!response.ok) {
        throw await responseError(response, cart === "preorder" ? "Pesanan pre-order belum dapat dimuat." : "Isi keranjang belum dapat dimuat.");
      }
      return prepareCartItems(await response.json());
    },
  });
}

export const cartItemsOptions = itemsQuery("items");
// Pre-orders are bought through their own one-product cart.
export const preorderItemsOptions = itemsQuery("preorder");


/** "Pre-order sekarang": replaces the pre-order cart with this product only. */
export async function startPreorder({ productId, variantId, quantity }: {
  productId: number;
  variantId?: number | null;
  quantity?: number;
}) {
  const response = await cartFetch(`/api/cart/${productId}/preorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(variantId != null ? { variant: variantId } : {}),
      ...(quantity && quantity > 1 ? { quantity } : {}),
    }),
  });
  if (!response.ok) throw await responseError(response, "Pre-order belum dapat diproses. Silakan coba lagi.");
}

export async function modifyCart({ productId, action, variantId, quantity }: {
  productId: number;
  action: CartAction;
  variantId?: number | null;
  // Only "add" uses it; the backend adds one when it is missing.
  quantity?: number;
}) {
  const response = await cartFetch(`/api/cart/${productId}/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...(variantId != null ? { variant: variantId } : {}),
      ...(action === "add" && quantity && quantity > 1 ? { quantity } : {}),
    }),
  });
  if (!response.ok) throw await responseError(response, "Keranjang belum dapat diperbarui. Silakan coba lagi.");
}

export async function refreshCart(client: QueryClient): Promise<boolean> {
  // Discard reads started before the mutation/cookie response. Their late
  // results must not replace the refreshed cart, including after checkout.
  await client.cancelQueries({ queryKey: cartKeys.all });
  // Only mounted views refetch now; inactive items refetch when needed next.
  await client.invalidateQueries({ queryKey: cartKeys.all });
  return client.getQueryState(cartKeys.count)?.status === "success";
}
