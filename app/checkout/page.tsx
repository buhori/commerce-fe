import type { Metadata } from "next";
import { CommerceHeading } from "@/components/commerce-heading";
import "../commerce.css";
import { redirect } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { Checkout } from "@/components/checkout";
import { getCustomer } from "@/lib/customer-api";
import { getStore } from "@/lib/store-api";

export const metadata: Metadata = { title: "Checkout — Toko Online" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const [store, { type }] = await Promise.all([getStore(), searchParams]);
  // Pre-orders are checked out on their own so they never share a shipment with ready items.
  const preorder = type === "preorder";
  // Stores that require an account send guests to sign in, then straight back here.
  if (store.auth_required && !(await getCustomer().catch(() => null))) {
    redirect(`/login?next=${encodeURIComponent(preorder ? "/checkout?type=preorder" : "/checkout")}`);
  }
  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page commerce-page commerce-checkout-page">
        <div className="container commerce-container cart-page checkout-page">
          <CommerceHeading stage="checkout" preorder={preorder} />
          {preorder && (
            <p className="preorder-summary checkout-preorder-note">
              Pre-order dipesan terpisah dari keranjang belanja, karena dikirim setelah masa pre-order selesai.
            </p>
          )}
          <Checkout currency={store.currency || "IDR"} preorder={preorder} />
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
