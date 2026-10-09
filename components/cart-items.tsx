"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cartItemsOptions } from "@/lib/cart-queries";
import { getCartStockLimit, getCartUnitPrice, getCartVariantId, type CartItem } from "@/lib/cart";
import { addDays, formatDate, formatPrice } from "@/lib/format";
import { preorderDays } from "@/lib/store-api";
import { ProductImage } from "./product-image";
import { useCart, type CartAction } from "./cart-provider";
import { Icon } from "./icons";
import { Spinner } from "./spinner";

export function CartItems({ currency }: { currency: string }) {
  const { countError, refreshing, pending, refresh } = useCart();
  return <>
    {countError && <div className="address-notice" role="alert">
      <p>Jumlah keranjang pada header belum dapat dimuat.</p>
      <Button variant="secondary" disabled={refreshing || pending} onClick={() => void refresh()}>Coba lagi jumlah keranjang</Button>
    </div>}
    <CartContents currency={currency} />
  </>;
}

function CartContents({ currency }: { currency: string }) {
  const itemsQuery = useQuery(cartItemsOptions);
  const items = itemsQuery.data ?? [];
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const { modify, pending, refresh } = useCart();
  const actionLock = useRef(false);

  async function updateItem(item: CartItem, action: CartAction) {
    if (actionLock.current) return;
    actionLock.current = true;
    setUpdating(true);
    setFeedback(null);
    try {
      const countSynced = await modify(item.product_id, action, getCartVariantId(item));
      if (!countSynced) {
        setFeedback({ message: "Jumlah pada header belum dapat dimuat ulang.", error: false });
      }
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error
            ? error.message
            : "Keranjang belum dapat diperbarui.",
        error: true,
      });
    } finally {
      actionLock.current = false;
      setUpdating(false);
    }
  }

  function retry() {
    void refresh();
  }

  if (itemsQuery.isPending)
    return (
      <div className="empty-state" aria-busy="true">
        <Spinner size={28} label="Memuat isi keranjang…" />
      </div>
    );
  if (itemsQuery.isError)
    return (
      <div className="empty-state" role="alert">
        <Icon name="bag" />
        <h2>Isi keranjang belum dapat dimuat</h2>
        <p>{itemsQuery.error.message}</p>
        <Button disabled={itemsQuery.isFetching} onClick={retry}>
          {itemsQuery.isFetching ? "Memuat…" : "Coba lagi"}
        </Button>
      </div>
    );
  if (items.length === 0)
    return (
      <div className="empty-state">
        <Icon name="bag" />
        <h2>Keranjang kosong</h2>
        <ButtonLink href="/">
          Lihat produk
        </ButtonLink>
      </div>
    );

  const totalItems = items.reduce((sum, item) => sum + item.amount, 0);
  const lines = items.map((item) => {
    const unitPrice = getCartUnitPrice(item);
    return { item, unitPrice, total: unitPrice === null ? null : unitPrice * item.amount };
  });
  const totalKnown = lines.every((line) => line.total !== null);
  const subtotal = lines.reduce(
    (sum, line) => sum + (line.total ?? 0),
    0,
  );
  // Product details and header count refreshes must not block cart mutations.
  // The backend decides whether an existing cart item can be incremented.
  const disabled = updating || pending;
  const stockProblem = items.some((item) => {
    const limit = getCartStockLimit(item);
    return limit !== null && item.amount > limit;
  });
  const longestPreorder = Math.max(0, ...items.map((item) => preorderDays(item.product)));

  return (
    <>
      <div className="cart-layout" aria-busy={updating}>
        <div className="cart-lines">
          <div className="commerce-card-heading">
            <div><span className="commerce-section-icon"><Icon name="bag" /></span><h2>Produk pilihan Anda</h2></div>
            <span className="commerce-count">{totalItems} barang</span>
          </div>
          {/* The changed amount and subtotal already confirm success; only problems need words. */}
          {feedback && (
            <p
              className={`cart-feedback ${feedback.error ? "cart-feedback-error" : ""}`}
              role={feedback.error ? "alert" : "status"}
            >
              {feedback.message}
            </p>
          )}
          <ul>
            {lines.map(({ item, unitPrice, total }) => {
              const product = item.product;
              const preorder = preorderDays(product);
              const limit = getCartStockLimit(item);
              const overStock = limit !== null && item.amount > limit;
              return (
                <li className="cart-line" key={item.id}>
                  <div className="cart-line-art" aria-hidden="true">
                    <ProductImage key={product?.image} src={product?.image} name={product?.name || ""} />
                  </div>
                  <div className="cart-line-info">
                    {product?.slug ? (
                      <Link href={`/products/${encodeURIComponent(product.slug)}`}>
                        <h2>{product.name}</h2>
                      </Link>
                    ) : (
                      <h2>{product?.name || `Produk #${item.product_id}`}</h2>
                    )}
                    {item.variant?.label && (
                      <p className="cart-line-variant">
                        <span className="variant-swatch" style={{ backgroundColor: item.variant.color }} aria-hidden="true" />
                        {item.variant.label}
                      </p>
                    )}
                    <p className="cart-line-price">
                      {unitPrice !== null
                        ? formatPrice(unitPrice, currency)
                        : "Harga belum tersedia"}
                    </p>
                    {preorder > 0 ? (
                      <p className="cart-line-note">
                        <span className="preorder-tag">Pre-order</span>
                        Siap dikirim ± {formatDate(addDays(preorder))}
                      </p>
                    ) : overStock ? (
                      <p className="cart-line-note cart-line-warning" role="alert">
                        {limit === 0 ? "Stok habis, hapus barang ini untuk checkout." : `Stok tinggal ${limit}, kurangi jumlahnya.`}
                      </p>
                    ) : limit !== null && limit <= 5 ? (
                      <p className="cart-line-note">Stok tersisa {limit}</p>
                    ) : null}
                    <div className="cart-line-controls">
                      <div
                        className="quantity-control"
                        role="group"
                        aria-label={`Jumlah ${product?.name || `produk ${item.product_id}`}`}
                      >
                        <Button variant="text" size="icon"
                          disabled={disabled}
                          aria-label={`Kurangi ${product?.name || `produk ${item.product_id}`}`}
                          onClick={() =>
                            void updateItem(
                              item,
                              item.amount === 1 ? "remove" : "reduce",
                            )
                          }
                        >
                          −
                        </Button>
                        <span aria-live="polite">{item.amount}</span>
                        <Button variant="text" size="icon"
                          disabled={disabled || (limit !== null && item.amount >= limit)}
                          aria-label={`Tambah ${product?.name || `produk ${item.product_id}`}`}
                          onClick={() => void updateItem(item, "add")}
                        >
                          +
                        </Button>
                      </div>
                      <Button variant="text" className="cart-remove"
                        disabled={disabled}
                        onClick={() => void updateItem(item, "remove")}
                        aria-label={`Hapus ${product?.name || `produk ${item.product_id}`}`}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                  <strong className="cart-line-total">
                    {total !== null
                      ? formatPrice(total, currency)
                      : "—"}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="commerce-sidebar" aria-label="Ringkasan belanja">
        <section className="cart-summary">
          <h2>Ringkasan belanja</h2>
          <div>
            <span>Jumlah barang</span>
            <strong>{totalItems}</strong>
          </div>
          <div className="commerce-summary-row">
            <span>Ongkos kirim</span><span>Dihitung saat checkout</span>
          </div>
          <div className="cart-subtotal cart-total">
            <span>Subtotal belanja</span>
            <strong>
              {totalKnown ? formatPrice(subtotal, currency) : "Belum tersedia"}
            </strong>
          </div>
          <p>
            {totalKnown
              ? "Belum termasuk ongkos kirim. Lengkapi alamat pengiriman di checkout."
              : "Sebagian harga belum tersedia. Muat ulang untuk menghitung subtotal."}
          </p>
          {!totalKnown && (
            <Button variant="secondary"
              disabled={disabled}
              onClick={retry}
            >
              Muat ulang keranjang
            </Button>
          )}
          {longestPreorder > 0 && (
            <p className="preorder-summary">
              Ada barang pre-order. Seluruh pesanan dikirim bersama, paling cepat{" "}
              <strong>{formatDate(addDays(longestPreorder))}</strong>.
            </p>
          )}
          {stockProblem ? (
            <p className="cart-feedback cart-feedback-error" role="alert">
              Sesuaikan jumlah barang yang melebihi stok sebelum checkout.
            </p>
          ) : (
            <ButtonLink href="/checkout">
              Lanjut ke checkout <Icon name="arrow" />
            </ButtonLink>
          )}
        </section>
        <p className="commerce-note"><Icon name="info" />Jumlah barang dan ongkos kirim bisa Anda periksa kembali sebelum membuat pesanan.</p>
        <ButtonLink variant="secondary" href="/" className="commerce-continue">Lanjut belanja<Icon name="arrow" /></ButtonLink>
        </aside>
      </div>
    </>
  );
}
