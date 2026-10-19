import type { NextRequest } from "next/server";
import { apiProxy, GATEWAY_TIMEOUT_MS } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  // Tombol "Cek status pembayaran": backend menanyakan status ke payment gateway sekarang (tanpa
  // menunggu webhook) lalu membalas detail pesanan terbaru; kepemilikan dicek backend.
  return apiProxy(request, `/orders/${id}/payment/check`, { timeoutMs: GATEWAY_TIMEOUT_MS });
}
