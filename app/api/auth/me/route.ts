import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { CUSTOMER_COOKIE } from "@/lib/auth";
import { isForeignOrigin } from "@/lib/request-origin";

export async function GET(request: NextRequest) {
  // Guests skip the backend round trip.
  if (!request.cookies.has(CUSTOMER_COOKIE)) {
    return Response.json({ data: null }, { headers: { "Cache-Control": "no-store" } });
  }
  return apiProxy(request, "/auth/me");
}

export async function PUT(request: NextRequest) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/auth/me");
}
