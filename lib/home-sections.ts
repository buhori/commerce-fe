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
  source: "latest" | "category";
  category_id: number | null;
  category_slug: string | null;
  limit: number;
  layout: "grid" | "row";
}
export interface CategoryTile { id: number; name: string; slug: string; image: string | null }
export interface CategoryGridSettings { title: string | null; categories: CategoryTile[] }
export interface TextSettings {
  eyebrow: string | null;
  title: string | null;
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

export type HomeSection =
  | { id: string; type: "banner"; settings: BannerSettings }
  | { id: string; type: "product-list"; settings: ProductListSettings }
  | { id: string; type: "category-grid"; settings: CategoryGridSettings }
  | { id: string; type: "text"; settings: TextSettings }
  | { id: string; type: "image"; settings: ImageSettings }
  | { id: string; type: "testimonials"; settings: TestimonialsSettings }
  | { id: string; type: "video"; settings: VideoSettings };

type Raw = Record<string, unknown>;

const text = (value: unknown, max = 2000) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
const choice = <T extends string>(value: unknown, options: readonly T[]): T => (options.includes(value as T) ? (value as T) : options[0]);
const object = (value: unknown): Raw | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null);

/** Hanya path toko ("/…", bukan "//…") atau http(s); selain itu (mis. javascript:) dibuang. */
export function safeLink(value: unknown): string | null {
  const link = text(value, 500);
  return link && (/^\/(?!\/)\S*$/.test(link) || /^https?:\/\/\S+$/i.test(link)) ? link : null;
}

const imageUrl = (value: unknown) => {
  const url = text(value, 1000);
  return url && /^https?:\/\/\S+$/i.test(url) ? url : null;
};

function settingsFor(type: unknown, raw: Raw): HomeSection | Omit<HomeSection, "id"> | null {
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
      const source = choice(raw.source, ["latest", "category"] as const);
      const slug = text(raw.category_slug, 200);
      const id = Number.isSafeInteger(raw.category_id) && (raw.category_id as number) > 0 ? (raw.category_id as number) : null;
      if (source === "category" && (!slug || !id)) return null;
      const limit = [4, 8, 12].includes(raw.limit as number) ? (raw.limit as number) : 8;
      return { type, settings: {
        title: text(raw.title, 80), subtitle: text(raw.subtitle, 160), source,
        category_id: source === "category" ? id : null, category_slug: source === "category" ? slug : null,
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
      const settings: TextSettings = {
        eyebrow: text(raw.eyebrow, 60), title: text(raw.title, 120), body: text(raw.body, 2000),
        align: choice(raw.align, ["center", "left"] as const), button_label: text(raw.button_label, 40), link: safeLink(raw.link),
      };
      return settings.title || settings.body ? { type, settings } : null;
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
  return data.slice(0, 20).flatMap((entry, index) => {
    const section = object(entry);
    const settings = object(section?.settings);
    const parsed = section && settings ? settingsFor(section.type, settings) : null;
    return parsed ? [{ ...parsed, id: typeof section?.id === "string" ? section.id : `section-${index}` } as HomeSection] : [];
  });
}

/** Paragraf dari teks biasa: dipisah baris kosong. */
export function paragraphs(value: string | null): string[] {
  return (value ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}
