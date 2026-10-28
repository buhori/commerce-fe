// SEO toko: URL kanonik, deskripsi meta, metadata dasar, dan JSON-LD. Murni (hanya mengimpor
// lib/catalog-url.ts) supaya bisa diuji langsung; yang membaca request ada di lib/site-seo.ts.
import type { Metadata } from "next";
import { catalogUrl, type CatalogFilter } from "./catalog-url";
import { e164 } from "./phone";

/** SEO halaman dari backend (produk, kategori, halaman); semua opsional di backend lama. */
export interface PageSeo {
  title: string | null;
  description: string | null;
  /** URL absolut http(s). */
  image: string | null;
}

export interface StoreSeo extends PageSeo {
  noindex: boolean;
  google_verification: string | null;
}

type Json = Record<string, unknown>;

const text = (value: unknown, max = 500) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

/** URL http(s) absolut yang valid, selain itu null (javascript:, data:, path relatif). */
export function httpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return null;
  try {
    return new URL(value.trim()).href;
  } catch {
    return null;
  }
}

/** Bentuk `seo` dari API tidak dipercaya: teks atau null, gambar harus http(s). */
export function readSeo(value: unknown): PageSeo {
  const seo = value && typeof value === "object" ? (value as Json) : {};
  return { title: text(seo.title, 200), description: text(seo.description, 1000), image: httpUrl(seo.image) };
}

export function readStoreSeo(value: unknown): StoreSeo {
  const seo = value && typeof value === "object" ? (value as Json) : {};
  // Token verifikasi Google hanya huruf, angka, - dan _; selain itu dibuang.
  const google = text(seo.google_verification, 200);
  return {
    ...readSeo(seo),
    noindex: seo.noindex === true,
    google_verification: google && /^[A-Za-z0-9_-]+$/.test(google) ? google : null,
  };
}

/** Origin http(s) saja, tanpa path dan garis miring akhir; null bila bukan URL yang valid. */
function origin(value: unknown): string | null {
  const url = httpUrl(value);
  return url ? new URL(url).origin : null;
}

/** Origin yang dibuka pengunjung, dari header request (di balik proxy: X-Forwarded-*). */
export function originFromHeaders(source: Headers): string {
  const first = (name: string) => source.get(name)?.split(",")[0]?.trim() || null;
  const host = first("x-forwarded-host") ?? first("host") ?? "localhost";
  const proto = first("x-forwarded-proto") === "http" ? "http" : "https";
  return origin(`${proto}://${host}`) ?? "http://localhost";
}

/**
 * Alamat publik toko untuk canonical, sitemap, dan JSON-LD. `store.url` dari backend didahulukan
 * (domain sendiri atau subdomain utama), supaya alamat lain dari toko yang sama tidak terindeks
 * sebagai duplikat; backend lama tanpa `url` memakai origin request.
 */
export function siteUrl(store: { url?: unknown } | null | undefined, fallbackOrigin: string): string {
  return origin(store?.url) ?? origin(fallbackOrigin) ?? "http://localhost";
}

export function absoluteUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const root = base.replace(/\/+$/, "");
  return path === "/" || path === "" ? `${root}/` : `${root}/${path.replace(/^\/+/, "")}`;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Deskripsi meta dari teks bebas atau HTML: tag dibuang, entitas dasar didekode, spasi dirapikan,
 * lalu dipotong di batas kata dengan "…" (paling banyak `max` karakter). Kosong bila tidak ada isi.
 */
export function metaDescription(value: unknown, max = 160): string {
  if (typeof value !== "string") return "";
  const plain = decodeEntities(
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  ).replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  // Kata yang sangat panjang (mis. URL) tetap dipotong daripada menyisakan deskripsi pendek sekali.
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?–—-]+$/, "")}…`;
}

export function ogLocale(language: unknown): string {
  return language === "en" ? "en_US" : "id_ID";
}

/** Atribut lang <html>; hanya bahasa yang didukung storefront, selain itu "id". */
export function htmlLang(language: unknown): "id" | "en" {
  return language === "en" ? "en" : "id";
}

/** Data toko yang dipakai metadata setiap halaman. */
export interface SiteSeo {
  /** URL publik toko tanpa garis miring akhir. */
  base: string;
  name: string;
  /** Judul beranda (SEO toko atau nama toko). */
  title: string;
  description: string;
  image: string | null;
  locale: string;
  /** Toko minta tidak diindeks, sedang pratinjau, atau tidak ada; halaman anak tidak boleh membuka. */
  noindex: boolean;
  googleVerification: string | null;
}

export interface SeoStoreInput {
  name?: unknown;
  url?: unknown;
  description?: unknown;
  language?: unknown;
  logo?: unknown;
  seo?: Partial<StoreSeo> | null;
}

const FALLBACK_NAME = "Toko Online";
const FALLBACK_DESCRIPTION = "Temukan produk pilihan untuk kebutuhan sehari-hari.";

export function siteSeo(store: SeoStoreInput | null, fallbackOrigin: string, options: { preview?: boolean; missing?: boolean } = {}): SiteSeo {
  const name = text(store?.name, 200) ?? FALLBACK_NAME;
  const seo = store?.seo ?? null;
  return {
    base: siteUrl(store, fallbackOrigin),
    name,
    title: text(seo?.title, 200) ?? name,
    description: metaDescription(seo?.description) || metaDescription(store?.description) || (store ? `Belanja online di ${name}.` : FALLBACK_DESCRIPTION),
    image: httpUrl(seo?.image) ?? httpUrl(store?.logo),
    locale: ogLocale(store?.language),
    noindex: seo?.noindex === true || options.preview === true || options.missing === true,
    googleVerification: text(seo?.google_verification, 200),
  };
}

type Robots = { index: boolean; follow: boolean };

/** noindex untuk seluruh toko; dipakai root layout dan halaman anak yang mengganti `robots`. */
const SITE_NOINDEX: Robots = { index: false, follow: false };

/**
 * Metadata root layout. openGraph/twitter sengaja tanpa title, description, dan url: Next mengisinya
 * dari judul dan deskripsi akhir tiap halaman, sedangkan halaman yang mengganti objek ini memakai
 * pageMetadata() supaya siteName, locale, dan gambar tetap ikut (objek bertingkat tidak digabung).
 */
export function rootMetadata(site: SiteSeo): Metadata {
  return {
    metadataBase: site.base,
    title: { default: site.title, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    openGraph: baseOpenGraph(site),
    twitter: { card: site.image ? "summary_large_image" : "summary" },
    robots: site.noindex ? SITE_NOINDEX : undefined,
    verification: site.googleVerification ? { google: site.googleVerification } : undefined,
  };
}

function baseOpenGraph(site: SiteSeo, images?: OgImage[]) {
  const list = images?.length ? images : site.image ? [{ url: site.image, alt: site.name }] : [];
  return {
    type: "website" as const,
    siteName: site.name,
    locale: site.locale,
    ...(list.length ? { images: list } : {}),
  };
}

export type OgImage = { url: string; alt?: string };

export interface PageSeoInput {
  /** Judul halaman; template root menambahkan " | {toko}". */
  title?: string;
  /** Judul tanpa template (beranda). */
  absoluteTitle?: string;
  description?: string;
  /** Path kanonik, mis. "/products/kopi". */
  path?: string;
  images?: OgImage[];
  /** Hanya untuk menutup halaman (noindex); halaman anak tidak pernah membuka yang ditutup toko. */
  noindex?: boolean;
  other?: Record<string, string>;
}

/** Metadata halaman yang mengganti canonical/openGraph tanpa kehilangan bagian dasar dari root. */
export function pageMetadata(site: SiteSeo, page: PageSeoInput): Metadata {
  const metadata: Metadata = {};
  if (page.absoluteTitle) metadata.title = { absolute: page.absoluteTitle };
  else if (page.title) metadata.title = page.title;
  if (page.description) metadata.description = page.description;
  if (page.path) metadata.alternates = { canonical: page.path };
  metadata.openGraph = { ...baseOpenGraph(site, page.images), ...(page.path ? { url: page.path } : {}) };
  const hasImage = Boolean(page.images?.length || site.image);
  metadata.twitter = { card: hasImage ? "summary_large_image" : "summary" };
  if (site.noindex) metadata.robots = SITE_NOINDEX;
  else if (page.noindex) metadata.robots = { index: false, follow: true };
  if (page.other) metadata.other = page.other;
  return metadata;
}

export interface CatalogCanonical {
  /** Path kanonik (relatif ke base). */
  path: string;
  /** Pencarian dan pilihan manual tidak diindeks, tautannya tetap diikuti. */
  noindex: boolean;
}

/**
 * Canonical dan robots untuk /products dengan semantik lib/catalog-url.ts: urutan tidak membuat
 * halaman baru (canonical /products), satu kategori pindah ke /c/{slug}, pencarian dan produk
 * pilihan (filter=id) noindex. Parameter lain tidak ikut karena URL dibangun ulang dari filter.
 */
export function canonicalCatalog(filter: CatalogFilter, categories: { id: number; slug: string }[] = []): CatalogCanonical {
  if (filter.q) return { path: catalogUrl({ q: filter.q, categoryIds: filter.categoryIds }), noindex: true };
  if (filter.productIds.length) return { path: catalogUrl({ productIds: filter.productIds }), noindex: true };
  if (filter.categoryIds.length === 1) {
    const slug = categories.find((category) => category.id === filter.categoryIds[0])?.slug;
    return { path: slug ? catalogUrl({ category: slug }) : "/products", noindex: false };
  }
  // Gabungan beberapa kategori berlipat ganda kombinasinya; tetap bisa dirayapi, tidak diindeks.
  if (filter.categoryIds.length) return { path: catalogUrl({ categoryIds: filter.categoryIds }), noindex: true };
  return { path: "/products", noindex: false };
}

// ---------------------------------------------------------------------------------------------
// JSON-LD (schema.org). Objek biasa; dirender oleh components/json-ld.tsx.

/**
 * JSON-LD tambahan dari plugin SEO (backend sudah memvalidasinya): hanya objek schema.org yang
 * dipakai; selain itu diabaikan.
 */
export function readStructuredData(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const context = (value as { "@context"?: unknown })["@context"];
  return typeof context === "string" && /^https?:\/\/schema\.org\/?$/.test(context) ? (value as Record<string, unknown>) : null;
}

/** JSON untuk <script type="application/ld+json">; "<" di-escape supaya teks tidak bisa menutup tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type AvailabilityTone = "preorder" | "ok" | "low" | "out";

const AVAILABILITY: Record<AvailabilityTone, string> = {
  ok: "https://schema.org/InStock",
  low: "https://schema.org/InStock",
  out: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

const validPrice = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

type PricedRow = { price?: unknown; final_price?: unknown };

/**
 * Harga terendah dan tertinggi produk; varian tanpa harga sendiri memakai harga produk. Memakai
 * harga setelah diskon (final_price) bila ada, agar sama dengan harga yang tampil di halaman.
 */
export function priceRange(product: PricedRow & { variants?: PricedRow[] | null }) {
  const base = validPrice(product.final_price) ? product.final_price : validPrice(product.price) ? product.price : null;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const prices = variants.length
    ? variants.map((variant) => (validPrice(variant?.final_price) ? variant.final_price : validPrice(variant?.price) ? variant.price : base)).filter(validPrice)
    : base === null ? [] : [base];
  if (!prices.length) return null;
  return { low: Math.min(...prices), high: Math.max(...prices), count: variants.length || 1 };
}

export interface ProductJsonLdInput {
  product: {
    name: string;
    sku?: unknown;
    price?: unknown;
    final_price?: unknown;
    variants?: PricedRow[] | null;
    rating?: unknown;
    rating_count?: unknown;
  };
  /** URL absolut halaman produk. */
  url: string;
  images: string[];
  description?: string;
  currency: string;
  availability: AvailabilityTone;
  seller: string;
}

export function productJsonLd({ product, url, images, description, currency, availability, seller }: ProductJsonLdInput): Json {
  const range = priceRange(product);
  const common = {
    priceCurrency: currency || "IDR",
    availability: AVAILABILITY[availability],
    itemCondition: "https://schema.org/NewCondition",
    url,
    seller: { "@type": "Organization", name: seller },
  };
  const offers = !range ? undefined
    : range.low === range.high
      ? { "@type": "Offer", price: range.low, ...common }
      : { "@type": "AggregateOffer", lowPrice: range.low, highPrice: range.high, offerCount: range.count, ...common };

  const count = typeof product.rating_count === "number" && Number.isInteger(product.rating_count) ? product.rating_count : 0;
  const rating = typeof product.rating === "number" && product.rating >= 1 && product.rating <= 5 ? product.rating : null;

  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description || undefined,
    image: images.length ? images : undefined,
    sku: text(product.sku, 100) ?? undefined,
    url,
    offers,
    aggregateRating: count > 0 && rating !== null
      ? { "@type": "AggregateRating", ratingValue: Math.round(rating * 10) / 10, reviewCount: count, bestRating: 5, worstRating: 1 }
      : undefined,
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}

/** FAQPage dari widget FAQ halaman builder; null bila tidak ada pertanyaan. */
export function faqJsonLd(items: { question: string; answer: string }[]): Json | null {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function websiteJsonLd(store: { name: string; language?: unknown }, base: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: absoluteUrl(base, "/"),
    inLanguage: htmlLang(store.language),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

// Nomor E.164 (+62812…): aturan yang sama dengan tampilan nomor toko (lib/phone.ts).
export { e164 };

export interface OrganizationInput {
  name: string;
  /** false: pemilik toko menyembunyikan alamatnya, jadi tidak ikut di data terstruktur. */
  show_address?: boolean;
  logo?: unknown;
  description?: unknown;
  email?: unknown;
  phone?: unknown;
  phone_country_code?: unknown;
  address?: unknown;
}

export function organizationJsonLd(store: OrganizationInput, base: string): Json {
  const email = text(store.email, 200);
  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: store.name,
    url: absoluteUrl(base, "/"),
    logo: httpUrl(store.logo) ?? undefined,
    description: metaDescription(store.description, 500) || undefined,
    email: email && /^[^\s@]+@[^\s@]+$/.test(email) ? email : undefined,
    telephone: e164(store.phone_country_code, store.phone) ?? undefined,
    address: store.show_address === false ? undefined : text(store.address) ?? undefined,
  });
}

function withoutEmpty(value: Json): Json {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null));
}
