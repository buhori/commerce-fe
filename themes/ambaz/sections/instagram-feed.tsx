"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { SectionRenderProps } from "@sellosy/theme";
import type { instagramFeed } from "../manifest";
import { IconArrowLeftS, IconArrowRightS, SOCIAL_ICONS } from "./icons";

import "swiper/css";

/** InstagramFeed Ambaz: foto dari setting, tautan ke akun Instagram toko bila diisi. */
export function InstagramFeed({ settings: s, editor }: SectionRenderProps<typeof instagramFeed>) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  if (s.images.length === 0) return null;
  const account = s.account?.href ?? null;
  const Card = ({ children }: { children: ReactNode }) => account
    ? <a href={account} target="_blank" rel="noopener noreferrer" className="ig-card">{children}</a>
    : <div className="ig-card">{children}</div>;

  return (
    <section {...editor} className="ig-section">
      <div className="container-main">
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#222", marginBottom: "8px" }}>{s.title}</h2>
          {s.subtitle && <p style={{ fontSize: "15px", color: "#777" }}>{account ? <a href={account} target="_blank" rel="noopener noreferrer" style={{ color: "#F15B41", textDecoration: "underline" }}>{s.subtitle}</a> : s.subtitle}</p>}
        </div>
        <div style={{ position: "relative", marginTop: "32px" }}>
          <Swiper modules={[Navigation]} onSwiper={setSwiperInstance} slidesPerView={2} breakpoints={{ 480: { slidesPerView: 3 }, 750: { slidesPerView: 4 }, 992: { slidesPerView: 5 } }}
            spaceBetween={16} loop={s.images.length > 5} speed={600} style={{ overflow: "hidden" }}>
            {s.images.map((image, i) => (
              <SwiperSlide key={`${image.url}-${i}`}>
                <Card>
                  <Image unoptimized src={image.url} alt={image.alt || `Instagram ${i + 1}`} fill className="ig-card-img" style={{ objectFit: "cover", transition: "transform 500ms ease" }} sizes="20vw" />
                  <div className="ig-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor" width={32} height={32} aria-hidden="true"><path d={SOCIAL_ICONS.instagram.d} /></svg>
                  </div>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
          <button onClick={() => swiperInstance?.slidePrev()} aria-label="Previous" className="ig-nav-prev"><IconArrowLeftS size={20} /></button>
          <button onClick={() => swiperInstance?.slideNext()} aria-label="Next" className="ig-nav-next"><IconArrowRightS size={20} /></button>
        </div>
      </div>
      <style>{`
        .ig-card { display: block; position: relative; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 6px; background-color: #f5f5f5; }
        .ig-overlay { position: absolute; inset: 0; background-color: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 300ms ease; z-index: 2; color: #fff; }
        .ig-card:hover .ig-overlay { opacity: 1; }
        .ig-card:hover .ig-card-img { transform: scale(1.08); }
        .ig-nav-prev, .ig-nav-next { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e0e0e0; background-color: #fff; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease; }
        .ig-nav-prev { left: 8px; }
        .ig-nav-next { right: 8px; }
        .ig-section:hover .ig-nav-prev, .ig-section:hover .ig-nav-next { opacity: 1; }
        .ig-nav-prev:hover, .ig-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }
      `}</style>
    </section>
  );
}
