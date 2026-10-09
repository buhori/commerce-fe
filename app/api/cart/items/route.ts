import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
  // Only the pre-order cart is a valid alternative to the shopping cart.
  const preorder = request.nextUrl.searchParams.get("cart") === "preorder";
  return apiProxy(request, preorder ? "/cart/items?cart=preorder" : "/cart/items");
}
