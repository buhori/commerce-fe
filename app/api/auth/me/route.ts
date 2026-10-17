import type { NextRequest } from "next/server";
import { apiProxy, expiredCustomerCookie } from "@/lib/api-proxy";
import { CUSTOMER_COOKIE } from "@/lib/auth";
import { isForeignOrigin } from "@/lib/request-origin";

export async function GET(request: NextRequest) {
  // Guests skip the backend round trip.
  if (!request.cookies.has(CUSTOMER_COOKIE)) {
    return Response.json({ data: null }, { headers: { "Cache-Control": "no-store" } });
  }
  const response = await apiProxy(request, "/auth/me");
  // Token basi dibaca sebagai tamu, sama seperti tanpa cookie; apiProxy sudah menyiapkan penghapusan cookienya.
  if (response.status === 401) {
    return Response.json({ data: null }, { headers: { "Cache-Control": "no-store", "Set-Cookie": expiredCustomerCookie() } });
  }
  return response;
}

export async function PUT(request: NextRequest) {
  if (isForeignOrigin(request)) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/auth/me");
}
