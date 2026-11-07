import Image from "next/image";
import { SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { bannerList } from "../manifest";

/** BannerList Ambaz: tiga banner tinggi dengan judul, keterangan, dan tautan di bawahnya. */
export function BannerList({ blocks, editor }: SectionRenderProps<typeof bannerList>) {
  const banners = blocks.filter((block) => block.settings.image || block.settings.title);
  if (banners.length === 0) return null;
  return (
    <section {...editor}>
      <div className="container-main">
        <div className="banner-list-grid">
          {banners.map(({ id, settings: banner }) => (
            <div key={id}>
              <div className="bl-img-wrap" style={{ position: "relative", height: "600px", borderRadius: "10px", overflow: "hidden", backgroundColor: "#f5f5f5", marginBottom: "24px" }}>
                {banner.image && <Image unoptimized src={banner.image.url} alt={banner.image.alt || banner.title} fill className="bl-img" style={{ objectFit: "cover", objectPosition: "center top", transition: "transform 500ms ease" }} sizes="33vw" />}
              </div>
              <div style={{ textAlign: "center" }}>
                {banner.title && <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#222", marginBottom: "8px" }}>{banner.title}</h3>}
                {banner.text && <p style={{ fontSize: "16px", color: "#777", lineHeight: 1.6, marginBottom: "14px" }}>{banner.text}</p>}
                {banner.button && banner.link && <SectionLink href={banner.link.href} className="bl-link">{banner.button}</SectionLink>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .banner-list-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 750px) { .banner-list-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; } }
        @media (min-width: 992px) { .banner-list-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; } }
        .bl-img-wrap:hover .bl-img { transform: scale(1.05); }
        .bl-link { font-size: 16px; font-weight: 500; color: #222; text-decoration: underline; text-underline-offset: 4px; transition: color 250ms ease; }
        .bl-link:hover { color: #F15B41; }
      `}</style>
    </section>
  );
}
