import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { readCatalogFilter } from "@/lib/catalog-url";
import { productQueryString } from "@/lib/store-api";

// "Load more" untuk katalog: hanya parameter yang dikenal dan sudah diperiksa yang diteruskan ke backend.
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const number = (name: string) => {
    const value = search.get(name);
    return value && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : undefined;
  };
  const { productIds, categoryIds, sort, q } = readCatalogFilter(search);
  return apiProxy(request, `/products?${productQueryString({
    productIds,
    categoryIds,
    categoryId: number("category_id"),
    lastProductId: number("last_product_id"),
    q,
    sort,
  })}`);
}
