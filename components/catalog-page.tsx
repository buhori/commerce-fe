import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductFeed } from "./product-feed";
import { CategoryTabs } from "./category-tabs";
import { Icon } from "./icons";
import { SiteFooter } from "./site-footer";
import { SortSelect } from "./sort-select";
import { StoreHeader } from "./store-header";
import { catalogUrl, readCatalogFilter, type CatalogFilter } from "@/lib/catalog-url";
import { getCategories, getProducts, getStore, type Category } from "@/lib/store-api";
import type { ProductListing } from "@/sdk";
import { getActiveTheme } from "@/themes/active";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const SORT_TITLES: Record<string, string> = {
  latest: "Produk terbaru",
  top_sale: "Produk terlaris",
  top_rating: "Rating tertinggi",
};

/** Judul katalog menurut pilihannya: pencarian, produk pilihan, kategori, atau urutan. */
export function catalogTitle(filter: CatalogFilter, categories: Category[], category?: Category) {
  if (filter.q) return `Hasil pencarian “${filter.q}”${category ? ` di ${category.name}` : ""}`;
  if (category) return category.name;
  if (filter.productIds.length) return "Produk pilihan";
  if (filter.categoryIds.length) {
    const names = filter.categoryIds.map((id) => categories.find((entry) => entry.id === id)?.name).filter(Boolean);
    if (names.length) return names.join(", ");
  }
  return (filter.sort && SORT_TITLES[filter.sort]) || "Semua produk";
}

/**
 * Katalog produk: /products (semua, atau filter=id|category|sort) dan /c/{slug} (satu kategori).
 * Beranda "/" tidak memakai ini; isinya murni dari builder (components/home-page.tsx).
 */
export async function CatalogPage({ params, categorySlug }: { params: CatalogSearchParams; categorySlug?: string }) {
  const filter = readCatalogFilter(params);

  const [[storeResult, categoriesResult], theme] = await Promise.all([
    Promise.allSettled([getStore(), getCategories()]),
    getActiveTheme(),
  ]);

  if (storeResult.status === "rejected") {
    return (
      <main className="unavailable">
        <h1>Toko belum dapat ditampilkan</h1>
        <p>Koneksi ke toko sedang terganggu.</p>
        <ButtonLink reloadDocument href="">Coba lagi</ButtonLink>
      </main>
    );
  }

  const store = storeResult.value;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const category = categorySlug ? categories.find((entry) => entry.slug === categorySlug) : undefined;
  // Only a successfully loaded list can prove a slug does not exist.
  if (categorySlug && !category && categoriesResult.status === "fulfilled") notFound();

  // Halaman kategori: filter kategori dari slug; filter lain di URL diabaikan.
  const effective: CatalogFilter = category
    ? { productIds: [], categoryIds: [category.id], sort: filter.sort, q: filter.q }
    : filter;
  // Satu kategori terpilih di /products tetap menyorot tabnya.
  const selected = category ?? (effective.categoryIds.length === 1 ? categories.find((entry) => entry.id === effective.categoryIds[0]) : undefined);

  const productQuery = {
    productIds: effective.productIds,
    categoryIds: effective.categoryIds,
    q: effective.q,
    sort: effective.sort,
  };
  const productsResult = categorySlug && !category ? null : await getProducts(productQuery).catch(() => null);
  const title = catalogTitle(effective, categories, category);
  const currency = store.currency || "IDR";
  const here = category ? catalogUrl({ category: category.slug, q: effective.q, sort: effective.sort }) : catalogUrl(effective);
  const listing: ProductListing | null = productsResult && {
    items: productsResult.data, hasMore: productsResult.hasMore, lastProductId: productsResult.lastProductId, query: productQuery,
  };

  const { CatalogPage: ThemeCatalogPage } = theme.components;
  if (ThemeCatalogPage) {
    return (
      <>
        <StoreHeader name={store.name} logo={store.logo} query={effective.q} />
        <ThemeCatalogPage store={store} categories={categories} category={selected ?? null} filter={effective}
          q={effective.q ?? ""} sort={effective.sort} title={title} products={listing} />
        <SiteFooter store={store} />
      </>
    );
  }

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} query={effective.q} />
      <main className="page storefront-catalog catalog-results-page">
        <section className="container catalog-section" id="produk">
          <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            {category || effective.q || effective.productIds.length || effective.categoryIds.length || effective.sort ? (
              <><Link href="/products">Produk</Link><span aria-hidden="true">/</span><span>{category?.name ?? (effective.q ? "Pencarian" : title)}</span></>
            ) : <span>Produk</span>}
          </nav>
          <CategoryTabs categories={categories} selectedSlug={selected?.slug}
            failed={categoriesResult.status === "rejected"} q={effective.q} sort={effective.sort} />
          <div className="catalog-toolbar">
            <div className="catalog-heading">
              <h1 className="catalog-title">{title}</h1>
            </div>
            <SortSelect filter={effective} category={category?.slug} />
          </div>

          {!productsResult ? (
            <div className="empty-state" role="alert">
              <h2>Produk belum dapat dimuat</h2>
              <ButtonLink reloadDocument href={here}>Coba lagi</ButtonLink>
            </div>
          ) : productsResult.data.length === 0 ? (
            <div className="empty-state">
              <Icon name="search" />
              <h2>{effective.q ? "Produk tidak ditemukan" : "Belum ada produk"}</h2>
              {here !== "/products" && <ButtonLink variant="secondary" href="/products">Lihat semua produk</ButtonLink>}
            </div>
          ) : (
            // Keyed by the filters, so a new category, search or sort starts a fresh list.
            <ProductFeed key={here}
              initial={productsResult.data} initialLastId={productsResult.lastProductId} initialHasMore={productsResult.hasMore}
              query={productQuery} currency={currency} />
          )}
        </section>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
