"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { Icon } from "./icons";

export function CartIndicator() {
  const { count, countError, refreshing } = useCart();
  return (
    <Link
      href="/cart"
      className={`cart-indicator ${countError ? "cart-count-error" : ""}`}
      aria-label={
        countError
          ? "Buka keranjang. Jumlah belum tersedia"
          : `Buka keranjang${count === null ? "" : `: ${count} barang`}`
      }
    >
      <Icon name="bag" />
      <span className="cart-label">Keranjang</span>
      {(countError || (count ?? 0) > 0) && (
        <span className="cart-badge" aria-live="polite">
          {countError ? "!" : refreshing ? "…" : count! > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
