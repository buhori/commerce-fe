import type { NextRequest } from "next/server";
import { apiProxy, GATEWAY_TIMEOUT_MS } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  // Prices and the order total are recomputed by the backend, never taken from here.
  return apiProxy(request, "/checkout", { timeoutMs: GATEWAY_TIMEOUT_MS });
}
