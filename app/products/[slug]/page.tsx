import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { StoreEventOnMount } from "@/components/plugin-scripts";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductDetail } from "@/components/product-detail";
import { productView } from "@/lib/product-view";
import { absoluteUrl, breadcrumbJsonLd, metaDescription, pageMetadata, priceRange, productJsonLd } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getProduct, getProductReviews, getStore, type Product } from "@/lib/store-api";
import { ProductReviews } from "@/components/product-reviews";
import { getActiveTheme } from "@/themes/active";

type ProductPageProps = { params: Promise<{ slug: string }> };

async function resolveProduct(params: ProductPageProps["params"]) {
  const { slug } = await params;
  if (!slug || slug === "." || slug === ".." || /[/\\\u0000-\u001f]/.test(slug)) {
    notFound();
  }
  const product = await getProduct(slug);
  if (!product) notFound();
  // Dibuka lewat ID ter-encode atau slug beda huruf: satu URL saja yang dikenal mesin pencari.
  if (product.slug !== slug) permanentRedirect(`/products/${encodeURIComponent(product.slug)}`);
  return product;
}

const productPath = (product: Product) => `/products/${encodeURIComponent(product.slug)}`;

function productDescription(product: Product, fallback: string) {
  return product.seo?.description || metaDescription(product.description) || fallback;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const [product, site] = await Promise.all([resolveProduct(params), getSiteSeo()]);
  const title = product.seo?.title || product.name;
  const gallery = productView(product).gallery;
  const images = product.seo?.image
    ? [{ url: product.seo.image, alt: title }]
    : gallery.slice(0, 4).map((url) => ({ url, alt: product.name }));
  const price = priceRange(product);
  return pageMetadata(site, {
    title,
    description: productDescription(product, `Beli ${product.name} di ${site.name}.`),
    path: productPath(product),
    images,
    other: price
      ? { "product:price:amount": String(price.low), "product:price:currency": site.store?.currency || "IDR" }
      : undefined,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await resolveProduct(params);
  const [store, theme, site, reviews] = await Promise.all([getStore(), getActiveTheme(), getSiteSeo(), getProductReviews(product.id)]);
  const Page = theme.components.ProductPage ?? ProductDetail;
  const view = productView(product);
  const url = absoluteUrl(site.base, productPath(product));
  // Kategori pertama bila backend mengirimnya; selain itu jalur yang tampil di halaman (Produk).
  const category = product.categories?.[0];

  return (
    <>
      <JsonLd data={[
        productJsonLd({
          product,
          url,
          images: [...new Set([product.seo?.image, ...view.gallery].filter((image): image is string => Boolean(image)))],
          description: metaDescription(product.description, 5000) || undefined,
          currency: store.currency || "IDR",
          availability: view.availability.tone,
          seller: store.name,
        }),
        breadcrumbJsonLd([
          { name: "Beranda", url: absoluteUrl(site.base, "/") },
          category
            ? { name: category.name, url: absoluteUrl(site.base, `/c/${encodeURIComponent(category.slug)}`) }
            : { name: "Produk", url: absoluteUrl(site.base, "/products") },
          { name: product.name, url },
        ]),
        ...(product.structured_data ? [product.structured_data] : []),
      ]} />
      <StoreHeader name={store.name} logo={store.logo} />
      <Page store={store} product={product} view={view} url={url} />
      {/* Di luar komponen tema, jadi tampil di semua tema. */}
      <ProductReviews productId={product.id} initial={reviews} />
      {/* Untuk plugin analytics (mis. Meta Pixel ViewContent); berlaku untuk semua tema. */}
      <StoreEventOnMount name="store:product_viewed" detail={{
        product_id: product.id,
        name: product.name,
        price: product.final_price ?? product.price,
        currency: store.currency || "IDR",
        category: category?.name ?? null,
      }} />
      <SiteFooter store={store} />
    </>
  );
}
