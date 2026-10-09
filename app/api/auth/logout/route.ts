import { NextResponse, type NextRequest } from "next/server";
import { backendFetch, CUSTOMER_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }

  // The cookie is removed even if revoking the token upstream fails.
  await backendFetch(request, "/auth/logout", { method: "POST" }).catch(() => null);
  const response = NextResponse.json({ message: "Anda sudah keluar." });
  response.cookies.delete(CUSTOMER_COOKIE);
  return response;
}
