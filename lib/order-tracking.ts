/**
 * "Lacak pesanan saya" (tombol bantuan): jawaban POST /orders/track di backend
 * (App\Http\Controllers\API\OrderTrackingController). Modul murni tanpa impor, supaya bisa dites.
 */

export interface TrackedShipmentEvent {
  status: string;
  note: string | null;
  at: string | null;
}

export interface TrackedOrder {
  orderId: string;
  invoiceNumber: string | null;
  status: string;
  createdAt: string | null;
  items: { name: string; amount: number }[];
  shipment: {
    courier: string | null;
    courierLogo: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    /** Status dari kurir; null untuk resi yang dicatat manual. */
    status: string | null;
    history: TrackedShipmentEvent[];
  } | null;
}

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
const httpUrl = (value: unknown): string | null => {
  const url = text(value);
  return url && /^https?:\/\//i.test(url) ? url : null;
};

/** Isi `data` dari backend; null bila bentuknya rusak. Baris yang rusak dibuang. */
export function readTrackedOrder(value: unknown): TrackedOrder | null {
  const order = value as Record<string, unknown> | null;
  if (!order || typeof order !== "object") return null;
  const orderId = typeof order.order_id === "number" || typeof order.order_id === "string" ? String(order.order_id) : null;
  const status = text(order.status);
  if (!orderId || !status) return null;

  const shipment = order.shipment as Record<string, unknown> | null | undefined;
  return {
    orderId,
    invoiceNumber: text(order.invoice_number),
    status,
    createdAt: text(order.created_at),
    items: (Array.isArray(order.items) ? order.items : []).flatMap((item) => {
      const row = item as Record<string, unknown> | null;
      const name = text(row?.name);
      return name ? [{ name, amount: Number.isInteger(row?.amount) ? Number(row?.amount) : 1 }] : [];
    }),
    shipment: shipment && typeof shipment === "object" ? {
      courier: text(shipment.courier),
      courierLogo: httpUrl(shipment.courier_logo),
      trackingNumber: text(shipment.tracking_number),
      trackingUrl: httpUrl(shipment.tracking_url),
      status: text(shipment.status),
      history: (Array.isArray(shipment.history) ? shipment.history : []).flatMap((event) => {
        const row = event as Record<string, unknown> | null;
        const eventStatus = text(row?.status);
        return eventStatus ? [{ status: eventStatus, note: text(row?.note), at: text(row?.at) }] : [];
      }),
    } : null,
  };
}

/** Yang diketik pembeli: nomor pesanan ("#3829104") atau nomor invoice, dan tepat 4 digit telepon. */
export function trackingInputError(order: string, phone: string): string | null {
  if (!order.trim()) return "Masukkan nomor pesanan.";
  if (!/^\d{4}$/.test(phone.trim())) return "Masukkan 4 digit terakhir nomor telepon.";
  return null;
}
