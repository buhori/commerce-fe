import Image from "next/image";
import Link from "next/link";
import { paragraphs, type ColumnBlock } from "@/lib/home-sections";
import { RichText, SectionLink } from "@/sdk/components";
import type {
  BannerSectionProps, CategoryGridSectionProps, ColumnsSectionProps, CountdownSectionProps, CtaSectionProps, FaqSectionProps, FeaturesSectionProps,
  GallerySectionProps, HeroSectionProps, ImageSectionProps, ProductListSectionProps, SectionComponents, TestimonialsSectionProps,
  TextSectionProps, VideoSectionProps,
} from "@/sdk/types";
import { BannerSlider } from "./banner-slider";
import { Catalog } from "./catalog";
import { Countdown } from "./countdown";
import { Icon } from "./icons";
import { FeatureIcon } from "./section-icons";
import { buttonClasses } from "./ui/button";
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

/** Tombol dari pengaturan widget; null bila label atau tautannya kosong. */
function ActionButton({ label, link, variant = "primary", arrow = false }: {
  label: string | null;
  link: string | null;
  variant?: "primary" | "secondary";
  arrow?: boolean;
}) {
  if (!label || !link) return null;
  return <SectionLink href={link} className={buttonClasses({ variant })}>{label}{arrow && <> <Icon name="arrow" /></>}</SectionLink>;
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
        <RichText html={settings.body_html} className="home-text-body" />
        <ActionButton label={settings.button_label} link={settings.link} variant="secondary" arrow />
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
      {settings.link ? <SectionLink href={settings.link}>{picture}</SectionLink> : picture}
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

/** Teks banyak baris (subjudul, jawaban): baris kosong = paragraf baru, baris baru tetap terlihat. */
function Paragraphs({ text, className }: { text: string | null; className?: string }) {
  return paragraphs(text).map((part, index) => <p key={index} className={className}>{part}</p>);
}

function HeroSection({ settings }: HeroSectionProps) {
  const backdrop = settings.image_position === "background" && settings.image ? settings.image : null;
  const media = !backdrop && settings.image ? settings.image : null;
  const layout = backdrop ? "background" : media ? settings.image_position : "text";
  const hasActions = Boolean(settings.primary_label || settings.secondary_label);
  return (
    <section className={`container home-section home-hero home-hero-${layout} home-hero-${settings.min_height}`}>
      <div className={`home-hero-inner ${backdrop ? "section-fg section-text-light section-buttons-invert" : ""}`}>
        {backdrop && (
          <span className="home-hero-backdrop" aria-hidden="true">
            <Image src={backdrop} alt="" fill unoptimized loading="eager" sizes="100vw" style={{ objectFit: "cover" }} />
          </span>
        )}
        <div className="home-hero-copy">
          {settings.eyebrow && <p className="home-eyebrow">{settings.eyebrow}</p>}
          <h2 className="home-hero-title">{settings.title}</h2>
          <Paragraphs text={settings.subtitle} className="home-hero-subtitle" />
          {hasActions && (
            <div className="home-actions">
              <ActionButton label={settings.primary_label} link={settings.primary_link} />
              <ActionButton label={settings.secondary_label} link={settings.secondary_link} variant="secondary" />
            </div>
          )}
        </div>
        {media && (
          <div className="home-hero-media">
            <Image src={media} alt={settings.image_alt ?? ""} fill unoptimized loading="eager" sizes="(max-width: 767px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturesSection({ settings }: FeaturesSectionProps) {
  return (
    <section className="container home-section home-features">
      <SectionHeading title={settings.title} subtitle={settings.subtitle} />
      <ul className={`home-features-grid home-columns-${settings.columns}`}>
        {settings.items.map((item, index) => (
          <li key={index} className="home-feature">
            {item.icon && <span className="home-feature-icon"><FeatureIcon name={item.icon} /></span>}
            <h3>{item.title}</h3>
            <Paragraphs text={item.text} className="home-feature-text" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FaqSection({ settings }: FaqSectionProps) {
  return (
    <section className="container home-section home-faq">
      <SectionHeading title={settings.title} subtitle={settings.subtitle} />
      <div className="home-faq-list">
        {settings.items.map((item, index) => (
          <details key={index} className="home-faq-item">
            <summary>
              <span>{item.question}</span>
              <svg className="home-faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="home-faq-answer"><Paragraphs text={item.answer} /></div>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ settings }: CtaSectionProps) {
  return (
    <section className="container home-section home-cta">
      <div className="home-cta-card">
        <h2>{settings.title}</h2>
        <Paragraphs text={settings.text} className="home-cta-text" />
        <ActionButton label={settings.button_label} link={settings.link} arrow />
        {settings.note && <p className="home-cta-note">{settings.note}</p>}
      </div>
    </section>
  );
}

function CountdownSection({ store, settings }: CountdownSectionProps) {
  return (
    <section className="container home-section home-countdown">
      <div className="home-cta-card">
        {settings.title && <h2>{settings.title}</h2>}
        <Paragraphs text={settings.text} className="home-cta-text" />
        <Countdown
          endsAt={settings.ends_at}
          language={store.language === "en" ? "en" : "id"}
          expired={settings.expired_text && <p className="home-countdown-expired">{settings.expired_text}</p>}
        >
          <ActionButton label={settings.button_label} link={settings.link} arrow />
        </Countdown>
      </div>
    </section>
  );
}

function GallerySection({ settings }: GallerySectionProps) {
  return (
    <section className="container home-section home-gallery">
      <SectionHeading title={settings.title} />
      <ul className={`home-gallery-grid home-columns-${settings.columns}`}>
        {settings.images.map((item, index) => {
          // Gambar bertautan butuh nama untuk pembaca layar; tanpa alt dipakai judul galeri dan nomornya.
          const alt = item.alt ?? (item.link ? `${settings.title ?? "Galeri"} ${index + 1}` : "");
          const picture = (
            <span className="home-gallery-art">
              <Image src={item.image} alt={alt} fill unoptimized sizes={`(max-width: 767px) 50vw, ${Math.round(100 / settings.columns)}vw`} style={{ objectFit: "cover" }} />
            </span>
          );
          return <li key={index}>{item.link ? <SectionLink href={item.link}>{picture}</SectionLink> : picture}</li>;
        })}
      </ul>
    </section>
  );
}

type ButtonBlock = Extract<ColumnBlock, { type: "button" }>;

/** Tombol yang berurutan dalam satu kolom dijadikan satu baris tombol. */
function groupBlocks(blocks: ColumnBlock[]): (ColumnBlock | ButtonBlock[])[] {
  return blocks.reduce<(ColumnBlock | ButtonBlock[])[]>((groups, block) => {
    const last = groups.at(-1);
    if (block.type !== "button") groups.push(block);
    else if (Array.isArray(last)) last.push(block);
    else groups.push([block]);
    return groups;
  }, []);
}

function ColumnBlockView({ block, label }: { block: ColumnBlock; label: string }) {
  switch (block.type) {
    case "heading": {
      const Heading = block.level;
      return <Heading className={`home-column-heading home-column-${block.level}`}>{block.text}</Heading>;
    }
    case "text":
      return <RichText html={block.html} className="home-column-text" />;
    case "image": {
      const picture = (
        // eslint-disable-next-line @next/next/no-img-element -- Ukuran asli gambar tidak diketahui; tampil utuh tanpa dipotong.
        <img src={block.image} alt={block.alt ?? (block.link ? label : "")} loading="lazy" />
      );
      return <div className="home-column-image">{block.link ? <SectionLink href={block.link}>{picture}</SectionLink> : picture}</div>;
    }
    case "spacer":
      return <div className={`home-column-spacer home-column-spacer-${block.size}`} aria-hidden="true" />;
    case "button":
      return null;
  }
}

function ColumnsSection({ settings }: ColumnsSectionProps) {
  const grid = [
    "home-columns-grid", `home-cols-${settings.layout}`, `home-cols-gap-${settings.gap}`, `home-cols-valign-${settings.vertical_align}`,
    `home-cols-mobile-${settings.mobile}`,
  ].join(" ");
  return (
    <section className="container home-section home-columns">
      <div className={grid}>
        {settings.columns.map((column, index) => {
          // Gambar bertautan tanpa alt dinamai judul pertama di kolomnya (untuk pembaca layar).
          const heading = column.blocks.find((block) => block.type === "heading");
          const label = heading?.type === "heading" ? heading.text : `Gambar ${index + 1}`;
          return (
            <div key={index} className="home-column">
              {groupBlocks(column.blocks).map((group, position) => (Array.isArray(group)
                ? (
                  <div key={position} className="home-actions home-column-actions">
                    {group.map((button, order) => (
                      <SectionLink key={order} href={button.link} className={buttonClasses({ variant: button.variant === "link" ? "text" : button.variant })}>
                        {button.label}{button.variant === "link" && <> <Icon name="arrow" /></>}
                      </SectionLink>
                    ))}
                  </div>
                )
                : <ColumnBlockView key={position} block={group} label={label} />))}
            </div>
          );
        })}
      </div>
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
  hero: HeroSection,
  features: FeaturesSection,
  faq: FaqSection,
  cta: CtaSection,
  countdown: CountdownSection,
  gallery: GallerySection,
  columns: ColumnsSection,
};
