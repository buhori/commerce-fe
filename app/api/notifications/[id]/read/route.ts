import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Pemberitahuan tidak valid." }, { status: 400 });
  }
  // Ownership is enforced by the backend against the buyer's token.
  return apiProxy(request, `/notifications/${id}/read`);
}
