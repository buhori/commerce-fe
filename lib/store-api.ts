import { cache } from "react";

export interface Store {
  // The backend sends the related theme row; older responses sent its key.
  theme?: string | { name?: unknown } | null;
  id: number;
  name: string;
  logo: string | null;
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
  sku: string;
  description: string;
  variants: ProductVariant[];
  status: string;
  preorder_duration: number;
  stock: number;
  deleted_at: string | null;
}

export function preorderDays(product: Pick<ProductSummary, "preorder_duration" | "spreorder_duration"> | null | undefined) {
  const days = product?.preorder_duration ?? product?.spreorder_duration ?? 0;
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type?: string;
  logo?: string | null;
}


export class StoreApiError extends Error {
  constructor(public readonly status: number) {
    super(`Store API returned ${status}`);
    this.name = "StoreApiError";
  }
}

// Registry keys are lower-case, the backend theme row carries a display name.
export function storeThemeKey(store: Pick<Store, "theme"> | null | undefined): unknown {
  const theme = store?.theme;
  const name = theme && typeof theme === "object" ? theme.name : theme;
  return typeof name === "string" ? name.trim().toLowerCase() : undefined;
}

async function storeFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Store-Id": process.env.STORE_ID || "404",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new StoreApiError(response.status);
  return response.json() as Promise<T>;
}

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
  return { ...store, logo: storeLogoUrl(store.logo) };
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const result = await storeFetch<{ data: Product | null | [] }>(`/products/${encodeURIComponent(slug)}`);
    if (!result.data || (Array.isArray(result.data) && !result.data.length)) return null;
    if (Array.isArray(result.data) || result.data.slug !== slug || !Number.isSafeInteger(result.data.id) || result.data.id < 1) {
      throw new Error("Invalid product detail response");
    }
    return result.data.status === "published" && !result.data.deleted_at
      ? result.data
      : null;
  } catch (error) {
    if (error instanceof StoreApiError && error.status === 404) return null;
    throw error;
  }
});

export interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  button_label: string | null;
  link: string | null;
  image: string;
  mobile_image: string | null;
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

// Only same-site paths and web addresses become links; anything else is dropped.
function safeLink(value: unknown) {
  const link = text(value);
  return link && (/^\/(?!\/)/.test(link) || /^https?:\/\//i.test(link)) ? link : null;
}

export interface PageLink {
  slug: string;
  title: string;
}

export interface StorePage extends PageLink {
  // Sanitised HTML from the backend's rich text renderer.
  content: string;
  updated_at: string | null;
}

const PAGE_SLUG = /^[A-Za-z0-9_-]{1,80}$/;

export function isPageSlug(value: string) {
  return PAGE_SLUG.test(value);
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
    return { slug, title: page.title, content: page.content, updated_at: typeof page.updated_at === "string" ? page.updated_at : null };
  } catch (error) {
    if (error instanceof StoreApiError && error.status === 404) return null;
    throw error;
  }
});

export async function getBanners(): Promise<Banner[]> {
  const result = await storeFetch<{ data?: unknown } | unknown[]>("/banners");
  const rows = Array.isArray(result) ? result : Array.isArray((result as { data?: unknown })?.data) ? (result as { data: unknown[] }).data : null;
  if (!rows) throw new Error("Invalid banner response");
  return rows.flatMap((row) => {
    const banner = row as Record<string, unknown>;
    const image = text(banner?.image);
    if (!banner || !Number.isSafeInteger(banner.id) || !image) return [];
    const link = safeLink(banner.link);
    return [{
      id: banner.id as number,
      title: text(banner.title),
      subtitle: text(banner.subtitle),
      button_label: link ? text(banner.button_label) : null,
      link,
      image,
      mobile_image: text(banner.mobile_image),
    }];
  });
}

export async function getCategories() {
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
  return categories.filter(
    (category) => (!category.type || category.type === "product") && typeof category.slug === "string" && category.slug.length > 0,
  );
}

export interface ProductQuery {
  categoryId?: number;
  // Encoded id of the last product already shown; the next page continues after it.
  lastProductId?: number;
  q?: string;
  sort?: string;
}

export interface ProductPage {
  data: ProductSummary[];
  hasMore: boolean;
  lastProductId: number | null;
}

export const PRODUCTS_PER_PAGE = 20;

export function productQueryString({ categoryId, lastProductId, q, sort }: ProductQuery) {
  const params = new URLSearchParams({ per_page: String(PRODUCTS_PER_PAGE) });
  if (categoryId) params.set("category_id", String(categoryId));
  if (lastProductId) params.set("last_product_id", String(lastProductId));
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  return params.toString();
}

/** Shared by the server render and the browser's "load more", so both read pages the same way. */
export function readProductPage(result: unknown): ProductPage {
  const body = result as { data?: unknown; meta?: { has_more?: unknown; last_product_id?: unknown } } | null;
  if (!body || !Array.isArray(body.data)) throw new Error("Invalid product response");
  const last = body.meta?.last_product_id;
  const lastProductId = Number.isSafeInteger(last) && (last as number) > 0 ? (last as number) : null;
  return {
    data: (body.data as ProductSummary[]).filter(
      (product) => product && (!product.status || product.status === "published") && !product.deleted_at,
    ),
    // Without a position to continue from there is nothing more to load.
    hasMore: body.meta?.has_more === true && lastProductId !== null,
    lastProductId,
  };
}

export async function getProducts(query: ProductQuery = {}) {
  return readProductPage(await storeFetch<unknown>(`/products?${productQueryString(query)}`));
}
