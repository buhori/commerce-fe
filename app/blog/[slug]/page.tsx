import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog-card";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { ButtonLink } from "@/components/ui/button";
import { blogPostingJsonLd } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getBlogPost, getStore } from "@/lib/store-api";

type BlogPostProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const [post, site] = await Promise.all([getBlogPost(slug), getSiteSeo()]);
  if (!post) return { title: "Artikel tidak ditemukan" };
  const image = post.seo.image || post.cover_image;
  const metadata = pageMetadata(site, {
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    images: image ? [{ url: image, alt: post.title }] : undefined,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, type: "article", ...(post.published_at ? { publishedTime: post.published_at } : {}), ...(post.updated_at ? { modifiedTime: post.updated_at } : {}) },
  };
}

/** Satu artikel blog: sampul, judul, tanggal, isi dari editor (disanitasi backend), dan artikel lain. */
export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const [post, store, site] = await Promise.all([getBlogPost(slug), getStore(), getSiteSeo()]);
  if (!post) notFound();
  const url = absoluteUrl(site.base, `/blog/${post.slug}`);

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: "Beranda", url: absoluteUrl(site.base, "/") },
          { name: "Blog", url: absoluteUrl(site.base, "/blog") },
          { name: post.title, url },
        ]),
        post.structured_data ?? blogPostingJsonLd(post, url, store.name),
      ]} />
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page blog-page">
        <article className="container blog-article">
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">›</span>
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{post.title}</span>
          </nav>
          <header className="blog-article-header">
            <h1>{post.title}</h1>
            {post.excerpt && <p className="blog-article-lead">{post.excerpt}</p>}
            <p className="blog-meta">
              {post.published_at && <time dateTime={post.published_at}>{formatDate(new Date(post.published_at))}</time>}
              <span>{post.reading_minutes} menit baca</span>
            </p>
          </header>
          {post.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element -- gambar dari disk unggahan toko, tanpa optimasi Next.
            <img className="blog-article-cover" src={post.cover_image} alt="" width={1600} height={900} />
          )}
          <div className="info-page-content blog-article-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          <footer className="blog-article-footer">
            <ButtonLink variant="secondary" href="/blog">Semua artikel</ButtonLink>
            <ButtonLink href="/products">Belanja di {store.name}</ButtonLink>
          </footer>
        </article>

        {post.related.length > 0 && (
          <section className="container blog-related" aria-labelledby="blog-related-title">
            <h2 id="blog-related-title">Artikel lainnya</h2>
            <ul className="blog-grid">
              {post.related.map((other) => <li key={other.slug}><BlogCard post={other} /></li>)}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter store={store} />
    </>
  );
}
