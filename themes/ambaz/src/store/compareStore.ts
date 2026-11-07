'use client';

import { useCompare } from '@sellosy/theme';
import type { Product } from '../types/product';
import { PLACEHOLDER_IMAGE } from '../lib/adapt';

/**
 * compareStore Ambaz dengan API yang sama, memakai daftar bandingkan platform (di browser, paling banyak 4,
 * dibuka di /compare). `items` hanya ringkasan; halaman bandingkan menerima produk lengkapnya dari platform.
 */
interface CompareState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  /** Alamat halaman bandingkan untuk daftar saat ini. */
  href: string;
}

function summary(item: { id: number; slug: string; name: string; image: string | null }): Product {
  return {
    id: String(item.id), slug: item.slug, name: item.name, vendor: '', price: 0, compareAtPrice: null, currency: 'IDR',
    images: [{ id: `${item.id}-0`, src: item.image || PLACEHOLDER_IMAGE, alt: item.name }], variants: [], colors: [], sizes: [],
    category: '', tags: [], brand: '', availability: 'in-stock', badge: null, description: '', features: [], rating: 0,
    reviewCount: 0, reviews: [], relatedProducts: [], pairsWellWith: [], createdAt: '', sku: '', countdownEnd: null,
  };
}

export function useCompareStore(): CompareState;
export function useCompareStore<T>(selector: (state: CompareState) => T): T;
export function useCompareStore<T>(selector?: (state: CompareState) => T) {
  const compare = useCompare();
  const toItem = (product: Product) => ({ id: Number(product.id), slug: product.slug, name: product.name, image: product.images[0]?.src ?? null });
  const state: CompareState = {
    items: compare.items.map(summary),
    addItem: (product) => { if (!compare.has(Number(product.id))) compare.toggle(toItem(product)); },
    removeItem: (productId) => compare.remove(Number(productId)),
    toggleItem: (product) => { compare.toggle(toItem(product)); },
    isInCompare: (productId) => compare.has(Number(productId)),
    clearCompare: () => compare.clear(),
    href: compare.items.length ? `/compare?p=${compare.items.map((item) => item.id).join(',')}` : '/compare',
  };
  return selector ? selector(state) : state;
}
