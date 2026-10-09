import type { Metadata } from "next";
import { CatalogPage, type CatalogSearchParams } from "@/components/catalog-page";
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

export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <CatalogPage params={await searchParams} />;
}
