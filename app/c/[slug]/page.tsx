import type { Metadata } from "next";
import { CatalogPage, type CatalogSearchParams } from "@/components/catalog-page";
import { getCategories, getStore } from "@/lib/store-api";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [store, categories] = await Promise.all([getStore().catch(() => null), getCategories().catch(() => [])]);
  const category = categories.find((entry) => entry.slug === slug);
  const name = category?.name ?? "Kategori";
  return { title: store ? `${name} — ${store.name}` : name };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <CatalogPage params={query} categorySlug={slug} />;
}
