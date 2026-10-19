"use client";

import { useId } from "react";
import { CompareButton, formatDate, formatPrice, ShareButton, useAddToCart, WishlistButton, type Product } from "@sellosy/theme";
import { WhatsappIcon } from "./icons";
import s from "./editorial.module.css";

/**
 * Kotak beli Editorial. Semua aturan (stok, varian, pre-order, batas jumlah, permintaan ke
 * keranjang) dari useAddToCart; tema hanya mengatur tampilan.
 */
export function BuyBox({ product, currency, preorder, maintenance, storeName, url }: {
  product: Product; currency: string; preorder: boolean; maintenance: boolean; storeName: string; url: string;
}) {
  const name = useId();
  const cart = useAddToCart({
    productId: product.id, stock: product.stock, price: product.price, finalPrice: product.final_price, discount: product.discount,
    currency, variants: product.variants, preorder, maintenance,
    whatsapp: product.whatsapp ? { number: product.whatsapp.number, storeName, productName: product.name, productUrl: url } : null,
    productName: product.name,
    image: product.images,
  });

  return (
    <div className={s.buy} aria-busy={cart.pending}>
      <p className={s.productPrice} aria-live="polite">
        {cart.originalPriceLabel && <span className={s.srOnly}>Harga diskon </span>}{cart.priceLabel}
        {cart.originalPriceLabel && <s className={s.priceOriginal}><span className={s.srOnly}>Harga normal </span>{cart.originalPriceLabel}</s>}
        {cart.discountLabel && <span className={s.priceBadge}>{cart.discountLabel}</span>}
      </p>
      {cart.discountEnds && <p className={s.hint}>Diskon berakhir {formatDate(cart.discountEnds)}</p>}

      {cart.variants.length > 0 && (
        <fieldset className={s.variants} disabled={cart.pending}>
          <legend>Varian {cart.selectedVariant && <span>· {cart.selectedVariant.label}</span>}</legend>
          {cart.variants.map((variant) => {
            const outOfStock = !preorder && variant.stock != null && variant.stock <= 0;
            return (
              <label key={variant.id} data-disabled={outOfStock}>
                <input type="radio" name={name} checked={cart.selectedVariant?.id === variant.id} disabled={outOfStock}
                  onChange={() => cart.selectVariant(variant.id)} />
                <span>
                  {variant.color && <i style={{ backgroundColor: variant.color }} aria-hidden="true" />}
                  {variant.label}
                  {cart.variantPrice(variant).final !== cart.basePrice.final && ` · ${formatPrice(cart.variantPrice(variant).final, currency)}`}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className={s.quantity} role="group" aria-label="Jumlah">
        <button type="button" aria-label="Kurangi jumlah" disabled={cart.disabled || cart.quantity <= 1}
          onClick={() => cart.changeQuantity(cart.quantity - 1)}>−</button>
        <input type="number" inputMode="numeric" min={1} max={Math.max(1, cart.max)} value={cart.quantity}
          aria-label="Jumlah barang" disabled={cart.disabled} onChange={(event) => cart.changeQuantity(Number(event.target.value))} />
        <button type="button" aria-label="Tambah jumlah" disabled={cart.disabled || cart.quantity >= cart.max}
          onClick={() => cart.changeQuantity(cart.quantity + 1)}>+</button>
      </div>

      {!cart.complete && <p className={s.hint}>Pilih varian sebelum membeli.</p>}

      {/* Pre-order dibeli sendiri dan langsung ke checkout, jadi hanya satu tombol. */}
      {!preorder && (
        <button type="button" className={s.primaryButton} disabled={cart.disabled} onClick={() => void cart.add("cart")}>
          {cart.soldOut ? "Stok habis" : cart.activeAction === "cart" ? "Menambahkan…" : "Tambah ke tas"}
        </button>
      )}
      <button type="button" className={preorder ? s.primaryButton : s.secondaryButton} disabled={cart.disabled || Boolean(cart.checkoutNote)}
        onClick={() => void cart.add("buy")}>
        {cart.activeAction === "buy" ? "Memproses…" : preorder ? "Pre-order sekarang" : "Beli sekarang"}
      </button>
      {cart.checkoutNote && <p className={s.hint} role="status">{cart.checkoutNote}</p>}
      {/* Tetap tampil saat perawatan dan untuk pre-order: hanya tautan chat, bukan pesanan. */}
      {cart.whatsappUrl && (
        <a className={`${s.secondaryButton} ${s.whatsappButton}`} href={cart.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon />Tanya via WhatsApp<span className={s.srOnly}> (membuka tab baru)</span>
        </a>
      )}
      <WishlistButton productId={product.id} productName={product.name} variant="button" className={s.wishlist} />
      <div className={s.secondaryActions}>
        <CompareButton product={product} className={s.wishlist} />
        <ShareButton url={url} title={product.name} className={s.wishlist} />
      </div>

      {/* Berhasil ditambahkan: notifikasi melayang dari platform (dengan tombol Lihat Cart); di sini hanya kesalahan. */}
      {cart.feedback?.error && (
        <p className={s.feedbackError} role="alert">
          {cart.feedback.message}
        </p>
      )}
    </div>
  );
}
