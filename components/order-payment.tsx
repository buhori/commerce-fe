"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { readOrder, type OrderSummary } from "@/lib/checkout";
import { formatDate, formatPrice } from "@/lib/format";
import { PaymentProofForm } from "./payment-proof-form";
import { ProductImage } from "./product-image";
import { Icon } from "./icons";
import { Spinner } from "./spinner";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; order: OrderSummary };

// Mirrors App\Enums\OrderStatus::label() on the backend.
const statusLabels: Record<string, string> = {
  pending: "menunggu pembayaran",
  paid: "sudah dibayar",
  cancelled: "dibatalkan",
  processed: "sedang diproses",
  delivering: "sedang dikirim",
  delivered: "sudah diterima",
  rejected: "ditolak",
  returned: "dikembalikan",
  refunded: "dananya dikembalikan",
  done: "selesai",
};

/**
 * Shows a value next to a button that copies a paste-ready version of it:
 * `value` is what lands on the clipboard, `children` is what the buyer reads.
 */
function CopyValue({ value, label, children }: {
  value: string;
  label: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // The clipboard API needs a secure context; say so rather than fail quietly.
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <>
      <div className="copy-row">
        <span className="copy-value">{children}</span>
        <Button type="button" variant="secondary" size="sm" className="copy-button" onClick={copy} aria-label={label} data-copied={state === "copied"}>
          <Icon name={state === "copied" ? "check" : "copy"} width={18} height={18} />
          {state === "copied" ? "Tersalin" : "Salin"}
        </Button>
      </div>
      <span role="status" className="sr-only">
        {state === "copied" ? "Tersalin ke papan klip." : state === "failed" ? "Gagal menyalin." : ""}
      </span>
      {state === "failed" && <p className="field-hint copy-failed">Gagal menyalin otomatis. Silakan salin manual dari layar.</p>}
    </>
  );
}

export function OrderPayment({ orderId, currency }: { orderId: string; currency: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async (response) => {
      // A 404 also covers an order belonging to someone else's session.
      if (response.status === 404 || response.status === 400) {
        if (!controller.signal.aborted) setState({ status: "missing" });
        return;
      }
      if (!response.ok) throw new Error("Order request failed");
      const order = readOrder(await response.json());
      if (!controller.signal.aborted) {
        setState({ status: "ready", order });
        if (attempt > 0) setRefreshMessage("Status pesanan sudah diperbarui.");
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setState((previous) => previous.status === "ready" ? previous : { status: "error" });
        setRefreshMessage("Status belum dapat diperbarui. Silakan coba lagi.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setRefreshing(false);
    });
    return () => controller.abort();
  }, [orderId, attempt]);

  if (state.status === "loading") {
    return <div className="empty-state" aria-busy="true"><Spinner size={28} label="Memuat rincian pembayaran…" /></div>;
  }
  if (state.status === "missing") {
    return (
      <div className="empty-state">
        <h1>Pesanan tidak ditemukan</h1>
        <p>Nomor pesanan ini tidak ada, atau dibuat dari perangkat lain.</p>
        <ButtonLink href="/">Lihat produk</ButtonLink>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="empty-state" role="alert">
        <h1>Pembayaran belum dapat dimuat</h1>
        <p>Rincian pembayaran belum dapat dimuat.</p>
        <Button variant="secondary" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>Coba lagi</Button>
      </div>
    );
  }

  const { order } = state;
  const awaitingPayment = order.status === "pending";
  const stopped = ["cancelled", "rejected", "returned", "refunded"].includes(order.status);
  const confirmed = ["paid", "processed", "delivering", "delivered", "done"].includes(order.status);
  const bankTransfer = order.payment_method === "bank_transfer";
  const transferAvailable = bankTransfer && Boolean(order.bank_account);
  const itemCount = order.items.reduce((count, item) => count + item.amount, 0);

  function refreshStatus() {
    setRefreshing(true);
    setRefreshMessage("");
    setAttempt((value) => value + 1);
  }

  return (
    <div className="payment-content">
      <header className="payment-heading">
        <div>
          <p className="payment-eyebrow">PEMBAYARAN PESANAN</p>
          <h1>{awaitingPayment ? "Satu langkah lagi." : stopped ? "Status pesanan Anda" : confirmed ? "Terima kasih sudah berbelanja." : "Rincian pesanan Anda"}</h1>
          <p>{awaitingPayment ? "Selesaikan pembayaran agar pesanan Anda bisa segera diproses." : "Lihat status dan rincian pembayaran pesanan Anda di sini."}</p>
        </div>
        <div className="payment-order-reference"><span>Nomor pesanan</span><strong>#{order.id}</strong></div>
      </header>

      {(awaitingPayment || confirmed) && (
        <ol className="payment-progress" aria-label="Tahapan pesanan">
          <li data-complete="true"><span><Icon name="check" /></span>Pesanan dibuat</li>
          <li data-complete={confirmed} aria-current={awaitingPayment ? "step" : undefined}><span>{confirmed ? <Icon name="check" /> : "2"}</span>Pembayaran</li>
          <li aria-current={confirmed ? "step" : undefined}><span>3</span>{["delivered", "done"].includes(order.status) ? "Pesanan selesai" : order.status === "delivering" ? "Pesanan dikirim" : "Pesanan diproses"}</li>
        </ol>
      )}

      <div className="payment-layout">
        <div className="payment-main">
          <section className="payment-card" aria-labelledby="payment-status-title">
            <div className="payment-status" data-tone={awaitingPayment ? "pending" : stopped ? "stopped" : "neutral"}>
              <span className="payment-status-icon"><Icon name={awaitingPayment ? "clock" : stopped ? "info" : confirmed ? "check" : "box"} width={24} height={24} /></span>
              <div>
                <h2 id="payment-status-title">{statusLabels[order.status] ?? order.status}</h2>
                <p>{awaitingPayment ? "Pesanan diproses setelah pembayaran diterima." : stopped ? "Tidak perlu melakukan pembayaran untuk pesanan ini." : "Status pesanan diperbarui oleh toko."}</p>
              </div>
            </div>

            {awaitingPayment && (
              <>
                <section className="payment-amount" aria-label="Total pembayaran">
                  <span className="payment-label">{transferAvailable ? "Total yang harus ditransfer" : "Total pembayaran"}</span>
                  <CopyValue value={String(order.grand_total)} label={`Salin nominal ${order.grand_total}`}>
                    <strong className="payment-amount-value">{formatPrice(order.grand_total, currency)}</strong>
                  </CopyValue>
                  {order.unique_payment_code !== null && (
                    <div className="payment-code-note">
                      <Icon name="info" />
                      <p>Bayar sesuai nominal hingga digit terakhir. Kode unik <strong>{order.unique_payment_code}</strong> sudah termasuk dalam total pembayaran.</p>
                    </div>
                  )}
                </section>

                {transferAvailable && order.bank_account ? (
                  <section className="payment-bank" aria-labelledby="payment-bank-title">
                    <div className="payment-section-heading"><span className="payment-small-icon"><Icon name="bank" /></span><div><h3 id="payment-bank-title">Rekening tujuan</h3><p>Transfer Bank · {order.bank_account.bank}</p></div></div>
                    <div className="payment-account">
                      <span className="payment-label">Nomor rekening</span>
                      <CopyValue value={order.bank_account.number.replace(/[\s-]/g, "")} label={`Salin nomor rekening ${order.bank_account.number}`}>
                        <strong className="payment-account-number">{order.bank_account.number}</strong>
                      </CopyValue>
                      <p>Atas nama <strong>{order.bank_account.name}</strong></p>
                    </div>
                    <PaymentProofForm order={order} onUploaded={(updated) => setState({ status: "ready", order: updated })} />
                  </section>
                ) : (
                  <div className="payment-method-notice"><Icon name="info" /><p>Instruksi {order.payment_method_name ?? "pembayaran"} belum tersedia di halaman ini. Hubungi toko untuk mendapatkan petunjuk pembayaran.</p></div>
                )}

                <div className="payment-check">
                  <Button onClick={refreshStatus} disabled={refreshing}>
                    {refreshing ? <Spinner size={18} label="Memeriksa status…" /> : <Icon name="refresh" />}
                    {refreshing ? "Memeriksa pembayaran…" : "Cek status pembayaran"}
                  </Button>
                  <p>Sudah membayar? Cek status setelah toko memverifikasi pembayaran Anda.</p>
                </div>
              </>
            )}

            {!awaitingPayment && (
              <div className="payment-result">
                <Icon name={stopped ? "info" : "box"} width={40} height={40} />
                <h3>{stopped ? "Pembayaran tidak diperlukan" : confirmed ? "Pembayaran sudah diterima" : "Pantau pesanan Anda"}</h3>
                <p>{stopped ? "Silakan lihat produk lainnya jika ingin membuat pesanan baru." : "Simpan nomor pesanan untuk memudahkan pengecekan dengan toko."}</p>
                <Button variant="secondary" onClick={refreshStatus} disabled={refreshing}><Icon name="refresh" />{refreshing ? "Memeriksa…" : "Perbarui status pesanan"}</Button>
              </div>
            )}
            <p className="payment-refresh-message" role="status">{refreshMessage}</p>
          </section>

          {awaitingPayment && transferAvailable && (
            <section className="payment-guide" aria-labelledby="payment-guide-title">
              <h2 id="payment-guide-title">Cara menyelesaikan pembayaran</h2>
              <ol>
                <li><span>1</span><div><h3>Buka aplikasi bank atau ATM</h3><p>Pilih transfer ke bank tujuan yang tertera di atas.</p></div></li>
                <li><span>2</span><div><h3>Masukkan rekening dan nominal</h3><p>Gunakan tombol salin, lalu pastikan nama penerima dan jumlah pembayaran sudah sesuai.</p></div></li>
                <li><span>3</span><div><h3>Unggah bukti transfer</h3><p>Kirim foto atau PDF bukti transfer lewat formulir di atas, lalu cek status setelah toko memverifikasi pembayaran.</p></div></li>
              </ol>
            </section>
          )}
        </div>

        <aside className="payment-sidebar" aria-labelledby="payment-summary-title">
          <section className="payment-summary payment-card">
            <div className="payment-summary-heading"><h2 id="payment-summary-title">Ringkasan pesanan</h2>{itemCount > 0 && <span>{itemCount} barang</span>}</div>
            {order.items.length > 0 && (
              <ul className="payment-products">
                {order.items.map((item, index) => (
                  <li key={index}>
                    <span className="payment-product-art" aria-hidden="true"><ProductImage key={item.image} src={item.image} name="" /></span>
                    <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}<span>{item.amount} × {formatPrice(item.price, currency)}</span>{item.preorder_duration > 0 && <span className="preorder-tag">Pre-order</span>}</div>
                    <strong>{formatPrice(item.price * item.amount, currency)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <dl className="payment-totals">
              <div><dt>Subtotal barang</dt><dd>{formatPrice(order.total, currency)}</dd></div>
              <div><dt>Ongkos kirim</dt><dd>{formatPrice(order.shipping_cost, currency)}</dd></div>
              {order.unique_payment_code !== null && <div><dt>Kode unik</dt><dd>{formatPrice(order.unique_payment_code, currency)}</dd></div>}
              <div className="payment-grand-total"><dt>Total pembayaran</dt><dd>{formatPrice(order.grand_total, currency)}</dd></div>
            </dl>
            <dl className="payment-order-details">
              <div><dt><Icon name="bank" />Pembayaran</dt><dd>{order.payment_method_name ?? order.payment_method ?? "—"}</dd></div>
              {order.shipping_method && <div><dt><Icon name="truck" />Pengiriman</dt><dd>{order.shipping_method}</dd></div>}
            </dl>
            {order.preorder_ready_at && !stopped && (
              <div className="payment-preorder"><Icon name="box" /><p>Pesanan berisi barang pre-order dan dikirim bersama, perkiraan mulai <strong>{formatDate(new Date(`${order.preorder_ready_at}T00:00:00`))}</strong>.</p></div>
            )}
          </section>
          <p className="payment-save-note"><Icon name="info" />Simpan halaman ini untuk melihat rincian dan status pembayaran Anda.</p>
          <div className="payment-navigation"><ButtonLink variant="secondary" href="/">Lanjut belanja<Icon name="arrow" /></ButtonLink><ButtonLink variant="text" href="/cart">Lihat keranjang</ButtonLink></div>
        </aside>
      </div>
    </div>
  );
}
