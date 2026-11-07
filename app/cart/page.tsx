import type { Metadata } from "next";
import { CommerceHeading } from "@/components/commerce-heading";
import "../commerce.css";
import { CartItems } from "@/components/cart-items";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

export const metadata: Metadata = { title: "Keranjang Belanja", robots: { index: false, follow: true } };

export default async function CartPage() {
  const [store, theme] = await Promise.all([getStore(), getActiveTheme()]);
  const { CartPage: ThemeCartPage } = theme.components;
  if (ThemeCartPage) {
    return (
      <>
        <StoreHeader name={store.name} logo={store.logo} />
        <ThemeCartPage store={store} />
        <SiteFooter store={store} />
      </>
    );
  }
  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page commerce-page commerce-cart-page">
        <div className="container commerce-container cart-page">
          <CommerceHeading stage="cart" />
          <CartItems currency={store.currency || "IDR"} maintenance={store.maintenance.active} />
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
