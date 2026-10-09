export type CatalogSort = "newest" | "price_asc" | "price_desc";

export const catalogSorts: { value: CatalogSort | ""; label: string }[] = [
  { value: "", label: "Paling sesuai" },
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
];

export function isCatalogSort(value: unknown): value is CatalogSort {
  return value === "newest" || value === "price_asc" || value === "price_desc";
}

// Categories live at /c/{slug}; search and sort ride along, the cursor never
// survives a category switch because callers only pass it for pagination.
export function catalogUrl({
  category,
  cursor,
  q,
  sort,
}: {
  category?: string;
  cursor?: string | null;
  q?: string;
  sort?: CatalogSort;
} = {}) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (sort) params.set("sort", sort);
  if (cursor) params.set("cursor", cursor);
  const path = category ? `/c/${encodeURIComponent(category)}` : "/";
  return `${path}${params.size ? `?${params}` : ""}`;
}
