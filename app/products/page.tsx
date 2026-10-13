import type { Metadata } from "next";
import { CatalogPage, catalogTitle } from "@/components/catalog-page";
import { readCatalogFilter } from "@/lib/catalog-url";
import { getCategories, getStore } from "@/lib/store-api";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const filter = readCatalogFilter(await searchParams);
  const [store, categories] = await Promise.all([getStore().catch(() => null), getCategories().catch(() => [])]);
  const title = catalogTitle(filter, categories);
  return { title: store ? `${title} — ${store.name}` : title };
}

/** Semua produk, atau sebagian lewat filter=id|category|sort (lihat lib/catalog-url.ts). */
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  return <CatalogPage params={await searchParams} />;
}
