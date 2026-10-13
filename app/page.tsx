import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { catalogUrl, readCatalogFilter } from "@/lib/catalog-url";
import { getStore } from "@/lib/store-api";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const store = await getStore();
    return {
      title: `${store.name} — Toko Online`,
      description: store.description || `Belanja di ${store.name}.`,
    };
  } catch {
    return { title: "Toko Online" };
  }
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  // Pencarian dan urutan dulu tinggal di "/"; sekarang katalog ada di /products.
  if (params.q !== undefined || params.sort !== undefined || params.filter !== undefined) {
    redirect(catalogUrl(readCatalogFilter(params)));
  }
  return <HomePage />;
}
