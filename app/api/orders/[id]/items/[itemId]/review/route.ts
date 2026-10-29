import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { readInvoiceAccess } from "@/lib/invoice";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id, itemId } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id) || !/^[1-9]\d{0,17}$/.test(itemId)) {
    return Response.json({ message: "Pesanan tidak valid." }, { status: 400 });
  }
  // Ulasan barang di pesanan sendiri, atau lewat link bertanda tangan dari email permintaan ulasan;
  // kepemilikan, tanda tangan, dan status pesanan dicek backend.
  const access = readInvoiceAccess(Object.fromEntries(request.nextUrl.searchParams));
  const query = access ? `?${new URLSearchParams(access)}` : "";
  // Foto dan video ulasan (toko Business) butuh waktu unggah lebih lama.
  return apiProxy(request, `/orders/${id}/items/${itemId}/review${query}`, { timeoutMs: 60_000 });
}
