"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartCountOptions, cartKeys, modifyCart, refreshCart, type CartAction } from "@/lib/cart-queries";

export type { CartAction } from "@/lib/cart-queries";
interface CartContextValue {
  count: number | null;
  countError: boolean;
  refreshing: boolean;
  pending: boolean;
  refresh: () => Promise<boolean>;
  modify: (productId: number, action: CartAction, variantId?: number | null, quantity?: number) => Promise<boolean>;
}
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const count = useQuery(cartCountOptions);
  const mutationLock = useRef(false);
  const refresh = useCallback(() => refreshCart(client), [client]);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: modifyCart,
    onSuccess: refresh,
    retry: false,
  });

  const modify = useCallback(async (productId: number, action: CartAction, variantId?: number | null, quantity?: number) => {
    if (mutationLock.current) throw new Error("Tunggu perubahan keranjang selesai.");
    mutationLock.current = true;
    try {
      await mutateAsync({ productId, action, variantId, quantity });
      return client.getQueryState(cartKeys.count)?.status === "success";
    } finally {
      mutationLock.current = false;
    }
  }, [client, mutateAsync]);

  return (
    <CartContext.Provider value={{
      count: count.data?.count ?? null,
      countError: count.isError,
      refreshing: count.isFetching,
      pending: isPending,
      refresh,
      modify,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
