'use client';

import { useSyncExternalStore } from 'react';
import type { Product } from '../types/product';

/**
 * uiStore Ambaz (zustand di aslinya) sebagai store kecil di browser dengan API yang sama: pencarian, menu mobile,
 * quick view, dan laci keranjang. Status ini murni tampilan; data keranjang tetap milik platform.
 */
export interface UIState {
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  quickViewProduct: Product | null;
  cartDrawerOpen: boolean;
  /** Pesan untuk pembeli setelah aksi keranjang gagal (mis. stok habis); tampil di laci keranjang. */
  cartMessage: string | null;
  toggleSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

type Data = Pick<UIState, 'searchOpen' | 'mobileMenuOpen' | 'quickViewProduct' | 'cartDrawerOpen' | 'cartMessage'>;

const INITIAL: Data = { searchOpen: false, mobileMenuOpen: false, quickViewProduct: null, cartDrawerOpen: false, cartMessage: null };
let data = INITIAL;
const listeners = new Set<() => void>();

export function setUI(patch: Partial<Data> | ((current: Data) => Partial<Data>)) {
  data = { ...data, ...(typeof patch === 'function' ? patch(data) : patch) };
  listeners.forEach((listener) => listener());
}

const actions = {
  toggleSearch: () => setUI((s) => ({ searchOpen: !s.searchOpen, mobileMenuOpen: false })),
  openSearch: () => setUI({ searchOpen: true, mobileMenuOpen: false }),
  closeSearch: () => setUI({ searchOpen: false }),
  toggleMobileMenu: () => setUI((s) => ({ mobileMenuOpen: !s.mobileMenuOpen, searchOpen: false })),
  openMobileMenu: () => setUI({ mobileMenuOpen: true, searchOpen: false }),
  closeMobileMenu: () => setUI({ mobileMenuOpen: false }),
  openQuickView: (product: Product) => setUI({ quickViewProduct: product }),
  closeQuickView: () => setUI({ quickViewProduct: null }),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useUIData(): Data {
  return useSyncExternalStore(subscribe, () => data, () => INITIAL);
}

export function useUIStore(): UIState;
export function useUIStore<T>(selector: (state: UIState) => T): T;
export function useUIStore<T>(selector?: (state: UIState) => T) {
  const state: UIState = { ...useUIData(), ...actions };
  return selector ? selector(state) : state;
}
