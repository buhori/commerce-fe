import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeShowcase } from "./home-showcase";
import { ProductFeed } from "./product-feed";
import { CategoryTabs } from "./category-tabs";
import { Icon } from "./icons";
import { SiteFooter } from "./site-footer";
import { SortSelect } from "./sort-select";
import { StoreHeader } from "./store-header";
import { catalogUrl, isCatalogSort } from "@/lib/catalog-url";
import { getBanners, getCategories, getProducts, getStore } from "@/lib/store-api";

export interface CatalogSearchParams {
  q?: string | string[];
  sort?: string | string[];
}

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** The product listing shared by the home page (/) and category pages (/c/{slug}). */
export async function CatalogPage({ params, categorySlug }: { params: CatalogSearchParams; categorySlug?: string }) {
  const q = single(params.q)?.trim().slice(0, 100) ?? "";
  const rawSort = single(params.sort);
  const sort = isCatalogSort(rawSort) ? rawSort : undefined;
  // Home sections appear only on the first page without category, search or sort filters.
  const isHome = !categorySlug && !q && !sort;

  const [storeResult, categoriesResult, bannersResult] = await Promise.allSettled([
    getStore(),
    getCategories(),
    isHome ? getBanners() : Promise.resolve([]),
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

  const productsResult = categorySlug && !category
    ? null
    : await getProducts({ categoryId: category?.id, q: q || undefined, sort }).catch(() => null);
  const banners = bannersResult.status === "fulfilled" ? bannersResult.value : [];
  const title = q ? `Hasil pencarian “${q}”${category ? ` di ${category.name}` : ""}` : category?.name ?? "Semua produk";
  const currency = store.currency || "IDR";
  const here = { category: categorySlug, q, sort };

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} query={q} />
      <main className={`page storefront-catalog ${isHome ? "home-page" : "catalog-results-page"}`}>
        {isHome && <><h1 className="sr-only">{store.name}</h1><HomeShowcase banners={banners} /></>}
        <section className="container catalog-section" id="produk">
          {!isHome && <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span aria-hidden="true">/</span><span>{category?.name ?? (q ? "Pencarian" : "Koleksi produk")}</span></nav>}
          <CategoryTabs categories={categories} selectedSlug={categorySlug}
            failed={categoriesResult.status === "rejected"} q={q} sort={sort} />
          <div className="catalog-toolbar">
            <div className="catalog-heading">
              {isHome ? <h2 className="catalog-title">Produk</h2> : <h1 className="catalog-title">{title}</h1>}
            </div>
            <SortSelect category={categorySlug} q={q} sort={sort} />
          </div>

          {!productsResult ? (
            <div className="empty-state" role="alert">
              <h2>Produk belum dapat dimuat</h2>
              <ButtonLink reloadDocument href={catalogUrl(here)}>Coba lagi</ButtonLink>
            </div>
          ) : productsResult.data.length === 0 ? (
            <div className="empty-state">
              <Icon name="search" />
              <h2>{q ? "Produk tidak ditemukan" : "Belum ada produk"}</h2>
              {(q || categorySlug) && <ButtonLink variant="secondary" href="/">Lihat semua produk</ButtonLink>}
            </div>
          ) : (
            // Keyed by the filters, so a new category, search or sort starts a fresh list.
            <ProductFeed key={`${category?.id ?? ""}|${q}|${sort ?? ""}`}
              initial={productsResult.data} initialLastId={productsResult.lastProductId} initialHasMore={productsResult.hasMore}
              query={{ categoryId: category?.id, q: q || undefined, sort }} currency={currency} />
          )}
        </section>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
