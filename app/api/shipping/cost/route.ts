import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  const addressCode = request.nextUrl.searchParams.get("address_code") || "";
  const methodId = request.nextUrl.searchParams.get("shipping_method_id") || "";
  if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(addressCode) || !/^\d{1,6}$/.test(methodId)) {
    return Response.json({ message: "Parameter ongkos kirim tidak valid." }, { status: 400 });
  }
  // The proxy builds the upstream URL from this path, so the query has to travel with it.
  // A pre-order is weighed from its own cart, not from the shopping cart.
  const cart = request.nextUrl.searchParams.get("cart") === "preorder" ? "&cart=preorder" : "";
  return apiProxy(request, `/shipping/cost?address_code=${addressCode}&shipping_method_id=${methodId}${cart}`);
}
