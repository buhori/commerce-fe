import type { ComponentType } from "react";
import type { CatalogFilter, CatalogSort } from "@/lib/catalog-url";
import type {
  BannerSettings, CategoryGridSettings, ColumnsSettings, CountdownSettings, CtaSettings, FaqSettings, FeaturesSettings, GallerySettings, HeroSettings,
  ImageSettings, ProductListSettings, TestimonialsSettings, TextSettings, VideoSettings,
} from "@/lib/home-sections";
import type { ProductView } from "@/lib/product-view";
import type { Category, NavigationLink, PageLink, Product, ProductSummary, Store, StorePage } from "@/lib/store-api";
import type { ProductQuery } from "@/lib/store-shared";

export type { Availability, ProductView, Spec } from "@/lib/product-view";
export type { Category, Discount, NavigationLink, PageLink, Product, ProductSummary, ProductVariant, Store, StorePage } from "@/lib/store-api";
export type { PriceView, Priced } from "@/lib/price";
export type { WhatsappChat, WhatsappChatInput, WhatsappProductChat } from "@/lib/whatsapp";
export type { CatalogFilter, CatalogSort } from "@/lib/catalog-url";
// store.style: warna/font pilihan toko. Sudah diterapkan lewat token CSS; tema cukup memakai token itu.
export type { StoreFontKey, StoreStyle } from "@/lib/store-style";
export type {
  BannerSettings, BannerSlide, CategoryGridSettings, CategoryTile, ColumnBlock, ColumnLayout, ColumnsColumn, ColumnsSettings,
  CountdownSettings, CtaSettings, FaqItem, FaqSettings, FeatureIcon, FeatureItem, FeaturesSettings, GalleryImage, GallerySettings, HeroSettings, HomeSection, ImageSettings, ProductListSettings,
  SectionStyle, Testimonial, TestimonialsSettings, TextSettings, VideoSettings,
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

/**
 * Shown on every page that uses the store footer. Must always contain <BuiltWith />; on whitelabel
 * stores (store.hide_branding) it renders nothing by itself.
 */
export interface FooterProps {
  store: Store;
  /** Information pages (/about, /privacy-policy, …) written in the panel. */
  pages: PageLink[];
}

/** "/c/{slug}", and "/" with a search (?q=) or sort (?sort=). */
export interface CatalogPageProps {
  /** Pilihan lengkap dari URL (produk pilihan, kategori, urutan, pencarian); teruskan ke <SortSelect filter>. */
  filter: CatalogFilter;
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
  /** URL lengkap (kanonik) halaman produk ini, mis. untuk pesan chat WhatsApp. */
  url: string;
}

/** "/{slug}" for pages written in the panel's text editor. Full-HTML landing pages stay with the platform. */
export interface InfoPageProps {
  store: Store;
  page: StorePage;
}

/**
 * Widget dari builder di panel (beranda dan halaman builder). Setiap widget menerima pengaturannya
 * (sudah diperiksa) dan data yang sudah dimuat platform. Satu widget = satu <section> selebar halaman.
 * Latar, warna teks, jarak, lebar, dan perataan (`style` bagian) dipasang platform di pembungkusnya
 * lewat kelas dan token CSS: pakai var(--text), var(--muted), var(--line), var(--surface) dan
 * `.container` supaya ikut berubah.
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
  /** Katalog /products dengan filter yang sama persis, untuk "Lihat semua". */
  moreHref: string | null;
}
export type CategoryGridSectionProps = SectionProps<CategoryGridSettings>;
export type TextSectionProps = SectionProps<TextSettings>;
export type ImageSectionProps = SectionProps<ImageSettings>;
export type TestimonialsSectionProps = SectionProps<TestimonialsSettings>;
/** Pakai <VideoEmbed> dari SDK: memuat YouTube (tanpa cookie) hanya setelah diklik. */
export type VideoSectionProps = SectionProps<VideoSettings>;
/** Pembuka halaman: judul selalu ada; tombol hanya ada bila label dan tautannya lengkap. */
export type HeroSectionProps = SectionProps<HeroSettings>;
/** `settings.items` tidak pernah kosong; `icon` salah satu FEATURE_ICONS (pakai <FeatureIcon>) atau null. */
export type FeaturesSectionProps = SectionProps<FeaturesSettings>;
export type FaqSectionProps = SectionProps<FaqSettings>;
export type CtaSectionProps = SectionProps<CtaSettings>;
/** Hitung mundur dihitung di browser; pakai <Countdown> dari SDK. Yang sudah lewat tanpa teks penutup tidak dirender. */
export type CountdownSectionProps = SectionProps<CountdownSettings>;
export type GallerySectionProps = SectionProps<GallerySettings>;
/**
 * Kolom berisi blok (judul, teks kaya, gambar, tombol, jarak). `settings.columns` selalu sebanyak kolom
 * `layout` (kolom kosong tetap ada); teks lewat <RichText>, tautan lewat <SectionLink>.
 */
export type ColumnsSectionProps = SectionProps<ColumnsSettings>;

export interface SectionComponents {
  banner?: ComponentType<BannerSectionProps>;
  "product-list"?: ComponentType<ProductListSectionProps>;
  "category-grid"?: ComponentType<CategoryGridSectionProps>;
  text?: ComponentType<TextSectionProps>;
  image?: ComponentType<ImageSectionProps>;
  testimonials?: ComponentType<TestimonialsSectionProps>;
  video?: ComponentType<VideoSectionProps>;
  hero?: ComponentType<HeroSectionProps>;
  features?: ComponentType<FeaturesSectionProps>;
  faq?: ComponentType<FaqSectionProps>;
  cta?: ComponentType<CtaSectionProps>;
  countdown?: ComponentType<CountdownSectionProps>;
  gallery?: ComponentType<GallerySectionProps>;
  columns?: ComponentType<ColumnsSectionProps>;
}

/** Every part is optional: a missing one falls back to the built-in storefront. */
export interface ThemeComponents {
  Header?: ComponentType<HeaderProps>;
  Footer?: ComponentType<FooterProps>;
  /** Widget builder (beranda dan halaman builder); widget yang tidak ada di sini memakai tampilan bawaan. */
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
