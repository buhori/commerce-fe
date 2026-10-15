import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { originFromHeaders, siteUrl } from "@/lib/seo";
import { sitemapEntries } from "@/lib/sitemap";
import { getSitemap, getStore, StoreApiError } from "@/lib/store-api";

/**
 * sitemap.xml per toko dari GET /sitemap; headers() membuatnya dirender per request. Toko yang
 * tidak terdaftar atau minta tidak diindeks mendapat sitemap kosong; bila backend gagal, beranda
 * dan katalog tetap tercantum.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = originFromHeaders(await headers());
  const store = await getStore().catch((error: unknown) => (error instanceof StoreApiError && error.status === 404 ? "missing" : null));
  if (store === "missing" || store?.seo?.noindex) return [];
  const data = await getSitemap().catch(() => null);
  return sitemapEntries(siteUrl(store, origin), data);
}
