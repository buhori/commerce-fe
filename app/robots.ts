import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { originFromHeaders, siteUrl } from "@/lib/seo";
import { getStore, StoreApiError } from "@/lib/store-api";

// Halaman pribadi dan transaksi; isinya per pembeli dan tidak berguna di hasil pencarian.
const PRIVATE = ["/cart", "/checkout", "/payment/", "/invoice/", "/profile", "/login", "/api/", "/auth/", "/preview"];

/**
 * robots.txt per toko. headers() membuatnya dirender per request, bukan di-cache sekali untuk
 * semua host. Toko yang tidak terdaftar menutup semuanya; gangguan backend tidak, supaya crawler
 * tidak berhenti merayapi toko yang sebenarnya ada.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = originFromHeaders(await headers());
  const store = await getStore().catch((error: unknown) => (error instanceof StoreApiError && error.status === 404 ? "missing" : null));
  if (store === "missing") return { rules: { userAgent: "*", disallow: "/" } };
  const base = siteUrl(store, origin);
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
