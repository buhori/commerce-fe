import type { ComponentType } from "react";
import type { BlogPage, BlogPost, BlogSummary } from "@/lib/blog";
import type { ProductView } from "@/lib/product-view";
import type { Category, NavigationLink, PageLink, Product, ProductSummary, Store, StorePage } from "@/lib/store-api";
import type { CatalogPageProps } from "./types";

/**
 * Kontrak tema v1 (sdk/THEME-CONTRACT.md): skema section yang dideklarasikan tema. Dari skema ini platform
 * menurunkan form customizer, validasi server (manifest theme.json), nilai default, dan tipe props komponen.
 * Modul ini tanpa kode React supaya bisa dipakai generator manifest dan tes.
 */
export const CONTRACT_VERSION = 1;

/** Jenis halaman yang punya template. Lihat kontrak bagian 5. */
export const TEMPLATES = ["home", "collection", "product", "blog", "article", "page", "not-found"] as const;
export type TemplateName = (typeof TEMPLATES)[number];

/** Grup section yang tampil di semua halaman. */
export const GROUPS = ["header", "footer"] as const;
export type GroupName = (typeof GROUPS)[number];

/** Template yang wajib punya section utama `main-<template>` bila tema menyediakannya. */
export const MAIN_SECTION_TEMPLATES: readonly TemplateName[] = ["collection", "product", "blog", "article", "page", "not-found"];

export const IMAGE_FORMATS = ["jpg", "png", "webp", "gif"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const PRODUCT_SOURCES = ["latest", "top_sale", "top_rating", "category", "manual"] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

// ---------------------------------------------------------------------------------------------------------------
// Input (kontrak bagian 6). Daftar ini tertutup: setiap tipe punya satu kontrol di customizer dan satu aturan validasi.

interface BaseInput<T extends string> {
  id: string;
  type: T;
  label: string;
  /** Teks bantuan di bawah kontrol. */
  info?: string;
  required?: boolean;
  /** Tampil di customizer hanya bila setting lain di section/block yang sama bernilai ini. */
  visibleIf?: { setting: string; equals: string | number | boolean };
}

export interface TextInput extends BaseInput<"text"> { default?: string; maxLength?: number; placeholder?: string }
export interface TextareaInput extends BaseInput<"textarea"> { default?: string; maxLength?: number; rows?: number }
export interface RichtextInput extends BaseInput<"richtext"> { default?: string; maxLength?: number }
export interface NumberInput extends BaseInput<"number" | "range"> { default?: number; min?: number; max?: number; step?: number; unit?: string }
export interface CheckboxInput extends BaseInput<"checkbox"> { default?: boolean }
export interface SelectOption { value: string; label: string }
export interface SelectInput extends BaseInput<"select" | "radio"> { options: readonly SelectOption[]; default?: string }
export interface ColorInput extends BaseInput<"color"> { default?: string | null; allowEmpty?: boolean }
export interface ImageInput extends BaseInput<"image"> {
  /** Path unggahan toko, atau `theme://path` untuk aset bawaan tema. */
  default?: string | null;
  accept?: readonly ImageFormat[];
  maxSizeKb?: number;
  /** Teks saran ukuran, mis. "930 × 930". */
  recommended?: string;
  aspect?: string;
}
export interface ImagesInput extends BaseInput<"images"> {
  default?: readonly string[];
  accept?: readonly ImageFormat[];
  maxSizeKb?: number;
  min?: number;
  max?: number;
}
export interface VideoInput extends BaseInput<"video"> { default?: string | null }
export interface LinkInput extends BaseInput<"link"> { default?: string | null; allowExternal?: boolean }
export interface IconInput extends BaseInput<"icon"> { default?: string | null; icons?: readonly string[] }
export interface DateInput extends BaseInput<"date" | "datetime"> { default?: string | null }
export interface FontInput extends BaseInput<"font"> { role: "heading" | "body"; default?: string }
export interface ResourceInput extends BaseInput<"product" | "category" | "post" | "menu"> { default?: null }
export interface ResourcesInput extends BaseInput<"products" | "categories" | "posts"> { max?: number }
export interface ProductSourceInput extends BaseInput<"product-source"> {
  default?: { source: ProductSource; limit: number };
  sources?: readonly ProductSource[];
  max?: number;
}

/** Hanya pemisah dan keterangan di form customizer; tidak menyimpan nilai. */
export interface DecorInput { type: "heading" | "paragraph"; content: string }

export type ValueInput =
  | TextInput | TextareaInput | RichtextInput | NumberInput | CheckboxInput | SelectInput | ColorInput | ImageInput | ImagesInput
  | VideoInput | LinkInput | IconInput | DateInput | FontInput | ResourceInput | ResourcesInput | ProductSourceInput;
export type Input = ValueInput | DecorInput;
export type InputType = Input["type"];

/** Input yang datanya dimuat platform dan diterima komponen di `data`, bukan di `settings`. */
export const RESOURCE_TYPES = ["product", "products", "product-source", "category", "categories", "post", "posts", "menu"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

export const INPUT_TYPES: readonly InputType[] = [
  "text", "textarea", "richtext", "number", "range", "checkbox", "select", "radio", "color", "image", "images", "video",
  "link", "icon", "date", "datetime", "font", ...RESOURCE_TYPES, "heading", "paragraph",
];

// ---------------------------------------------------------------------------------------------------------------
// Nilai yang diterima komponen (sudah lengkap dan divalidasi platform).

export interface ImageValue { url: string; width: number | null; height: number | null; alt: string }
export interface LinkValue { href: string; external: boolean }
export interface VideoValue { provider: "youtube"; id: string }
/** Ringkasan artikel blog untuk input `post`/`posts` (sama dengan daftar /blog). */
export type PostSummary = BlogSummary;

type ValueOf<I> =
  I extends TextInput | TextareaInput | RichtextInput ? string
  : I extends NumberInput ? number
  : I extends CheckboxInput ? boolean
  : I extends SelectInput ? I["options"][number]["value"]
  : I extends ColorInput | IconInput | DateInput ? string | null
  : I extends ImageInput ? ImageValue | null
  : I extends ImagesInput ? ImageValue[]
  : I extends VideoInput ? VideoValue | null
  : I extends LinkInput ? LinkValue | null
  : I extends FontInput ? string
  : never;

type ResourceValue<I> =
  I extends { type: "product" } ? ProductSummary | null
  : I extends { type: "products" | "product-source" } ? ProductSummary[]
  : I extends { type: "category" } ? Category | null
  : I extends { type: "categories" } ? Category[]
  : I extends { type: "post" } ? PostSummary | null
  : I extends { type: "posts" } ? PostSummary[]
  : I extends { type: "menu" } ? NavigationLink[]
  : never;

type Plain<S extends readonly Input[]> = Exclude<Extract<S[number], { id: string }>, { type: ResourceType }>;
type Resources<S extends readonly Input[]> = Extract<S[number], { id: string; type: ResourceType }>;

/** `settings` komponen: setiap input bernilai (bukan sumber daya) dengan tipe nilainya. */
export type SettingsOf<S extends readonly Input[] | undefined> = S extends readonly Input[]
  ? { [I in Plain<S> as I["id"]]: ValueOf<I> }
  : Record<string, never>;

/** `data` komponen: input sumber daya yang sudah dimuat platform. */
export type DataOf<S extends readonly Input[] | undefined> = S extends readonly Input[]
  ? { [I in Resources<S> as I["id"]]: ResourceValue<I> }
  : Record<string, never>;

// ---------------------------------------------------------------------------------------------------------------
// Section dan block (kontrak bagian 4).

export interface BlockSchema {
  name: string;
  min?: number;
  max?: number;
  settings?: readonly Input[];
}

export interface SectionPresetBlock { type: string; settings?: Record<string, unknown> }
export interface SectionPreset { settings?: Record<string, unknown>; blocks?: readonly SectionPresetBlock[] }

export interface SectionSchema {
  /** Kunci huruf kecil dengan tanda hubung, unik di satu tema, mis. "promo-banners" atau "main-product". */
  type: string;
  name: string;
  /** Template/grup tempat section ini boleh ditambahkan. Kosong: semua template. */
  templates?: readonly (TemplateName | GroupName)[];
  settings?: readonly Input[];
  blocks?: Readonly<Record<string, BlockSchema>>;
  /** Batas total block (semua jenis). */
  maxBlocks?: number;
  /** Isi saat section ditambahkan dari customizer. */
  default?: SectionPreset;
}

export type BlockInstance<S extends SectionSchema> = S["blocks"] extends Readonly<Record<string, BlockSchema>>
  ? {
    [K in keyof S["blocks"] & string]: {
      id: string;
      type: K;
      settings: SettingsOf<S["blocks"][K]["settings"]>;
      data: DataOf<S["blocks"][K]["settings"]>;
    };
  }[keyof S["blocks"] & string]
  : never;

/** Atribut untuk klik-ke-edit di pratinjau customizer; pasang di elemen terluar section. */
export type EditorAttributes = Record<`data-${string}`, string>;

/**
 * Konteks halaman yang dijamin platform per template (kontrak bagian 5). Section memeriksa `page.template`,
 * lalu mendapat datanya dengan tipe yang tepat, mis. `if (page.template === "product") page.product`.
 */
export type PageContext =
  | { template: "home" }
  | { template: "not-found" }
  | { template: "header"; navigation: NavigationLink[]; query: string; accounts: boolean }
  | { template: "footer"; pages: PageLink[] }
  | { template: "product"; product: Product; view: ProductView; url: string }
  | ({ template: "collection" } & Omit<CatalogPageProps, "store">)
  | { template: "page"; page: StorePage }
  | { template: "blog"; blog: BlogPage }
  | { template: "article"; post: BlogPost };

export interface SectionRenderProps<S extends SectionSchema> {
  /** ID section di susunan toko (stabil). */
  id: string;
  settings: SettingsOf<S["settings"]>;
  data: DataOf<S["settings"]>;
  blocks: BlockInstance<S>[];
  store: Store;
  page: PageContext;
  editor: EditorAttributes;
}

export interface SectionDefinition<S extends SectionSchema = SectionSchema> {
  schema: S;
  component: ComponentType<SectionRenderProps<S>>;
}

/**
 * Satu section tema. `component` menerima props yang tipenya diturunkan dari `schema`:
 *
 *   export const promo = defineSection({ type: "promo", name: "Promo", settings: [{ id: "title", type: "text", label: "Judul" }] }, Promo);
 *   function Promo({ settings }: SectionRenderProps<typeof promo.schema>) { return <h2>{settings.title}</h2>; }
 */
export function defineSection<const S extends SectionSchema>(schema: S, component: ComponentType<SectionRenderProps<S>>): SectionDefinition<S> {
  return { schema, component };
}

// ---------------------------------------------------------------------------------------------------------------
// Template, preset, dan manifest (kontrak bagian 3 dan 5).

export interface TemplateSection { type: string; settings?: Record<string, unknown>; blocks?: readonly SectionPresetBlock[]; hidden?: boolean }
export interface TemplateLayout { sections: readonly TemplateSection[] }

export interface ThemePreset {
  name: string;
  /** Path aset tema, mis. "presets/coffee.webp". */
  thumbnail?: string;
  /** Susunan per template/grup yang diisi saat pemilik toko memilih preset ini. */
  templates: Partial<Record<TemplateName | GroupName, TemplateLayout>>;
}

/**
 * Isi manifest tema tanpa komponen, di `themes/<id>/manifest.ts` (modul murni, tanpa React), supaya
 * `node scripts/theme-manifest.mjs <id>` bisa membuat theme.json. index.tsx memasangkan skema yang sama dengan
 * komponennya lewat defineSection().
 */
export interface ThemeManifestSource {
  id: string;
  name: string;
  /** Versi tema (semver), berbeda dari versi kontrak. */
  version: string;
  description?: string;
  /** Pengaturan global tema (warna, font, logo, …). */
  settings?: readonly Input[];
  sections: readonly SectionSchema[];
  /** Preset pertama dipakai sebagai susunan bawaan toko baru. */
  presets: Readonly<Record<string, ThemePreset>>;
  /** Penggantian nama setting antar versi tema: { "1.1.0": { rename: { "promo.title": "promo.heading" } } }. */
  migrations?: Readonly<Record<string, { rename?: Readonly<Record<string, string>> }>>;
}

export interface ThemeContract {
  id: string;
  name: string;
  /** Versi tema (semver), berbeda dari versi kontrak. */
  version: string;
  description?: string;
  /** Pengaturan global tema (warna, font, logo, …). */
  settings?: readonly Input[];
  sections: readonly SectionDefinition<SectionSchema>[];
  /** Preset pertama dipakai sebagai susunan bawaan toko baru. */
  presets: Readonly<Record<string, ThemePreset>>;
  /** Penggantian nama setting antar versi tema: { "1.1.0": { rename: { "promo.title": "promo.heading" } } }. */
  migrations?: Readonly<Record<string, { rename?: Readonly<Record<string, string>> }>>;
}

export interface ThemeManifest {
  contract: number;
  id: string;
  name: string;
  version: string;
  description?: string;
  settings: readonly Input[];
  sections: Record<string, SectionSchema>;
  presets: ThemeContract["presets"];
  migrations: NonNullable<ThemeContract["migrations"]>;
}

/** theme.json untuk backend dan customizer: skema tanpa komponen (dari manifest.ts maupun kontrak lengkap). */
export function buildManifest(theme: ThemeContract | ThemeManifestSource): ThemeManifest {
  return JSON.parse(JSON.stringify({
    contract: CONTRACT_VERSION,
    id: theme.id,
    name: theme.name,
    version: theme.version,
    ...(theme.description ? { description: theme.description } : {}),
    settings: theme.settings ?? [],
    sections: Object.fromEntries(theme.sections.map((section) => {
      const schema = "schema" in section ? section.schema : section;
      return [schema.type, schema];
    })),
    presets: theme.presets,
    migrations: theme.migrations ?? {},
  })) as ThemeManifest;
}

// ---------------------------------------------------------------------------------------------------------------
// Pemeriksa manifest: kesalahan pembuat tema ditemukan saat theme.json dibuat, bukan di toko pembeli.

const KEY = /^[a-z][a-z0-9-]{0,39}$/;
const SETTING_ID = /^[a-z][a-z0-9_]{0,39}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const HEX = /^#[0-9a-f]{6}$/i;

function hasId(input: Input): input is ValueInput {
  return "id" in input;
}

function checkInputs(inputs: readonly Input[] | undefined, where: string, errors: string[]): void {
  const ids = new Set<string>();
  for (const input of inputs ?? []) {
    if (!INPUT_TYPES.includes(input.type)) {
      errors.push(`${where}: tipe input "${String(input.type)}" tidak dikenal`);
      continue;
    }
    if (!hasId(input)) {
      if (!input.content) errors.push(`${where}: ${input.type} tanpa content`);
      continue;
    }
    const at = `${where}.${input.id}`;
    if (!SETTING_ID.test(input.id)) errors.push(`${at}: id harus huruf kecil, angka, atau _ (maks. 40)`);
    if (ids.has(input.id)) errors.push(`${at}: id ganda`);
    ids.add(input.id);
    if (!input.label) errors.push(`${at}: label wajib`);

    switch (input.type) {
      case "text": case "textarea": case "richtext":
        if (input.maxLength !== undefined && !(input.maxLength > 0)) errors.push(`${at}: maxLength harus > 0`);
        if (input.default !== undefined && input.maxLength !== undefined && input.default.length > input.maxLength) errors.push(`${at}: default lebih panjang dari maxLength`);
        break;
      case "number": case "range":
        if (input.min !== undefined && input.max !== undefined && input.min > input.max) errors.push(`${at}: min lebih besar dari max`);
        if (input.default !== undefined && ((input.min !== undefined && input.default < input.min) || (input.max !== undefined && input.default > input.max))) errors.push(`${at}: default di luar min/max`);
        if (input.type === "range" && (input.min === undefined || input.max === undefined)) errors.push(`${at}: range wajib punya min dan max`);
        break;
      case "select": case "radio": {
        const values = input.options.map((option) => option.value);
        if (values.length === 0) errors.push(`${at}: options kosong`);
        if (new Set(values).size !== values.length) errors.push(`${at}: nilai options ganda`);
        if (input.default !== undefined && !values.includes(input.default)) errors.push(`${at}: default bukan salah satu options`);
        break;
      }
      case "color":
        if (input.default && !HEX.test(input.default)) errors.push(`${at}: default harus #rrggbb`);
        break;
      case "image": case "images":
        if (input.accept?.some((format) => !IMAGE_FORMATS.includes(format))) errors.push(`${at}: accept hanya ${IMAGE_FORMATS.join(", ")}`);
        if (input.type === "images" && input.min !== undefined && input.max !== undefined && input.min > input.max) errors.push(`${at}: min lebih besar dari max`);
        break;
      case "product-source":
        if (input.sources?.some((source) => !PRODUCT_SOURCES.includes(source))) errors.push(`${at}: sources hanya ${PRODUCT_SOURCES.join(", ")}`);
        break;
      default:
        break;
    }
  }
  for (const input of inputs ?? []) {
    if (hasId(input) && input.visibleIf && !ids.has(input.visibleIf.setting)) errors.push(`${where}.${input.id}: visibleIf merujuk setting yang tidak ada`);
  }
}

function checkLayout(layout: TemplateLayout, where: string, sections: Record<string, SectionSchema>, errors: string[]): void {
  for (const [index, entry] of layout.sections.entries()) {
    const section = sections[entry.type];
    if (!section) {
      errors.push(`${where}[${index}]: section "${entry.type}" tidak ada`);
      continue;
    }
    const blocks = entry.blocks ?? [];
    if (blocks.some((block) => !section.blocks?.[block.type])) errors.push(`${where}[${index}]: block tidak dikenal di "${entry.type}"`);
    if (section.maxBlocks !== undefined && blocks.length > section.maxBlocks) errors.push(`${where}[${index}]: melebihi maxBlocks "${entry.type}"`);
  }
}

/** Daftar kesalahan manifest; kosong berarti valid. */
export function validateManifest(manifest: ThemeManifest): string[] {
  const errors: string[] = [];
  if (manifest.contract !== CONTRACT_VERSION) errors.push(`contract harus ${CONTRACT_VERSION}`);
  if (!KEY.test(manifest.id)) errors.push("id tema harus huruf kecil dengan tanda hubung");
  if (!SEMVER.test(manifest.version)) errors.push("version harus semver, mis. 1.0.0");
  checkInputs(manifest.settings, "settings", errors);

  const allowedPlaces = new Set<string>([...TEMPLATES, ...GROUPS]);
  for (const [type, section] of Object.entries(manifest.sections)) {
    const where = `sections.${type}`;
    if (!KEY.test(type) || section.type !== type) errors.push(`${where}: type tidak valid`);
    if (section.templates?.some((template) => !allowedPlaces.has(template))) errors.push(`${where}: templates tidak dikenal`);
    checkInputs(section.settings, where, errors);
    for (const [blockType, block] of Object.entries(section.blocks ?? {})) {
      if (!KEY.test(blockType)) errors.push(`${where}.blocks.${blockType}: type tidak valid`);
      if (block.min !== undefined && block.max !== undefined && block.min > block.max) errors.push(`${where}.blocks.${blockType}: min lebih besar dari max`);
      checkInputs(block.settings, `${where}.blocks.${blockType}`, errors);
    }
    if (section.default) checkLayout({ sections: [{ type, ...section.default }] }, `${where}.default`, manifest.sections, errors);
  }

  const presets = Object.entries(manifest.presets);
  if (presets.length === 0) errors.push("presets: minimal satu preset (susunan bawaan toko)");
  for (const [key, preset] of presets) {
    if (!KEY.test(key)) errors.push(`presets.${key}: kunci tidak valid`);
    for (const [template, layout] of Object.entries(preset.templates)) {
      const where = `presets.${key}.${template}`;
      if (!allowedPlaces.has(template)) {
        errors.push(`${where}: template tidak dikenal`);
        continue;
      }
      checkLayout(layout as TemplateLayout, where, manifest.sections, errors);
      if ((MAIN_SECTION_TEMPLATES as readonly string[]).includes(template)
        && (layout as TemplateLayout).sections.filter((section) => section.type === `main-${template}`).length !== 1) {
        errors.push(`${where}: wajib tepat satu section main-${template}`);
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------------------------------------------
// Normalisasi saat dibaca (kontrak bagian 9): nilai yang salah bentuk diganti default, jadi data lama atau rusak
// tidak pernah membuat komponen tema gagal.

function emptyValue(input: ValueInput): unknown {
  switch (input.type) {
    case "text": case "textarea": case "richtext": return "";
    case "number": case "range": return input.min ?? 0;
    case "checkbox": return false;
    case "select": case "radio": return input.options[0]?.value ?? "";
    case "images": return [];
    case "font": return "";
    default: return null;
  }
}

function isImage(value: unknown): value is ImageValue {
  return !!value && typeof value === "object" && typeof (value as ImageValue).url === "string"
    && /^(https?:\/\/|\/)/.test((value as ImageValue).url);
}

function normalizeValue(input: ValueInput, raw: unknown): { ok: boolean; value: unknown } {
  switch (input.type) {
    case "text": case "textarea": case "richtext":
      return typeof raw === "string" ? { ok: true, value: input.maxLength ? raw.slice(0, input.maxLength) : raw } : { ok: false, value: undefined };
    case "number": case "range": {
      if (typeof raw !== "number" || !Number.isFinite(raw)) return { ok: false, value: undefined };
      return { ok: true, value: Math.min(input.max ?? Infinity, Math.max(input.min ?? -Infinity, raw)) };
    }
    case "checkbox":
      return typeof raw === "boolean" ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "select": case "radio":
      return typeof raw === "string" && input.options.some((option) => option.value === raw) ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "color":
      return raw === null ? { ok: true, value: null } : typeof raw === "string" && HEX.test(raw) ? { ok: true, value: raw.toLowerCase() } : { ok: false, value: undefined };
    case "icon":
      return raw === null || (typeof raw === "string" && (!input.icons || input.icons.includes(raw))) ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "date": case "datetime":
      return raw === null || (typeof raw === "string" && !Number.isNaN(Date.parse(raw))) ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "image":
      return raw === null || isImage(raw) ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "images":
      return Array.isArray(raw) ? { ok: true, value: raw.filter(isImage).slice(0, input.max ?? Infinity) } : { ok: false, value: undefined };
    case "video":
      return raw === null || (!!raw && typeof raw === "object" && (raw as VideoValue).provider === "youtube" && typeof (raw as VideoValue).id === "string")
        ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "link":
      return raw === null || (!!raw && typeof raw === "object" && typeof (raw as LinkValue).href === "string"
        && (/^(\/(?!\/)|#)/.test((raw as LinkValue).href) || (input.allowExternal !== false && /^https?:\/\//.test((raw as LinkValue).href))))
        ? { ok: true, value: raw } : { ok: false, value: undefined };
    case "font":
      return typeof raw === "string" ? { ok: true, value: raw } : { ok: false, value: undefined };
    default:
      return { ok: false, value: undefined };
  }
}

/**
 * `settings` lengkap untuk komponen dari nilai yang dikirim platform: setiap input bernilai ada, nilai yang
 * salah bentuk diganti default. Input sumber daya tidak di sini (ada di `data`). Default `image`/`link` berupa
 * path mentah, jadi untuk input itu nilai kosongnya null; platform yang mengubah default menjadi nilai lengkap.
 */
export function normalizeSettings(inputs: readonly Input[] | undefined, raw: unknown): Record<string, unknown> {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const settings: Record<string, unknown> = {};
  for (const input of inputs ?? []) {
    if (!hasId(input) || (RESOURCE_TYPES as readonly string[]).includes(input.type)) continue;
    const normalized = Object.hasOwn(source, input.id) ? normalizeValue(input, source[input.id]) : { ok: false, value: undefined };
    if (normalized.ok) {
      settings[input.id] = normalized.value;
      continue;
    }
    const fallback = normalizeValue(input, "default" in input ? input.default : undefined);
    settings[input.id] = fallback.ok ? fallback.value : emptyValue(input);
  }
  return settings;
}
