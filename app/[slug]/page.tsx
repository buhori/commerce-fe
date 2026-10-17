import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuilderSections } from "@/components/builder-sections";
import { JsonLd } from "@/components/json-ld";
import { LandingFrame } from "@/components/landing-frame";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { formatDate } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getPage, getStore } from "@/lib/store-api";
import { PageContent } from "@/sdk/components";
import { getActiveTheme } from "@/themes/active";

type StorePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [page, site] = await Promise.all([getPage(slug).catch(() => null), getSiteSeo()]);
  if (!page) return { title: "Halaman tidak ditemukan" };
  return pageMetadata(site, {
    title: page.seo.title || page.title,
    description: page.seo.description || page.meta_description || undefined,
    path: `/${page.slug}`,
    images: page.seo.image ? [{ url: page.seo.image, alt: page.title }] : undefined,
  });
}

/**
 * Halaman toko: halaman informasi (/about, /privacy-policy, ...) dari editor teks, landing page
 * HTML penuh dari panel, atau halaman dari builder; dua yang terakhir dengan atau tanpa header dan
 * footer toko.
 */
export default async function StoreInfoPage({ params }: StorePageProps) {
  const { slug } = await params;
  const [page, store, theme, site] = await Promise.all([getPage(slug), getStore(), getActiveTheme(), getSiteSeo()]);
  if (!page) notFound();
  const breadcrumb = (
    <JsonLd data={[
      breadcrumbJsonLd([
        { name: "Beranda", url: absoluteUrl(site.base, "/") },
        { name: page.title, url: absoluteUrl(site.base, `/${page.slug}`) },
      ]),
      ...(page.structured_data ? [page.structured_data] : []),
    ]} />
  );

  if (page.format === "builder") {
    const sections = page.sections ?? [];
    const faq = faqJsonLd(sections.flatMap((section) => (section.type === "faq" ? section.settings.items : [])));
    const content = (
      <main className={page.layout === "blank" ? "home-page builder-page builder-page-blank" : "page home-page builder-page"}>
        <h1 className="sr-only">{page.title}</h1>
        <BuilderSections store={store} sections={sections} components={theme.components.sections} compact={page.layout !== "blank"} />
      </main>
    );
    return (
      <>
        {breadcrumb}
        {faq && <JsonLd data={faq} />}
        {page.layout === "blank" ? content : <><StoreHeader name={store.name} logo={store.logo} />{content}<SiteFooter store={store} /></>}
      </>
    );
  }

  // Landing page layar penuh: tanpa header dan footer toko.
  if (page.document && page.layout === "blank") {
    return <>{breadcrumb}<LandingFrame title={page.title} document={page.document} fill /></>;
  }

  if (page.document) {
    return (
      <>
        {breadcrumb}
        <StoreHeader name={store.name} logo={store.logo} />
        <main className="landing-page">
          <h1 className="sr-only">{page.title}</h1>
          <LandingFrame title={page.title} document={page.document} />
        </main>
        <SiteFooter store={store} />
      </>
    );
  }

  const { InfoPage } = theme.components;
  return (
    <>
      {breadcrumb}
      <StoreHeader name={store.name} logo={store.logo} />
      {InfoPage ? <InfoPage store={store} page={page} /> : (
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
            <PageContent className="info-page-content" page={page} />
          </article>
        </main>
      )}
      <SiteFooter store={store} />
    </>
  );
}
