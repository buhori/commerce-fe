import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/notifications/read-all");
}
