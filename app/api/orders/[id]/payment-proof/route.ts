import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

// The backend caps the file at 2 MB; leave room for the multipart envelope and text fields.
const MAX_BODY_BYTES = 3 * 1024 * 1024;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  // Refuse oversized uploads before buffering them into memory.
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return Response.json({ message: "Ukuran bukti transfer maksimal 2 MB." }, { status: 413 });
  }
  // Ownership, payment method and order status are enforced by the backend.
  return apiProxy(request, `/orders/${id}/payment-proof`);
}
