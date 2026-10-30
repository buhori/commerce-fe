import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { readInvoiceAccess } from "@/lib/invoice";
import { isForeignOrigin } from "@/lib/request-origin";

/** URL unggah langsung ke S3 untuk foto/video ulasan dan bukti transfer; filenya tidak lewat sini. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  // Link ulasan dari email (bertanda tangan) diteruskan; kepemilikan, jenis, dan ukuran dicek backend.
  const access = readInvoiceAccess(Object.fromEntries(request.nextUrl.searchParams));
  return apiProxy(request, `/orders/${id}/uploads${access ? `?${new URLSearchParams(access)}` : ""}`);
}
