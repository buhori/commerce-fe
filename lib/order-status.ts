/** Status pesanan untuk pembeli; mengikuti App\Enums\OrderStatus di backend. */
export const ORDER_STATUSES: Record<string, { label: string; tone: string }> = {
  pending: { label: "Menunggu pembayaran", tone: "warning" },
  paid: { label: "Dibayar", tone: "info" },
  processed: { label: "Diproses", tone: "info" },
  delivering: { label: "Dikirim", tone: "primary" },
  delivered: { label: "Diterima", tone: "success" },
  done: { label: "Selesai", tone: "success" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
  rejected: { label: "Ditolak", tone: "danger" },
  returned: { label: "Dikembalikan", tone: "danger" },
  refunded: { label: "Dana dikembalikan", tone: "danger" },
};

/** Status dari kurir (pengiriman lewat plugin kurir); mengikuti orders.shipment.statuses di backend. */
export const SHIPMENT_STATUSES: Record<string, string> = {
  confirmed: "Menunggu dijemput",
  picked_up: "Dijemput kurir",
  delivering: "Sedang diantar",
  delivered: "Sampai di tujuan",
  returned: "Dikembalikan ke pengirim",
  cancelled: "Dibatalkan",
};

export function orderStatus(status: string): { label: string; tone: string } {
  return ORDER_STATUSES[status] ?? { label: status, tone: "info" };
}

export function shipmentStatusLabel(status: string): string {
  return SHIPMENT_STATUSES[status] ?? status;
}

/** Warna status kurir: menunggu (kuning), di jalan (biru), sampai (hijau), gagal (merah). */
export function shipmentStatusTone(status: string): string {
  if (status === "delivered") return "success";
  if (status === "returned" || status === "cancelled") return "danger";
  if (status === "confirmed") return "warning";
  return "info";
}

/** Tahapan pesanan yang berjalan normal, untuk bilah kemajuan pelacakan. */
export const ORDER_STEPS = ["Dibayar", "Dikemas", "Dikirim", "Diterima"] as const;

/**
 * Tahap pesanan di ORDER_STEPS: -1 menunggu pembayaran, 0–3 tahap yang sudah dicapai; null untuk
 * pesanan yang berhenti (dibatalkan, ditolak, dikembalikan) atau status yang tidak dikenal.
 */
export function orderStep(status: string): number | null {
  const steps: Record<string, number> = { pending: -1, paid: 0, processed: 1, delivering: 2, delivered: 3, done: 3 };
  return status in steps ? steps[status] : null;
}
