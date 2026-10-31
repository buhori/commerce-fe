/**
 * "Lacak pesanan saya" (tombol bantuan): jawaban POST /orders/track di backend
 * (App\Http\Controllers\API\OrderTrackingController). Blok `shipment`-nya dibaca readTrackedShipment
 * di ./checkout, sama dengan detail pesanan pembeli (App\Models\Shipping::forBuyer).
 */
import { readTrackedShipment, type TrackedShipment } from "./checkout";

export type { TrackedShipment, TrackedShipmentEvent } from "./checkout";


export interface TrackedOrder {
  orderId: string;
  invoiceNumber: string | null;
  status: string;
  createdAt: string | null;
  items: { name: string; amount: number }[];
  shipment: TrackedShipment | null;
}


const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

/** Isi `data` dari backend; null bila bentuknya rusak. Baris yang rusak dibuang. */
export function readTrackedOrder(value: unknown): TrackedOrder | null {
  const order = value as Record<string, unknown> | null;
  if (!order || typeof order !== "object") return null;
  const orderId = typeof order.order_id === "number" || typeof order.order_id === "string" ? String(order.order_id) : null;
  const status = text(order.status);
  if (!orderId || !status) return null;

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
    shipment: readTrackedShipment(order.shipment),
  };
}


/** Yang diketik pembeli: nomor pesanan ("#3829104") atau nomor invoice, dan tepat 4 digit telepon. */
export function trackingInputError(order: string, phone: string): string | null {
  if (!order.trim()) return "Masukkan nomor pesanan.";
  if (!/^\d{4}$/.test(phone.trim())) return "Masukkan 4 digit terakhir nomor telepon.";
  return null;
}
