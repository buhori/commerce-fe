"use client";

import { formatDateTime } from "@/lib/format";
import { shipmentStatusLabel, shipmentStatusTone } from "@/lib/order-status";
import type { TrackedShipment } from "@/lib/order-tracking";
import { BrandLogo } from "./brand-logo";
import { CopyValue } from "./copy-value";
import { Icon } from "./icons";
import { buttonClasses } from "./ui/button";

/**
 * Kartu pengiriman pesanan: kurir, status dari kurir, nomor resi (bisa disalin), tautan lacak di situs
 * kurir, dan riwayatnya. Dipakai "Lacak pesanan saya" di tombol bantuan dan halaman pesanan pembeli.
 */
export function ShipmentTracking({ shipment, id, className }: { shipment: TrackedShipment; id?: string; className?: string }) {
  const titleId = `${id ?? "shipment"}-title`;
  return (
    <section id={id} className={["shipment-track help-track-card", className].filter(Boolean).join(" ")} aria-labelledby={titleId}>
      <div className="help-track-card-head">
        <BrandLogo src={shipment.courierLogo} className="help-track-courier-logo" />
        <div className="help-track-courier">
          <small id={titleId}>Pengiriman</small>
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
  );
}
