import Link from "next/link";
import { categoryUrl, type Banner, type HomePageProps } from "@sellosy/theme";
import { ArrowIcon } from "./icons";
import { ProductGrid } from "./product-grid";
import s from "./editorial.module.css";

const FEATURED_CATEGORIES = 6;

function Slide({ banner, index, total }: { banner: Banner; index: number; total: number }) {
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
  return banner.link.startsWith("/")
    ? <Link href={banner.link} className={className}>{content}</Link>
    : <a href={banner.link} className={className} target="_blank" rel="noopener noreferrer">{content}</a>;
}

export function HomePage({ store, banners, categories, products }: HomePageProps) {
  return (
    <main className={s.main}>
      <h1 className="sr-only">{store.name}</h1>
      {banners.length > 0 && (
        <section className={s.banner} aria-label="Promo toko">
          <div className={s.bannerTrack}>
            {banners.map((banner, index) => <Slide key={banner.id} banner={banner} index={index} total={banners.length} />)}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <nav className={`${s.block} ${s.categoryStrip}`} aria-label="Kategori">
          <p className={s.eyebrow}>Belanja menurut kategori</p>
          <ul>
            {categories.slice(0, FEATURED_CATEGORIES).map((category) => (
              <li key={category.id}><Link href={categoryUrl(category.slug)}>{category.name}</Link></li>
            ))}
            {categories.length > FEATURED_CATEGORIES && <li><Link href="/?sort=newest">Semua →</Link></li>}
          </ul>
        </nav>
      )}

      <section className={s.block} id="produk">
        <div className={s.blockHead}>
          <div>
            <p className={s.eyebrow}>Koleksi</p>
            <h2 className={s.blockTitle}>Produk terbaru</h2>
          </div>
        </div>
        {!products ? (
          <p className={s.empty}>Produk belum dapat dimuat. <Link href="/">Coba lagi</Link></p>
        ) : products.items.length === 0 ? (
          <p className={s.empty}>Belum ada produk.</p>
        ) : (
          <ProductGrid listing={products} currency={store.currency || "IDR"} />
        )}
      </section>
    </main>
  );
}
