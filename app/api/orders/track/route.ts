import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

/**
 * "Lacak pesanan saya" dari tombol bantuan: { order, phone } (nomor pesanan atau invoice, dan 4 digit
 * terakhir telepon). Backend yang mencocokkan, membatasi tebakan, dan hanya menjawab status serta resi.
 */
export async function POST(request: NextRequest) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/orders/track");
}
