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
// Tombol hati wishlist (tersembunyi bila paket toko tanpa akun pembeli); useWishlist untuk tampilan sendiri.
export { WishlistButton, useWishlist } from "@/components/wishlist-button";
export { CategoryTabs } from "@/components/category-tabs";
export { ProductGrid, useCartCount, useCustomer, useProductFeed } from "./client";

// Tampilan yang sudah menangani kasus sulit (gambar gagal dimuat, carousel, galeri zoom).
export { BannerSlider } from "@/components/banner-slider";
export { ProductGallery } from "@/components/product-gallery";
export { ProductImage } from "@/components/product-image";
export { StoreBrand as StoreLogo } from "@/components/store-brand";
export { BuiltWith, PageContent, Price, RichText, SearchForm, SectionLink, SmartLink } from "./components";
// Widget builder: hitung mundur di browser (Countdown) dan ikon Keunggulan (FeatureIcon, nama dari FEATURE_ICONS).
export { Countdown } from "@/components/countdown";
export { FeatureIcon } from "@/components/section-icons";
// Harga akhir + harga normal dicoret + lencana diskon, dengan teks untuk pembaca layar.
export { ProductPrice } from "@/components/product-price";
export { VideoEmbed } from "@/components/video-embed";
export { FEATURE_ICONS, paragraphs } from "@/lib/home-sections";

// Helper.
export { formatDate, formatPrice, formatProductStats } from "@/lib/format";
// Aturan harga diskon yang sama dengan tampilan bawaan; jangan membandingkan price dan final_price sendiri.
export { discountEndDate, priceView } from "@/lib/price";
// Tautan wa.me dengan pesan tentang produk; useAddToCart({ whatsapp }) sudah membuatnya dengan varian terpilih.
export { whatsappChatUrl } from "@/lib/whatsapp";
export { catalogSorts, catalogUrl } from "@/lib/catalog-url";
export { preorderDays } from "@/lib/store-shared";

export const productUrl = (slug: string) => `/products/${encodeURIComponent(slug)}`;
export const categoryUrl = (slug: string) => `/c/${encodeURIComponent(slug)}`;
export const pageUrl = (slug: string) => `/${encodeURIComponent(slug)}`;
