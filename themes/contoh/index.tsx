import Image from "next/image";
import type { CSSProperties } from "react";
import { defineSection, defineTheme, ProductImage, ProductPrice, productUrl, RichText, SectionLink, type SectionRenderProps } from "@sellosy/theme";
import { featuredProducts, heroBanner, manifest, richText } from "./manifest";
import styles from "./contoh.module.css";

/** Tema contoh berkontrak: tiga section, skemanya di manifest.ts. Lihat sdk/THEME-CONTRACT.md. */

function HeroBanner({ settings, editor }: SectionRenderProps<typeof heroBanner>) {
  return (
    <section className={styles.hero} {...editor}>
      {settings.image && <Image src={settings.image.url} alt={settings.image.alt} fill unoptimized priority sizes="100vw" className={styles.heroImage} />}
      <div className={`container ${styles.heroText}`}>
        {settings.eyebrow && <p className={styles.eyebrow}>{settings.eyebrow}</p>}
        <h2>{settings.title}</h2>
        {settings.subtitle && <p>{settings.subtitle}</p>}
        {settings.button && settings.link && <SectionLink href={settings.link.href} className="button button-primary button-md">{settings.button}</SectionLink>}
      </div>
    </section>
  );
}

function FeaturedProducts({ settings, data, store, editor }: SectionRenderProps<typeof featuredProducts>) {
  if (data.products.length === 0) return null;
  return (
    <section className={`container ${styles.products}`} {...editor}>
      {settings.title && <h2>{settings.title}</h2>}
      <ul className={styles.grid} style={{ "--columns": settings.columns } as CSSProperties}>
        {data.products.map((product) => (
          <li key={product.id}>
            <SectionLink href={productUrl(product.slug)} className={styles.card}>
              <span className={styles.cardImage}><ProductImage src={product.images} name={product.name} /></span>
              <span className={styles.cardName}>{product.name}</span>
              <ProductPrice item={product} currency={store.currency || "IDR"} />
            </SectionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RichTextSection({ settings, editor }: SectionRenderProps<typeof richText>) {
  return (
    <section className={`container ${styles.text}`} {...editor}>
      {settings.title && <h2>{settings.title}</h2>}
      <RichText html={settings.body} />
    </section>
  );
}

export default defineTheme({
  id: manifest.id,
  name: manifest.name,
  description: manifest.description ?? "",
  contract: {
    ...manifest,
    sections: [
      defineSection(heroBanner, HeroBanner),
      defineSection(featuredProducts, FeaturedProducts),
      defineSection(richText, RichTextSection),
    ],
  },
});
