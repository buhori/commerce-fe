import { formatWeight } from "./format";
import type { Product } from "./store-api";
import { preorderDays } from "./store-shared";

export type Availability = { tone: "preorder" | "ok" | "low" | "out"; text: string };
export type Spec = { label: string; value: string };

/** Ready-to-show product facts, shared by the default product page and themes. */
export interface ProductView {
  /** Every photo, primary first; empty when the product has none. */
  gallery: string[];
  /** Days until a pre-order ships; 0 for ready stock. */
  preorder: number;
  /** Stock across variants when they carry their own, otherwise the product's. */
  stock: number;
  availability: Availability;
  /** The store's own rows first, then weight and size unless the store wrote those itself. */
  specs: Spec[];
}

export function productView(product: Product): ProductView {
  const preorder = preorderDays(product);
  const gallery = product.gallery?.length ? product.gallery : product.images ? [product.images] : [];
  const variants = product.variants || [];
  const variantStock = variants.some((variant) => variant.stock != null)
    ? variants.reduce((sum, variant) => sum + Math.max(0, variant.stock ?? 0), 0)
    : null;
  const stock = variantStock ?? product.stock;

  const availability: Availability = preorder > 0
    ? { tone: "preorder", text: "Pre-order" }
    : stock > 5 ? { tone: "ok", text: "Stok tersedia" }
    : stock > 0 ? { tone: "low", text: `Sisa ${stock}` }
    : { tone: "out", text: "Stok habis" };

  const dimensions = [product.length, product.width, product.height];
  // The store's own rows come first, in the order written in the admin panel.
  const written = (Array.isArray(product.specification) ? product.specification : []).filter(
    (row) => typeof row?.label === "string" && typeof row?.value === "string" && row.label.trim() && row.value.trim(),
  );
  const writtenLabels = new Set(written.map((row) => row.label.trim().toLowerCase()));
  // Facts the store already has on file follow, unless it wrote its own row with that name.
  const derived = [
    product.weight ? { label: "Berat", value: formatWeight(product.weight) } : null,
    dimensions.every((value) => value && value > 0) ? { label: "Ukuran", value: `${dimensions.join(" × ")} cm` } : null,
  ].filter((spec): spec is Spec => spec !== null && !writtenLabels.has(spec.label.toLowerCase()));

  return { gallery, preorder, stock, availability, specs: [...written, ...derived] };
}
