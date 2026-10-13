// Katalog produk: membaca pilihan dari URL dan membuat URL-nya. Murni (tanpa import) supaya
// bisa dipakai server, browser, proxy API, dan diuji langsung.
//
//   /products                                            semua produk
//   /products?filter=sort&filter_value=top_sale          terlaris
//   /products?filter=category&filter_value[]=3&filter_value[]=5
//   /products?filter=id&filter_value[]=81623             produk pilihan (ID ter-encode)
//   /c/{slug}?sort=price_asc                             satu kategori (menu, tautan lama)
//
// `filter_value` boleh satu nilai atau array; `sort` dan `q` bisa digabung dengan filter apa pun.

export type CatalogSort = "latest" | "top_sale" | "top_rating" | "price_asc" | "price_desc";

export const catalogSorts: { value: CatalogSort | ""; label: string }[] = [
  { value: "", label: "Paling sesuai" },
  { value: "latest", label: "Terbaru" },
  { value: "top_sale", label: "Terlaris" },
  { value: "top_rating", label: "Rating tertinggi" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
];

const SORTS = new Set<string>(catalogSorts.map((option) => option.value).filter(Boolean));

/** Batas nilai filter, sama dengan backend. */
export const MAX_FILTER_VALUES = 50;

export function isCatalogSort(value: unknown): value is CatalogSort {
  return typeof value === "string" && SORTS.has(value);
}

/** `newest` adalah nama lama untuk `latest`. */
export function readSort(value: unknown): CatalogSort | undefined {
  const sort = value === "newest" ? "latest" : value;
  return isCatalogSort(sort) ? sort : undefined;
}

export interface CatalogFilter {
  /** Produk pilihan, ID ter-encode, sesuai urutan di URL. */
  productIds: number[];
  categoryIds: number[];
  sort?: CatalogSort;
  q?: string;
}

type Params = Record<string, string | string[] | undefined>;

const list = (value: string | string[] | undefined) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);
const single = (value: string | string[] | undefined) => list(value)[0];
const ids = (values: string[]) => [...new Set(values.filter((value) => /^[1-9]\d{0,9}$/.test(value)).map(Number))]
  .filter((id) => id <= 4294967295)
  .slice(0, MAX_FILTER_VALUES);

/** Pilihan katalog dari query string (searchParams Next.js atau URLSearchParams). */
export function readCatalogFilter(params: Params | URLSearchParams): CatalogFilter {
  const get = (name: string): string | string[] | undefined =>
    params instanceof URLSearchParams ? (params.getAll(name).length ? params.getAll(name) : undefined) : params[name];

  const filter = single(get("filter"));
  const values = [...list(get("filter_value[]")), ...list(get("filter_value"))];
  const q = single(get("q"))?.trim().slice(0, 100);

  return {
    productIds: filter === "id" ? ids(values) : [],
    categoryIds: filter === "category" ? ids(values) : [],
    // `sort` eksplisit menang atas filter=sort, supaya bisa digabung dengan filter lain.
    sort: readSort(single(get("sort"))) ?? (filter === "sort" ? readSort(values[0]) : undefined),
    q: q || undefined,
  };
}

/** URL katalog kanonik untuk pilihan ini. */
export function catalogUrl({
  category,
  categoryIds = [],
  productIds = [],
  q,
  sort,
}: {
  /** Slug satu kategori: halaman /c/{slug}. */
  category?: string;
  categoryIds?: number[];
  productIds?: number[];
  q?: string;
  sort?: CatalogSort;
} = {}) {
  const params = new URLSearchParams();
  let path = "/products";

  if (category) {
    path = `/c/${encodeURIComponent(category)}`;
  } else if (productIds.length) {
    params.set("filter", "id");
    productIds.forEach((id) => params.append("filter_value[]", String(id)));
  } else if (categoryIds.length) {
    params.set("filter", "category");
    categoryIds.forEach((id) => params.append("filter_value[]", String(id)));
  } else if (sort && !q?.trim()) {
    // Urutan saja: bentuk filter=sort, sama dengan "Lihat semua" di widget.
    params.set("filter", "sort");
    params.set("filter_value", sort);
    return `${path}?${params}`;
  }

  if (q?.trim()) params.set("q", q.trim());
  if (sort) params.set("sort", sort);
  return `${path}${params.size ? `?${params}` : ""}`;
}
