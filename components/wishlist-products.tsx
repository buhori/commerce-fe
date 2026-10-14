"use client";

import { useQuery } from "@tanstack/react-query";
import { wishlistProductsQuery } from "@/lib/wishlist";
import { Catalog } from "./catalog";
import { Spinner } from "./spinner";
import { Button, ButtonLink } from "./ui/button";

/** Produk yang disimpan pembeli; tombol hati di kartu menghapusnya langsung dari daftar ini. */
export function WishlistProducts({ currency }: { currency: string }) {
  const { data: products, status, refetch } = useQuery(wishlistProductsQuery);

  if (status === "pending") return <div className="profile-empty" aria-busy="true"><Spinner label="Memuat wishlist…" /></div>;
  if (status === "error") return (
    <div className="profile-empty" role="alert">
      <p>Wishlist belum dapat dimuat.</p>
      <Button type="button" variant="secondary" onClick={() => void refetch()}>Coba lagi</Button>
    </div>
  );
  if (!products?.length) return (
    <div className="profile-empty">
      <p>Wishlist Anda masih kosong. Tekan ikon hati pada produk untuk menyimpannya di sini.</p>
      <ButtonLink href="/products" variant="secondary">Lihat produk</ButtonLink>
    </div>
  );
  return <div className="storefront-catalog profile-wishlist"><Catalog products={products} currency={currency} /></div>;
}
