"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  jsonHeaders, paymentChangeErrorMessage, readOrder,
  type BankAccount, type OnlinePayment, type OnlinePaymentDisplay, type OrderSummary, type PaymentMethod,
} from "@/lib/checkout";
import { formatDateTime, formatPrice } from "@/lib/format";
import { CopyValue } from "./copy-value";
import { PaymentChoices } from "./delivery-options";
import { Icon } from "./icons";
import { Spinner } from "./spinner";

// Satu jam bersama untuk semua sisa waktu di halaman: satu interval, berdetak tiap detik.
let now: number | null = null;
let clock: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  const tick = () => { now = Date.now(); clockListeners.forEach((notify) => notify()); };
  if (!clock) clock = setInterval(tick, 1000);
  tick();
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && clock) { clearInterval(clock); clock = undefined; }
  };
}

const useNow = () => useSyncExternalStore(subscribeClock, () => now, () => null);

// Ponsel/tablet (layar sentuh tanpa kursor): tautan aplikasi e-wallet didahulukan.
const touchQuery = "(hover: none) and (pointer: coarse)";
function subscribeTouch(listener: () => void) {
  const query = window.matchMedia(touchQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const useTouchDevice = () => useSyncExternalStore(subscribeTouch, () => window.matchMedia(touchQuery).matches, () => false);

const pad = (value: number) => String(value).padStart(2, "0");

function PaymentDeadline({ expiresAt }: { expiresAt: string | null }) {
  const current = useNow();
  if (!expiresAt) return null;
  const end = Date.parse(expiresAt);
  const remaining = current === null ? null : Math.max(0, Math.floor((end - current) / 1000));
  if (remaining === 0) {
    return <p className="payment-deadline" data-expired="true"><Icon name="clock" />Batas waktu pembayaran sudah lewat. Status diperbarui sebentar lagi.</p>;
  }
  const clockText = remaining === null ? "--:--:--"
    : `${Math.floor(remaining / 86400) > 0 ? `${Math.floor(remaining / 86400)} hari ` : ""}${pad(Math.floor(remaining / 3600) % 24)}:${pad(Math.floor(remaining / 60) % 60)}:${pad(remaining % 60)}`;
  return (
    <p className="payment-deadline">
      <Icon name="clock" />
      <span>Bayar sebelum <strong>{formatDateTime(new Date(end))}</strong></span>
      <span className="payment-deadline-timer" role="timer" aria-label="Sisa waktu pembayaran">{clockText}</span>
    </p>
  );
}

function SectionHeading({ id, icon, title, payment }: { id: string; icon: "bank" | "qr" | "arrow" | "phone" | "clock"; title: string; payment: OnlinePayment }) {
  return (
    <div className="payment-section-heading">
      <span className="payment-small-icon"><Icon name={icon} /></span>
      <div><h3 id={id}>{title}</h3><p>{payment.method_label}{payment.provider ? ` · ${payment.provider}` : ""}</p></div>
    </div>
  );
}

function DisplayAction({ payment, display, currency }: { payment: OnlinePayment; display: OnlinePaymentDisplay; currency: string }) {
  const virtualAccount = display.kind === "virtual_account" || (!display.kind && Boolean(display.account_number));
  const steps = display.instructions.length ? display.instructions : [
    virtualAccount ? `Buka aplikasi m-banking, internet banking, atau ATM${display.bank ? ` ${display.bank}` : ""}.` : "Kunjungi gerai atau aplikasi pembayaran yang mendukung kode ini.",
    virtualAccount ? "Pilih menu transfer ke Virtual Account, lalu masukkan nomor di atas." : "Sebutkan atau masukkan kode pembayaran di atas.",
    `Pastikan nominalnya ${formatPrice(display.amount, currency)}, lalu selesaikan pembayaran.`,
    "Status pesanan diperbarui otomatis setelah pembayaran diterima.",
  ];
  return (
    <section className="payment-bank payment-online" aria-labelledby="online-payment-title">
      <SectionHeading id="online-payment-title" icon="bank" payment={payment}
        title={virtualAccount ? `Transfer ke Virtual Account${display.bank ? ` ${display.bank}` : ""}` : "Kode pembayaran"} />
      <div className="payment-account">
        {display.account_number && (
          <>
            <span className="payment-label">{virtualAccount ? "Nomor virtual account" : "Nomor pembayaran"}</span>
            <CopyValue value={display.account_number.replace(/[\s-]/g, "")} label={`Salin nomor ${display.account_number}`}>
              <strong className="payment-account-number">{display.account_number}</strong>
            </CopyValue>
          </>
        )}
        {display.payment_code && (
          <div className="payment-online-field">
            <span className="payment-label">Kode pembayaran</span>
            <CopyValue value={display.payment_code} label={`Salin kode pembayaran ${display.payment_code}`}>
              <strong className="payment-account-number">{display.payment_code}</strong>
            </CopyValue>
          </div>
        )}
        {display.account_name && <p>Atas nama <strong>{display.account_name}</strong></p>}
        <div className="payment-online-field">
          <span className="payment-label">Nominal yang harus dibayar</span>
          <CopyValue value={String(display.amount)} label={`Salin nominal ${display.amount}`}>
            <strong className="payment-online-amount">{formatPrice(display.amount, currency)}</strong>
          </CopyValue>
        </div>
      </div>
      <PaymentDeadline expiresAt={payment.expires_at} />
      <ol className="payment-qris-steps">
        {steps.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
    </section>
  );
}

function QrAction({ payment, qr, amount, currency, orderId }: { payment: OnlinePayment; qr: string; amount: number; currency: string; orderId: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [downloadFailed, setDownloadFailed] = useState(false);

  function download() {
    try {
      const link = document.createElement("a");
      link.href = canvas.current!.toDataURL("image/png");
      link.download = `qris-pesanan-${orderId}.png`;
      link.click();
      setDownloadFailed(false);
    } catch {
      setDownloadFailed(true);
    }
  }

  return (
    <section className="payment-bank payment-online" aria-labelledby="online-payment-title">
      <SectionHeading id="online-payment-title" icon="qr" title="Scan QRIS" payment={payment} />
      <div className="payment-qris-code">
        <QRCodeCanvas ref={canvas} value={qr} size={280} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000"
          role="img" aria-label={`Kode QRIS untuk membayar ${formatPrice(amount, currency)}`} />
      </div>
      <p className="payment-online-qr-amount"><span>Total</span><strong>{formatPrice(amount, currency)}</strong></p>
      <PaymentDeadline expiresAt={payment.expires_at} />
      <ol className="payment-qris-steps">
        <li>Buka aplikasi e-wallet atau m-banking yang mendukung QRIS.</li>
        <li>Scan kode di atas. Jika membayar dari ponsel yang sama, unduh QR lalu pilih dari galeri di aplikasi.</li>
        <li>Pastikan nominal yang muncul <strong>{formatPrice(amount, currency)}</strong>, lalu konfirmasi pembayaran.</li>
        <li>Status pesanan diperbarui otomatis setelah pembayaran diterima.</li>
      </ol>
      <div className="payment-qris-actions">
        <Button variant="secondary" size="sm" onClick={download}><Icon name="download" />Unduh QR</Button>
      </div>
      {downloadFailed && <p className="field-hint copy-failed" role="alert">QR belum dapat diunduh. Ambil tangkapan layar sebagai gantinya.</p>}
    </section>
  );
}

/** Penanda sudah dialihkan ke halaman gateway, per tagihan: kembali dari gateway tidak dilempar lagi. */
const redirectedKey = (payment: OnlinePayment) => `sellosy-payment-redirected:${payment.public_id}`;

function RedirectAction({ payment, url }: { payment: OnlinePayment; url: string }) {
  // Tagihan baru langsung dibuka di halaman penyedia (sekali saja); tombol di bawah tetap ada.
  useEffect(() => {
    if (payment.status !== "pending" || !/^https:/i.test(url)) return;
    try {
      if (window.sessionStorage.getItem(redirectedKey(payment))) return;
      window.sessionStorage.setItem(redirectedKey(payment), "1");
    } catch {
      return; // Tanpa sessionStorage (mode privat tertentu): pembeli menekan tombolnya sendiri.
    }
    window.location.assign(url);
  }, [payment, url]);

  return (
    <section className="payment-bank payment-online" aria-labelledby="online-payment-title">
      <SectionHeading id="online-payment-title" icon="arrow" title="Lanjutkan ke halaman pembayaran" payment={payment} />
      <p className="payment-online-text">
        Pembayaran {payment.method_label} diselesaikan di halaman {payment.provider ?? "penyedia pembayaran"}.
        Setelah membayar, kembali ke halaman ini. Status pesanan diperbarui otomatis.
      </p>
      <PaymentDeadline expiresAt={payment.expires_at} />
      <div className="payment-online-actions">
        <ButtonLink reloadDocument href={url} rel="noopener">Bayar sekarang<Icon name="arrow" /></ButtonLink>
      </div>
    </section>
  );
}

function DeeplinkAction({ payment, mobileUrl, desktopUrl }: { payment: OnlinePayment; mobileUrl: string | null; desktopUrl: string | null }) {
  const touch = useTouchDevice();
  // Di komputer tautan aplikasi hanya berguna bila berupa https (universal link).
  const primary = touch ? (mobileUrl ?? desktopUrl) : (desktopUrl ?? (mobileUrl && /^https:/i.test(mobileUrl) ? mobileUrl : null));
  const opensApp = primary !== null && primary === mobileUrl;
  return (
    <section className="payment-bank payment-online" aria-labelledby="online-payment-title">
      <SectionHeading id="online-payment-title" icon="phone" title={`Bayar dengan ${payment.method_label}`} payment={payment} />
      <p className="payment-online-text">
        {primary
          ? opensApp
            ? `Ketuk tombol di bawah untuk membuka aplikasi ${payment.method_label}, lalu konfirmasi pembayaran. Status pesanan diperbarui otomatis.`
            : `Lanjutkan ke halaman ${payment.provider ?? "pembayaran"} untuk membayar dengan ${payment.method_label}. Status pesanan diperbarui otomatis.`
          : `Buka halaman ini di ponsel yang terpasang aplikasi ${payment.method_label} untuk melanjutkan pembayaran.`}
      </p>
      <PaymentDeadline expiresAt={payment.expires_at} />
      {primary && (
        <div className="payment-online-actions">
          <ButtonLink reloadDocument href={primary} rel="noopener">{opensApp ? `Buka ${payment.method_label}` : "Bayar sekarang"}<Icon name="arrow" /></ButtonLink>
          {touch && opensApp && desktopUrl && (
            <ButtonLink reloadDocument variant="text" size="sm" href={desktopUrl} rel="noopener">Bayar lewat browser</ButtonLink>
          )}
        </div>
      )}
    </section>
  );
}

function Notice({ tone, title, children }: { tone: "waiting" | "error" | "neutral" | "success"; title: string; children?: string }) {
  return (
    <div className="payment-online-notice" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      {tone === "waiting" ? <Spinner size={20} /> : <Icon name={tone === "error" ? "alert" : tone === "success" ? "check" : "info"} />}
      <div><strong>{title}</strong>{children && <p>{children}</p>}</div>
    </div>
  );
}

/** Ganti metode bayar pesanan yang masih menunggu: tagihan online baru, atau transfer/QRIS toko. */
function ChangePaymentMethod({ orderId, onChanged, onCancel }: {
  orderId: number;
  onChanged: (order: OrderSummary) => void;
  onCancel?: () => void;
}) {
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const needsBankAccount = payment?.code === "bank_transfer";
  const ready = Boolean(payment && (!needsBankAccount || bankAccount));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !ready) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST", credentials: "same-origin", headers: jsonHeaders(),
        body: JSON.stringify({ payment_method: payment!.code, ...(needsBankAccount ? { bank_account_id: bankAccount!.id } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(paymentChangeErrorMessage(response.status, data));
      onChanged(readOrder(data));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : paymentChangeErrorMessage(500, null));
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <form className="payment-change" onSubmit={submit} aria-busy={pending}>
      <PaymentChoices legend="Pilih metode lain" payment={payment} bankAccount={bankAccount}
        onPaymentChange={(method) => { setPayment(method); setError(null); if (method.code !== "bank_transfer") setBankAccount(null); }}
        onBankAccountChange={setBankAccount} />
      <div className="payment-online-actions">
        <Button type="submit" disabled={!ready || pending}>
          {pending ? <Spinner size={18} /> : <Icon name="check" />}
          {pending ? "Menyiapkan pembayaran…" : payment ? `Bayar dengan ${payment.name}` : "Pilih metode dulu"}
        </Button>
        {onCancel && <Button variant="text" disabled={pending} onClick={onCancel}>Batal</Button>}
      </div>
      {error && <p className="cart-feedback cart-feedback-error" role="alert">{error}</p>}
    </form>
  );
}

/**
 * Tagihan plugin payment gateway pada halaman pembayaran: langkah bayar sesuai jenis aksinya,
 * lalu pilihan metode lain bila tagihan gagal atau kedaluwarsa. Tidak ada field yang dirender
 * sebagai HTML; URL sudah disaring saat dibaca (readOnlinePayment).
 */
export function OnlinePaymentPanel({ order, payment, currency, onOrderChange }: {
  order: OrderSummary;
  payment: OnlinePayment;
  currency: string;
  onOrderChange: (order: OrderSummary) => void;
}) {
  const [changing, setChanging] = useState(false);
  const change = (cancellable: boolean) => (
    <ChangePaymentMethod orderId={order.id} onCancel={cancellable ? () => setChanging(false) : undefined}
      onChanged={(updated) => { setChanging(false); onOrderChange(updated); }} />
  );

  if (payment.status === "failed" || payment.status === "expired") {
    return (
      <div className="payment-bank payment-online">
        <Notice tone="error" title={payment.status === "expired" ? "Tagihan pembayaran kedaluwarsa" : "Pembayaran belum dapat diproses"}>
          {payment.error_message ?? (payment.status === "expired"
            ? `Batas waktu pembayaran ${payment.method_label} sudah lewat. Pilih metode lain untuk melanjutkan.`
            : `${payment.method_label} sedang tidak dapat dipakai. Pilih metode lain untuk melanjutkan.`)}
        </Notice>
        {change(false)}
      </div>
    );
  }
  if (payment.status === "needs_review") {
    return (
      <div className="payment-bank payment-online">
        <Notice tone="neutral" title="Pembayaran sedang diperiksa toko">
          Toko sedang memeriksa pembayaran Anda. Status pesanan diperbarui setelah pemeriksaan selesai, tidak perlu membayar ulang.
        </Notice>
      </div>
    );
  }
  if (payment.status === "paid") {
    return (
      <div className="payment-bank payment-online">
        <Notice tone="success" title="Pembayaran diterima">Status pesanan sedang diperbarui.</Notice>
      </div>
    );
  }

  const action = payment.action;
  return (
    <>
      {action?.type === "display" ? <DisplayAction payment={payment} display={action.display} currency={currency} />
        : action?.type === "qr" ? <QrAction payment={payment} qr={action.qr_string} amount={action.amount} currency={currency} orderId={order.id} />
        : action?.type === "redirect" ? <RedirectAction payment={payment} url={action.url} />
        : action?.type === "deeplink" ? <DeeplinkAction payment={payment} mobileUrl={action.mobile_url} desktopUrl={action.desktop_url} />
        : (
          <div className="payment-bank payment-online">
            <Notice tone="waiting" title="Menunggu konfirmasi pembayaran…">
              {`${payment.method_label}${payment.provider ? ` lewat ${payment.provider}` : ""}. Halaman ini diperbarui otomatis.`}
            </Notice>
            <PaymentDeadline expiresAt={payment.expires_at} />
          </div>
        )}
      <div className="payment-bank payment-online payment-change-toggle">
        {changing ? change(true) : (
          <Button variant="text" size="sm" onClick={() => setChanging(true)}>Ganti metode pembayaran</Button>
        )}
      </div>
    </>
  );
}
