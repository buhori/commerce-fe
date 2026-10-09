import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{2}(?:\.\d{2}(?:\.\d{2})?)?$/.test(code)) {
    return Response.json({ message: "Kode wilayah tidak valid." }, { status: 400 });
  }
  return apiProxy(request, `/regions/${code}`);
}
