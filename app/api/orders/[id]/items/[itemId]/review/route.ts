import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id, itemId } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id) || !/^[1-9]\d{0,17}$/.test(itemId)) {
    return Response.json({ message: "Pesanan tidak valid." }, { status: 400 });
  }
  // Ulasan barang di pesanan sendiri; kepemilikan dan status pesanan dicek backend.
  return apiProxy(request, `/orders/${id}/items/${itemId}/review`);
}
