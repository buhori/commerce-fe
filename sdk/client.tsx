"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCart, type CartAction } from "@/components/cart-provider";
import { getCartOriginalUnitPrice, getCartStockLimit, getCartUnitPrice, getCartVariantId, type CartItem } from "@/lib/cart";
import { cartItemsOptions } from "@/lib/cart-queries";
import { emitStoreEvent } from "@/lib/store-events";
import { preorderDays, productQueryString, readProductPage, type ProductQuery } from "@/lib/store-shared";
import type { Product, ProductSummary } from "@/lib/store-api";
import { ProductFeed, useProductFeed as useFeed } from "@/components/product-feed";
import { customerQuery } from "@/lib/customer-query";
import { setWishlisted, WishlistLoginRequired, wishlistIdsKey, wishlistIdsQuery, wishlistProductsKey, wishlistProductsQuery, type WishlistState } from "@/lib/wishlist";
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

/**
 * Jumlah produk di wishlist pembeli untuk lencana di header tema. `available` false bila paket toko tanpa akun
 * pembeli (sembunyikan tautan wishlist); tamu selalu 0. Daftarnya ada di /profile/wishlist.
 */
export function useWishlistCount() {
  const { data } = useQuery(wishlistIdsQuery);
  return { available: data?.available ?? true, count: data?.ids.length ?? 0 };
}

/** Satu baris keranjang yang siap ditampilkan; harga dari backend (sudah diskon), sama dengan yang ditagihkan. */
export interface CartLine {
  /** Kunci stabil untuk React. */
  id: number;
  product: Product | null;
  productId: number;
  variantId: number | null;
  /** Nama varian, mis. "Merah / XL"; null tanpa varian. */
  variantLabel: string | null;
  /** Warna contoh varian (CSS); null tanpa varian. */
  variantColor: string | null;
  name: string;
  slug: string | null;
  image: string | null;
  quantity: number;
  /** Null bila harganya belum bisa dimuat. */
  unitPrice: number | null;
  /** Harga normal sebelum diskon (dicoret); null tanpa diskon. */
  originalPrice: number | null;
  /** Batas stok barang siap kirim; null untuk pre-order atau tanpa batas. */
  stockLimit: number | null;
  /** Hari sampai pre-order dikirim; 0 untuk stok siap. */
  preorder: number;
}

function cartLine(item: CartItem): CartLine {
  const variantId = getCartVariantId(item) ?? null;
  return {
    id: item.id,
    product: item.product,
    productId: item.product_id,
    variantId,
    variantLabel: item.variant?.label || null,
    variantColor: item.variant?.color || null,
    name: item.product?.name || `Produk #${item.product_id}`,
    slug: item.product?.slug ?? null,
    image: item.product?.image ?? item.product?.images ?? null,
    quantity: item.amount,
    unitPrice: getCartUnitPrice(item),
    originalPrice: getCartOriginalUnitPrice(item),
    stockLimit: getCartStockLimit(item),
    preorder: preorderDays(item.product),
  };
}

/**
 * Isi keranjang untuk halaman/laci keranjang buatan tema. `change` menambah, mengurangi, atau menghapus satu baris
 * lewat keranjang platform (dengan event analytics yang sama dengan tampilan bawaan); `setQuantity` mengubah
 * jumlahnya langsung. Gagal = Error dengan pesan untuk pembeli. Checkout tetap halaman /checkout platform.
 */
export function useCartLines(currency: string) {
  const query = useQuery(cartItemsOptions);
  const { modify, pending, refresh } = useCart();
  const lines = (query.data ?? []).map(cartLine);
  const subtotal = lines.every((line) => line.unitPrice !== null)
    ? lines.reduce((sum, line) => sum + (line.unitPrice ?? 0) * line.quantity, 0)
    : null;

  const change = useCallback(async (line: CartLine, action: CartAction, quantity = 1) => {
    await modify(line.productId, action, line.variantId, action === "add" ? quantity : undefined);
    const product = { product_id: line.product?.id ?? line.productId, variant_id: line.variantId };
    if (action === "add") emitStoreEvent("store:cart_item_added", { ...product, qty: quantity, price: line.unitPrice ?? 0, currency, name: line.name });
    else emitStoreEvent("store:cart_item_removed", { ...product, qty: action === "remove" ? line.quantity : 1 });
  }, [modify, currency]);

  /** Tambah produk yang belum tentu ada di keranjang (tombol beli di kartu, quick view). */
  const add = useCallback(async (productId: number, variantId: number | null, quantity = 1, info: { price?: number; name?: string } = {}) => {
    await modify(productId, "add", variantId, quantity);
    emitStoreEvent("store:cart_item_added", { product_id: productId, variant_id: variantId, qty: quantity, price: info.price ?? 0, currency, name: info.name ?? null });
  }, [modify, currency]);

  const setQuantity = useCallback(async (line: CartLine, quantity: number) => {
    if (quantity < 1) return change(line, "remove");
    if (quantity > line.quantity) return change(line, "add", quantity - line.quantity);
    // Backend hanya mengurangi satu per permintaan.
    for (let current = line.quantity; current > quantity; current--) await change({ ...line, quantity: current }, "reduce");
  }, [change]);

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    status: query.isPending ? "loading" as const : query.isError ? "error" as const : "ready" as const,
    pending,
    add,
    change,
    setQuantity,
    reload: refresh,
  };
}

/** Produk di wishlist pembeli (null untuk tamu: arahkan ke /login). */
export function useWishlistProducts() {
  const { data, isPending, isError, refetch } = useQuery(wishlistProductsQuery);
  return { products: data ?? null, status: isPending ? "loading" as const : isError ? "error" as const : "ready" as const, reload: refetch };
}

async function getJson(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Produk belum dapat dimuat.");
  return response.json() as Promise<unknown>;
}

/** Produk toko di browser (slider produk terkait, rekomendasi), satu halaman. Data awal halaman tetap lewat props. */
export function useProducts(query: Omit<ProductQuery, "lastProductId"> = {}, enabled = true) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["theme-products", query],
    queryFn: async () => readProductPage(await getJson(`/api/products?${productQueryString(query)}`)).data,
    enabled,
    staleTime: 60_000,
  });
  return { products: data ?? ([] as ProductSummary[]), status: isPending ? "loading" as const : isError ? "error" as const : "ready" as const };
}

/** Detail satu produk (varian, galeri) di browser, mis. untuk quick view. */
export function useProduct(productId: number | null) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["theme-product", productId],
    queryFn: async () => {
      const body = (await getJson(`/api/products/${productId}`)) as { data?: Product } | Product;
      return ("data" in body && body.data ? body.data : body) as Product;
    },
    enabled: productId !== null,
    staleTime: 60_000,
  });
  return { product: data ?? null, status: isPending ? "loading" as const : isError ? "error" as const : "ready" as const };
}

/**
 * Wishlist untuk banyak produk sekaligus (kartu produk, halaman wishlist tema): ID yang tersimpan dan `toggle(id)`.
 * Sama dengan useWishlist(): tamu diarahkan ke /login, perubahan tampil seketika dan dibatalkan bila gagal.
 * `available` false bila paket toko tanpa akun pembeli (sembunyikan tombolnya).
 */
export function useWishlistActions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useQuery(wishlistIdsQuery);
  const login = useCallback(() => router.push(`/login?next=${encodeURIComponent(pathname)}`), [router, pathname]);

  const mutation = useMutation({
    mutationFn: ({ productId, saved }: { productId: number; saved: boolean }) => setWishlisted(productId, saved),
    onMutate: async ({ productId, saved }) => {
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
    onError: (failure, _input, context) => {
      if (context?.previous) queryClient.setQueryData(wishlistIdsKey, context.previous);
      if (failure instanceof WishlistLoginRequired) login();
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistIdsKey });
      void queryClient.invalidateQueries({ queryKey: wishlistProductsKey });
    },
  });

  const ids = data?.ids ?? [];
  return {
    available: data?.available ?? false,
    ids,
    has: (productId: number) => ids.includes(productId),
    toggle: (productId: number) => {
      if (data && !data.authenticated) return login();
      mutation.mutate({ productId, saved: !ids.includes(productId) });
    },
  };
}
