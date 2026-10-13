"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { catalogSorts, catalogUrl, readSort, type CatalogFilter } from "@/lib/catalog-url";

/** Ganti urutan tanpa kehilangan filter (kategori, produk pilihan, pencarian). */
export function SortSelect({ filter, category }: { filter: CatalogFilter; category?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="sort-field">
      <span>Urutkan</span>
      <select value={filter.sort ?? ""} disabled={pending} onChange={(event) => {
        const sort = readSort(event.target.value);
        startTransition(() => router.push(catalogUrl({ ...filter, category, sort }), { scroll: false }));
      }}>
        {catalogSorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
