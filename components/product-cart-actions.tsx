"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys, startPreorder } from "@/lib/cart-queries";
import { showCartToast } from "./cart-toast";
import { useCart } from "./cart-provider";
import { Icon } from "./icons";
import type { Discount, Product } from "@/lib/store-api";
import { formatDate, formatPrice } from "@/lib/format";
import { discountEndDate, priceView, type PriceView } from "@/lib/price";
import { MAINTENANCE_NOTE } from "@/lib/store-shared";
import { emitStoreEvent } from "@/lib/store-events";
import { whatsappChatUrl, type WhatsappProductChat } from "@/lib/whatsapp";

const MAX_QUANTITY = 99;

export interface AddToCartOptions {
  productId: number;
  stock: number;
  price: number;
  /** product.final_price: harga setelah diskon otomatis; kosong berarti tanpa diskon. */
  finalPrice?: number | null;
  /** product.discount, untuk lencana dan tanggal berakhirnya. */
  discount?: Discount | null;
  currency: string;
  variants?: Product["variants"];
  preorder?: boolean;
  /** store.maintenance.active: beli sekarang dan pre-order ditutup, tambah ke keranjang tetap bisa. */
  maintenance?: boolean;
  /**
   * Chat WhatsApp tentang produk ini (bila product.whatsapp ada); hook menambahkan varian yang
   * dipilih ke pesannya. Tidak ikut dimatikan saat perawatan atau pre-order: hanya tautan chat.
   */
  whatsapp?: WhatsappProductChat | null;
  /** Nama dan foto produk untuk notifikasi "Ditambahkan ke keranjang"; tanpa keduanya notifikasinya umum. */
  productName?: string | null;
  image?: string | null;
}

/**
 * Buying logic without markup: variant choice, quantity limits, price, and the add/buy actions.
 * Pre-orders skip the cart and open their own checkout.
 */
export function useAddToCart({ productId, stock, price, finalPrice, discount, currency, variants = [], preorder = false, maintenance = false, whatsapp = null, productName = null, image = null }: AddToCartOptions) {
  const { modify, pending } = useCart();
  const router = useRouter();
  const queryClient = useQueryClient();
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
  // Alasan tombol yang menuju checkout dimatikan; pre-order selalu langsung ke checkout.
  const checkoutNote = maintenance ? MAINTENANCE_NOTE : null;
  // Semua harga di sini adalah harga setelah diskon, sama dengan yang ditagihkan di keranjang.
  const base = { price, final_price: finalPrice, discount };
  const basePrice = priceView(base);
  const variantPrice = (variant: Product["variants"][number]) => priceView(variant, base);
  const variantViews = variants.map(variantPrice);
  const selectedPrice: PriceView | null = selectedVariant ? variantPrice(selectedVariant) : variants.length === 0 ? basePrice : null;
  const unitPrice = (selectedPrice ?? basePrice).final;
  const range = (amounts: number[]) => {
    const low = amounts.length ? Math.min(...amounts) : basePrice.final;
    const high = amounts.length ? Math.max(...amounts) : basePrice.final;
    return low === high ? formatPrice(low, currency) : `${formatPrice(low, currency)} – ${formatPrice(high, currency)}`;
  };
  const priceLabel = selectedPrice ? formatPrice(selectedPrice.final, currency) : range(variantViews.map((view) => view.final));
  // Sebelum varian dipilih, harga normal ditampilkan sebagai rentang bila ada varian yang diskon.
  const discounted = selectedPrice ? (selectedPrice.original !== null ? selectedPrice : null) : variantViews.find((view) => view.original !== null) ?? null;
  const originalLabel = !discounted ? null
    : selectedPrice ? formatPrice(selectedPrice.original!, currency)
    : range(variantViews.map((view) => view.original ?? view.final));
  const originalPriceLabel = originalLabel !== priceLabel ? originalLabel : null;
  const discountLabel = discounted?.label ?? null;
  const discountEnds = discountEndDate(discounted?.endsAt);
  // Dibuat ulang setiap pilihan varian berubah, supaya penjual tahu varian yang ditanyakan.
  const whatsappUrl = whatsapp ? whatsappChatUrl({ ...whatsapp, variantLabel: selectedVariant?.label }) : null;

  function changeQuantity(value: number) {
    setQuantity(Math.max(1, Math.min(Math.max(1, max), Number.isFinite(value) ? Math.trunc(value) : 1)));
    setFeedback(null);
  }

  function selectVariant(id: number) {
    setSelectedId(id);
    setQuantity(1);
    setFeedback(null);
  }

  async function add(mode: "cart" | "buy") {
    if (disabled) return;
    // Penjaga untuk tema yang tidak mematikan tombolnya: checkout pasti ditolak backend.
    if (checkoutNote && (preorder || mode === "buy")) {
      setFeedback({ message: checkoutNote, error: true });
      return;
    }
    setActiveAction(mode);
    setFeedback(null);
    const added = () => emitStoreEvent("store:cart_item_added", {
      product_id: productId, variant_id: selectedVariant?.id ?? null, qty: quantity, price: unitPrice, currency,
    });
    try {
      if (preorder) {
        // Pre-orders never share a cart with ready items; they get their own checkout.
        await startPreorder({ productId, variantId: selectedVariant?.id, quantity });
        added();
        await queryClient.invalidateQueries({ queryKey: cartKeys.preorder });
        router.push("/checkout?type=preorder");
        return;
      }
      const synced = await modify(productId, "add", selectedVariant?.id, quantity);
      added();
      if (mode === "buy") {
        router.push("/checkout");
        return;
      }
      setFeedback({
        message: `${quantity} barang ditambahkan ke keranjang.${synced ? "" : " Jumlah di header belum dapat dimuat ulang."}`,
        error: false,
        added: true,
      });
      // Notifikasi melayang dengan tombol "Lihat Cart", sama di semua tema (CartToast di layout).
      showCartToast({ name: productName, variant: selectedVariant?.label ?? null, quantity, image });
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

  return {
    variants, selectedVariant, selectVariant, quantity, changeQuantity, max, complete, soldOut, disabled, pending,
    preorder, unitPrice, priceLabel, subtotal: unitPrice * quantity, activeAction, feedback, add, checkoutNote,
    /** Harga normal yang dicoret (satu harga atau rentang); null bila tidak ada diskon. */
    originalPriceLabel,
    /** Lencana diskon, mis. "-20%". */
    discountLabel,
    /** Tanggal diskon berakhir, untuk "Berakhir …"; null bila tanpa batas. */
    discountEnds,
    /** Harga satu varian setelah diskon, untuk daftar pilihan varian. */
    variantPrice,
    /** Harga produk tanpa varian terpilih. */
    basePrice,
    /** Tautan wa.me dengan varian terpilih di pesannya; null bila produk tanpa chat WhatsApp. Buka di tab baru. */
    whatsappUrl,
  };
}

export function ProductCartActions(options: AddToCartOptions) {
  const { productId, currency } = options;
  const variantGroupId = useId();
  const {
    variants, selectedVariant, selectVariant, quantity, changeQuantity, max, complete, soldOut, disabled, pending,
    preorder, unitPrice, priceLabel, activeAction, feedback, add, checkoutNote,
    originalPriceLabel, discountLabel, discountEnds, variantPrice, basePrice, whatsappUrl,
  } = useAddToCart(options);

  return (
    <section className="product-cart-actions" aria-label="Beli produk" aria-busy={pending}>
      <div className="purchase-price-block" aria-live="polite">
        <span className="purchase-price-label">{selectedVariant ? `Harga ${selectedVariant.label}` : "Harga produk"}</span>
        <p className="detail-price">{originalPriceLabel && <span className="sr-only">Harga diskon </span>}{priceLabel}</p>
        {originalPriceLabel && (
          <p className="detail-price-discount">
            <s className="price-original"><span className="sr-only">Harga normal </span>{originalPriceLabel}</s>
            {discountLabel && <span className="price-badge"><span className="sr-only">Diskon </span>{discountLabel}</span>}
            {discountEnds && <span className="detail-price-ends">Berakhir {formatDate(discountEnds)}</span>}
          </p>
        )}
        <span className="purchase-price-caption">{preorder ? "Tersedia untuk pre-order" : "Harga per barang"}</span>
      </div>
      {variants.length > 0 && (
        <fieldset className="variant-picker" disabled={pending}>
          <legend>Pilih varian <span>{selectedVariant ? selectedVariant.label : `${variants.length} pilihan`}</span></legend>
          <div className="variant-options">
            {variants.map((variant) => {
              const outOfStock = !preorder && variant.stock != null && variant.stock <= 0;
              const variantFinal = variantPrice(variant).final;
              return (
                <label className="variant-option" key={variant.id} data-disabled={outOfStock}>
                  <input
                    type="radio"
                    name={`product-${productId}-variant-${variantGroupId}`}
                    value={variant.id}
                    checked={selectedVariant?.id === variant.id}
                    disabled={outOfStock}
                    onChange={() => selectVariant(variant.id)}
                  />
                  <span className="variant-choice">
                    {variant.color && <span className="variant-swatch" style={{ backgroundColor: variant.color }} aria-hidden="true" />}
                    <span className="variant-choice-copy">
                      <span>{variant.label}</span>
                      <small>
                        {/* A variant price replaces the product price, so show it where it differs. */}
                        {variantFinal !== basePrice.final && `${formatPrice(variantFinal, currency)} · `}
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
          <Button type="button" disabled={disabled || Boolean(checkoutNote)} onClick={() => void add("buy")}>
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

      {checkoutNote && <p className="maintenance-note" role="status">{checkoutNote}</p>}
      {/* Di luar dock supaya bar bawah di HP tetap ringkas; tautan biasa karena tujuannya di luar toko. */}
      {whatsappUrl && (
        <ButtonLink variant="secondary" className="purchase-whatsapp" href={whatsappUrl} reloadDocument target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" />
          Tanya via WhatsApp<span className="sr-only"> (membuka tab baru)</span>
        </ButtonLink>
      )}
      {/* Berhasil ditambahkan: diberitahukan lewat notifikasi melayang (CartToast); di sini hanya kesalahan. */}
      {feedback?.error && (
        <p className="cart-feedback cart-feedback-error" role="alert">{feedback.message}</p>
      )}
    </section>
  );
}
