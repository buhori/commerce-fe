"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import type { Category } from "@/lib/store-api";
import { catalogUrl, type CatalogSort } from "@/lib/catalog-url";

export function CategoryTabs({
  categories,
  selectedSlug,
  failed,
  q,
  sort,
}: {
  categories: Category[];
  selectedSlug?: string;
  failed: boolean;
  q?: string;
  sort?: CatalogSort;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const container = useRef<HTMLElement>(null);

  // Keep the active category in view when the list scrolls horizontally.
  useEffect(() => {
    const nav = container.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const left = active.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollLeft = left - (nav.clientWidth - active.offsetWidth) / 2;
    }
  }, [selectedSlug]);

  return (
    <div className="category-filter">
      <nav className="category-tabs" aria-label="Kategori produk" ref={container}>
        <Link href={catalogUrl({ q, sort })} className="category-tab"
          aria-current={!selectedSlug ? "page" : undefined}>
          Semua
        </Link>
        {categories.map((category) => (
          <Link key={category.id} href={catalogUrl({ category: category.slug, q, sort })} className="category-tab"
            aria-current={selectedSlug === category.slug ? "page" : undefined}>
            {category.name}
          </Link>
        ))}
      </nav>
      {failed && (
        <p className="category-error" role="status">
          Kategori belum dapat dimuat.{" "}
          <Button variant="text" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
            {pending ? "Memuat…" : "Coba lagi"}
          </Button>
        </p>
      )}
    </div>
  );
}
