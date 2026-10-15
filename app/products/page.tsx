import type { Metadata } from "next";
import { CatalogPage, catalogTitle } from "@/components/catalog-page";
import { readCatalogFilter } from "@/lib/catalog-url";
import { canonicalCatalog, pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getCategories } from "@/lib/store-api";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const filter = readCatalogFilter(await searchParams);
  const [site, categories] = await Promise.all([getSiteSeo(), getCategories().catch(() => [])]);
  const title = catalogTitle(filter, categories);
  // Urutan dan parameter asing berbagi satu canonical; pencarian dan produk pilihan tidak diindeks.
  const { path, noindex } = canonicalCatalog(filter, categories);
  const plain = !filter.q && !filter.productIds.length && !filter.categoryIds.length;
  return pageMetadata(site, {
    title,
    description: plain ? `Belanja semua produk ${site.name} secara online.` : `${title} di ${site.name}.`,
    path,
    noindex,
  });
}

/** Semua produk, atau sebagian lewat filter=id|category|sort (lihat lib/catalog-url.ts). */
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  return <CatalogPage params={await searchParams} />;
}
