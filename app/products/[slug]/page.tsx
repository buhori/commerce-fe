import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { SiteFooter } from "@/components/site-footer";
import { getProduct, getStore, preorderDays } from "@/lib/store-api";
import { ProductCartActions } from "@/components/product-cart-actions";
import { ProductGallery } from "@/components/product-gallery";
import { addDays, formatDate, formatWeight } from "@/lib/format";
import { ProductDescription } from "@/components/product-description";
import { Icon } from "@/components/icons";

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
  const store = await getStore();
  const currency = store.currency || "IDR";
  const preorder = preorderDays(product);
  const gallery = product.gallery?.length ? product.gallery : product.images ? [product.images] : [];
  const variants = product.variants || [];
  const variantStock = variants.some((variant) => variant.stock != null)
    ? variants.reduce((sum, variant) => sum + Math.max(0, variant.stock ?? 0), 0)
    : null;
  const stock = variantStock ?? product.stock;

  const status = preorder > 0
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
  ].filter((spec): spec is { label: string; value: string } => spec !== null && !writtenLabels.has(spec.label.toLowerCase()));
  const specs = [...written, ...derived];

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page product-detail-page">
        <div className="container product-page">
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">›</span>
            <Link href="/#produk">Produk</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{product.name}</span>
          </nav>
          <article className="product-detail-grid">
            <ProductGallery key={product.id} images={gallery} name={product.name} />
            <div className="detail-content">
              <header className="detail-header">
                <div className="detail-overline">
                  <Link href="/" className="detail-store-name">{store.name}</Link>
                  <p className="detail-status" data-tone={status.tone}>{status.text}</p>
                </div>
                <h1>{product.name}</h1>
                <a className="detail-description-link" href="#detail-produk">Lihat detail produk <Icon name="arrow" /></a>
              </header>
              <ProductCartActions
                key={product.id}
                productId={product.id}
                variants={variants}
                preorder={preorder > 0}
                stock={product.stock}
                price={product.price}
                currency={currency}
              />
              <div className="detail-delivery">
                <span className="detail-delivery-icon"><Icon name="truck" /></span>
                <div>
                  <strong>{preorder > 0 ? `Produk pre-order · ${preorder} hari` : "Informasi pengiriman"}</strong>
                  <p>{preorder > 0 ? `Estimasi siap dikirim ${formatDate(addDays(preorder))}.` : "Pengiriman diproses setelah pembayaran diterima."} Ongkos kirim dihitung saat checkout.</p>
                </div>
              </div>
              {(store.email || store.phone || store.address) && <a className="detail-help" href="#kontak"><Icon name="mail" /><span>Ada pertanyaan? <strong>Hubungi toko</strong></span><Icon name="arrow" /></a>}
            </div>
          </article>
          <section className="product-information" id="detail-produk" data-has-description={Boolean(product.description)} aria-labelledby="product-information-title">
            <div className="product-information-heading">
              <span className="detail-kicker">KENALI LEBIH DEKAT</span>
              <h2 id="product-information-title">Detail produk</h2>
            </div>
            <div className="product-information-grid">
              {product.description && <ProductDescription text={product.description} />}
              {specs.length > 0 && (
                <section className="detail-specification" aria-labelledby="product-specification-title">
                  <h3 id="product-specification-title">Spesifikasi</h3>
                  <dl className="detail-specs">
                    {specs.map((spec, index) => <div key={`${index}-${spec.label}`}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}
                  </dl>
                </section>
              )}
            </div>
          </section>
          <Link className="detail-back-link" href="/#produk"><Icon name="arrow" /> Jelajahi produk lainnya</Link>
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
