"use client";

import Link from "next/link";
import { useId } from "react";
import { formatPrice, useAddToCart, WishlistButton, type Product } from "@sellosy/theme";
import s from "./editorial.module.css";

/**
 * Kotak beli Editorial. Semua aturan (stok, varian, pre-order, batas jumlah, permintaan ke
 * keranjang) dari useAddToCart; tema hanya mengatur tampilan.
 */
export function BuyBox({ product, currency, preorder }: { product: Product; currency: string; preorder: boolean }) {
  const name = useId();
  const cart = useAddToCart({
    productId: product.id, stock: product.stock, price: product.price, currency, variants: product.variants, preorder,
  });

  return (
    <div className={s.buy} aria-busy={cart.pending}>
      <p className={s.productPrice} aria-live="polite">{cart.priceLabel}</p>

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
                  {variant.price != null && variant.price !== product.price && ` · ${formatPrice(variant.price, currency)}`}
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
      <button type="button" className={preorder ? s.primaryButton : s.secondaryButton} disabled={cart.disabled}
        onClick={() => void cart.add("buy")}>
        {cart.activeAction === "buy" ? "Memproses…" : preorder ? "Pre-order sekarang" : "Beli sekarang"}
      </button>
      <WishlistButton productId={product.id} productName={product.name} variant="button" className={s.wishlist} />

      {cart.feedback && (
        <p className={cart.feedback.error ? s.feedbackError : s.feedback} role={cart.feedback.error ? "alert" : "status"}>
          {cart.feedback.message} {cart.feedback.added && <Link href="/cart">Lihat tas →</Link>}
        </p>
      )}
    </div>
  );
}
