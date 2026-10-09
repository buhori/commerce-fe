import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { isCatalogSort } from "@/lib/catalog-url";
import { productQueryString } from "@/lib/store-api";

// "Load more" for the catalog: only known parameters, validated, reach the backend.
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const number = (name: string) => {
    const value = search.get(name);
    return value && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : undefined;
  };
  const sort = search.get("sort");
  return apiProxy(request, `/products?${productQueryString({
    categoryId: number("category_id"),
    lastProductId: number("last_product_id"),
    q: search.get("q")?.trim().slice(0, 100) || undefined,
    sort: isCatalogSort(sort) ? sort : undefined,
  })}`);
}
