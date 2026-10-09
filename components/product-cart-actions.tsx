"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys, startPreorder } from "@/lib/cart-queries";
import { useCart } from "./cart-provider";
import { Icon } from "./icons";
import type { Product } from "@/lib/store-api";
import { formatPrice } from "@/lib/format";

const MAX_QUANTITY = 99;

export function ProductCartActions({
  productId,
  stock,
  price,
  currency,
  variants = [],
  preorder = false,
}: {
  productId: number;
  stock: number;
  price: number;
  currency: string;
  variants?: Product["variants"];
  preorder?: boolean;
}) {
  const { modify, pending } = useCart();
  const router = useRouter();
  const queryClient = useQueryClient();
  const variantGroupId = useId();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeAction, setActiveAction] = useState<"cart" | "buy" | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean; added?: boolean } | null>(null);

  const selectedVariant = variants.find((variant) => variant.id === selectedId);
  const complete = variants.length === 0 || Boolean(selectedVariant);
  // Pre-orders are not limited by stock; ready items are limited by the chosen variant.
  const available = selectedVariant?.stock ?? stock;
  const max = preorder ? MAX_QUANTITY : Math.min(MAX_QUANTITY, Math.max(0, available));
  const soldOut = !preorder && complete && max === 0;
  const disabled = pending || !complete || soldOut;
  const unitPrice = selectedVariant?.price ?? price;
  const variantPrices = variants.map((variant) => variant.price ?? price);
  const low = variantPrices.length ? Math.min(...variantPrices) : price;
  const high = variantPrices.length ? Math.max(...variantPrices) : price;
  const priceLabel = complete ? formatPrice(unitPrice, currency)
    : low === high ? formatPrice(low, currency) : `${formatPrice(low, currency)} – ${formatPrice(high, currency)}`;

  function changeQuantity(value: number) {
    setQuantity(Math.max(1, Math.min(Math.max(1, max), Number.isFinite(value) ? Math.trunc(value) : 1)));
    setFeedback(null);
  }

  async function add(mode: "cart" | "buy") {
    if (disabled) return;
    setActiveAction(mode);
    setFeedback(null);
    try {
      if (preorder) {
        // Pre-orders never share a cart with ready items; they get their own checkout.
        await startPreorder({ productId, variantId: selectedVariant?.id, quantity });
        await queryClient.invalidateQueries({ queryKey: cartKeys.preorder });
        router.push("/checkout?type=preorder");
        return;
      }
      const synced = await modify(productId, "add", selectedVariant?.id, quantity);
      if (mode === "buy") {
        router.push("/checkout");
        return;
      }
      setFeedback({
        message: `${quantity} barang ditambahkan ke keranjang.${synced ? "" : " Jumlah di header belum dapat dimuat ulang."}`,
        error: false,
        added: true,
      });
      setQuantity(1);
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Keranjang belum dapat diperbarui. Silakan coba lagi.",
        error: true,
      });
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <section className="product-cart-actions" aria-label="Beli produk" aria-busy={pending}>
      <div className="purchase-price-block" aria-live="polite">
        <span className="purchase-price-label">{selectedVariant ? `Harga ${selectedVariant.label}` : "Harga produk"}</span>
        <p className="detail-price">{priceLabel}</p>
        <span className="purchase-price-caption">{preorder ? "Tersedia untuk pre-order" : "Harga per barang"}</span>
      </div>
      {variants.length > 0 && (
        <fieldset className="variant-picker" disabled={pending}>
          <legend>Pilih varian <span>{selectedVariant ? selectedVariant.label : `${variants.length} pilihan`}</span></legend>
          <div className="variant-options">
            {variants.map((variant) => {
              const outOfStock = !preorder && variant.stock != null && variant.stock <= 0;
              return (
                <label className="variant-option" key={variant.id} data-disabled={outOfStock}>
                  <input
                    type="radio"
                    name={`product-${productId}-variant-${variantGroupId}`}
                    value={variant.id}
                    checked={selectedId === variant.id}
                    disabled={outOfStock}
                    onChange={() => { setSelectedId(variant.id); setQuantity(1); setFeedback(null); }}
                  />
                  <span className="variant-choice">
                    {variant.color && <span className="variant-swatch" style={{ backgroundColor: variant.color }} aria-hidden="true" />}
                    <span className="variant-choice-copy">
                      <span>{variant.label}</span>
                      <small>
                        {/* A variant price replaces the product price, so show it where it differs. */}
                        {variant.price != null && variant.price !== price && `${formatPrice(variant.price, currency)} · `}
                        {preorder ? "Pre-order" : outOfStock ? "Habis" : "Tersedia"}
                      </small>
                    </span>
                    <span className="variant-check" aria-hidden="true"><Icon name="check" /></span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="purchase-order-row">
        <div className="purchase-quantity">
          <span className="purchase-label" id={`${variantGroupId}-qty`}>Jumlah</span>
          <div className="purchase-quantity-row">
            <div className="quantity-control" role="group" aria-labelledby={`${variantGroupId}-qty`}>
              <Button variant="text" size="icon" type="button" aria-label="Kurangi jumlah" disabled={disabled || quantity <= 1} onClick={() => changeQuantity(quantity - 1)}>−</Button>
              <input type="number" inputMode="numeric" min={1} max={Math.max(1, max)} value={quantity}
                aria-label="Jumlah barang" disabled={disabled}
                onChange={(event) => changeQuantity(Number(event.target.value))} />
              <Button variant="text" size="icon" type="button" aria-label="Tambah jumlah" disabled={disabled || quantity >= max} onClick={() => changeQuantity(quantity + 1)}>+</Button>
            </div>
            {!preorder && complete && max > 0 && <span className="purchase-hint">Maksimal {max}</span>}
          </div>
        </div>
        <div className="purchase-subtotal" aria-live="polite"><span>Subtotal</span><strong>{complete ? formatPrice(unitPrice * quantity, currency) : "Pilih varian"}</strong></div>
      </div>

      {!complete && <p className="variant-hint">Pilih varian sebelum membeli.</p>}

      <div className="purchase-dock">
        <div className="purchase-mobile-summary"><span>{!complete ? "Pilih varian terlebih dahulu" : `${quantity} barang`}</span><strong>{complete ? formatPrice(unitPrice * quantity, currency) : priceLabel}</strong></div>
        {/* Pre-orders are bought on their own, so they go straight to checkout. */}
        <div className="purchase-buttons" data-single={preorder}>
          <Button type="button" disabled={disabled} onClick={() => void add("buy")}>
            {soldOut ? "Stok habis" : activeAction === "buy" ? "Memproses…" : preorder ? "Pre-order sekarang" : "Beli sekarang"}
            {!soldOut && activeAction !== "buy" && <Icon name="arrow" />}
          </Button>
          {!preorder && (
            <Button type="button" variant="secondary" disabled={disabled} onClick={() => void add("cart")}>
              <Icon name="bag" />
              <span className="purchase-cart-label">{activeAction === "cart" ? "Menambahkan…" : "Tambah ke keranjang"}</span>
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <p className={`cart-feedback ${feedback.error ? "cart-feedback-error" : ""}`} role={feedback.error ? "alert" : "status"}>
          {feedback.message}
          {feedback.added && <> <ButtonLink variant="text" href="/cart">Lihat keranjang →</ButtonLink></>}
        </p>
      )}
    </section>
  );
}
