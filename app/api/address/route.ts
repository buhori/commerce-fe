import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  // Authentication and address ownership are enforced by the backend.
  return apiProxy(request, "/address");
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  return apiProxy(request, "/address");
}
