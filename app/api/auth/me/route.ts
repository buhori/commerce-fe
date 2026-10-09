import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { CUSTOMER_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Guests skip the backend round trip.
  if (!request.cookies.has(CUSTOMER_COOKIE)) {
    return Response.json({ data: null }, { headers: { "Cache-Control": "no-store" } });
  }
  return apiProxy(request, "/auth/me");
}

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/auth/me");
}
