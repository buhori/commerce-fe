/**
 * Susunan template tema berkontrak dari GET /theme/{template} (App\Http\Controllers\API\ThemeLayoutController),
 * lalu disiapkan untuk komponen section: setting disaring menurut skema tema (normalizeSettings) dan referensi
 * sumber daya di `data` dimuat menjadi produk, kategori, artikel, atau menu. Kontrak bagian 5, 7, dan 8.
 * Modul murni (loader diberikan pemanggil) supaya bisa diuji tanpa Next.js.
 */
import type { BlogSummary } from "./blog";
import type { Category, NavigationLink, ProductSummary } from "./store-api";
import type { ProductQuery } from "./store-shared";
import { normalizeSettings, RESOURCE_TYPES, type Input, type SectionSchema, type ValueInput } from "@/sdk/schema";

export interface ThemeLayoutPart {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface ThemeLayoutSection extends ThemeLayoutPart {
  blocks: ThemeLayoutPart[];
}

export interface ThemeLayout {
  theme: string;
  version: string | null;
  template: string;
  /** Pengaturan global tema. */
  settings: { settings: Record<string, unknown>; data: Record<string, unknown> };
  sections: ThemeLayoutSection[];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readPart(value: unknown): ThemeLayoutPart | null {
  const part = record(value);
  return typeof part.id === "string" && typeof part.type === "string"
    ? { id: part.id, type: part.type, settings: record(part.settings), data: record(part.data) }
    : null;
}

/** Respons /theme/{template}; null bila tema belum berkontrak atau tidak punya template ini (`data: null`). */
export function readThemeLayout(value: unknown): ThemeLayout | null {
  const data = record(value).data;
  if (data === null || data === undefined) return null;
  const layout = record(data);
  if (typeof layout.theme !== "string" || typeof layout.template !== "string" || !Array.isArray(layout.sections)) {
    throw new Error("Invalid theme layout response");
  }
  const settings = record(layout.settings);
  return {
    theme: layout.theme,
    version: typeof layout.version === "string" ? layout.version : null,
    template: layout.template,
    settings: { settings: record(settings.settings), data: record(settings.data) },
    sections: layout.sections.flatMap((entry) => {
      const section = readPart(entry);
      if (!section) return [];
      const blocks = Array.isArray(record(entry).blocks) ? (record(entry).blocks as unknown[]) : [];
      return [{ ...section, blocks: blocks.map(readPart).filter((block): block is ThemeLayoutPart => block !== null) }];
    }),
  };
}

/** Sumber data platform untuk input sumber daya. */
export interface ThemeDataLoaders {
  /** Produk sesuai query, urutan dari backend (produk pilihan mengikuti urutan ID). */
  products(query: ProductQuery): Promise<ProductSummary[]>;
  categories(): Promise<Category[]>;
  post(slug: string): Promise<BlogSummary | null>;
  navigation(): Promise<NavigationLink[]>;
}

const ids = (value: unknown): number[] => Array.isArray(value) ? value.filter((id): id is number => Number.isSafeInteger(id) && id > 0) : [];
const slugs = (value: unknown): string[] => Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === "string" && slug !== "") : [];

/** Satu input sumber daya dari referensinya. Gagal dimuat menjadi kosong, bukan halaman error. */
async function resolveRef(input: ValueInput, ref: unknown, loaders: ThemeDataLoaders): Promise<unknown> {
  const max = "max" in input && typeof input.max === "number" ? input.max : Infinity;
  try {
    switch (input.type) {
      case "product":
        return Number.isSafeInteger(ref) ? (await loaders.products({ productIds: [ref as number] }))[0] ?? null : null;
      case "products": {
        const wanted = ids(ref).slice(0, max);
        return wanted.length ? await loaders.products({ productIds: wanted }) : [];
      }
      case "product-source": {
        const source = record(ref);
        const limit = Math.min(max, typeof source.limit === "number" ? source.limit : 8);
        if (source.source === "manual") {
          const wanted = ids(source.product_ids).slice(0, limit);
          return wanted.length ? await loaders.products({ productIds: wanted }) : [];
        }
        if (source.source === "category") {
          const categoryIds = ids(source.category_ids);
          return categoryIds.length ? (await loaders.products({ categoryIds, sort: "latest" })).slice(0, limit) : [];
        }
        return typeof source.source === "string" ? (await loaders.products({ sort: source.source })).slice(0, limit) : [];
      }
      case "category":
        return Number.isSafeInteger(ref) ? (await loaders.categories()).find((category) => category.id === ref) ?? null : null;
      case "categories": {
        const all = await loaders.categories();
        return ids(ref).slice(0, max).flatMap((id) => all.filter((category) => category.id === id));
      }
      case "post":
        return typeof ref === "string" && ref !== "" ? await loaders.post(ref) : null;
      case "posts":
        return (await Promise.all(slugs(ref).slice(0, max).map((slug) => loaders.post(slug)))).filter((post): post is BlogSummary => post !== null);
      case "menu":
        return ref === "main" ? await loaders.navigation() : [];
      default:
        return null;
    }
  } catch {
    return ["products", "product-source", "categories", "posts", "menu"].includes(input.type) ? [] : null;
  }
}

function resourceInputs(inputs: readonly Input[] | undefined): ValueInput[] {
  return (inputs ?? []).filter((input): input is ValueInput => "id" in input && (RESOURCE_TYPES as readonly string[]).includes(input.type));
}

async function resolvePart(part: ThemeLayoutPart, inputs: readonly Input[] | undefined, loaders: ThemeDataLoaders): Promise<ThemeLayoutPart> {
  const resources = resourceInputs(inputs);
  const values = await Promise.all(resources.map((input) => resolveRef(input, part.data[input.id], loaders)));
  return {
    id: part.id,
    type: part.type,
    settings: normalizeSettings(inputs, part.settings),
    data: Object.fromEntries(resources.map((input, index) => [input.id, values[index]])),
  };
}

/** Kategori dan menu dimuat sekali per halaman walau dipakai banyak section. */
function memoized(loaders: ThemeDataLoaders): ThemeDataLoaders {
  let categories: Promise<Category[]> | undefined;
  let navigation: Promise<NavigationLink[]> | undefined;
  return {
    products: (query) => loaders.products(query),
    categories: () => (categories ??= loaders.categories()),
    post: (slug) => loaders.post(slug),
    navigation: () => (navigation ??= loaders.navigation()),
  };
}

/**
 * Section siap render, sesuai urutan susunan. Section dan block yang tidak dikenal kode tema (mis. manifest di
 * backend lebih baru dari storefront) dilewati.
 */
export async function resolveLayout(
  sections: ThemeLayoutSection[],
  schemas: Readonly<Record<string, SectionSchema>>,
  loaders: ThemeDataLoaders,
): Promise<ThemeLayoutSection[]> {
  const shared = memoized(loaders);
  const resolved = await Promise.all(sections.map(async (section) => {
    const schema = schemas[section.type];
    if (!schema) return null;
    const [own, blocks] = await Promise.all([
      resolvePart(section, schema.settings, shared),
      Promise.all(section.blocks
        .filter((block) => schema.blocks?.[block.type])
        .map((block) => resolvePart(block, schema.blocks?.[block.type]?.settings, shared))),
    ]);
    return { ...own, blocks };
  }));
  return resolved.filter((section): section is ThemeLayoutSection => section !== null);
}
