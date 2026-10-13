import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeBuilderPage } from "./home-builder-page";
import { ProductFeed } from "./product-feed";
import { CategoryTabs } from "./category-tabs";
import { Icon } from "./icons";
import { SiteFooter } from "./site-footer";
import { SortSelect } from "./sort-select";
import { StoreHeader } from "./store-header";
import { catalogUrl, isCatalogSort } from "@/lib/catalog-url";
import { getPreviewState } from "@/lib/preview";
import { getCategories, getHomeSections, getProducts, getStore } from "@/lib/store-api";
import type { ProductListing } from "@/sdk";
import { getActiveTheme } from "@/themes/active";

export interface CatalogSearchParams {
  q?: string | string[];
  sort?: string | string[];
}

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/**
 * "/" tanpa filter adalah beranda dari builder: murni susunan yang diterbitkan (kosong pun tetap kosong).
 * Pencarian, urutan, dan kategori (/c/{slug}) memakai katalog produk.
 */
export async function CatalogPage({ params, categorySlug }: { params: CatalogSearchParams; categorySlug?: string }) {
  const q = single(params.q)?.trim().slice(0, 100) ?? "";
  const rawSort = single(params.sort);
  const sort = isCatalogSort(rawSort) ? rawSort : undefined;
  // Beranda hanya halaman pertama tanpa kategori, pencarian, atau urutan.
  const isHome = !categorySlug && !q && !sort;

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

  // Beranda: susunan milik tema yang tampil (tema aktif, atau tema/draf yang dipratinjau pemilik).
  // Tidak ada beranda cadangan: yang tampil hanya yang disusun di editor.
  if (isHome) {
    const preview = await getPreviewState();
    const sections = await getHomeSections(preview?.token ?? null).catch(() => undefined);
    return (
      <>
        <StoreHeader name={store.name} logo={store.logo} />
        {sections === undefined ? (
          <main className="page home-page">
            <div className="container empty-state" role="alert">
              <h1>Beranda belum dapat dimuat</h1>
              <ButtonLink reloadDocument href="/">Coba lagi</ButtonLink>
            </div>
          </main>
        ) : (
          <HomeBuilderPage store={store} sections={sections ?? []} components={theme.components.sections} />
        )}
        <SiteFooter store={store} />
      </>
    );
  }

  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const category = categorySlug ? categories.find((entry) => entry.slug === categorySlug) : undefined;
  // Only a successfully loaded list can prove a slug does not exist.
  if (categorySlug && !category && categoriesResult.status === "fulfilled") notFound();

  const productsResult = categorySlug && !category
    ? null
    : await getProducts({ categoryId: category?.id, q: q || undefined, sort }).catch(() => null);
  const title = q ? `Hasil pencarian “${q}”${category ? ` di ${category.name}` : ""}` : category?.name ?? "Semua produk";
  const currency = store.currency || "IDR";
  const here = { category: categorySlug, q, sort };
  const productQuery = { categoryId: category?.id, q: q || undefined, sort };
  const listing: ProductListing | null = productsResult && {
    items: productsResult.data, hasMore: productsResult.hasMore, lastProductId: productsResult.lastProductId, query: productQuery,
  };

  const { CatalogPage: ThemeCatalogPage } = theme.components;
  const themed = ThemeCatalogPage && <ThemeCatalogPage store={store} categories={categories} category={category ?? null}
    q={q} sort={sort} title={title} products={listing} />;
  if (themed) {
    return (
      <>
        <StoreHeader name={store.name} logo={store.logo} query={q} />
        {themed}
        <SiteFooter store={store} />
      </>
    );
  }

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} query={q} />
      <main className="page storefront-catalog catalog-results-page">
        <section className="container catalog-section" id="produk">
          <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span aria-hidden="true">/</span><span>{category?.name ?? (q ? "Pencarian" : "Koleksi produk")}</span></nav>
          <CategoryTabs categories={categories} selectedSlug={categorySlug}
            failed={categoriesResult.status === "rejected"} q={q} sort={sort} />
          <div className="catalog-toolbar">
            <div className="catalog-heading">
              <h1 className="catalog-title">{title}</h1>
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
              query={productQuery} currency={currency} />
          )}
        </section>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
