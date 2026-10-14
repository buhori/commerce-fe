"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setWishlisted, WishlistLoginRequired, wishlistIdsKey, wishlistIdsQuery, wishlistProductsKey, type WishlistState } from "@/lib/wishlist";
import { Icon } from "./icons";

/**
 * State and toggle for one product's heart. `available` is false on plans without buyer accounts
 * (render nothing then). Guests are sent to the login page and come back to the same page.
 * The heart flips at once and rolls back if the request fails.
 */
export function useWishlist(productId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useQuery(wishlistIdsQuery);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (saved: boolean) => setWishlisted(productId, saved),
    onMutate: async (saved) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: wishlistIdsKey });
      const previous = queryClient.getQueryData<WishlistState>(wishlistIdsKey);
      if (previous) {
        queryClient.setQueryData<WishlistState>(wishlistIdsKey, {
          ...previous,
          ids: saved ? [productId, ...previous.ids.filter((id) => id !== productId)] : previous.ids.filter((id) => id !== productId),
        });
      }
      return { previous };
    },
    onError: (failure, _saved, context) => {
      if (context?.previous) queryClient.setQueryData(wishlistIdsKey, context.previous);
      if (failure instanceof WishlistLoginRequired) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(failure.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistIdsKey });
      void queryClient.invalidateQueries({ queryKey: wishlistProductsKey });
    },
  });

  const saved = data?.ids.includes(productId) ?? false;

  return {
    available: data?.available ?? false,
    saved,
    pending: mutation.isPending,
    error,
    toggle: () => {
      // Guests go straight to login; no request needed to learn that.
      if (data && !data.authenticated) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      mutation.mutate(!saved);
    },
  };
}

/**
 * Heart button. `variant="icon"` is the round button over product images; `"button"` is the
 * labelled button next to "Add to cart" on the product page.
 */
export function WishlistButton({ productId, productName, variant = "icon", className }: {
  productId: number;
  productName?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { available, saved, pending, error, toggle } = useWishlist(productId);
  if (!available) return null;

  const label = saved ? "Hapus dari wishlist" : "Tambah ke wishlist";
  return (
    <>
      <button
        type="button"
        className={["wishlist-button", `wishlist-button-${variant}`, className].filter(Boolean).join(" ")}
        aria-pressed={saved}
        aria-label={variant === "icon" ? `${label}${productName ? `: ${productName}` : ""}` : undefined}
        title={variant === "icon" ? label : undefined}
        disabled={pending}
        onClick={(event) => {
          // Cards are links; the heart must not open the product.
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
      >
        <Icon name="heart" />
        {variant === "button" && <span>{saved ? "Tersimpan di wishlist" : "Tambah ke wishlist"}</span>}
      </button>
      {error && variant === "button" && <p className="wishlist-error" role="alert">{error}</p>}
    </>
  );
}
