import Image from "next/image";
import type { CSSProperties } from "react";
import { catalogUrl } from "@/lib/catalog-url";
import { countdownEnded, scopedSectionCss, sectionAppearance, type HomeSection, type ProductListSettings } from "@/lib/home-sections";
import { getProducts, type ProductSummary, type Store } from "@/lib/store-api";
import type { SectionComponents } from "@/sdk/types";
import { defaultSections } from "./home-sections";

/**
 * Bagian dari builder (beranda dan halaman builder): data tiap widget dimuat paralel, lalu dirender
 * dengan komponen tema (theme.components.sections) atau tampilan bawaan. Widget yang datanya kosong
 * atau gagal dimuat dilewati, supaya tidak merusak seluruh halaman.
 *
 * Pembungkus tiap bagian membawa `style`-nya (latar, warna teks, jarak, lebar, perataan, anchor) sebagai
 * kelas di app/home.css, plus `data-section`/`data-section-index` untuk custom CSS dan klik-untuk-edit.
 */
export async function BuilderSections({ store, sections, components = {}, compact = false }: {
  store: Store;
  sections: HomeSection[];
  components?: SectionComponents;
  /** Di antara header dan footer toko: jarak bawaan di awal dan akhir dipangkas (beranda, layout "store"). */
  compact?: boolean;
}) {
  const products = await Promise.all(sections.map((section) => section.type === "product-list"
    ? getProducts(productQuery(section.settings))
      .then((page) => (section.settings.source === "manual" ? page.data : page.data.slice(0, section.settings.limit)))
      .catch(() => [])
    : Promise.resolve([])));

  return (
    <div className={`builder-sections ${compact ? "builder-sections-compact" : ""}`}>
      {sections.map((section, index) => {
        const rendered = renderSection({ store, section, components, products: products[index] });
        // Nomor bagian di draf (section-3 = bagian ke-4), untuk klik-untuk-edit di pratinjau builder.
        const position = Number(section.id.replace("section-", ""));
        const look = sectionAppearance(section.style);
        // Custom CSS bagian dibungkus selektor `data-section`-nya; `<` sudah dibuang di readSections.
        return rendered && (
          <div
            key={section.id}
            id={look.id}
            className={`home-block ${look.className}`}
            style={look.style as CSSProperties | undefined}
            data-section={section.id}
            data-section-index={Number.isInteger(position) ? position : index}
          >
            {section.css && <style dangerouslySetInnerHTML={{ __html: scopedSectionCss(section.id, section.css) }} />}
            {section.style.background_image && (
              <span className="builder-section-image" aria-hidden="true">
                <Image src={section.style.background_image} alt="" fill unoptimized sizes="100vw" style={{ objectFit: "cover" }} />
              </span>
            )}
            {rendered}
          </div>
        );
      })}
    </div>
  );
}

function renderSection({ store, section, components, products }: {
  store: Store;
  section: HomeSection;
  components: SectionComponents;
  products: ProductSummary[];
}) {
  switch (section.type) {
    case "banner": {
      const Banner = components.banner ?? defaultSections.banner;
      return <Banner store={store} settings={section.settings} />;
    }
    case "product-list": {
      const List = components["product-list"] ?? defaultSections["product-list"];
      const moreHref = moreLink(section.settings);
      return products.length > 0 ? <List store={store} settings={section.settings} products={products} moreHref={moreHref} /> : null;
    }
    case "category-grid": {
      const Grid = components["category-grid"] ?? defaultSections["category-grid"];
      return <Grid store={store} settings={section.settings} />;
    }
    case "text": {
      const Text = components.text ?? defaultSections.text;
      return <Text store={store} settings={section.settings} />;
    }
    case "image": {
      const Picture = components.image ?? defaultSections.image;
      return <Picture store={store} settings={section.settings} />;
    }
    case "testimonials": {
      const Testimonials = components.testimonials ?? defaultSections.testimonials;
      return <Testimonials store={store} settings={section.settings} />;
    }
    case "video": {
      const Video = components.video ?? defaultSections.video;
      return <Video store={store} settings={section.settings} />;
    }
    case "hero": {
      const Hero = components.hero ?? defaultSections.hero;
      return <Hero store={store} settings={section.settings} />;
    }
    case "features": {
      const Features = components.features ?? defaultSections.features;
      return <Features store={store} settings={section.settings} />;
    }
    case "faq": {
      const Faq = components.faq ?? defaultSections.faq;
      return <Faq store={store} settings={section.settings} />;
    }
    case "cta": {
      const Cta = components.cta ?? defaultSections.cta;
      return <Cta store={store} settings={section.settings} />;
    }
    case "countdown": {
      // Sudah lewat tanpa teks penutup: tidak ada yang perlu ditampilkan (yang lewat saat dibuka disembunyikan di browser).
      if (!section.settings.expired_text && countdownEnded(section.settings)) return null;
      const Countdown = components.countdown ?? defaultSections.countdown;
      return <Countdown store={store} settings={section.settings} />;
    }
    case "gallery": {
      const Gallery = components.gallery ?? defaultSections.gallery;
      return <Gallery store={store} settings={section.settings} />;
    }
    case "columns": {
      const Columns = components.columns ?? defaultSections.columns;
      return <Columns store={store} settings={section.settings} />;
    }
  }
}

/** Produk untuk Daftar produk, lewat filter /api/products yang sama dengan halaman /products. */
function productQuery(settings: ProductListSettings) {
  switch (settings.source) {
    case "manual":
      return { productIds: settings.product_ids };
    case "category":
      return { categoryIds: settings.category_ids, sort: "latest" };
    default:
      return { sort: settings.source };
  }
}

/**
 * "Lihat semua": halaman /products dengan filter yang sama persis, yang lalu dikirim apa adanya ke
 * backend (filter=id|category|sort dan filter_value).
 */
function moreLink(settings: ProductListSettings): string {
  switch (settings.source) {
    case "manual":
      return catalogUrl({ productIds: settings.product_ids });
    case "category":
      return catalogUrl({ categoryIds: settings.category_ids });
    default:
      return catalogUrl({ sort: settings.source });
  }
}
