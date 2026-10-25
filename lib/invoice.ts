import { cookies } from "next/headers";
import { cache } from "react";
import { CUSTOMER_COOKIE } from "./auth";
import { readOrderDiscount } from "./checkout";
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
  /** Kode kupon yang dipakai; null bila tanpa kupon atau backend lama. */
  coupon_code: string | null;
  /** Potongan kupon dalam rupiah; sudah termasuk di grand_total. */
  discount_amount: number;
  shipping_cost: number;
  shipping_method: string | null;
  tracking_number: string | null;
  unique_code: number;
  grand_total: number;
  payment_method: string | null;
  bank_account: { bank: string; logo_url?: string | null; name: string; number: string } | null;
  /** "Powered by Sellosy" di invoice; false untuk toko whitelabel. */
  powered_by?: boolean;
}

/** Tanda tangan link invoice dari email bukti bayar (InvoiceLink di backend). */
export type InvoiceAccess = { expires: string; signature: string };

/** expires dan signature dari query string, bila keduanya ada dan berbentuk wajar. */
export function readInvoiceAccess(query: Record<string, string | string[] | undefined>): InvoiceAccess | null {
  const expires = typeof query.expires === "string" ? query.expires : "";
  const signature = typeof query.signature === "string" ? query.signature : "";
  return /^\d{1,12}$/.test(expires) && /^[a-f0-9]{64}$/.test(signature) ? { expires, signature } : null;
}

/**
 * Invoice milik pembeli ini: sesi akun (Bearer) atau token tamu yang membuat pesanan, persis seperti
 * proxy /api, atau link bertanda tangan dari email bukti bayar (expires + signature) yang bisa dibuka
 * dari perangkat mana pun. null bila pesanan tidak ada, milik orang lain, atau tanda tangannya tidak
 * berlaku (backend menjawab 404 untuk semuanya).
 */
export const getInvoice = cache(async (id: string, expires?: string, signature?: string): Promise<Invoice | null> => {
  if (!/^\d{1,10}$/.test(id)) return null;
  const jar = await cookies();
  const customerToken = jar.get(CUSTOMER_COOKIE)?.value;
  const guestToken = jar.get("guest_token")?.value;
  const signed = Boolean(expires && signature);
  if (!signed && !customerToken && !guestToken) return null;

  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const query = signed ? `?${new URLSearchParams({ expires: expires!, signature: signature! })}` : "";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/orders/${id}/invoice${query}`, {
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
  const invoice = ((await response.json()) as { data: Invoice }).data;
  return { ...invoice, ...readOrderDiscount(invoice) };
});
