import { priceView, type Product as StoreProduct, type ProductSummary } from "@sellosy/theme";
import type { Product, ProductVariant } from "../types/product";

/** Gambar kosong (abu-abu) untuk produk tanpa foto; next/image tidak menerima src kosong. */
export const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Crect width='100%25' height='100%25' fill='%23f2f2f2'/%3E%3C/svg%3E";

const isDetail = (product: ProductSummary | StoreProduct): product is StoreProduct => "description" in product;

function photos(product: ProductSummary | StoreProduct): string[] {
  const gallery = isDetail(product) && product.gallery?.length ? product.gallery : product.images ? [product.images] : [];
  return gallery.length ? gallery : [PLACEHOLDER_IMAGE];
}

/** Gambar pertama varian (API mengirim string atau daftar), atau null. */
function variantImage(images: unknown): string | null {
  if (typeof images === "string" && images) return images;
  if (Array.isArray(images)) return images.find((image): image is string => typeof image === "string" && image !== "") ?? null;
  return null;
}

/**
 * Produk platform → bentuk Product Ambaz, supaya komponen Ambaz bisa dipakai apa adanya. ID tetap ID platform
 * (sebagai string); varian platform satu dimensi (label + warna contoh) menjadi pilihan "warna" Ambaz.
 */
export function toAmbazProduct(product: ProductSummary | StoreProduct, currency = "IDR"): Product {
  const images = photos(product);
  const price = priceView(product);
  const detail = isDetail(product) ? product : null;
  const stock = product.stock ?? null;
  const preorder = (product.preorder_duration ?? 0) > 0;
  const variants: ProductVariant[] = (product.variants ?? []).map((variant) => {
    const view = priceView(variant, product);
    return {
      id: String(variant.id),
      color: variant.label,
      size: "",
      price: view.final,
      compareAtPrice: view.original,
      image: variantImage(variant.images) ?? images[0],
      available: preorder || variant.stock == null || variant.stock > 0,
      sku: typeof variant.sku === "string" ? variant.sku : "",
    };
  });
  const soldOut = !preorder && (variants.length ? variants.every((variant) => !variant.available) : stock !== null && stock <= 0);

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    vendor: detail?.categories?.[0]?.name ?? "",
    price: price.final,
    compareAtPrice: price.original,
    currency,
    images: images.map((src, i) => ({ id: `${product.id}-${i}`, src, alt: product.name })),
    variants,
    colors: (product.variants ?? []).map((variant) => ({ name: variant.label, value: variant.color || "#e5e5e5", type: "hex" as const })),
    sizes: [],
    category: detail?.categories?.[0]?.slug ?? "",
    tags: [],
    brand: "",
    availability: preorder ? "pre-order" : soldOut ? "out-of-stock" : "in-stock",
    badge: preorder ? "pre-order" : price.original !== null ? "sale" : null,
    description: detail?.description ?? "",
    features: [],
    rating: product.rating ?? 0,
    reviewCount: product.rating_count ?? 0,
    reviews: [],
    relatedProducts: [],
    pairsWellWith: [],
    createdAt: "",
    sku: product.sku ?? "",
    countdownEnd: price.endsAt,
    collections: detail?.categories?.map((category) => category.slug),
  };
}
