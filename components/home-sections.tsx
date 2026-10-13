import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { paragraphs } from "@/lib/home-sections";
import type {
  BannerSectionProps, CategoryGridSectionProps, ImageSectionProps, ProductListSectionProps, SectionComponents,
  TestimonialsSectionProps, TextSectionProps, VideoSectionProps,
} from "@/sdk/types";
import { BannerSlider } from "./banner-slider";
import { Catalog } from "./catalog";
import { Icon } from "./icons";
import { ButtonLink } from "./ui/button";
import { VideoEmbed } from "./video-embed";

/** Tampilan bawaan widget builder, dipakai bila tema tidak menyediakan versinya sendiri. */

function SectionHeading({ title, subtitle, moreHref }: { title: string | null; subtitle?: string | null; moreHref?: string | null }) {
  if (!title && !subtitle && !moreHref) return null;
  return (
    <div className="home-section-heading">
      <div>
        {title && <h2>{title}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {moreHref && <Link href={moreHref} className="home-section-more">Lihat semua <Icon name="arrow" /></Link>}
    </div>
  );
}

function SmartAnchor({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return href.startsWith("/")
    ? <Link href={href} className={className}>{children}</Link>
    : <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function BannerSection({ settings }: BannerSectionProps) {
  return (
    <div className={`home-showcase home-banner-${settings.height}`}>
      <BannerSlider slides={settings.slides} />
    </div>
  );
}

function ProductListSection({ store, settings, products, moreHref }: ProductListSectionProps) {
  return (
    <section className={`container home-section home-products home-products-${settings.layout}`}>
      <SectionHeading title={settings.title} subtitle={settings.subtitle} moreHref={moreHref} />
      <Catalog products={products} currency={store.currency || "IDR"} />
    </section>
  );
}

function CategoryGridSection({ settings }: CategoryGridSectionProps) {
  return (
    <section className="container home-section">
      <SectionHeading title={settings.title} />
      <ul className="home-categories">
        {settings.categories.map((category) => (
          <li key={category.id}>
            <Link href={`/c/${encodeURIComponent(category.slug)}`}>
              <span className="home-category-art">
                {category.image
                  ? <Image src={category.image} alt="" fill unoptimized sizes="(max-width: 700px) 45vw, 200px" style={{ objectFit: "cover" }} />
                  : <span aria-hidden="true">{category.name.charAt(0)}</span>}
              </span>
              <span className="home-category-name">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TextSection({ settings }: TextSectionProps) {
  return (
    <section className="container home-section">
      <div className={`home-text home-text-${settings.align}`}>
        {settings.eyebrow && <p className="home-eyebrow">{settings.eyebrow}</p>}
        {settings.title && <h2>{settings.title}</h2>}
        {paragraphs(settings.body).map((text, index) => <p key={index} className="home-text-body">{text}</p>)}
        {settings.link && settings.button_label && (
          settings.link.startsWith("/")
            ? <ButtonLink href={settings.link} variant="secondary">{settings.button_label} <Icon name="arrow" /></ButtonLink>
            : <a href={settings.link} className="button button-secondary button-md" target="_blank" rel="noopener noreferrer">{settings.button_label} <Icon name="arrow" /></a>
        )}
      </div>
    </section>
  );
}

function ImageSection({ settings }: ImageSectionProps) {
  const picture = (
    // eslint-disable-next-line @next/next/no-img-element -- Ukuran asli gambar tidak diketahui; tampil utuh tanpa dipotong.
    <img src={settings.image} alt={settings.alt ?? ""} loading="lazy" />
  );
  return (
    <figure className={`home-section home-image home-image-${settings.width} ${settings.width === "contained" ? "container" : ""}`}>
      {settings.link ? <SmartAnchor href={settings.link}>{picture}</SmartAnchor> : picture}
      {settings.caption && <figcaption>{settings.caption}</figcaption>}
    </figure>
  );
}

function TestimonialsSection({ settings }: TestimonialsSectionProps) {
  return (
    <section className="container home-section">
      <SectionHeading title={settings.title} />
      <ul className="home-testimonials">
        {settings.items.map((item, index) => (
          <li key={index}>
            <blockquote>
              <p>“{item.quote}”</p>
              <footer><strong>{item.name}</strong>{item.detail && <span> · {item.detail}</span>}</footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideoSection({ store, settings }: VideoSectionProps) {
  return (
    <section className="container home-section home-video">
      <SectionHeading title={settings.title} />
      <VideoEmbed videoId={settings.video_id} title={settings.title ?? `Video ${store.name}`} />
      {settings.caption && <p className="home-video-caption">{settings.caption}</p>}
    </section>
  );
}

export const defaultSections: Required<SectionComponents> = {
  banner: BannerSection,
  "product-list": ProductListSection,
  "category-grid": CategoryGridSection,
  text: TextSection,
  image: ImageSection,
  testimonials: TestimonialsSection,
  video: VideoSection,
};
