"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type RefObject } from "react";
import { formatDateTime } from "@/lib/format";
import { ORDER_STEPS, orderStatus, orderStep, shipmentStatusLabel, shipmentStatusTone } from "@/lib/order-status";
import { readTrackedOrder, trackingInputError, type TrackedOrder } from "@/lib/order-tracking";
import { storeContactUrl } from "@/lib/whatsapp";
import { BrandLogo } from "./brand-logo";
import { useBottomOffset } from "./compare-tray";
import { CopyValue } from "./copy-value";
import { Icon, type IconName } from "./icons";
import { Button, buttonClasses } from "./ui/button";

/** Halaman tempat tombol bantuan hanya mengganggu (formulir checkout, login) atau tidak berguna (pratinjau). */
const HIDDEN = ["/checkout", "/login", "/auth", "/preview"];

/**
 * Tombol bantuan melayang di pojok kanan bawah: "Lacak pesanan saya" (nomor pesanan + 4 digit terakhir
 * telepon, tanpa login) dan, bila pemilik toko menyalakannya, "Hubungi toko" lewat WhatsApp.
 */
export function HelpButton({ storeName, contactWhatsapp }: { storeName: string; contactWhatsapp: string | null }) {
  const pathname = usePathname();
  const visible = !HIDDEN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const offset = useBottomOffset(visible, pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Menu tertutup saat klik di luar atau Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  if (!visible) return null;

  return (
    <div ref={root} className="help-fab" style={{ "--help-fab-offset": `${offset}px` } as CSSProperties}>
      {menuOpen && (
        <div id={menuId} className="help-fab-menu" role="menu" aria-label="Bantuan">
          <button type="button" role="menuitem" className="help-fab-item" onClick={() => { setMenuOpen(false); dialog.current?.showModal(); }}>
            <span className="help-fab-item-icon"><Icon name="truck" /></span>
            <span><strong>Lacak pesanan saya</strong><small>Status dan nomor resi pesanan</small></span>
          </button>
          {contactWhatsapp && (
            <a role="menuitem" className="help-fab-item" href={storeContactUrl(contactWhatsapp, storeName)} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
              <span className="help-fab-item-icon help-fab-item-whatsapp"><Icon name="whatsapp" /></span>
              <span><strong>Hubungi {storeName}</strong><small>Chat lewat WhatsApp</small></span>
            </a>
          )}
        </div>
      )}
      <button type="button" className="help-fab-button" aria-label="Bantuan" aria-haspopup="menu" aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined} onClick={() => setMenuOpen((open) => !open)}>
        <Icon name={menuOpen ? "close" : "help"} />
      </button>
      <TrackOrderDialog dialog={dialog} />
    </div>
  );
}

function TrackOrderDialog({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const orderNumber = String(form.get("order") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const invalid = trackingInputError(orderNumber, phone);
    if (invalid) return setError(invalid);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ order: orderNumber, phone }),
      });
      const body = await response.json().catch(() => null);
      const tracked = response.ok ? readTrackedOrder(body?.data) : null;
      if (tracked) setOrder(tracked);
      else setError(typeof body?.message === "string" ? body.message : "Pesanan belum bisa dilacak. Coba lagi sebentar lagi.");
    } catch {
      setError("Tidak bisa terhubung. Periksa koneksi internet lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialog} className="help-dialog" aria-labelledby="help-dialog-title"
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="help-dialog-header">
        <h2 id="help-dialog-title">Lacak pesanan saya</h2>
        <Button variant="secondary" size="icon" aria-label="Tutup" onClick={() => dialog.current?.close()}><Icon name="close" /></Button>
      </div>
      {order ? (
        <TrackedOrderDetail order={order} onReset={() => { setOrder(null); setError(null); }} />
      ) : (
        <form className="help-dialog-form" onSubmit={submit} noValidate>
          <p className="field-hint">Nomor pesanan ada di halaman pembayaran dan invoice, misalnya <strong>#3829104</strong> atau <strong>INV/TOKO/2026/10/0001</strong>.</p>
          <div className="checkout-field">
            <label htmlFor="help-order">Nomor pesanan</label>
            <input id="help-order" name="order" autoComplete="off" maxLength={64} placeholder="#3829104" required />
          </div>
          <div className="checkout-field">
            <label htmlFor="help-phone">4 digit terakhir nomor telepon</label>
            <input id="help-phone" name="phone" inputMode="numeric" autoComplete="off" maxLength={4} pattern="\d{4}" placeholder="5603" required />
            <span className="field-hint">Nomor telepon penerima yang diisi saat checkout.</span>
          </div>
          {error && <p className="help-dialog-error" role="alert">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Mencari…" : "Lacak pesanan"}</Button>
        </form>
      )}
    </dialog>
  );
}

const STATUS_ICONS: Record<string, IconName> = { pending: "clock", paid: "check", processed: "box", delivering: "truck", delivered: "check", done: "check" };

function TrackedOrderDetail({ order, onReset }: { order: TrackedOrder; onReset: () => void }) {
  const status = orderStatus(order.status);
  const step = orderStep(order.status);
  const shipment = order.shipment;
  const items = order.items.reduce((total, item) => total + item.amount, 0);
  return (
    <div className="help-track">
      <section className="help-track-summary" data-tone={status.tone}>
        <span className="help-track-summary-icon"><Icon name={STATUS_ICONS[order.status] ?? "alert"} /></span>
        <div>
          <small>Status pesanan</small>
          <strong>{status.label}</strong>
        </div>
      </section>

      {step !== null && step >= 0 && (
        <ol className="help-track-steps" aria-label="Tahapan pesanan">
          {ORDER_STEPS.map((label, index) => (
            <li key={label} data-state={index < step ? "done" : index === step ? "current" : "todo"} aria-current={index === step ? "step" : undefined}>
              <span className="help-track-step-dot">{index <= step && <Icon name="check" />}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
      )}

      <dl className="help-track-meta">
        <div><dt>Nomor pesanan</dt><dd>#{order.orderId}</dd></div>
        {order.invoiceNumber && <div><dt>Invoice</dt><dd>{order.invoiceNumber}</dd></div>}
        {order.createdAt && <div><dt>Tanggal pesan</dt><dd>{formatDateTime(new Date(order.createdAt))}</dd></div>}
      </dl>

      {shipment && (
        <section className="help-track-card" aria-labelledby="help-track-shipment-title">
          <div className="help-track-card-head">
            <BrandLogo src={shipment.courierLogo} className="help-track-courier-logo" />
            <div className="help-track-courier">
              <small id="help-track-shipment-title">Pengiriman</small>
              <strong>{shipment.courier ?? "Kurir"}</strong>
              {shipment.status && <span className="help-track-pill" data-tone={shipmentStatusTone(shipment.status)}>{shipmentStatusLabel(shipment.status)}</span>}
            </div>
          </div>

          {shipment.trackingNumber ? (
            <div className="help-track-awb">
              <small>Nomor resi</small>
              <CopyValue value={shipment.trackingNumber} label="Salin nomor resi"><strong>{shipment.trackingNumber}</strong></CopyValue>
            </div>
          ) : (
            <p className="help-track-empty"><Icon name="clock" />Nomor resi muncul di sini setelah paket diserahkan ke kurir.</p>
          )}

          {shipment.trackingUrl && (
            <a className={buttonClasses({ variant: "secondary", className: "help-track-link" })} href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
              Lacak di situs kurir<Icon name="arrow" />
            </a>
          )}

          {shipment.history.length > 0 && (
            <div className="help-track-history-wrap">
              <small>Riwayat pengiriman</small>
              <ol className="help-track-history">
                {shipment.history.map((event, index) => (
                  <li key={index} data-latest={index === 0 || undefined}>
                    <strong>{shipmentStatusLabel(event.status)}</strong>
                    {event.note && event.note !== shipmentStatusLabel(event.status) && <span>{event.note}</span>}
                    {event.at && <time dateTime={event.at}>{formatDateTime(new Date(event.at))}</time>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {order.items.length > 0 && (
        <section className="help-track-card" aria-labelledby="help-track-items-title">
          <small id="help-track-items-title" className="help-track-card-title">Barang ({items})</small>
          <ul className="help-track-items">
            {order.items.map((item, index) => <li key={index}><span>{item.name}</span><span>×{item.amount}</span></li>)}
          </ul>
        </section>
      )}

      <Button variant="text" className="help-track-reset" onClick={onReset}><Icon name="search" />Lacak pesanan lain</Button>
    </div>
  );
}
