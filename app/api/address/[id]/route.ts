import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return Response.json({ message: "Alamat tidak valid." }, { status: 400 });
  }
  // The backend only resolves addresses owned by the caller's guest token or account.
  return apiProxy(request, `/address/${id}`);
}
