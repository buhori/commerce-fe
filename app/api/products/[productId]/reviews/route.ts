import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

/** Halaman ulasan berikutnya (tombol "Muat lebih banyak" di halaman produk). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  if (!/^\d+$/.test(productId) || !Number.isSafeInteger(Number(productId)) || Number(productId) < 1 || !Number.isSafeInteger(page) || page < 1 || page > 1000) {
    return Response.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  return apiProxy(request, `/products/${Number(productId)}/reviews?page=${page}`);
}
