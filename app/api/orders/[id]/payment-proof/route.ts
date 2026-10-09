import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

// The backend caps the file at 5 MB; leave room for the multipart envelope and text fields.
const MAX_BODY_BYTES = 6 * 1024 * 1024;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  // Refuse oversized uploads before buffering them into memory.
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return Response.json({ message: "Ukuran bukti transfer maksimal 5 MB." }, { status: 413 });
  }
  // Ownership, payment method and order status are enforced by the backend.
  return apiProxy(request, `/orders/${id}/payment-proof`);
}
