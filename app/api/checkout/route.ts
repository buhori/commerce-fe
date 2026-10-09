import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  // Prices and the order total are recomputed by the backend, never taken from here.
  return apiProxy(request, "/checkout");
}
