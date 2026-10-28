import type { ProductSummary, Store } from "./store-api";

// Pure helpers shared with client components. lib/store-api.ts reads request headers, so it is server-only.

/**
 * Alamat toko yang boleh tampil di storefront (footer, data SEO); null bila pemiliknya menyembunyikannya.
 * Invoice tetap memakai store.address apa adanya.
 */
export function publicAddress(store: Pick<Store, "address" | "show_address">): string | null {
  return store.show_address === false ? null : store.address;
}

export function preorderDays(product: Pick<ProductSummary, "preorder_duration" | "spreorder_duration"> | null | undefined) {
  const days = product?.preorder_duration ?? product?.spreorder_duration ?? 0;
  return Number.isFinite(days) && days > 0 ? days : 0;
}

export interface ProductQuery {
  categoryId?: number;
  /** Produk di salah satu kategori ini. */
  categoryIds?: number[];
  /** Produk pilihan (ID ter-encode); tanpa `sort` tampil sesuai urutan ini, satu halaman. */
  productIds?: number[];
  // Encoded id of the last product already shown; the next page continues after it.
  lastProductId?: number;
  q?: string;
  /** latest, top_sale, top_rating, price_asc, price_desc. */
  sort?: string;
}

/** Diskon otomatis produk dari backend; `label` sudah diformat, mis. "-20%" atau "-Rp5.000". */
export interface Discount {
  type: "percent" | "fixed";
  value: number;
  /** Batas potongan rupiah untuk diskon persen; null bila tanpa batas. */
  max_discount: number | null;
  /** Akhir masa diskon (zona waktu toko); null bila tanpa batas waktu. */
  ends_at: string | null;
  label: string;
}

const isMoney = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Diskon yang bentuknya rusak dianggap tidak ada, jadi tampilan kembali ke harga biasa. */
export function readDiscount(value: unknown): Discount | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if ((row.type !== "percent" && row.type !== "fixed") || !isMoney(row.value) || typeof row.label !== "string" || !row.label.trim()) return null;
  return {
    type: row.type,
    value: row.value,
    max_discount: isMoney(row.max_discount) ? row.max_discount : null,
    ends_at: typeof row.ends_at === "string" && row.ends_at.trim() ? row.ends_at.trim() : null,
    label: row.label.trim(),
  };
}

/**
 * Merapikan `final_price` dan `discount` produk (beserta `final_price` variannya). Backend lama tidak
 * mengirimnya: field dibiarkan kosong dan priceView() menganggap harganya tanpa diskon.
 */
export function readPricing<T extends object>(row: T): T {
  const product = row as { final_price?: unknown; discount?: unknown; variants?: unknown };
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => variant && typeof variant === "object"
      ? { ...variant, final_price: isMoney(variant.final_price) ? variant.final_price : undefined }
      : variant)
    : product.variants;
  return {
    ...row,
    final_price: isMoney(product.final_price) ? product.final_price : undefined,
    // Kunci yang tidak dikirim tetap tidak ada; isi yang rusak menjadi null.
    discount: product.discount === undefined ? undefined : readDiscount(product.discount),
    variants,
  };
}

export interface ProductPage {
  data: ProductSummary[];
  hasMore: boolean;
  lastProductId: number | null;
}

export const PRODUCTS_PER_PAGE = 20;

const PAGE_SLUG = /^[A-Za-z0-9_-]{1,80}$/;

/** Slug halaman toko (/about, /privacy-policy); sama dengan aturan backend. */
export function isPageSlug(value: unknown): value is string {
  return typeof value === "string" && PAGE_SLUG.test(value);
}

/**
 * Query /api/products backend, sama dengan URL halaman /products: filter=id|category dengan
 * filter_value[], atau filter=sort&filter_value=… bila hanya urutan; `sort` ikut bila digabung.
 */
export function productQueryString({ categoryId, categoryIds = [], productIds = [], lastProductId, q, sort: requestedSort }: ProductQuery) {
  let sort = requestedSort;
  const params = new URLSearchParams({ per_page: String(PRODUCTS_PER_PAGE) });
  const categories = categoryIds.length ? categoryIds : categoryId ? [categoryId] : [];
  if (productIds.length) {
    params.set("filter", "id");
    productIds.forEach((id) => params.append("filter_value[]", String(id)));
  } else if (categories.length) {
    params.set("filter", "category");
    categories.forEach((id) => params.append("filter_value[]", String(id)));
  } else if (sort && !q) {
    params.set("filter", "sort");
    params.set("filter_value", sort);
    sort = undefined;
  }
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
    ).map(readPricing),
    // Without a position to continue from there is nothing more to load.
    hasMore: body.meta?.has_more === true && lastProductId !== null,
    lastProductId,
  };
}


/**
 * Akun pembeli (login, profil, wishlist) hanya ada bila paket toko menyertakannya.
 * Backend lama tidak mengirim `features`, jadi dianggap tersedia.
 */
export function accountsEnabled(store: Pick<Store, "features"> | null | undefined): boolean {
  return !store?.features || store.features.includes("account");
}

/**
 * Mode perawatan toko: produk tetap tampil, tetapi pesanan ditolak backend.
 * manual: dinyalakan pemilik; setup: toko belum siap (kurir, tujuan pembayaran, atau lokasi belum ada);
 * unpublished: toko baru yang belum dibuka pemiliknya.
 */
export interface StoreMaintenance {
  active: boolean;
  reason: "manual" | "setup" | "unpublished" | null;
}

/** Catatan singkat di dekat tombol beli/checkout yang dimatikan selama perawatan. */
export const MAINTENANCE_NOTE = "Toko sedang dalam perawatan; pesanan belum bisa dibuat.";

/** Backend lama tidak mengirim `maintenance`; apa pun selain `active: true` berarti toko buka. */
export function readStoreMaintenance(value: unknown): StoreMaintenance {
  const row = value && typeof value === "object" ? (value as { active?: unknown; reason?: unknown }) : null;
  const active = row?.active === true;
  // Alasan hanya berarti selama perawatan aktif.
  const reason = active && (row?.reason === "manual" || row?.reason === "setup" || row?.reason === "unpublished") ? row.reason : null;
  return { active, reason };
}
