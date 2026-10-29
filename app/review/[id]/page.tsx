import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderReviews } from "@/components/order-reviews";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { ButtonLink } from "@/components/ui/button";
import { readInvoiceAccess } from "@/lib/invoice";
import { getReviewOrder } from "@/lib/review-order";
import { getStore } from "@/lib/store-api";
import { reviewsEnabled } from "@/lib/store-shared";
import "../../payment/payment.css";

export const metadata: Metadata = {
  title: "Beri ulasan",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Halaman ulasan dari email permintaan ulasan: link bertanda tangan, jadi pembeli tamu pun bisa
 * mengulas dari perangkat lain. Tanpa tanda tangan, pemilik pesanan diarahkan ke halaman pesanannya.
 */
export default async function ReviewPage({ params, searchParams }: PageProps<"/review/[id]">) {
  const [store, { id }, query] = await Promise.all([getStore(), params, searchParams]);
  const access = readInvoiceAccess(query);
  if (!access) redirect(`/payment/${id}`);
  const order = reviewsEnabled(store) ? await getReviewOrder(id, access) : null;

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page payment-page">
        <div className="container payment-container">
          <nav className="payment-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link><span aria-hidden="true">/</span>
            <span aria-current="page">Beri ulasan</span>
          </nav>
          {!reviewsEnabled(store) ? (
            <div className="empty-state">
              <h1>Ulasan belum tersedia</h1>
              <p>Toko ini belum menerima ulasan produk.</p>
              <ButtonLink href="/">Lihat produk</ButtonLink>
            </div>
          ) : !order ? (
            <div className="empty-state">
              <h1>Link ulasan tidak berlaku</h1>
              <p>Link ini sudah kedaluwarsa atau tidak lengkap. Buka pesanan dari perangkat yang dipakai saat belanja untuk mengulas.</p>
              <ButtonLink href="/">Lihat produk</ButtonLink>
            </div>
          ) : !order.reviewable ? (
            <div className="empty-state">
              <h1>Pesanan belum sampai</h1>
              <p>Ulasan bisa ditulis setelah pesanan {order.invoiceNumber} diterima.</p>
              <ButtonLink href="/">Lihat produk</ButtonLink>
            </div>
          ) : (
            <OrderReviews orderId={order.orderId} items={order.items} access={access} photos={order.reviewPhotos} video={order.reviewVideos} />
          )}
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
