import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { formatDate } from "@/lib/format";
import { getPage, getStore } from "@/lib/store-api";

type StorePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [page, store] = await Promise.all([getPage(slug).catch(() => null), getStore().catch(() => null)]);
  if (!page) return { title: "Halaman tidak ditemukan" };
  return { title: store ? `${page.title} — ${store.name}` : page.title };
}

/** Store information pages such as /about, /privacy-policy and /terms-condition. */
export default async function StoreInfoPage({ params }: StorePageProps) {
  const { slug } = await params;
  const [page, store] = await Promise.all([getPage(slug), getStore()]);
  if (!page) notFound();

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
