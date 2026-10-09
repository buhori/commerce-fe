import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Nomor pesanan tidak valid." }, { status: 400 });
  }
  // Ownership is enforced by the backend against the guest token the proxy forwards.
  return apiProxy(request, `/orders/${id}`);
}
