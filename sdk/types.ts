import type { ComponentType } from "react";
import type { CatalogSort } from "@/lib/catalog-url";
import type { ProductView } from "@/lib/product-view";
import type { Banner, Category, NavigationLink, PageLink, Product, ProductSummary, Store, StorePage } from "@/lib/store-api";
import type { ProductQuery } from "@/lib/store-shared";

export type { Availability, ProductView, Spec } from "@/lib/product-view";
export type { Banner, Category, NavigationLink, PageLink, Product, ProductSummary, ProductVariant, Store, StorePage } from "@/lib/store-api";
export type { CatalogSort } from "@/lib/catalog-url";

/**
 * The first page of a product list plus what the browser needs to load the next pages.
 * Pass it whole to <ProductGrid> or useProductFeed(); it is plain data, safe for client components.
 */
export interface ProductListing {
  items: ProductSummary[];
  hasMore: boolean;
  lastProductId: number | null;
  query: Omit<ProductQuery, "lastProductId">;
}

/** Shown on every page that uses the store header, including cart, checkout and account. */
export interface HeaderProps {
  store: Store;
  navigation: NavigationLink[];
  /** The current search text, to prefill <SearchForm>. */
  query: string;
  /** False when the store's plan has no buyer accounts: render no <AccountButton>. */
  accounts: boolean;
}

/** Shown on every page that uses the store footer. Must contain <BuiltWith />. */
export interface FooterProps {
  store: Store;
  /** Information pages (/about, /privacy-policy, …) written in the panel. */
  pages: PageLink[];
}

/** "/" without search, sort or category. */
export interface HomePageProps {
  store: Store;
  banners: Banner[];
  categories: Category[];
  /** Null when the product list could not be loaded; show a retry link to "/". */
  products: ProductListing | null;
}

/** "/c/{slug}", and "/" with a search (?q=) or sort (?sort=). */
export interface CatalogPageProps {
  store: Store;
  categories: Category[];
  /** Null for search or sort across all products. */
  category: Category | null;
  q: string;
  sort: CatalogSort | undefined;
  /** "Hasil pencarian “…”", the category name, or "Semua produk". */
  title: string;
  /** Null when the product list could not be loaded; show a retry link to this page. */
  products: ProductListing | null;
}

/** "/products/{slug}". Buying happens through <AddToCart> or useAddToCart(). */
export interface ProductPageProps {
  store: Store;
  product: Product;
  view: ProductView;
}

/** "/{slug}" for pages written in the panel's text editor. Full-HTML landing pages stay with the platform. */
export interface InfoPageProps {
  store: Store;
  page: StorePage;
}

/** Every part is optional: a missing one falls back to the built-in storefront. */
export interface ThemeComponents {
  Header?: ComponentType<HeaderProps>;
  Footer?: ComponentType<FooterProps>;
  HomePage?: ComponentType<HomePageProps>;
  CatalogPage?: ComponentType<CatalogPageProps>;
  ProductPage?: ComponentType<ProductPageProps>;
  InfoPage?: ComponentType<InfoPageProps>;
}

export interface ThemeDefinition {
  /** Lower-case key; the backend theme row's name must match it (e.g. "Editorial" → "editorial"). */
  id: string;
  name: string;
  description: string;
  /** Added to <html>, e.g. next/font variable classes the theme's CSS uses. */
  className?: string;
  components?: ThemeComponents;
}

export function defineTheme<T extends ThemeDefinition>(theme: T): T {
  return theme;
}
