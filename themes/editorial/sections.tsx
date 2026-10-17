import Link from "next/link";
import {
  categoryUrl, RichText, SectionLink,
  type BannerSectionProps, type BannerSlide, type CategoryGridSectionProps, type ProductListSectionProps, type SectionComponents, type TextSectionProps,
} from "@sellosy/theme";
import { ArrowIcon } from "./icons";
import { ProductCard } from "./product-grid";
import s from "./editorial.module.css";

/**
 * Widget builder versi Editorial. Gambar, testimoni, dan video memakai tampilan bawaan SDK,
 * yang sudah mengikuti warna dan font tema lewat token di styles.css.
 */

function Slide({ banner, index, total }: { banner: BannerSlide; index: number; total: number }) {
  // Banner tanpa teks biasanya sudah memuat tulisan di gambarnya: tampil utuh, tidak dipotong.
  const hasText = Boolean(banner.title || banner.subtitle);
  const picture = (
    <picture>
      {banner.mobile_image && <source media="(max-width: 700px)" srcSet={banner.mobile_image} />}
      {/* <picture> butuh <img> biasa; next/image tidak bisa berganti sumber per ukuran layar. */}
      <img src={banner.image} alt={banner.title ?? ""} loading={index === 0 ? "eager" : "lazy"} />
    </picture>
  );
  const content = (
    <>
      {picture}
      {hasText && (
        <div className={s.slideText}>
          {banner.title && <h2>{banner.title}</h2>}
          {banner.subtitle && <p className={s.slideSubtitle}>{banner.subtitle}</p>}
          {banner.button_label && <span className={s.slideButton}>{banner.button_label}<ArrowIcon /></span>}
        </div>
      )}
      {total > 1 && <span className={s.slideCount}>{index + 1} / {total}</span>}
    </>
  );
  const className = `${s.slide} ${hasText ? s.slideCover : ""}`;
  if (!banner.link) return <div className={className}>{content}</div>;
  return <SectionLink href={banner.link} className={className}>{content}</SectionLink>;
}

function Banner({ settings }: BannerSectionProps) {
  return (
    <section className={`${s.banner} ${settings.height === "short" ? s.bannerShort : ""}`} aria-label="Promo toko">
      <div className={s.bannerTrack}>
        {settings.slides.map((slide, index) => <Slide key={index} banner={slide} index={index} total={settings.slides.length} />)}
      </div>
    </section>
  );
}

function ProductList({ store, settings, products, moreHref }: ProductListSectionProps) {
  return (
    <section className={s.block}>
      <div className={s.blockHead}>
        <div>
          {settings.subtitle && <p className={s.eyebrow}>{settings.subtitle}</p>}
          {settings.title && <h2 className={s.blockTitle}>{settings.title}</h2>}
        </div>
        {moreHref && <Link href={moreHref} className={s.moreLink}>Lihat semua</Link>}
      </div>
      <div className={settings.layout === "row" ? s.row : s.grid}>
        {products.map((product) => <ProductCard key={product.id} product={product} currency={store.currency || "IDR"} />)}
      </div>
    </section>
  );
}

function CategoryGrid({ settings }: CategoryGridSectionProps) {
  return (
    <nav className={`${s.block} ${s.categoryStrip}`} aria-label={settings.title ?? "Kategori"}>
      {settings.title && <p className={s.eyebrow}>{settings.title}</p>}
      <ul>
        {settings.categories.map((category) => (
          <li key={category.id}><Link href={categoryUrl(category.slug)}>{category.name}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

function Text({ settings }: TextSectionProps) {
  const button = settings.link && settings.button_label;
  return (
    <section className={`${s.block} ${settings.align === "center" ? s.textCenter : s.textSplit}`}>
      <div>
        {settings.eyebrow && <p className={s.eyebrow}>{settings.eyebrow}</p>}
        {settings.title && <h2 className={s.textTitle}>{settings.title}</h2>}
      </div>
      <div className={s.textBody}>
        <RichText html={settings.body_html} />
        {button && <SectionLink href={settings.link!} className={s.outlineButton}>{settings.button_label}</SectionLink>}
      </div>
    </section>
  );
}

export const sections: SectionComponents = { banner: Banner, "product-list": ProductList, "category-grid": CategoryGrid, text: Text };
