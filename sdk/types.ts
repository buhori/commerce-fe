import type { ComponentType } from "react";
import type { CatalogSort } from "@/lib/catalog-url";
import type {
  BannerSettings, CategoryGridSettings, ImageSettings, ProductListSettings, TestimonialsSettings, TextSettings, VideoSettings,
} from "@/lib/home-sections";
import type { ProductView } from "@/lib/product-view";
import type { Category, NavigationLink, PageLink, Product, ProductSummary, Store, StorePage } from "@/lib/store-api";
import type { ProductQuery } from "@/lib/store-shared";

export type { Availability, ProductView, Spec } from "@/lib/product-view";
export type { Category, NavigationLink, PageLink, Product, ProductSummary, ProductVariant, Store, StorePage } from "@/lib/store-api";
export type { CatalogSort } from "@/lib/catalog-url";
export type {
  BannerSettings, BannerSlide, CategoryGridSettings, CategoryTile, HomeSection, ImageSettings, ProductListSettings, Testimonial,
  TestimonialsSettings, TextSettings, VideoSettings,
} from "@/lib/home-sections";

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

/**
 * Widget beranda dari builder di panel. Setiap widget menerima pengaturannya (sudah diperiksa)
 * dan data yang sudah dimuat platform. Satu widget = satu <section> selebar halaman.
 */
export interface SectionProps<Settings> {
  store: Store;
  settings: Settings;
}
/** `settings.slides` sudah diurutkan, bergambar, dan dibatasi paket toko. Tidak pernah kosong. */
export type BannerSectionProps = SectionProps<BannerSettings>;
export interface ProductListSectionProps extends SectionProps<ProductListSettings> {
  /** Sudah dipotong ke `settings.limit`. Tidak pernah kosong. */
  products: ProductSummary[];
  /** Halaman katalog lengkap untuk tautan "Lihat semua". */
  moreHref: string;
}
export type CategoryGridSectionProps = SectionProps<CategoryGridSettings>;
export type TextSectionProps = SectionProps<TextSettings>;
export type ImageSectionProps = SectionProps<ImageSettings>;
export type TestimonialsSectionProps = SectionProps<TestimonialsSettings>;
/** Pakai <VideoEmbed> dari SDK: memuat YouTube (tanpa cookie) hanya setelah diklik. */
export type VideoSectionProps = SectionProps<VideoSettings>;

export interface SectionComponents {
  banner?: ComponentType<BannerSectionProps>;
  "product-list"?: ComponentType<ProductListSectionProps>;
  "category-grid"?: ComponentType<CategoryGridSectionProps>;
  text?: ComponentType<TextSectionProps>;
  image?: ComponentType<ImageSectionProps>;
  testimonials?: ComponentType<TestimonialsSectionProps>;
  video?: ComponentType<VideoSectionProps>;
}

/** Every part is optional: a missing one falls back to the built-in storefront. */
export interface ThemeComponents {
  Header?: ComponentType<HeaderProps>;
  Footer?: ComponentType<FooterProps>;
  /** Beranda dari builder: tampilan widget; widget yang tidak ada di sini memakai tampilan bawaan. */
  sections?: SectionComponents;
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
