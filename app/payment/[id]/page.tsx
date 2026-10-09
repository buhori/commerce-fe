import type { Metadata } from "next";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { OrderPayment } from "@/components/order-payment";
import { getStore } from "@/lib/store-api";
import Link from "next/link";
import "../payment.css";

export const metadata: Metadata = { title: "Pembayaran — Toko Online" };

export default async function PaymentPage({ params }: PageProps<"/payment/[id]">) {
  const [store, { id }] = await Promise.all([getStore(), params]);
  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page payment-page">
        <div className="container payment-container">
          <nav className="payment-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link><span aria-hidden="true">/</span>
            <span aria-current="page">Pembayaran</span>
          </nav>
          <OrderPayment key={id} orderId={id} currency={store.currency || "IDR"} />
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
