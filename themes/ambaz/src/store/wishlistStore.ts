'use client';

import { useWishlistActions, useWishlistProducts } from '@sellosy/theme';
import { toAmbazProduct } from '../lib/adapt';

/**
 * wishlistStore Ambaz dengan API yang sama, berisi wishlist akun pembeli di platform. Tamu yang menekan hati
 * diarahkan ke halaman masuk; paket tanpa akun pembeli: `available` false (sembunyikan tombolnya).
 */
export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  image2: string;
  slug: string;
  badge: string | null;
  colors: { name: string; value: string }[];
  vendor: string;
}

interface WishlistState {
  available: boolean;
  /** Null untuk tamu (belum masuk). */
  items: WishlistItem[];
  guest: boolean;
  status: 'loading' | 'error' | 'ready';
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Partial<WishlistItem> & { productId: string }) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export function useWishlistStore(): WishlistState;
export function useWishlistStore<T>(selector: (state: WishlistState) => T): T;
export function useWishlistStore<T>(selector?: (state: WishlistState) => T) {
  const actions = useWishlistActions();
  const list = useWishlistProducts();
  const items: WishlistItem[] = (list.products ?? []).map((summary) => {
    const product = toAmbazProduct(summary);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images[0].src,
      image2: product.images[1]?.src ?? product.images[0].src,
      slug: product.slug,
      badge: product.badge,
      colors: product.colors,
      vendor: product.vendor,
    };
  });
  const has = (productId: string) => actions.has(Number(productId));
  const state: WishlistState = {
    available: actions.available,
    items,
    guest: list.status === 'ready' && list.products === null,
    status: list.status,
    addItem: (item) => { if (!has(item.productId)) actions.toggle(Number(item.productId)); },
    removeItem: (productId) => { if (has(productId)) actions.toggle(Number(productId)); },
    toggleItem: (item) => actions.toggle(Number(item.productId)),
    isInWishlist: has,
    clearWishlist: () => actions.ids.forEach((id) => actions.toggle(id)),
  };
  return selector ? selector(state) : state;
}
