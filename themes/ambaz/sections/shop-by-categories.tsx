"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { categoryUrl, type SectionRenderProps } from "@sellosy/theme";
import type { shopByCategories } from "../manifest";
import { IconArrowLeftS, IconArrowRightLong, IconArrowRightS } from "./icons";

import "swiper/css";

/** ShopByCategories Ambaz: kartu kategori toko (nama dan tautan dari kategori, gambar dari setting atau logo kategori). */
export function ShopByCategories({ settings: s, blocks, editor }: SectionRenderProps<typeof shopByCategories>) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const categories = blocks.map(({ id, settings, data }) => ({
    id,
    label: settings.title || data.category?.name || "",
    caption: settings.caption,
    image: settings.image?.url ?? data.category?.logo ?? null,
    href: data.category ? categoryUrl(data.category.slug) : "/products",
  })).filter((cat) => cat.label);
  if (categories.length === 0) return null;

  return (
    <section {...editor} className="shop-categories-section">
      <div className="container-main">
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#222", marginBottom: "12px" }}>{s.title}</h2>
          {s.subtitle && <p style={{ fontSize: "15px", color: "#777", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>{s.subtitle}</p>}
        </div>
        <div style={{ position: "relative", marginTop: "36px" }}>
          <Swiper modules={[Navigation]} onSwiper={setSwiperInstance} slidesPerView={2} breakpoints={{ 750: { slidesPerView: 3 }, 992: { slidesPerView: 4 } }}
            spaceBetween={24} loop={categories.length > 4} speed={600} style={{ overflow: "hidden" }}>
            {categories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <div style={{ textAlign: "left" }} className="cat-card">
                  <Link href={cat.href} className="cat-card-img-wrap" style={{ display: "block", position: "relative", width: "100%", height: "370px", backgroundColor: "#f5f5f5", overflow: "hidden", marginBottom: "18px", borderRadius: "8px" }}>
                    {cat.image && <Image unoptimized src={cat.image} alt={cat.label} fill className="cat-card-img" style={{ objectFit: "cover", transition: "transform 500ms ease" }} sizes="(max-width: 749px) 50vw, 25vw" />}
                  </Link>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "#222", display: "inline-block" }}>{cat.label}</span>
                      {cat.caption && <p style={{ fontSize: "14px", color: "#888", marginTop: "2px" }}>{cat.caption}</p>}
                    </div>
                    <Link href={cat.href} className="cat-arrow-btn" aria-label={`Shop ${cat.label}`}><IconArrowRightLong size={18} /></Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <button onClick={() => swiperInstance?.slidePrev()} aria-label="Previous categories" className="cat-nav-prev"><IconArrowLeftS size={20} /></button>
          <button onClick={() => swiperInstance?.slideNext()} aria-label="Next categories" className="cat-nav-next"><IconArrowRightS size={20} /></button>
        </div>
      </div>
      <style>{`
        .cat-card-img-wrap:hover .cat-card-img { transform: scale(1.05); }
        .cat-arrow-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background-color 300ms ease; }
        .cat-arrow-btn:hover, .cat-card:hover .cat-arrow-btn { background-color: #fc5732; }
        .cat-nav-prev, .cat-nav-next { position: absolute; top: 40%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e0e0e0; background-color: #fff; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease; }
        .cat-nav-prev { left: 8px; }
        .cat-nav-next { right: 8px; }
        .shop-categories-section:hover .cat-nav-prev, .shop-categories-section:hover .cat-nav-next { opacity: 1; }
        .cat-nav-prev:hover, .cat-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }
      `}</style>
    </section>
  );
}
