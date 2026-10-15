import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { JsonLd } from "@/components/json-ld";
import { catalogUrl, readCatalogFilter } from "@/lib/catalog-url";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSeo();
  // Judul absolut: template root akan menjadi "Toko | Toko" untuk beranda.
  return pageMetadata(site, { absoluteTitle: site.title, description: site.description, path: "/" });
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  // Pencarian dan urutan dulu tinggal di "/"; sekarang katalog ada di /products.
  if (params.q !== undefined || params.sort !== undefined || params.filter !== undefined) {
    redirect(catalogUrl(readCatalogFilter(params)));
  }
  const { store, base } = await getSiteSeo();
  return (
    <>
      {/* Identitas toko dan kotak pencarian untuk mesin pencari; hanya di beranda. */}
      {store && <JsonLd data={[websiteJsonLd(store, base), organizationJsonLd(store, base)]} />}
      <HomePage />
    </>
  );
}
