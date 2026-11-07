'use client';

import { useCartLines, type CartLine } from '@sellosy/theme';
import type { CartItem } from '../types/cart';
import { FREE_SHIPPING_THRESHOLD } from '../lib/constants';
import { PLACEHOLDER_IMAGE } from '../lib/adapt';
import { setUI, useUIData } from './uiStore';

/**
 * cartStore Ambaz dengan API yang sama, tetapi isinya keranjang platform (server): addItem/updateQuantity/removeItem
 * memanggil keranjang toko, jadi harga, stok, dan checkout tetap benar. Aksinya async; kegagalan (mis. stok habis)
 * tampil sebagai pesan di laci keranjang.
 */
export interface CartState {
  items: CartItem[];
  /** Baris asli platform (stok, pre-order), untuk tampilan yang membutuhkannya. */
  lines: CartLine[];
  status: 'loading' | 'error' | 'ready';
  pending: boolean;
  isDrawerOpen: boolean;
  message: string | null;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  updateQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getFreeShippingRemaining: () => number;
}

const variantKey = (id: number | null) => (id === null ? '' : String(id));

function toItem(line: CartLine): CartItem {
  return {
    productId: String(line.productId),
    variantId: variantKey(line.variantId),
    name: line.name,
    slug: line.slug ?? '',
    image: line.image || PLACEHOLDER_IMAGE,
    color: line.variantLabel ?? '',
    size: '',
    price: line.unitPrice ?? 0,
    compareAtPrice: line.originalPrice,
    quantity: line.quantity,
    vendor: '',
  };
}

const message = (error: unknown) => (error instanceof Error ? error.message : 'Keranjang belum dapat diperbarui.');

export function useCartStore(): CartState;
export function useCartStore<T>(selector: (state: CartState) => T): T;
export function useCartStore<T>(selector?: (state: CartState) => T) {
  const cart = useCartLines('IDR');
  const ui = useUIData();
  const find = (productId: string, variantId: string) =>
    cart.lines.find((line) => String(line.productId) === productId && variantKey(line.variantId) === variantId);

  // Setiap aksi: kosongkan pesan lama, jalankan, tampilkan pesan bila gagal.
  const run = async (action: () => Promise<unknown>) => {
    setUI({ cartMessage: null });
    try {
      await action();
    } catch (error) {
      setUI({ cartMessage: message(error), cartDrawerOpen: true });
    }
  };

  const subtotal = cart.subtotal ?? 0;
  const state: CartState = {
    items: cart.lines.map(toItem),
    lines: cart.lines,
    status: cart.status,
    pending: cart.pending,
    isDrawerOpen: ui.cartDrawerOpen,
    message: ui.cartMessage,
    addItem: (item) => run(async () => {
      await cart.add(Number(item.productId), item.variantId ? Number(item.variantId) : null, item.quantity, { price: item.price, name: item.name });
      setUI({ cartDrawerOpen: true });
    }),
    removeItem: (productId, variantId) => run(async () => {
      const line = find(productId, variantId);
      if (line) await cart.change(line, 'remove');
    }),
    updateQuantity: (productId, variantId, quantity) => run(async () => {
      const line = find(productId, variantId);
      if (line && quantity >= 1) await cart.setQuantity(line, quantity);
    }),
    clearCart: () => run(async () => {
      for (const line of cart.lines) await cart.change(line, 'remove');
    }),
    openDrawer: () => setUI({ cartDrawerOpen: true }),
    closeDrawer: () => setUI({ cartDrawerOpen: false, cartMessage: null }),
    toggleDrawer: () => setUI((s) => ({ cartDrawerOpen: !s.cartDrawerOpen })),
    getTotalItems: () => cart.count,
    getSubtotal: () => subtotal,
    getFreeShippingRemaining: () => Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
  return selector ? selector(state) : state;
}
