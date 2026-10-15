import { cache } from "react";
import { currentStoreHeaders } from "./store-host";
import { readHomeSections, type HomeSection } from "./home-sections";
import { httpUrl, readSeo, readStoreSeo, type PageSeo, type StoreSeo } from "./seo";
import { readSitemap, type SitemapData } from "./sitemap";
import { isPageSlug, productQueryString, readProductPage, readStoreMaintenance, type ProductQuery, type StoreMaintenance } from "./store-shared";

// Client components import these from ./store-shared; server code may keep using this module.
export { accountsEnabled, isPageSlug, PRODUCTS_PER_PAGE, preorderDays, productQueryString, readProductPage } from "./store-shared";
export type { ProductPage, ProductQuery, StoreMaintenance } from "./store-shared";

export interface Store {
  // The backend sends the related theme row; older responses sent its key.
  theme?: string | { key?: unknown; name?: unknown } | null;
  id: number;
  name: string;
  logo: string | null;
  // Ikon tab browser; kosong berarti memakai logo.
  favicon?: string | null;
  currency: string;
  language: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  phone_country_code: string | null;
  address: string | null;
  // "Wajib login sebelum checkout" in the store settings.
  auth_required?: boolean;
  // Login methods whose keys the backend has; older backends omit it.
  login_providers?: string[];
  // Fitur yang terbuka penuh di paket toko, mis. "account" untuk akun pembeli.
  features?: string[];
  // Batas paket yang berlaku, mis. { cart: 3 }; kosong berarti tanpa batas.
  limits?: Record<string, number>;
  /** Alamat publik kanonik toko (domain sendiri atau subdomain), tanpa garis miring akhir. */
  url?: string | null;
  seo?: StoreSeo;
  /** Selalu terisi setelah getStore(); selama aktif pesanan belum bisa dibuat. */
  maintenance: StoreMaintenance;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  color: string;
  label: string;
  stock?: number | null;
  price?: number | null;
  images?: unknown;
  // Extra fields remain available for display, but cart requests send only id.
  [key: string]: unknown;
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  price: number;
  images?: string | null;
  // Cart items carry the product's primary photo here.
  image?: string | null;
  spreorder_duration?: number;
  preorder_duration?: number;
  sku?: string;
  stock?: number;
  status?: string;
  deleted_at?: string | null;
  variants?: ProductVariant[];
  variants_count?: number;
  /** Dari pesanan yang dihitung sebagai pendapatan. */
  sold_count?: number;
  /** Rata-rata ulasan (1–5), null bila belum ada ulasan. */
  rating?: number | null;
  rating_count?: number;
}

export interface Product extends ProductSummary {
  // Every photo in upload order; `images` stays the primary photo.
  gallery?: string[];
  // Ordered rows written in the admin panel's "Spesifikasi" section.
  specification?: { label: string; value: string }[];
  // Grams and centimetres, as entered in the admin panel.
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  seo?: PageSeo;
  categories?: { id: number; name: string; slug: string }[];
  updated_at?: string | null;
  sku: string;
  description: string;
  variants: ProductVariant[];
  status: string;
  preorder_duration: number;
  stock: number;
  deleted_at: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type?: string;
  logo?: string | null;
  seo?: PageSeo;
}

export class StoreApiError extends Error {
  constructor(public readonly status: number) {
    super(`Store API returned ${status}`);
    this.name = "StoreApiError";
  }
}

// The backend theme row carries the registry key; rows from before that column only have a display name.
export function storeThemeKey(store: Pick<Store, "theme"> | null | undefined): unknown {
  const theme = store?.theme;
  const key = theme && typeof theme === "object" ? (typeof theme.key === "string" ? theme.key : theme.name) : theme;
  return typeof key === "string" ? key.trim().toLowerCase() : undefined;
}

async function storeFetch<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Accept: "application/json",
      ...extraHeaders,
      ...(await currentStoreHeaders()),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new StoreApiError(response.status);
  return response.json() as Promise<T>;
}

/**
 * Token pratinjau bertanda tangan HMAC dari Laravel (`payload.signature`, base64url). Storefront
 * tidak memegang kuncinya: bentuknya saja yang dicek di sini, isinya diperiksa backend.
 */
export const PREVIEW_TOKEN = /^[A-Za-z0-9_-]{20,400}\.[A-Za-z0-9_-]{43}$/;

export interface StorefrontPreview {
  /** Tema yang dipratinjau, atau null untuk tema toko yang aktif. */
  theme: { key: string; name: string } | null;
  /** Draf beranda dari builder ditampilkan, bukan versi yang tayang. */
  draft: boolean;
}

/**
 * What a store owner is previewing from the panel (a theme, the home draft, or both), or null.
 * Tokens are valid for this store only and expire on the backend, so visitors cannot use them.
 */
export const getPreview = cache(async (token: string | null | undefined): Promise<StorefrontPreview | null> => {
  if (!token || !PREVIEW_TOKEN.test(token)) return null;
  try {
    // Lewat header, bukan path, supaya token tidak tercatat di log akses backend.
    const result = await storeFetch<{ data?: { theme?: { key?: unknown; name?: unknown } | null; draft?: unknown } }>("/preview", { "X-Preview-Token": token });
    const data = result?.data;
    if (!data) return null;
    const theme = data.theme && typeof data.theme.key === "string" && typeof data.theme.name === "string"
      ? { key: data.theme.key, name: data.theme.name }
      : null;
    return { theme, draft: data.draft === true };
  } catch {
    return null;
  }
});

/**
 * Builder widgets for the home page of the theme being shown, or null when that theme has no
 * published layout (the built-in home is used). With a preview token the backend picks the
 * previewed theme's layout, and its draft for a draft preview.
 */
export const getHomeSections = cache(async (previewToken: string | null): Promise<HomeSection[] | null> => {
  return readHomeSections(await storeFetch<unknown>("/home", previewToken ? { "X-Preview-Token": previewToken } : undefined));
});

/** Store uploads use Laravel's public disk; remote logo URLs remain supported. */
export function storeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const path = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^https?:\/\//i.test(path)) return null;
  try {
    const source = /^https?:\/\//i.test(path) || path.startsWith("/")
      ? path
      : `/${path.startsWith("storage/") ? path : `storage/${path}`}`;
    const url = new URL(source, process.env.STORE_API_URL || "http://localhost:8000/api");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export const getStore = cache(async () => {
  const store = await storeFetch<Store>("/store");
  return {
    ...store,
    logo: storeLogoUrl(store.logo),
    favicon: storeLogoUrl(store.favicon),
    // Backend lama tidak mengirim keduanya; tanpa url, SEO memakai origin request.
    url: httpUrl(store.url)?.replace(/\/+$/, "") ?? null,
    seo: readStoreSeo(store.seo),
    maintenance: readStoreMaintenance(store.maintenance),
  };
});

/** Kategori produk yang ditempelkan di detail produk (untuk breadcrumb); baris rusak dibuang. */
function readProductCategories(value: unknown): NonNullable<Product["categories"]> {
  return (Array.isArray(value) ? value : []).flatMap((entry) => {
    const row = entry as Partial<Record<"id" | "name" | "slug", unknown>> | null;
    return row && Number.isSafeInteger(row.id) && typeof row.name === "string" && row.name.trim() && typeof row.slug === "string" && row.slug
      ? [{ id: row.id as number, name: row.name.trim(), slug: row.slug }]
      : [];
  });
}

/**
 * Detail produk yang tayang. Backend boleh menemukan produk lewat ID ter-encode atau slug beda
 * huruf; `slug` hasilnya adalah slug kanonik dan halaman mengalihkan ke sana bila berbeda.
 */
export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const result = await storeFetch<{ data: Product | null | [] }>(`/products/${encodeURIComponent(slug)}`);
    if (!result.data || (Array.isArray(result.data) && !result.data.length)) return null;
    const product = result.data;
    if (Array.isArray(product) || typeof product.slug !== "string" || !product.slug || !Number.isSafeInteger(product.id) || product.id < 1) {
      throw new Error("Invalid product detail response");
    }
    if (product.status !== "published" || product.deleted_at) return null;
    return {
      ...product,
      seo: readSeo(product.seo),
      categories: readProductCategories(product.categories),
      rating: typeof product.rating === "number" && Number.isFinite(product.rating) ? product.rating : null,
      rating_count: Number.isSafeInteger(product.rating_count) && (product.rating_count as number) > 0 ? product.rating_count : 0,
      updated_at: typeof product.updated_at === "string" ? product.updated_at : null,
    };
  } catch (error) {
    if (error instanceof StoreApiError && error.status === 404) return null;
    throw error;
  }
});

export interface PageLink {
  slug: string;
  title: string;
}

export interface StorePage extends PageLink {
  /** rich: `content` dari editor teks; html: `document` landing page (HTML penuh). */
  format: "rich" | "html";
  /** store: di dalam header dan footer toko; blank: landing page layar penuh. */
  layout: "store" | "blank";
  // Sanitised HTML from the backend's rich text renderer.
  content: string;
  /** Dokumen HTML penuh; wajib dirender di iframe sandbox (LandingFrame), jangan langsung. */
  document: string | null;
  meta_description: string | null;
  updated_at: string | null;
  seo: PageSeo;
}

// Footer links; a failure leaves the footer without them rather than breaking the page.
export const getPages = cache(async (): Promise<PageLink[]> => {
  try {
    const result = await storeFetch<{ data?: unknown }>("/pages");
    const rows = Array.isArray(result?.data) ? result.data : [];
    return rows.flatMap((row) => {
      const page = row as Partial<PageLink>;
      return typeof page?.slug === "string" && isPageSlug(page.slug) && typeof page.title === "string" && page.title.trim()
        ? [{ slug: page.slug, title: page.title.trim() }]
        : [];
    });
  } catch {
    return [];
  }
});

export const getPage = cache(async (slug: string): Promise<StorePage | null> => {
  if (!isPageSlug(slug)) return null;
  try {
    const result = await storeFetch<{ data?: Partial<StorePage> }>(`/pages/${slug}`);
    const page = result?.data;
    if (!page || page.slug !== slug || typeof page.title !== "string" || typeof page.content !== "string") {
      throw new Error("Invalid page response");
    }
    const html = page.format === "html" && typeof page.document === "string";
    return {
      slug,
      title: page.title,
      format: html ? "html" : "rich",
      layout: html && page.layout === "blank" ? "blank" : "store",
      content: page.content,
      document: html ? (page.document as string) : null,
      meta_description: typeof page.meta_description === "string" && page.meta_description.trim() ? page.meta_description.trim() : null,
      updated_at: typeof page.updated_at === "string" ? page.updated_at : null,
      seo: readSeo(page.seo),
    };
  } catch (error) {
    if (error instanceof StoreApiError && error.status === 404) return null;
    throw error;
  }
});

// Di-cache per request: metadata, JSON-LD, dan katalog di halaman yang sama memakai daftar ini.
export const getCategories = cache(async (): Promise<Category[]> => {
  const result = await storeFetch<Category[] | { data: Category[] }>(
    "/categories?page=1&per_page=10",
  );
  const categories = Array.isArray(result) ? result : result.data;
  if (
    !Array.isArray(categories) ||
    !categories.every(
      (category) =>
        category &&
        Number.isSafeInteger(category.id) &&
        category.id > 0 &&
        typeof category.name === "string",
    )
  )
    throw new Error("Invalid category response");
  // A category without a slug has no page to link to.
  return categories
    .filter((category) => (!category.type || category.type === "product") && typeof category.slug === "string" && category.slug.length > 0)
    .map((category) => ({ ...category, seo: readSeo(category.seo) }));
});

/** Isi sitemap toko: slug produk, kategori, dan halaman yang tayang. */
export async function getSitemap(): Promise<SitemapData> {
  return readSitemap(await storeFetch<unknown>("/sitemap"));
}

export async function getProducts(query: ProductQuery = {}) {
  return readProductPage(await storeFetch<unknown>(`/products?${productQueryString(query)}`));
}

export interface NavigationLink {
  label: string;
  /** Path toko ("/c/kopi") atau URL lengkap; null untuk induk dropdown yang tidak bisa diklik. */
  href: string | null;
  new_tab: boolean;
  children: NavigationLink[];
}

/** Hanya tautan internal ("/…") atau http(s); selain itu (mis. javascript:) dibuang. */
function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : /^https?:\/\//i.test(value) ? value : null;
}

function readNavigation(value: unknown, depth = 0): NavigationLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = entry as Partial<Record<keyof NavigationLink, unknown>> | null;
    if (!item || typeof item.label !== "string" || item.label.trim() === "") return [];
    const children = depth === 0 ? readNavigation(item.children, 1) : [];
    const href = safeHref(item.href);
    // Tanpa tujuan dan tanpa isi dropdown, tidak ada yang bisa dibuka pembeli.
    if (!href && children.length === 0) return [];
    return [{ label: item.label, href, new_tab: item.new_tab === true, children }];
  });
}

/** Menu navigasi toko, sudah diurutkan dari panel; satu tingkat sub-menu. */
export const getNavigation = cache(async (): Promise<NavigationLink[]> => {
  const result = await storeFetch<{ data?: unknown }>("/navigations");
  return readNavigation(result?.data);
});
