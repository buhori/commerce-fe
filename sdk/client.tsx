"use client";

import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/components/cart-provider";
import { ProductFeed, useProductFeed as useFeed } from "@/components/product-feed";
import { customerQuery } from "@/lib/customer-query";
import type { ProductListing } from "./types";

/** Grid produk bawaan dengan muat-otomatis halaman berikutnya. Untuk kartu sendiri, pakai useProductFeed(). */
export function ProductGrid({ listing, currency }: { listing: ProductListing; currency: string }) {
  return (
    <ProductFeed key={JSON.stringify(listing.query)} initial={listing.items} initialLastId={listing.lastProductId}
      initialHasMore={listing.hasMore} query={listing.query} currency={currency} />
  );
}

/**
 * Daftar produk yang bertambah sendiri saat digulir, untuk grid dengan kartu buatan tema.
 * Pasang `sentinel` pada elemen setelah grid. Bila `autoLoad` false atau `status` "error",
 * tampilkan tombol yang memanggil `loadMore`. Beri komponennya `key={JSON.stringify(listing.query)}`
 * supaya daftar dimulai ulang saat kategori, pencarian, atau urutan berganti.
 */
export function useProductFeed(listing: ProductListing) {
  return useFeed({ initial: listing.items, initialLastId: listing.lastProductId, initialHasMore: listing.hasMore, query: listing.query });
}

/** Jumlah barang di keranjang untuk tombol keranjang buatan tema. `count` null selama belum dimuat. */
export function useCartCount() {
  const { count, countError, refreshing } = useCart();
  return { count, error: countError, refreshing };
}

/** Pembeli yang sedang masuk (null untuk tamu). Hanya untuk tampilan; aksi akun ada di halaman /profile. */
export function useCustomer() {
  const { data, isPending } = useQuery(customerQuery);
  return { customer: data ?? null, isPending };
}
