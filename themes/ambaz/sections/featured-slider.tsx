"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { SectionRenderProps } from "@sellosy/theme";
import type { featuredSlider } from "../manifest";
import { HomeProductCard } from "../src/features/home/components/HomeProductCard";
import { toAmbazProduct } from "../src/lib/adapt";
import { IconArrowLeftS, IconArrowRightS } from "./icons";

import "swiper/css";

/** FeaturedSlider Ambaz (features/home/components/FeaturedSlider.tsx) dengan produk toko. */
export function FeaturedSlider({ settings: s, data, editor }: SectionRenderProps<typeof featuredSlider>) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const products = data.products.map((product) => toAmbazProduct(product));
  if (products.length === 0) return null;

  return (
    <section {...editor} className="fs-section">
      <div className="container-main">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#222" }}>{s.title}</h2>
        </div>
        <div style={{ position: "relative" }}>
          <Swiper modules={[Navigation]} onSwiper={setSwiperInstance} slidesPerView={2} breakpoints={{ 750: { slidesPerView: 3 }, 992: { slidesPerView: 4 } }}
            spaceBetween={24} loop={products.length > 4} speed={600} style={{ overflow: "hidden" }}>
            {products.map((product, i) => (
              <SwiperSlide key={product.id}>
                <HomeProductCard product={product} index={i + 15} />
              </SwiperSlide>
            ))}
          </Swiper>
          <button onClick={() => swiperInstance?.slidePrev()} aria-label="Previous" className="fs-nav-prev"><IconArrowLeftS size={20} /></button>
          <button onClick={() => swiperInstance?.slideNext()} aria-label="Next" className="fs-nav-next"><IconArrowRightS size={20} /></button>
        </div>
      </div>
      <style>{`
        .fs-nav-prev, .fs-nav-next { position: absolute; top: 40%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e0e0e0; background-color: #fff; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 400ms ease, transform 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease; }
        .fs-nav-prev { left: 8px; }
        .fs-nav-next { right: 8px; }
        .fs-section:hover .fs-nav-prev, .fs-section:hover .fs-nav-next { opacity: 1; }
        .fs-nav-prev:hover, .fs-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }
        @media (min-width: 992px) and (max-width: 1199px) { .fs-section .fc-card > a:first-child { height: clamp(300px, 28vw, 360px); aspect-ratio: auto; } }
        @media (max-width: 749px) { .fs-nav-prev, .fs-nav-next { display: none !important; } }
      `}</style>
    </section>
  );
}
