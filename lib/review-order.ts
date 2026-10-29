import { cache } from "react";
import { readReviewOrder, type ReviewOrder } from "./checkout";
import type { InvoiceAccess } from "./invoice";
import { currentStoreHeaders } from "./store-host";

/**
 * Barang pesanan beserta ulasannya untuk halaman ulasan dari email (GET /orders/{id}/reviews), lewat
 * link bertanda tangan sehingga bisa dibuka dari perangkat mana pun. null bila pesanan tidak ada atau
 * tanda tangannya tidak berlaku (backend menjawab 404 untuk semuanya).
 */
export const getReviewOrder = cache(async (id: string, access: InvoiceAccess): Promise<ReviewOrder | null> => {
  if (!/^\d{1,10}$/.test(id)) return null;
  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/orders/${id}/reviews?${new URLSearchParams(access)}`, {
    headers: { Accept: "application/json", ...(await currentStoreHeaders()) },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Store API returned ${response.status}`);
  return readReviewOrder(await response.json());
});
