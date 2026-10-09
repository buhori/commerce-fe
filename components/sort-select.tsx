"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { catalogSorts, catalogUrl, isCatalogSort, type CatalogSort } from "@/lib/catalog-url";

export function SortSelect({ category, q, sort }: { category?: string; q?: string; sort?: CatalogSort }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="sort-field">
      <span>Urutkan</span>
      <select value={sort ?? ""} disabled={pending} onChange={(event) => {
        const value = event.target.value;
        startTransition(() => router.push(catalogUrl({ category, q, sort: isCatalogSort(value) ? value : undefined }), { scroll: false }));
      }}>
        {catalogSorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
