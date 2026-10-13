/**
 * @sellosy/theme — semua yang boleh dipakai tema. Tema tidak mengimpor apa pun dari "@/…".
 * Panduan: sdk/README.md.
 */

export * from "./types";

// Bagian fungsional: logika keranjang, akun, dan pembayaran tetap milik platform.
export { ProductCartActions as AddToCart, useAddToCart } from "@/components/product-cart-actions";
export { CartIndicator as CartButton } from "@/components/cart-indicator";
export { AccountMenu as AccountButton } from "@/components/account-menu";
export { SortSelect } from "@/components/sort-select";
export { CategoryTabs } from "@/components/category-tabs";
export { ProductGrid, useCartCount, useCustomer, useProductFeed } from "./client";

// Tampilan yang sudah menangani kasus sulit (gambar gagal dimuat, carousel, galeri zoom).
export { BannerSlider } from "@/components/banner-slider";
export { ProductGallery } from "@/components/product-gallery";
export { ProductImage } from "@/components/product-image";
export { StoreBrand as StoreLogo } from "@/components/store-brand";
export { BuiltWith, PageContent, Price, SearchForm, SmartLink } from "./components";
export { VideoEmbed } from "@/components/video-embed";
export { paragraphs } from "@/lib/home-sections";

// Helper.
export { formatDate, formatPrice, formatProductStats } from "@/lib/format";
export { catalogSorts, catalogUrl } from "@/lib/catalog-url";
export { preorderDays } from "@/lib/store-shared";

export const productUrl = (slug: string) => `/products/${encodeURIComponent(slug)}`;
export const categoryUrl = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const pageUrl = (slug: string) => `/${encodeURIComponent(slug)}`;
