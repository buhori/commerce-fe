import type { ComponentType, ReactNode } from "react";
import { BuiltWith } from "@/sdk/components";
import { ProductDetail } from "@/components/product-detail";
import { getPreviewState } from "@/lib/preview";
import { getBlogPost, getCategories, getNavigation, getProducts, getThemeLayout, type Store } from "@/lib/store-api";
import { resolveLayout, type ThemeDataLoaders, type ThemeLayoutPart } from "@/lib/theme-layout";
import type { PageContext, SectionSchema, ThemeContract } from "@/sdk/schema";
import type { ThemeComponents } from "@/sdk/types";

/**
 * Tema berkontrak (sdk/THEME-CONTRACT.md) dirender platform: setiap template yang disediakan preset tema menjadi
 * komponen halaman biasa (ThemeComponents), yang mengambil susunannya dari panel, memuat datanya, lalu merender
 * section tema. Halaman storefront tidak perlu tahu tema mana yang berkontrak.
 */

/** Data platform untuk input sumber daya, lewat API storefront yang sama dengan halaman lain. */
const storeLoaders: ThemeDataLoaders = {
  products: async (query) => (await getProducts(query)).data,
  categories: () => getCategories(),
  post: async (slug) => {
    const post = await getBlogPost(slug);
    return post && { slug: post.slug, title: post.title, excerpt: post.excerpt, cover_image: post.cover_image, published_at: post.published_at, updated_at: post.updated_at };
  },
  navigation: () => getNavigation(),
};

/** Props section setelah disiapkan platform (bentuk runtime dari SectionRenderProps). */
interface RenderedSectionProps {
  id: string;
  settings: Record<string, unknown>;
  data: Record<string, unknown>;
  blocks: ThemeLayoutPart[];
  store: Store;
  page: PageContext;
  editor: Record<`data-${string}`, string>;
}

/** Template dan grup yang disediakan salah satu preset tema. */
export function contractTemplates(contract: ThemeContract): Set<string> {
  return new Set(Object.values(contract.presets).flatMap((preset) => Object.keys(preset.templates)));
}

/**
 * Section satu template, atau null bila susunannya tidak bisa dimuat (pemanggil memakai tampilan bawaan).
 * Section yang kodenya tidak ada di tema dilewati.
 */
export async function renderTemplate(contract: ThemeContract, store: Store, page: PageContext): Promise<ReactNode[] | null> {
  const preview = await getPreviewState();
  const layout = await getThemeLayout(page.template, preview?.token ?? null).catch(() => null);
  if (!layout) return null;

  const definitions = new Map(contract.sections.map((definition) => [definition.schema.type, definition]));
  const schemas: Record<string, SectionSchema> = Object.fromEntries([...definitions].map(([type, definition]) => [type, definition.schema]));
  const sections = await resolveLayout(layout.sections, schemas, storeLoaders);

  return sections.map((section) => {
    const Component = definitions.get(section.type)!.component as unknown as ComponentType<RenderedSectionProps>;
    return (
      <Component
        key={section.id}
        id={section.id}
        settings={section.settings}
        data={section.data}
        blocks={section.blocks}
        store={store}
        page={page}
        // Klik-untuk-edit di pratinjau customizer.
        editor={{ "data-theme-section": section.id }}
      />
    );
  });
}

function TemplateUnavailable() {
  return (
    <main className="page">
      <div className="container empty-state" role="alert">
        <h1>Halaman belum dapat dimuat</h1>
        <p>Coba muat ulang halaman ini.</p>
      </div>
    </main>
  );
}

/** Komponen halaman untuk template yang disediakan tema; template lain tetap memakai tampilan bawaan. */
export function contractComponents(contract: ThemeContract): ThemeComponents {
  const provided = contractTemplates(contract);
  const components: ThemeComponents = {};

  if (provided.has("header")) {
    components.Header = async function ContractHeader({ store, navigation, query, accounts }) {
      return <>{await renderTemplate(contract, store, { template: "header", navigation, query, accounts })}</>;
    };
  }
  if (provided.has("footer")) {
    // Platform memasang BuiltWith sendiri (tersembunyi di toko whitelabel lewat BrandingProvider SiteFooter).
    components.Footer = async function ContractFooter({ store, pages }) {
      return (
        <>
          {await renderTemplate(contract, store, { template: "footer", pages })}
          <BuiltWith />
        </>
      );
    };
  }
  if (provided.has("product")) {
    components.ProductPage = async function ContractProductPage(props) {
      return <>{(await renderTemplate(contract, props.store, { template: "product", product: props.product, view: props.view, url: props.url })) ?? <ProductDetail {...props} />}</>;
    };
  }
  if (provided.has("collection")) {
    components.CatalogPage = async function ContractCatalogPage({ store, ...catalog }) {
      return <>{(await renderTemplate(contract, store, { template: "collection", ...catalog })) ?? <TemplateUnavailable />}</>;
    };
  }
  if (provided.has("page")) {
    components.InfoPage = async function ContractInfoPage({ store, page }) {
      return <>{(await renderTemplate(contract, store, { template: "page", page })) ?? <TemplateUnavailable />}</>;
    };
  }

  return components;
}
