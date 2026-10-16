import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  // Potongan dihitung backend dari keranjang pembeli ini (token tamu atau akun), bukan dari isi permintaan.
  return apiProxy(request, "/checkout/coupon");
}
