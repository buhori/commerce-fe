import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog-card";
import { Icon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { ButtonLink } from "@/components/ui/button";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getBlogPosts, getStore } from "@/lib/store-api";

type BlogIndexProps = { searchParams: Promise<{ page?: string }> };

const pageNumber = (value: string | undefined) => (/^[1-9]\d{0,3}$/.test(value ?? "") ? Number(value) : 1);

export async function generateMetadata({ searchParams }: BlogIndexProps): Promise<Metadata> {
  const [site, store, { page }] = await Promise.all([getSiteSeo(), getStore(), searchParams]);
  const current = pageNumber(page);
  return pageMetadata(site, {
    title: current > 1 ? `Blog (halaman ${current})` : "Blog",
    description: `Artikel, tips, dan cerita dari ${store.name}.`,
    path: current > 1 ? `/blog?page=${current}` : "/blog",
  });
}

/** Daftar artikel blog toko (paket Business); toko tanpa blog dijawab 404. */
export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const { page } = await searchParams;
  const [blog, store, site] = await Promise.all([getBlogPosts(pageNumber(page)), getStore(), getSiteSeo()]);
  if (!blog) notFound();
  const [featured, ...rest] = blog.page === 1 ? blog.posts : [];
  const posts = blog.page === 1 ? rest : blog.posts;
  const href = (target: number) => (target > 1 ? `/blog?page=${target}` : "/blog");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Beranda", url: absoluteUrl(site.base, "/") },
        { name: "Blog", url: absoluteUrl(site.base, "/blog") },
      ])} />
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page blog-page">
        <div className="container">
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Blog</span>
          </nav>
          <header className="blog-hero">
            <p className="blog-eyebrow">Blog {store.name}</p>
            <h1>Artikel &amp; cerita</h1>
            <p>Tips, panduan, dan kabar terbaru dari {store.name}.</p>
          </header>

          {blog.posts.length === 0 ? (
            <div className="empty-state">
              <Icon name="info" />
              <h2>Belum ada artikel</h2>
              <p>Artikel dari {store.name} akan tampil di sini.</p>
              <ButtonLink variant="secondary" href="/products">Lihat produk</ButtonLink>
            </div>
          ) : (
            <>
              {featured && <BlogCard post={featured} featured />}
              {posts.length > 0 && (
                <ul className="blog-grid">
                  {posts.map((post) => <li key={post.slug}><BlogCard post={post} /></li>)}
                </ul>
              )}
              {blog.lastPage > 1 && (
                <nav className="pagination" aria-label="Halaman blog">
                  {blog.page > 1 && <ButtonLink variant="secondary" href={href(blog.page - 1)}>Sebelumnya</ButtonLink>}
                  <span className="blog-page-count">Halaman {blog.page} dari {blog.lastPage}</span>
                  {blog.page < blog.lastPage && <ButtonLink variant="secondary" href={href(blog.page + 1)}>Berikutnya</ButtonLink>}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
