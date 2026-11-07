import Image from "next/image";
import type { ReactNode } from "react";
import { SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { promotionalGrid } from "../manifest";
import { IconArrowRight } from "./icons";

type Settings = SectionRenderProps<typeof promotionalGrid>["settings"];

function ShopNowLink({ label }: { label: string }) {
  return (
    <span className="shop-now-link">
      {label}
      <IconArrowRight size={14} />
    </span>
  );
}

/** Kartu bertautan; tanpa tautan tetap tampil sebagai kartu biasa. */
function Card({ href, className, children }: { href: string | undefined; className: string; children: ReactNode }) {
  return href ? <SectionLink href={href} className={className}>{children}</SectionLink> : <div className={className}>{children}</div>;
}

function CardImage({ image, alt, sizes, position = "center" }: { image: Settings["main_image"]; alt: string; sizes: string; position?: string }) {
  return image ? (
    <Image src={image.url} alt={image.alt || alt} fill unoptimized className="promo-card-img" sizes={sizes} style={{ objectFit: "cover", objectPosition: position }} />
  ) : null;
}

/** PromotionalGrid Ambaz (features/home/components/PromotionalGrid.tsx): satu kartu besar dan tiga kartu kecil. */
export function PromotionalGrid({ settings: s, editor }: SectionRenderProps<typeof promotionalGrid>) {
  return (
    <section {...editor}>
      <div className="container-main">
        <div className="promo-grid-wrapper">
          <Card href={s.main_link?.href} className="promo-card promo-grid-left">
            <CardImage image={s.main_image} alt={s.main_title} sizes="50vw" position="right center" />
            <div className="promo-main-content">
              <div>{s.main_badge && <span className="promo-badge">{s.main_badge}</span>}</div>
              <div className="promo-main-text">
                <h3 className="promo-main-title">{s.main_title}</h3>
                {s.main_text && <p className="promo-caption">{s.main_text}</p>}
              </div>
              <div>
                {s.main_button && (
                  <span className="promo-btn">
                    {s.main_button}
                    <IconArrowRight size={14} />
                  </span>
                )}
              </div>
            </div>
          </Card>

          <div className="promo-grid-right">
            <div className="promo-grid-right-top">
              <Card href={s.card1_link?.href} className="promo-card promo-card-split">
                <CardImage image={s.card1_image} alt={s.card1_title} sizes="25vw" />
                <div style={{ position: "relative", zIndex: 2, padding: "24px 24px 0" }}>
                  <h3 className="promo-small-title">{s.card1_title}</h3>
                </div>
                <div style={{ position: "relative", zIndex: 2, padding: "0 24px 24px" }}>
                  {s.link_label && <ShopNowLink label={s.link_label} />}
                </div>
              </Card>

              <Card href={s.card2_link?.href} className="promo-card promo-card-stack">
                <CardImage image={s.card2_image} alt={s.card2_title} sizes="25vw" />
                <div style={{ position: "relative", zIndex: 2, padding: "24px" }}>
                  <h3 className="promo-small-title" style={{ marginBottom: "6px" }}>{s.card2_title}</h3>
                  {s.link_label && <ShopNowLink label={s.link_label} />}
                </div>
              </Card>
            </div>

            <Card href={s.card3_link?.href} className="promo-card">
              <CardImage image={s.card3_image} alt={s.card3_title} sizes="50vw" />
              <div className="promo-wide-content">
                <div>
                  <h3 className="promo-wide-title">{s.card3_title}</h3>
                  {s.card3_text && <p className="promo-caption">{s.card3_text}</p>}
                </div>
                <div>{s.link_label && <ShopNowLink label={s.link_label} />}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        .promo-grid-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .promo-grid-right { display: grid; grid-template-rows: 1fr 1fr; gap: 20px; height: 600px; }
        .promo-grid-right-top { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .promo-card { position: relative; display: block; overflow: hidden; text-decoration: none; color: inherit; background: #f2f2f2; }
        .promo-card-split { display: flex; flex-direction: column; justify-content: space-between; }
        .promo-card-stack { display: flex; flex-direction: column; }
        .promo-grid-left { height: 600px; }
        .promo-card-img { transition: transform 500ms ease; }
        .promo-card:hover .promo-card-img { transform: scale(1.05); }
        .promo-main-content { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 30px 36px; z-index: 2; }
        .promo-main-text { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .promo-badge { display: inline-block; background-color: #fff; color: #222; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 7px 16px; }
        .promo-main-title { font-size: 30px; font-weight: 700; color: #222; line-height: 1.2; margin-bottom: 10px; white-space: pre-line; }
        .promo-caption { font-size: 13px; color: #555; text-transform: uppercase; letter-spacing: 0.3px; }
        .promo-small-title { font-size: 22px; font-weight: 700; color: #222; line-height: 1.3; }
        .promo-wide-content { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 28px 32px; max-width: 50%; }
        .promo-wide-title { font-size: 24px; font-weight: 700; color: #222; line-height: 1.3; margin-bottom: 10px; white-space: pre-line; }
        .shop-now-link { display: inline-flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 500; color: #222; }
        .promo-btn { display: inline-flex; align-items: center; gap: 8px; background-color: #000; color: #fff; font-size: 15px; font-weight: 500; padding: 14px 28px; border-radius: 40px; transition: background-color 250ms ease; }
        .promo-btn:hover { background-color: #fc5732; }
        @media (max-width: 749px) {
          .promo-grid-wrapper { grid-template-columns: 1fr !important; }
          .promo-grid-left { height: clamp(230px, calc(89px + 44.2vw), 420px) !important; }
          .promo-grid-right { grid-template-rows: auto auto !important; height: auto !important; }
          .promo-grid-right-top { grid-template-columns: 1fr !important; }
          .promo-grid-right .promo-card { height: clamp(230px, calc(89px + 44.2vw), 420px) !important; }
          .promo-grid-left h3 { font-size: clamp(18px, 5vw, 28px) !important; }
          .promo-grid-right h3 { font-size: clamp(14px, 4vw, 22px) !important; }
        }
        @media (min-width: 750px) and (max-width: 991px) {
          .promo-grid-wrapper { grid-template-columns: 1fr !important; }
          .promo-grid-left { height: 420px !important; }
          .promo-grid-right { grid-template-rows: auto auto !important; height: auto !important; }
          .promo-grid-right .promo-card { height: 260px !important; }
        }
      `}</style>
    </section>
  );
}
