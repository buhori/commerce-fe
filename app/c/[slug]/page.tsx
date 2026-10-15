import type { Metadata } from "next";
import { CatalogPage, type CatalogSearchParams } from "@/components/catalog-page";
import { JsonLd } from "@/components/json-ld";
import { catalogUrl, readCatalogFilter } from "@/lib/catalog-url";
import { absoluteUrl, breadcrumbJsonLd, httpUrl, pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getCategories } from "@/lib/store-api";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

async function findCategory(slug: string) {
  const categories = await getCategories().catch(() => []);
  return categories.find((entry) => entry.slug === slug);
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [site, category] = await Promise.all([getSiteSeo(), findCategory(slug)]);
  if (!category) return { title: "Kategori" };
  const title = category.seo?.title || category.name;
  const image = category.seo?.image || httpUrl(category.logo);
  return pageMetadata(site, {
    title,
    description: category.seo?.description || `Belanja ${category.name} di ${site.name}.`,
    // Urutan tidak membuat halaman baru; pencarian di dalam kategori tidak diindeks.
    path: catalogUrl({ category: category.slug }),
    images: image ? [{ url: image, alt: category.name }] : undefined,
    noindex: Boolean(readCatalogFilter(query).q),
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [site, category] = await Promise.all([getSiteSeo(), findCategory(slug)]);
  return (
    <>
      {category && (
        <JsonLd data={breadcrumbJsonLd([
          { name: "Beranda", url: absoluteUrl(site.base, "/") },
          { name: "Produk", url: absoluteUrl(site.base, "/products") },
          { name: category.name, url: absoluteUrl(site.base, catalogUrl({ category: category.slug })) },
        ])} />
      )}
      <CatalogPage params={query} categorySlug={slug} />
    </>
  );
}
