// Sitemap toko dari GET /sitemap. Murni supaya bentuk respons dan URL-nya bisa diuji langsung.
import type { MetadataRoute } from "next";
import { absoluteUrl, httpUrl } from "./seo";
import { isPageSlug } from "./store-shared";

export interface SitemapData {
  products: { slug: string; updated_at: string | null; image: string | null }[];
  categories: { slug: string; updated_at: string | null }[];
  pages: { slug: string; updated_at: string | null }[];
}

/** Batas protokol sitemap per berkas. */
const MAX_URLS = 50_000;

const rows = (value: unknown) => (Array.isArray(value) ? value : []).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
const slug = (value: unknown) => (typeof value === "string" && value.trim() && !/[/\\\u0000-\u001f]/.test(value) && value !== "." && value !== ".." ? value : null);
// Tanggal yang tidak bisa dibaca dilewati, bukan membuat <lastmod> yang salah. Dibentuk ulang
// sebagai ISO karena Next menulis nilainya apa adanya ke XML.
const date = (value: unknown) => (typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null);
// Next juga tidak meng-escape <image:loc>; query string gambar CDN biasanya berisi "&".
const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Respons `{data: {products, categories, pages}}`; baris yang tidak valid dibuang. */
export function readSitemap(value: unknown): SitemapData {
  const data = value && typeof value === "object" ? (value as { data?: unknown }).data : null;
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid sitemap response");
  const source = data as Record<string, unknown>;
  return {
    products: rows(source.products).flatMap((row) => {
      const value = slug(row.slug);
      return value ? [{ slug: value, updated_at: date(row.updated_at), image: httpUrl(row.image) }] : [];
    }),
    categories: rows(source.categories).flatMap((row) => {
      const value = slug(row.slug);
      return value ? [{ slug: value, updated_at: date(row.updated_at) }] : [];
    }),
    pages: rows(source.pages).flatMap((row) => (isPageSlug(row.slug) ? [{ slug: row.slug, updated_at: date(row.updated_at) }] : [])),
  };
}

/** Entri sitemap absolut; tanpa data (backend gagal) tetap ada beranda dan katalog. */
export function sitemapEntries(base: string, data: SitemapData | null): MetadataRoute.Sitemap {
  const at = (updated: string | null) => (updated ? { lastModified: updated } : {});
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(base, "/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(base, "/products"), changeFrequency: "daily", priority: 0.8 },
  ];
  if (!data) return entries;
  for (const category of data.categories) {
    entries.push({ url: absoluteUrl(base, `/c/${encodeURIComponent(category.slug)}`), ...at(category.updated_at), changeFrequency: "weekly", priority: 0.7 });
  }
  for (const product of data.products) {
    entries.push({
      url: absoluteUrl(base, `/products/${encodeURIComponent(product.slug)}`),
      ...at(product.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
      ...(product.image ? { images: [xml(product.image)] } : {}),
    });
  }
  for (const page of data.pages) {
    entries.push({ url: absoluteUrl(base, `/${page.slug}`), ...at(page.updated_at), changeFrequency: "monthly", priority: 0.4 });
  }
  return entries.slice(0, MAX_URLS);
}
