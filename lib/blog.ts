/**
 * Blog toko dari GET /blog dan /blog/{slug} (App\Http\Controllers\API\BlogController, paket Business).
 * Modul murni supaya bentuk respons bisa diuji langsung.
 */
import { readSeo, readStructuredData, type PageSeo } from "./seo";
import { isPageSlug } from "./store-shared";

export interface BlogSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string | null;
}

export interface BlogPost extends BlogSummary {
  /** HTML yang sudah disanitasi backend. */
  content: string;
  reading_minutes: number;
  seo: PageSeo;
  structured_data: Record<string, unknown> | null;
  related: BlogSummary[];
}

export interface BlogPage {
  posts: BlogSummary[];
  page: number;
  lastPage: number;
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const httpUrl = (value: unknown) => (typeof value === "string" && /^https?:\/\/\S+$/i.test(value) ? value : null);
const date = (value: unknown) => (typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null);
const positive = (value: unknown, fallback: number) => (Number.isInteger(value) && (value as number) > 0 ? (value as number) : fallback);

/** Satu baris daftar; null bila slug atau judulnya rusak. */
export function readBlogSummary(value: unknown): BlogSummary | null {
  const row = value as Record<string, unknown> | null;
  const title = text(row?.title);
  if (!row || !isPageSlug(row.slug) || !title) return null;
  return {
    slug: row.slug,
    title,
    excerpt: text(row.excerpt),
    cover_image: httpUrl(row.cover_image),
    published_at: date(row.published_at),
    updated_at: date(row.updated_at),
  };
}

export function readBlogPage(value: unknown): BlogPage {
  const body = value && typeof value === "object" ? (value as { data?: unknown; meta?: Record<string, unknown> }) : {};
  const posts = (Array.isArray(body.data) ? body.data : []).flatMap((row) => {
    const post = readBlogSummary(row);
    return post ? [post] : [];
  });
  const page = positive(body.meta?.current_page, 1);
  return { posts, page, lastPage: Math.max(page, positive(body.meta?.last_page, 1)) };
}

export function readBlogPost(value: unknown): BlogPost | null {
  const data = value && typeof value === "object" ? (value as { data?: unknown }).data : null;
  const summary = readBlogSummary(data);
  if (!summary) return null;
  const row = data as Record<string, unknown>;
  return {
    ...summary,
    content: typeof row.content === "string" ? row.content : "",
    reading_minutes: positive(row.reading_minutes, 1),
    seo: readSeo(row.seo),
    structured_data: readStructuredData(row.structured_data),
    related: (Array.isArray(row.related) ? row.related : []).flatMap((item) => {
      const post = readBlogSummary(item);
      return post && post.slug !== summary.slug ? [post] : [];
    }).slice(0, 3),
  };
}

/** JSON-LD BlogPosting untuk artikel. */
export function blogPostingJsonLd(post: BlogPost, url: string, publisher: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.seo.description || post.excerpt ? { description: post.seo.description || post.excerpt } : {}),
    ...(post.cover_image ? { image: [post.cover_image] } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    mainEntityOfPage: url,
    publisher: { "@type": "Organization", name: publisher },
  };
}
