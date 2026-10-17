// Widget beranda dari builder di panel. Murni (tanpa import runtime) supaya bisa diuji langsung.
// Backend sudah membersihkan isinya; pemeriksaan di sini lapisan kedua sebelum dirender tema.

export interface BannerSlide {
  image: string;
  mobile_image: string | null;
  title: string | null;
  subtitle: string | null;
  /** Hanya ada bila slide punya tautan. */
  button_label: string | null;
  link: string | null;
}
export interface BannerSettings { height: "tall" | "short"; slides: BannerSlide[] }
export interface ProductListSettings {
  title: string | null;
  subtitle: string | null;
  /** latest, top_sale, top_rating: semua produk menurut urutan itu; category; manual (produk pilihan). */
  source: "latest" | "top_sale" | "top_rating" | "category" | "manual";
  category_ids: number[];
  /** ID ter-encode, sesuai urutan pilihan pemilik. */
  product_ids: number[];
  limit: number;
  layout: "grid" | "row";
}
export interface CategoryTile { id: number; name: string; slug: string; image: string | null }
export interface CategoryGridSettings { title: string | null; categories: CategoryTile[] }
export interface TextSettings {
  eyebrow: string | null;
  title: string | null;
  /**
   * Isi teks kaya yang sudah disanitasi backend (p, br, strong, em, u, s, a, ul, ol, li, h2, h3,
   * blockquote). Render lewat <RichText> dari SDK; teks lama (`body`) sudah diubah menjadi paragraf di sini.
   */
  body_html: string | null;
  /** @deprecated Teks biasa dari backend lama; pakai `body_html`. */
  body: string | null;
  align: "center" | "left";
  button_label: string | null;
  link: string | null;
}
export interface ImageSettings {
  image: string;
  alt: string | null;
  caption: string | null;
  link: string | null;
  width: "contained" | "full";
}
export interface Testimonial { quote: string; name: string; detail: string | null }
export interface TestimonialsSettings { title: string | null; items: Testimonial[] }
export interface VideoSettings { title: string | null; caption: string | null; video_id: string }

export interface HeroSettings {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  /** Deskripsi gambar samping; gambar latar selalu dekoratif. */
  image_alt: string | null;
  image_position: "right" | "left" | "background";
  /** Tombol hanya ada bila label dan tautannya lengkap; selain itu keduanya null. */
  primary_label: string | null;
  primary_link: string | null;
  secondary_label: string | null;
  secondary_link: string | null;
  min_height: "auto" | "medium" | "screen";
}

export const FEATURE_ICONS = [
  "check", "star", "truck", "shield", "heart", "gift", "clock", "leaf", "sparkles", "tag", "chat", "phone", "award", "lock",
  "refresh", "package",
] as const;
export type FeatureIcon = (typeof FEATURE_ICONS)[number];
export interface FeatureItem { icon: FeatureIcon | null; title: string; text: string | null }
export interface FeaturesSettings { title: string | null; subtitle: string | null; columns: 2 | 3 | 4; items: FeatureItem[] }

export interface FaqItem { question: string; answer: string }
export interface FaqSettings { title: string | null; subtitle: string | null; items: FaqItem[] }

export interface CtaSettings {
  title: string;
  text: string | null;
  button_label: string | null;
  link: string | null;
  note: string | null;
}

export interface CountdownSettings {
  title: string | null;
  text: string | null;
  /** Batas waktu, ISO-8601 UTC (`2026-12-31T17:00:00.000Z`). */
  ends_at: string;
  /** Tampil setelah batas waktu; kosong berarti bagian ini disembunyikan. */
  expired_text: string | null;
  button_label: string | null;
  link: string | null;
}

export interface GalleryImage { image: string; alt: string | null; link: string | null }
export interface GallerySettings { title: string | null; columns: 2 | 3 | 4; images: GalleryImage[] }

/** Susunan kolom: lebar relatif tiap kolom (33-67 = sepertiga dan dua pertiga). Yang pertama bawaan. */
export const COLUMN_LAYOUTS = ["50-50", "100", "33-67", "67-33", "33-33-33", "25-50-25", "25-25-25-25"] as const;
export type ColumnLayout = (typeof COLUMN_LAYOUTS)[number];
/** Jumlah kolom sebuah susunan ("25-50-25" = 3). */
export const columnCount = (layout: ColumnLayout) => layout.split("-").length;

/** Isi kolom; blok yang tidak lengkap sudah dibuang. */
export type ColumnBlock =
  | { type: "heading"; text: string; level: "h2" | "h3" | "h4" }
  /** Teks kaya yang sudah disanitasi backend (sama dengan widget Teks); render lewat <RichText>. */
  | { type: "text"; html: string }
  | { type: "image"; image: string; alt: string | null; link: string | null }
  | { type: "button"; label: string; link: string; variant: "primary" | "secondary" | "link" }
  | { type: "spacer"; size: "sm" | "md" | "lg" };
export interface ColumnsColumn { blocks: ColumnBlock[] }
export interface ColumnsSettings {
  layout: ColumnLayout;
  gap: "sm" | "md" | "lg";
  vertical_align: "top" | "center" | "bottom";
  /** Di ponsel: satu kolom berurutan, atau dua per baris (untuk susunan 3–4 kolom). */
  mobile: "stack" | "two";
  /** Selalu sebanyak kolom susunannya; kolom kosong tetap ada supaya posisinya tidak bergeser. */
  columns: ColumnsColumn[];
}

export const SECTION_SPACING = ["none", "sm", "md", "lg", "xl"] as const;
export type SectionSpacing = (typeof SECTION_SPACING)[number];

/** Tampilan bagian dari builder (latar, warna teks, jarak, lebar, perataan); selalu lengkap. */
export interface SectionStyle {
  background: "none" | "surface" | "primary" | "accent" | "dark" | "custom";
  /** `#rrggbb`, hanya untuk background "custom". */
  background_color: string | null;
  background_image: string | null;
  overlay: "none" | "light" | "dark";
  text_color: "auto" | "light" | "dark";
  padding_top: SectionSpacing;
  padding_bottom: SectionSpacing;
  width: "contained" | "wide" | "full";
  align: "default" | "left" | "center";
  visibility: "all" | "desktop" | "mobile";
  /** Menjadi `id` pembungkus, untuk tautan `#anchor`. */
  anchor: string | null;
}

/** `css`: custom CSS bagian dari builder (paket yang mencakupnya), lihat scopedSectionCss. */
export type HomeSection = (
  | { id: string; type: "banner"; settings: BannerSettings }
  | { id: string; type: "product-list"; settings: ProductListSettings }
  | { id: string; type: "category-grid"; settings: CategoryGridSettings }
  | { id: string; type: "text"; settings: TextSettings }
  | { id: string; type: "image"; settings: ImageSettings }
  | { id: string; type: "testimonials"; settings: TestimonialsSettings }
  | { id: string; type: "video"; settings: VideoSettings }
  | { id: string; type: "hero"; settings: HeroSettings }
  | { id: string; type: "features"; settings: FeaturesSettings }
  | { id: string; type: "faq"; settings: FaqSettings }
  | { id: string; type: "cta"; settings: CtaSettings }
  | { id: string; type: "countdown"; settings: CountdownSettings }
  | { id: string; type: "gallery"; settings: GallerySettings }
  | { id: string; type: "columns"; settings: ColumnsSettings }
) & { css: string | null; style: SectionStyle };

type Raw = Record<string, unknown>;

const text = (value: unknown, max = 2000) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
const choice = <T extends string | number>(value: unknown, options: readonly T[], fallback: T = options[0]): T => (options.includes(value as T) ? (value as T) : fallback);
const object = (value: unknown): Raw | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null);

/** Hanya path toko ("/…", bukan "//…"), http(s), atau `#anchor` di halaman yang sama; selain itu (mis. javascript:) dibuang. */
export function safeLink(value: unknown): string | null {
  const link = text(value, 500);
  return link && (/^\/(?!\/)\S*$/.test(link) || /^https?:\/\/\S+$/i.test(link) || /^#[a-z0-9-]{1,40}$/.test(link)) ? link : null;
}

/** Label dan tautan tombol: keduanya ada, atau keduanya null. */
function button(label: unknown, link: unknown, max = 40): { label: string | null; link: string | null } {
  const href = safeLink(link);
  const caption = text(label, max);
  return href && caption ? { label: caption, link: href } : { label: null, link: null };
}

const list = (value: unknown) => (Array.isArray(value) ? value : []);

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Teks biasa (backend lama) menjadi HTML: baris kosong = paragraf baru, satu baris baru = <br>. */
export function plainTextHtml(value: string | null): string | null {
  const html = paragraphs(value).map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("");
  return html || null;
}

/** HTML teks kaya dari backend (sudah disanitasi); yang terlalu panjang dibuang, tidak dipotong. */
const trustedHtml = (value: unknown, max: number) => (typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null);

/** Satu blok kolom; jenis yang tidak dikenal atau isinya tidak lengkap dibuang. */
function columnBlock(entry: unknown): ColumnBlock[] {
  const block = object(entry);
  switch (block?.type) {
    case "heading": {
      const value = text(block.text, 160);
      return value ? [{ type: "heading", text: value, level: choice(block.level, ["h3", "h2", "h4"] as const) }] : [];
    }
    case "text": {
      const html = trustedHtml(block.html, 10000);
      return html ? [{ type: "text", html }] : [];
    }
    case "image": {
      const image = imageUrl(block.image);
      return image ? [{ type: "image", image, alt: text(block.alt, 160), link: safeLink(block.link) }] : [];
    }
    case "button": {
      const action = button(block.label, block.link);
      return action.label && action.link
        ? [{ type: "button", label: action.label, link: action.link, variant: choice(block.variant, ["primary", "secondary", "link"] as const) }]
        : [];
    }
    case "spacer":
      return [{ type: "spacer", size: choice(block.size, ["md", "sm", "lg"] as const) }];
    default:
      return [];
  }
}

const HEX = /^#[0-9a-f]{6}$/i;

/** `style` bagian; kunci yang hilang atau tidak dikenal memakai bawaan (tampilan tema apa adanya). */
export function readSectionStyle(value: unknown): SectionStyle {
  const raw = object(value) ?? {};
  const color = typeof raw.background_color === "string" && HEX.test(raw.background_color) ? raw.background_color.toLowerCase() : null;
  let background = choice(raw.background, ["none", "surface", "primary", "accent", "dark", "custom"] as const);
  // Warna sendiri tanpa warna yang sah: kembali ke latar tema.
  if (background === "custom" && !color) background = "none";
  return {
    background,
    background_color: background === "custom" ? color : null,
    background_image: imageUrl(raw.background_image),
    overlay: choice(raw.overlay, ["none", "light", "dark"] as const),
    text_color: choice(raw.text_color, ["auto", "light", "dark"] as const),
    padding_top: choice(raw.padding_top, SECTION_SPACING, "md"),
    padding_bottom: choice(raw.padding_bottom, SECTION_SPACING, "md"),
    width: choice(raw.width, ["contained", "wide", "full"] as const),
    align: choice(raw.align, ["default", "left", "center"] as const),
    visibility: choice(raw.visibility, ["all", "desktop", "mobile"] as const),
    anchor: typeof raw.anchor === "string" && /^[a-z0-9-]{1,40}$/.test(raw.anchor) ? raw.anchor : null,
  };
}

/** Luminans relatif WCAG dari `#rrggbb`. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface SectionAppearance {
  id: string | undefined;
  className: string;
  /** Hanya variabel CSS (`--section-bg`) dari nilai yang sudah divalidasi. */
  style: Record<string, string> | undefined;
}

/**
 * Kelas pembungkus bagian dari `style` (CSS di app/home.css). Warna teks `auto` di latar primary,
 * accent, gelap, warna sendiri yang gelap, atau gambar dengan lapisan gelap memakai teks terang.
 */
export function sectionAppearance(style: SectionStyle): SectionAppearance {
  const image = Boolean(style.background_image);
  const overlay = image ? style.overlay : "none";
  const filled = style.background !== "none" || image;

  let foreground: "light" | "dark" | "on-primary" | "on-accent" | "on-dark" | null = null;
  if (style.text_color !== "auto") foreground = style.text_color;
  else if (overlay !== "none") foreground = overlay === "dark" ? "light" : "dark";
  else if (style.background === "primary") foreground = "on-primary";
  else if (style.background === "accent") foreground = "on-accent";
  else if (style.background === "dark") foreground = "on-dark";
  else if (style.background === "custom" && style.background_color) foreground = luminance(style.background_color) < 0.18 ? "light" : "dark";

  // Tombol utama di atas latar berwarna (atau teks terang) dibalik supaya tidak menyatu dengan latarnya.
  const invert = filled && (style.background === "primary" || style.background === "accent" || (foreground !== null && foreground !== "dark"));

  const classes = [
    "builder-section",
    filled && "section-has-bg",
    style.background !== "none" && `section-bg-${style.background}`,
    image && "section-has-image",
    overlay !== "none" && `section-overlay-${overlay}`,
    foreground && "section-fg",
    foreground && `section-text-${foreground}`,
    invert && "section-buttons-invert",
    `section-pt-${style.padding_top}`,
    `section-pb-${style.padding_bottom}`,
    `section-width-${style.width}`,
    style.align !== "default" && `section-align-${style.align}`,
    style.visibility !== "all" && `section-only-${style.visibility}`,
  ];
  return {
    id: style.anchor ?? undefined,
    className: classes.filter(Boolean).join(" "),
    style: style.background === "custom" && style.background_color ? { "--section-bg": style.background_color } : undefined,
  };
}

/** Hitung mundur yang sudah lewat tanpa teks penutup tidak dirender sama sekali. */
export function countdownEnded(settings: CountdownSettings, now = Date.now()): boolean {
  return Date.parse(settings.ends_at) <= now;
}

const imageUrl = (value: unknown) => {
  const url = text(value, 1000);
  return url && /^https?:\/\/\S+$/i.test(url) ? url : null;
};

function settingsFor(type: unknown, raw: Raw): Omit<HomeSection, "id" | "css" | "style"> | null {
  switch (type) {
    case "banner": {
      const slides = (Array.isArray(raw.slides) ? raw.slides : []).flatMap((entry): BannerSlide[] => {
        const slide = object(entry);
        const image = imageUrl(slide?.image);
        if (!slide || !image) return [];
        const link = safeLink(slide.link);
        return [{
          image, mobile_image: imageUrl(slide.mobile_image), title: text(slide.title, 120), subtitle: text(slide.subtitle, 300),
          button_label: link ? text(slide.button_label, 40) : null, link,
        }];
      }).slice(0, 8);
      return slides.length ? { type, settings: { height: choice(raw.height, ["tall", "short"] as const), slides } } : null;
    }
    case "product-list": {
      const source = choice(raw.source, ["latest", "top_sale", "top_rating", "category", "manual"] as const);
      const ids = (value: unknown) => (Array.isArray(value) ? value : [])
        .filter((id): id is number => Number.isSafeInteger(id) && id > 0)
        .slice(0, 12);
      const category_ids = source === "category" ? ids(raw.category_ids) : [];
      const product_ids = source === "manual" ? ids(raw.product_ids) : [];
      if ((source === "category" && !category_ids.length) || (source === "manual" && !product_ids.length)) return null;
      const limit = [4, 8, 12].includes(raw.limit as number) ? (raw.limit as number) : 8;
      return { type, settings: {
        title: text(raw.title, 80), subtitle: text(raw.subtitle, 160), source, category_ids, product_ids,
        limit, layout: choice(raw.layout, ["grid", "row"] as const),
      } };
    }
    case "category-grid": {
      const categories = (Array.isArray(raw.categories) ? raw.categories : []).flatMap((entry) => {
        const tile = object(entry);
        const name = text(tile?.name, 80);
        const slug = text(tile?.slug, 200);
        return tile && Number.isSafeInteger(tile.id) && name && slug ? [{ id: tile.id as number, name, slug, image: imageUrl(tile.image) }] : [];
      }).slice(0, 12);
      return categories.length ? { type, settings: { title: text(raw.title, 80), categories } } : null;
    }
    case "text": {
      const body = text(raw.body, 2000);
      const html = trustedHtml(raw.body_html, 20000);
      const action = button(raw.button_label, raw.link);
      const settings: TextSettings = {
        eyebrow: text(raw.eyebrow, 60), title: text(raw.title, 120), body_html: html ?? plainTextHtml(body), body: html ? null : body,
        align: choice(raw.align, ["center", "left"] as const), button_label: action.label, link: action.link,
      };
      return settings.title || settings.body_html ? { type, settings } : null;
    }
    case "hero": {
      const title = text(raw.title, 120);
      if (!title) return null;
      const primary = button(raw.primary_label, raw.primary_link);
      const secondary = button(raw.secondary_label, raw.secondary_link);
      return { type, settings: {
        eyebrow: text(raw.eyebrow, 60), title, subtitle: text(raw.subtitle, 400), image: imageUrl(raw.image), image_alt: text(raw.image_alt, 160),
        image_position: choice(raw.image_position, ["right", "left", "background"] as const),
        primary_label: primary.label, primary_link: primary.link, secondary_label: secondary.label, secondary_link: secondary.link,
        min_height: choice(raw.min_height, ["auto", "medium", "screen"] as const),
      } };
    }
    case "features": {
      const items = list(raw.items).flatMap((entry): FeatureItem[] => {
        const item = object(entry);
        const title = text(item?.title, 60);
        return item && title ? [{ icon: FEATURE_ICONS.includes(item.icon as FeatureIcon) ? (item.icon as FeatureIcon) : null, title, text: text(item.text, 240) }] : [];
      }).slice(0, 12);
      return items.length ? { type, settings: {
        title: text(raw.title, 80), subtitle: text(raw.subtitle, 160), columns: choice(raw.columns, [3, 2, 4] as const), items,
      } } : null;
    }
    case "faq": {
      const items = list(raw.items).flatMap((entry): FaqItem[] => {
        const item = object(entry);
        const question = text(item?.question, 200);
        const answer = text(item?.answer, 1000);
        return question && answer ? [{ question, answer }] : [];
      }).slice(0, 20);
      return items.length ? { type, settings: { title: text(raw.title, 80), subtitle: text(raw.subtitle, 160), items } } : null;
    }
    case "cta": {
      const title = text(raw.title, 120);
      const action = button(raw.button_label, raw.link);
      return title ? { type, settings: { title, text: text(raw.text, 300), button_label: action.label, link: action.link, note: text(raw.note, 120) } } : null;
    }
    case "countdown": {
      const time = typeof raw.ends_at === "string" ? Date.parse(raw.ends_at) : NaN;
      if (!Number.isFinite(time)) return null;
      const action = button(raw.button_label, raw.link);
      return { type, settings: {
        title: text(raw.title, 120), text: text(raw.text, 300), ends_at: new Date(time).toISOString(),
        expired_text: text(raw.expired_text, 160), button_label: action.label, link: action.link,
      } };
    }
    case "gallery": {
      const images = list(raw.images).flatMap((entry): GalleryImage[] => {
        const item = object(entry);
        const image = imageUrl(item?.image);
        return item && image ? [{ image, alt: text(item.alt, 160), link: safeLink(item.link) }] : [];
      }).slice(0, 12);
      return images.length ? { type, settings: { title: text(raw.title, 80), columns: choice(raw.columns, [3, 2, 4] as const), images } } : null;
    }
    case "columns": {
      const layout = choice(raw.layout, COLUMN_LAYOUTS);
      const source = list(raw.columns);
      // Dipotong/ditambah sesuai jumlah kolom susunan, supaya posisi tiap kolom tetap.
      const columns = Array.from({ length: columnCount(layout) }, (_, index): ColumnsColumn => ({
        blocks: list(object(source[index])?.blocks).flatMap(columnBlock).slice(0, 8),
      }));
      return columns.some((column) => column.blocks.length) ? { type, settings: {
        layout, gap: choice(raw.gap, ["md", "sm", "lg"] as const), vertical_align: choice(raw.vertical_align, ["top", "center", "bottom"] as const),
        mobile: choice(raw.mobile, ["stack", "two"] as const), columns,
      } } : null;
    }
    case "image": {
      const image = imageUrl(raw.image);
      return image ? { type, settings: {
        image, alt: text(raw.alt, 160), caption: text(raw.caption, 160), link: safeLink(raw.link),
        width: choice(raw.width, ["contained", "full"] as const),
      } } : null;
    }
    case "testimonials": {
      const items = (Array.isArray(raw.items) ? raw.items : []).flatMap((entry) => {
        const item = object(entry);
        const quote = text(item?.quote, 400);
        const name = text(item?.name, 60);
        return quote && name ? [{ quote, name, detail: text(item?.detail, 60) }] : [];
      }).slice(0, 6);
      return items.length ? { type, settings: { title: text(raw.title, 80), items } } : null;
    }
    case "video": {
      const id = typeof raw.video_id === "string" && /^[A-Za-z0-9_-]{11}$/.test(raw.video_id) ? raw.video_id : null;
      return id ? { type, settings: { title: text(raw.title, 80), caption: text(raw.caption, 160), video_id: id } } : null;
    }
    default:
      return null;
  }
}

/**
 * Respons GET /home. `null` berarti toko belum menerbitkan susunan: pakai beranda bawaan.
 * Widget yang tidak dikenal atau tidak lengkap dilewati, bukan menggagalkan seluruh beranda.
 */
export function readHomeSections(body: unknown): HomeSection[] | null {
  const data = object(body)?.data;
  if (data === null || data === undefined) return null;
  if (!Array.isArray(data)) throw new Error("Invalid home response");
  return readSections(data);
}

/** Daftar bagian yang dipresentasikan backend (beranda dan halaman builder); maks. 20. */
export function readSections(data: unknown[]): HomeSection[] {
  const anchors = new Set<string>();
  return data.slice(0, 20).flatMap((entry, index) => {
    const section = object(entry);
    const settings = object(section?.settings);
    const parsed = section && settings ? settingsFor(section.type, settings) : null;
    if (!parsed) return [];
    const id = typeof section?.id === "string" && /^[\w-]{1,40}$/.test(section.id) ? section.id : `section-${index}`;
    const style = readSectionStyle(section?.style);
    // `id` di dokumen harus unik: anchor yang sudah dipakai bagian sebelumnya dilepas.
    if (style.anchor && anchors.has(style.anchor)) style.anchor = null;
    if (style.anchor) anchors.add(style.anchor);
    return [{ ...parsed, id, css: sectionCss(section?.css), style } as HomeSection];
  });
}

/**
 * Custom CSS bagian, dibungkus selektor bagian itu (CSS nesting): properti berlaku ke bagiannya,
 * `& h2 { … }` ke elemen di dalamnya, dan tidak ada yang bocor ke bagian lain.
 */
export function scopedSectionCss(id: string, css: string): string {
  return `.home-block[data-section="${id}"] {\n${css}\n}`;
}

/**
 * Backend (SectionCss) sudah membersihkannya; di sini diperiksa lagi sebelum masuk <style>: tanpa
 * `<` (tidak bisa menutup tag), dan kurung kurawal seimbang supaya pembungkus tidak bisa ditutup.
 */
function sectionCss(value: unknown): string | null {
  const css = typeof value === "string" ? value.slice(0, 5000).replace(/</g, "").trim() : "";
  return css && balanced(css) ? css : null;
}

/** Sama dengan SectionCss::isBalanced: string, komentar, escape, dan isi tanda kurung dilewati. */
function balanced(css: string): boolean {
  let braces = 0;
  let parens = 0;
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === "\\") {
      i++;
    } else if (char === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end === -1) return false;
      i = end + 1;
    } else if (char === '"' || char === "'") {
      for (i++; i < css.length && css[i] !== char; i++) {
        if (css[i] === "\n") return false;
        if (css[i] === "\\") i++;
      }
      if (i >= css.length) return false;
    } else if (char === "(") {
      parens++;
    } else if (char === ")") {
      if (--parens < 0) return false;
    } else if ((char === "{" || char === "}") && parens > 0) {
      return false;
    } else if (char === "{") {
      braces++;
    } else if (char === "}" && --braces < 0) {
      return false;
    }
  }
  return braces === 0 && parens === 0;
}

/** Paragraf dari teks biasa: dipisah baris kosong. */
export function paragraphs(value: string | null): string[] {
  return (value ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}
