import Link from "next/link";
import { ProductGallery, type ProductPageProps } from "@sellosy/theme";
import { BuyBox } from "./buy-box";
import s from "./editorial.module.css";

export function ProductPage({ store, product, view }: ProductPageProps) {
  const paragraphs = (product.description ?? "").split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);

  return (
    <main className={s.main}>
      <article className={s.product}>
        <div className={s.gallery}>
          <ProductGallery key={product.id} images={view.gallery} name={product.name} />
        </div>
        <div className={s.productInfo}>
          <nav className={s.crumbs} aria-label="Breadcrumb">
            <Link href="/">Beranda</Link> / <Link href="/products">Koleksi</Link>
          </nav>
          <h1 className={s.productName}>{product.name}</h1>
          <p className={s.availability} data-tone={view.availability.tone}>
            {view.availability.text}{view.preorder > 0 && ` · dikirim ${view.preorder} hari setelah pesan`}
          </p>
          <BuyBox key={product.id} product={product} currency={store.currency || "IDR"} preorder={view.preorder > 0}
            maintenance={store.maintenance.active} />
          {paragraphs.map((text, index) => <p key={index} className={s.productDescription}>{text}</p>)}
          {view.specs.length > 0 && (
            <dl className={s.specs}>
              {view.specs.map((spec, index) => <div key={`${index}-${spec.label}`}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}
            </dl>
          )}
        </div>
      </article>
    </main>
  );
}
