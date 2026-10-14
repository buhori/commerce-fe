import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  const addressCode = request.nextUrl.searchParams.get("address_code") || "";
  if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(addressCode)) {
    return Response.json({ message: "Kode wilayah alamat tidak valid." }, { status: 400 });
  }
  // The proxy builds the upstream URL from this path, so the query has to travel with it.
  // A pre-order is weighed from its own cart, not from the shopping cart.
  const cart = request.nextUrl.searchParams.get("cart") === "preorder" ? "&cart=preorder" : "";
  return apiProxy(request, `/shipping/options?address_code=${addressCode}${cart}`);
}
