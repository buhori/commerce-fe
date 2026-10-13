import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductCartActions } from "@/components/product-cart-actions";
import { ProductDescription } from "@/components/product-description";
import { ProductGallery } from "@/components/product-gallery";
import { addDays, formatDate } from "@/lib/format";
import type { ProductPageProps } from "@/sdk";

/** The built-in product page, used when the active theme has no ProductPage. */
export function ProductDetail({ store, product, view }: ProductPageProps) {
  const { gallery, preorder, availability: status, specs } = view;
  const variants = product.variants || [];
  const currency = store.currency || "IDR";

  return (
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
  );
}
