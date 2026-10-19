"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import { ProductImage } from "./product-image";

export interface CartToastDetail {
  name?: string | null;
  variant?: string | null;
  quantity: number;
  image?: string | null;
}

const EVENT = "sellosy:cart-added";

/** Lama notifikasi tampil; berhenti sementara selama disorot atau difokus. */
export const CART_TOAST_MS = 3000;

/** Tampilkan notifikasi "Ditambahkan ke keranjang" (dipanggil useAddToCart, berlaku di semua tema). */
export function showCartToast(detail: CartToastDetail): void {
  window.dispatchEvent(new CustomEvent<CartToastDetail>(EVENT, { detail }));
}

/**
 * Notifikasi melayang di atas layar setelah barang masuk keranjang, dengan tombol "Lihat Cart". Hilang
 * sendiri saat garis progresnya habis (CART_TOAST_MS); tambah lagi memulai ulang hitungannya.
 */
export function CartToast() {
  const [toast, setToast] = useState<(CartToastDetail & { id: number }) | null>(null);

  useEffect(() => {
    let id = 0;
    const show = (event: Event) => setToast({ ...(event as CustomEvent<CartToastDetail>).detail, id: ++id });
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setToast(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [toast]);

  return (
    // Selalu ada di halaman supaya pembaca layar mengumumkan isinya saat muncul.
    <div className="cart-toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="cart-toast" style={{ "--cart-toast-ms": `${CART_TOAST_MS}ms` } as CSSProperties}>
          <span className="cart-toast-art" aria-hidden="true">
            <ProductImage key={toast.image} src={toast.image} name="" />
          </span>
          <div className="cart-toast-text">
            <strong><Icon name="check" /> Ditambahkan ke keranjang</strong>
            {toast.name && (
              <span>{toast.name}{toast.variant ? ` · ${toast.variant}` : ""} · {toast.quantity} barang</span>
            )}
          </div>
          <Link className="cart-toast-action" href="/cart" onClick={() => setToast(null)}>Lihat Cart</Link>
          <button type="button" className="cart-toast-close" aria-label="Tutup notifikasi" onClick={() => setToast(null)}>
            <Icon name="close" />
          </button>
          <span className="cart-toast-progress" aria-hidden="true" onAnimationEnd={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
