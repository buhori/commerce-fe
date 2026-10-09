import type { Metadata } from "next";
import { CommerceHeading } from "@/components/commerce-heading";
import "../commerce.css";
import { CartItems } from "@/components/cart-items";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { getStore } from "@/lib/store-api";

export const metadata: Metadata = { title: "Keranjang Belanja — Toko Online" };

export default async function CartPage() {
  const store = await getStore();
  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page commerce-page commerce-cart-page">
        <div className="container commerce-container cart-page">
          <CommerceHeading stage="cart" />
          <CartItems currency={store.currency || "IDR"} />
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
