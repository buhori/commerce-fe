"use client";

import Link from "next/link";
import { formatPrice, formatProductStats, preorderDays, ProductImage, productUrl, useProductFeed, WishlistButton, type ProductListing, type ProductSummary } from "@sellosy/theme";
import s from "./editorial.module.css";

export function ProductCard({ product, currency }: { product: ProductSummary; currency: string }) {
  const preorder = preorderDays(product);
  const soldOut = !preorder && product.stock === 0;
  return (
    <div className={s.cardWrap}>
      {/* Di luar tautan: tombol di dalam <a> tidak valid dan akan membuka produknya. */}
      <WishlistButton productId={product.id} productName={product.name} className={s.cardHeart} />
      <Link href={productUrl(product.slug)} className={s.card}>
        <div className={s.cardImage}>
          <ProductImage src={product.images} name={product.name} />
          {soldOut && <span className={s.badge}>Habis</span>}
          {preorder > 0 && <span className={s.badge}>Pre-order</span>}
        </div>
        <p className={s.cardName}>{product.name}</p>
        <p className={s.cardPrice}>{formatPrice(product.price, currency)}</p>
        {formatProductStats(product) && <p className={s.cardStats}>{formatProductStats(product)}</p>}
      </Link>
    </div>
  );
}

/** Grid dengan kartu Editorial; halaman berikutnya dimuat otomatis lewat useProductFeed. */
export function ProductGrid({ listing, currency }: { listing: ProductListing; currency: string }) {
  const { products, hasMore, status, autoLoad, loadMore, sentinel } = useProductFeed(listing);
  return (
    <>
      <div className={s.grid}>
        {products.map((product) => <ProductCard key={product.id} product={product} currency={currency} />)}
      </div>
      {hasMore && (
        <div ref={sentinel} className={s.more} aria-live="polite">
          {status === "error" && <p role="alert">Produk berikutnya belum dapat dimuat.</p>}
          {status === "error" || !autoLoad
            ? <button type="button" className={s.outlineButton} onClick={() => void loadMore()}>Muat lebih banyak</button>
            : status === "loading" && <p>Memuat…</p>}
        </div>
      )}
    </>
  );
}
