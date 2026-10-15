import type { Metadata } from "next";
import { CommerceHeading } from "@/components/commerce-heading";
import "../commerce.css";
import { redirect } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { Checkout } from "@/components/checkout";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { getCustomer } from "@/lib/customer-api";
import { getStore } from "@/lib/store-api";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: true } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const [store, { type }] = await Promise.all([getStore(), searchParams]);
  // Pre-orders are checked out on their own so they never share a shipment with ready items.
  const preorder = type === "preorder";
  // Selama perawatan backend menolak pesanan, jadi pembeli tidak perlu diminta login dulu.
  const closed = store.maintenance.active;
  // Stores that require an account send guests to sign in, then straight back here.
  if (!closed && store.auth_required && !(await getCustomer().catch(() => null))) {
    redirect(`/login?next=${encodeURIComponent(preorder ? "/checkout?type=preorder" : "/checkout")}`);
  }
  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page commerce-page commerce-checkout-page">
        <div className="container commerce-container cart-page checkout-page">
          <CommerceHeading stage="checkout" preorder={preorder} />
          {closed ? (
            <div className="empty-state checkout-maintenance" role="status">
              <Icon name="tool" />
              <h2>Toko sedang dalam perawatan</h2>
              <p>Pesanan belum bisa dibuat untuk sementara. Silakan kembali lagi nanti.</p>
              <ButtonLink href="/">Lihat produk</ButtonLink>
            </div>
          ) : (
            <>
              {preorder && (
                <p className="preorder-summary checkout-preorder-note">
                  Pre-order dipesan terpisah dari keranjang belanja, karena dikirim setelah masa pre-order selesai.
                </p>
              )}
              <Checkout currency={store.currency || "IDR"} preorder={preorder} />
            </>
          )}
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
