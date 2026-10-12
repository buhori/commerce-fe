import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isForeignOrigin } from "@/lib/request-origin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (isForeignOrigin(request)) {
    return Response.json(
      { message: "Permintaan tidak diizinkan." },
      { status: 403 },
    );
  }
  const { productId } = await params;
  if (
    !/^\d+$/.test(productId) ||
    !Number.isSafeInteger(Number(productId)) ||
    Number(productId) < 1
  ) {
    return Response.json(
      { message: "ID produk tidak valid." },
      { status: 400 },
    );
  }
  return apiProxy(request, `/cart/${Number(productId)}/modify`);
}
