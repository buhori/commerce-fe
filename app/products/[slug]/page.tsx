import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductDetail } from "@/components/product-detail";
import { productView } from "@/lib/product-view";
import { getProduct, getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

type ProductPageProps = { params: Promise<{ slug: string }> };

async function resolveProduct(params: ProductPageProps["params"]) {
  const { slug } = await params;
  if (!slug || slug === "." || slug === ".." || /[/\\\u0000-\u001f]/.test(slug)) {
    notFound();
  }
  const product = await getProduct(slug);
  if (!product) notFound();
  return product;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await resolveProduct(params);
  return {
    title: `${product.name} — Toko Online`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await resolveProduct(params);
  const [store, theme] = await Promise.all([getStore(), getActiveTheme()]);
  const Page = theme.components.ProductPage ?? ProductDetail;

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <Page store={store} product={product} view={productView(product)} />
      <SiteFooter store={store} />
    </>
  );
}
