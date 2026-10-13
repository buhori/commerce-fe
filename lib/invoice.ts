import { cookies } from "next/headers";
import { cache } from "react";
import { CUSTOMER_COOKIE } from "./auth";
import { currentStoreHeaders } from "./store-host";

/** Invoice pesanan dari GET /orders/{id}/invoice; isinya sama dengan invoice cetak di panel penjual. */
export interface Invoice {
  number: string;
  order_id: number;
  issued_at: string | null;
  paid_at: string | null;
  status: string;
  status_label: string;
  payment_state: "unpaid" | "paid" | "void" | "refunded";
  currency: string;
  store: { name: string; logo: string | null; address: string | null; phone: string | null; email: string | null };
  buyer: { name: string; phone: string | null; email: string | null; address: string | null; region: string | null } | null;
  items: { name: string; variant: string | null; sku: string | null; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  discount_percent: number;
  discount: number;
  shipping_cost: number;
  shipping_method: string | null;
  tracking_number: string | null;
  unique_code: number;
  grand_total: number;
  payment_method: string | null;
  bank_account: { bank: string; name: string; number: string } | null;
}

/**
 * Invoice milik pembeli ini: sesi akun (Bearer) atau token tamu yang membuat pesanan, persis seperti
 * proxy /api. null bila pesanan tidak ada atau milik orang lain (backend menjawab 404 untuk keduanya).
 */
export const getInvoice = cache(async (id: string): Promise<Invoice | null> => {
  if (!/^\d{1,10}$/.test(id)) return null;
  const jar = await cookies();
  const customerToken = jar.get(CUSTOMER_COOKIE)?.value;
  const guestToken = jar.get("guest_token")?.value;
  if (!customerToken && !guestToken) return null;

  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/orders/${id}/invoice`, {
    headers: {
      Accept: "application/json",
      ...(await currentStoreHeaders()),
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Store API returned ${response.status}`);
  return ((await response.json()) as { data: Invoice }).data;
});
