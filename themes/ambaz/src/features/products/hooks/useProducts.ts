'use client';

import { useProducts as useStoreProducts, useProduct as useStoreProduct } from '@sellosy/theme';
import { toAmbazProduct } from '../../../lib/adapt';
import type { Product } from '../../../types/product';

/** Parameter useProducts Ambaz yang berlaku di platform. */
export interface ProductsParams {
  /** "best-selling", "top-rated", "newest", "price-asc", "price-desc"; lainnya = urutan toko. */
  sort?: string;
  category?: string | number;
  q?: string;
  ids?: number[];
  limit?: number;
}

const SORTS: Record<string, string> = { 'best-selling': 'top_sale', 'top-rated': 'top_rating', newest: 'latest', 'price-asc': 'price_asc', 'price-desc': 'price_desc' };

/** useProducts Ambaz dengan data produk toko: `{ data: { products } }` seperti API demonya. */
export function useProducts(params: ProductsParams = {}) {
  const categoryId = typeof params.category === 'number' ? params.category : undefined;
  const { products, status } = useStoreProducts({
    sort: params.sort ? SORTS[params.sort] : undefined,
    categoryId,
    q: params.q,
    productIds: params.ids,
  });
  const mapped: Product[] = products.slice(0, params.limit ?? products.length).map((product) => toAmbazProduct(product));
  return { data: { products: mapped, total: mapped.length }, isLoading: status === 'loading', isError: status === 'error' };
}

/** Detail produk (varian, galeri) untuk quick view. */
export function useProduct(productId: string | null) {
  const { product, status } = useStoreProduct(productId ? Number(productId) : null);
  return { data: product ? toAmbazProduct(product) : null, isLoading: status === 'loading', isError: status === 'error' };
}
