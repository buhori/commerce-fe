import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  if (!/^\d+$/.test(productId) || !Number.isSafeInteger(Number(productId)) || Number(productId) < 1) {
    return Response.json({ message: "ID produk tidak valid." }, { status: 400 });
  }
  return apiProxy(request, `/products/${Number(productId)}`);
}
