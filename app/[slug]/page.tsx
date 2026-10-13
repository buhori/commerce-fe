import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingFrame } from "@/components/landing-frame";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { formatDate } from "@/lib/format";
import { getPage, getStore } from "@/lib/store-api";

type StorePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [page, store] = await Promise.all([getPage(slug).catch(() => null), getStore().catch(() => null)]);
  if (!page) return { title: "Halaman tidak ditemukan" };
  return {
    title: store ? `${page.title} — ${store.name}` : page.title,
    description: page.meta_description ?? undefined,
    openGraph: page.meta_description ? { title: page.title, description: page.meta_description } : undefined,
  };
}

/**
 * Halaman toko: halaman informasi (/about, /privacy-policy, ...) dari editor teks, atau landing
 * page HTML penuh dari panel, dengan atau tanpa header dan footer toko.
 */
export default async function StoreInfoPage({ params }: StorePageProps) {
  const { slug } = await params;
  const [page, store] = await Promise.all([getPage(slug), getStore()]);
  if (!page) notFound();

  // Landing page layar penuh: tanpa header dan footer toko.
  if (page.document && page.layout === "blank") {
    return <LandingFrame title={page.title} document={page.document} fill />;
  }

  if (page.document) {
    return (
      <>
        <StoreHeader name={store.name} logo={store.logo} />
        <main className="landing-page">
          <h1 className="sr-only">{page.title}</h1>
          <LandingFrame title={page.title} document={page.document} />
        </main>
        <SiteFooter store={store} />
      </>
    );
  }

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page">
        <article className="container info-page">
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{page.title}</span>
          </nav>
          <header className="info-page-header">
            <h1>{page.title}</h1>
            {page.updated_at && <p>Diperbarui {formatDate(new Date(page.updated_at))}</p>}
          </header>
          {/* The backend sanitises this HTML before it leaves the API. */}
          <div className="info-page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
