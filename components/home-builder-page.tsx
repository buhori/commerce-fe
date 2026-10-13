import type { HomeSection } from "@/lib/home-sections";
import { getProducts, type ProductSummary, type Store } from "@/lib/store-api";
import type { SectionComponents } from "@/sdk/types";
import { defaultSections } from "./home-sections";

/**
 * Beranda dari builder: data tiap widget dimuat paralel, lalu dirender dengan komponen tema
 * (theme.components.sections) atau tampilan bawaan; slide banner sudah ada di pengaturan widgetnya.
 * Widget yang datanya kosong atau gagal dimuat dilewati, supaya tidak merusak seluruh beranda.
 */
export async function HomeBuilderPage({ store, sections, components = {} }: {
  store: Store;
  sections: HomeSection[];
  components?: SectionComponents;
}) {
  const products = await Promise.all(sections.map((section) => section.type === "product-list"
    ? getProducts({ categoryId: section.settings.category_id ?? undefined, sort: "newest" })
      .then((page) => page.data.slice(0, section.settings.limit))
      .catch(() => [])
    : Promise.resolve([])));

  return (
    <main className="page home-page home-builder">
      <h1 className="sr-only">{store.name}</h1>
      {sections.map((section, index) => {
        const rendered = renderSection({ store, section, components, products: products[index] });
        // Nomor bagian di draf (section-3 = bagian ke-4), untuk klik-untuk-edit di pratinjau builder.
        const position = Number(section.id.replace("section-", ""));
        return rendered && (
          <div key={section.id} className="home-block" data-section-index={Number.isInteger(position) ? position : index}>
            {rendered}
          </div>
        );
      })}
    </main>
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
      const moreHref = section.settings.category_slug ? `/c/${encodeURIComponent(section.settings.category_slug)}` : "/?sort=newest";
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
  }
}
