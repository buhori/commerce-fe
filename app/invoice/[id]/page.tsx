import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { formatDate, formatPrice } from "@/lib/format";
import { getInvoice, type Invoice } from "@/lib/invoice";
import "../invoice.css";

export async function generateMetadata({ params }: PageProps<"/invoice/[id]">): Promise<Metadata> {
  const invoice = await getInvoice((await params).id);
  return {
    title: invoice ? `Invoice ${invoice.number}` : "Invoice",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

const stamps: Record<Invoice["payment_state"], string> = {
  paid: "Lunas",
  unpaid: "Belum dibayar",
  void: "Dibatalkan",
  refunded: "Dikembalikan",
};

// Tanggal dari backend sudah dalam zona waktu toko; ambil bagian tanggalnya saja supaya
// tidak bergeser mengikuti zona waktu server.
const day = (iso: string | null) => (iso ? formatDate(new Date(`${iso.slice(0, 10)}T00:00:00`)) : "—");

/**
 * Invoice pesanan untuk pembeli, siap dicetak atau disimpan sebagai PDF. Hanya pemilik pesanan
 * (akun atau perangkat tamu yang membuatnya) yang bisa membukanya.
 */
export default async function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  // Link lama dengan nomor pesanan asli (masa transisi): pakai alamat dengan nomor tersamar.
  if (invoice && String(invoice.order_id) !== id) redirect(`/invoice/${invoice.order_id}`);

  if (!invoice) {
    return (
      <main className="invoice-page">
        <div className="empty-state">
          <h1>Invoice tidak ditemukan</h1>
          <p>Pesanan ini tidak ada, atau dibuat dari akun atau perangkat lain.</p>
          <ButtonLink href="/">Lihat produk</ButtonLink>
        </div>
      </main>
    );
  }

  const money = (amount: number) => formatPrice(amount, invoice.currency);
  const { store, buyer } = invoice;

  return (
    <main className="invoice-page">
      <div className="invoice-toolbar">
        <ButtonLink variant="secondary" href={`/payment/${invoice.order_id}`}>Kembali ke pesanan</ButtonLink>
        <PrintButton />
      </div>

      <article className="invoice-sheet" aria-labelledby="invoice-title">
        <header className="invoice-header">
          <div className="invoice-store">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo toko dari S3, dicetak apa adanya. */}
            {store.logo && <img src={store.logo} alt="" />}
            <div>
              <strong>{store.name}</strong>
              {store.address && <p>{store.address}</p>}
              {(store.phone || store.email) && <p>{[store.phone, store.email].filter(Boolean).join(" · ")}</p>}
            </div>
          </div>
          <div className="invoice-identity">
            <h1 id="invoice-title">INVOICE</h1>
            <p>{invoice.number}</p>
            <span className="invoice-stamp" data-state={invoice.payment_state}>{stamps[invoice.payment_state]}</span>
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <h2>Ditagihkan kepada</h2>
            {buyer ? (
              <>
                <strong>{buyer.name}</strong>
                {buyer.address && <p>{buyer.address}</p>}
                {buyer.region && <p>{buyer.region}</p>}
                {(buyer.phone || buyer.email) && <p>{[buyer.phone, buyer.email].filter(Boolean).join(" · ")}</p>}
              </>
            ) : <p>—</p>}
          </div>
          <dl>
            <div><dt>Tanggal</dt><dd>{day(invoice.issued_at)}</dd></div>
            <div><dt>Pesanan</dt><dd>#{invoice.order_id}</dd></div>
            <div><dt>Status</dt><dd>{invoice.status_label}</dd></div>
            {invoice.paid_at && <div><dt>Dibayar</dt><dd>{day(invoice.paid_at)}</dd></div>}
            {invoice.payment_method && <div><dt>Pembayaran</dt><dd>{invoice.payment_method}</dd></div>}
            {invoice.shipping_method && (
              <div><dt>Pengiriman</dt><dd>{invoice.shipping_method}{invoice.tracking_number && <><br />Resi {invoice.tracking_number}</>}</dd></div>
            )}
          </dl>
        </section>

        <table className="invoice-items">
          <thead>
            <tr><th scope="col">Produk</th><th scope="col" className="num">Jumlah</th><th scope="col" className="num">Harga</th><th scope="col" className="num">Total</th></tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>
                  <strong>{item.name}</strong>
                  {(item.variant || item.sku) && <small>{[item.variant, item.sku && `SKU ${item.sku}`].filter(Boolean).join(" · ")}</small>}
                </td>
                <td className="num">{item.quantity}</td>
                <td className="num">{money(item.unit_price)}</td>
                <td className="num">{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="invoice-totals">
          <div><dt>Subtotal</dt><dd>{money(invoice.subtotal)}</dd></div>
          {invoice.discount_amount > 0 && <div><dt>Kupon{invoice.coupon_code && ` ${invoice.coupon_code}`}</dt><dd>−{money(invoice.discount_amount)}</dd></div>}
          {/* Diskon persen lama; tidak ditampilkan bersama kupon agar potongan yang sama tidak tercatat dua kali. */}
          {invoice.discount > 0 && invoice.discount_amount === 0 && <div><dt>Diskon ({invoice.discount_percent}%)</dt><dd>−{money(invoice.discount)}</dd></div>}
          <div><dt>Ongkos kirim</dt><dd>{money(invoice.shipping_cost)}</dd></div>
          {invoice.unique_code > 0 && <div><dt>Kode unik transfer</dt><dd>{money(invoice.unique_code)}</dd></div>}
          <div className="invoice-grand-total"><dt>Total</dt><dd>{money(invoice.grand_total)}</dd></div>
        </dl>

        {invoice.bank_account && (
          <p className="invoice-note">
            Transfer <strong>{money(invoice.grand_total)}</strong> ke {invoice.bank_account.bank} {invoice.bank_account.number} a.n. {invoice.bank_account.name}, tepat hingga digit terakhir.
          </p>
        )}

        <footer className="invoice-footer">Terima kasih telah berbelanja di {store.name}.</footer>
      </article>
    </main>
  );
}
