"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { heroSlider } from "../manifest";
import { IconArrowRight, IconArrowRightS } from "./icons";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

/** HeroSlider Ambaz (features/home/components/HeroSlider.tsx): slide dari block, isi demo sebagai default. */
export function HeroSlider({ blocks, editor }: SectionRenderProps<typeof heroSlider>) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const slides = blocks.filter((block) => block.settings.image);

  if (slides.length === 0) return null;

  return (
    <section {...editor} className="hero-slider-section" style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <Swiper
        modules={[Navigation, Pagination, EffectFade]}
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
          setAnimKey((key) => key + 1);
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={slides.length > 1}
        speed={800}
        slidesPerView={1}
        style={{ width: "100%", height: "730px" }}
      >
        {slides.map(({ id, settings: slide }, i) => (
          <SwiperSlide key={id}>
            <div className="hero-slide-wrap">
              <div className="hero-slide-img-wrap">
                <Image
                  src={slide.image!.url}
                  alt={slide.image!.alt || slide.title.replace("\n", " ")}
                  fill
                  unoptimized
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>

              <div className="hero-slide-content container-main">
                <div
                  key={`content-${animKey}-${i}`}
                  className="hero-slide-text"
                  style={{
                    animation: activeIndex === i ? "heroFadeInDown 800ms ease-out forwards" : "none",
                    opacity: activeIndex === i ? 1 : 0,
                  }}
                >
                  {slide.title && <h2 className="hero-slide-title">{slide.title}</h2>}
                  {slide.subtitle && <p className="hero-slide-subtitle">{slide.subtitle}</p>}
                  {slide.button && slide.link && (
                    <SectionLink href={slide.link.href} className="hero-slide-cta">
                      {slide.button}
                      <IconArrowRight size={14} />
                    </SectionLink>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {slides.length > 1 && (
        <>
          <button onClick={() => swiperInstance?.slidePrev()} aria-label="Slide sebelumnya" className="hero-nav-prev">
            <IconArrowRightS size={24} />
          </button>
          <button onClick={() => swiperInstance?.slideNext()} aria-label="Slide berikutnya" className="hero-nav-next">
            <IconArrowRightS size={24} />
          </button>

          <div className="hero-dots">
            {slides.map(({ id }, i) => (
              <button
                key={id}
                onClick={() => swiperInstance?.slideToLoop(i)}
                aria-label={`Ke slide ${i + 1}`}
                className="hero-dot"
                data-active={activeIndex === i || undefined}
              >
                <span />
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes heroFadeInDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate3d(0, -22px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .swiper-slide-active .hero-slide-text > * {
          animation-name: fadeInDown;
          animation-duration: 1.2s;
          animation-fill-mode: both;
        }
        .swiper-slide-active .hero-slide-text > .hero-slide-title {
          animation-delay: 0.6s;
        }
        .hero-slide-wrap {
          position: relative;
          width: 100%;
          height: 730px;
          background-color: #f5f0eb;
          overflow: hidden;
        }
        .hero-slide-img-wrap { position: absolute; inset: 0; }
        .hero-slide-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          z-index: 2;
        }
        .hero-slide-text { max-width: 520px; }
        .hero-slide-title {
          font-size: 50px;
          font-weight: 700;
          color: #222;
          line-height: 1.2;
          margin-bottom: 16px;
          white-space: pre-line;
        }
        .hero-slide-subtitle {
          font-size: 20px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .hero-slide-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #000;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          padding: 14px 28px;
          border-radius: 40px;
          text-decoration: none;
          transition: background-color 200ms ease;
        }
        .hero-slide-cta:hover { background-color: #fc5732; }
        .hero-dots {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }
        .hero-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
          transition: all 300ms ease;
        }
        .hero-dot span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #bbb;
          display: block;
          transition: all 300ms ease;
        }
        .hero-dot[data-active] { width: 18px; height: 18px; border: 1.5px solid #222; }
        .hero-dot[data-active] span { width: 8px; height: 8px; background-color: #222; }

        @media (max-width: 749px) {
          .hero-slider-section .swiper {
            height: calc(clamp(240px, 58vw, 420px) + 260px) !important;
          }
          .hero-slider-section .swiper-wrapper,
          .hero-slider-section .swiper-slide { height: 100% !important; }
          .hero-slide-wrap {
            height: 100%;
            overflow: visible;
            display: flex;
            flex-direction: column;
          }
          .hero-slide-img-wrap {
            position: relative;
            inset: auto;
            width: 100%;
            height: clamp(240px, 58vw, 420px);
            flex-shrink: 0;
            overflow: hidden;
          }
          .hero-slide-content {
            position: static;
            width: 100%;
            flex: 1;
            padding-top: 24px;
            padding-bottom: 56px;
            align-items: flex-start;
            justify-content: center;
            z-index: auto;
          }
          .hero-slide-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 100%;
            width: 100%;
          }
          .hero-slide-title {
            font-size: clamp(22px, 5.5vw, 32px);
            margin-bottom: clamp(10px, 2.5vw, 16px);
            text-align: center;
          }
          .hero-slide-subtitle {
            font-size: clamp(13px, 3.2vw, 15px);
            margin-bottom: clamp(16px, 4vw, 22px);
            text-align: center;
          }
          .hero-nav-prev, .hero-nav-next { display: none !important; }
        }

        .hero-nav-prev, .hero-nav-next {
          position: absolute;
          top: 50%;
          z-index: 10;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 400ms ease, opacity 400ms ease, background-color 250ms ease;
          opacity: 0;
          font-size: 24px;
        }
        .hero-nav-prev {
          left: 40px;
          transform: translateY(-50%) translateX(-50px) rotate(180deg);
          background-color: rgba(0, 0, 0, 0.35);
        }
        .hero-nav-next {
          right: 40px;
          transform: translateY(-50%) translateX(50px);
          background-color: #000;
        }
        .hero-slider-section:hover .hero-nav-prev {
          opacity: 1;
          transform: translateY(-50%) translateX(0) rotate(180deg);
        }
        .hero-slider-section:hover .hero-nav-next {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
        .hero-nav-prev:hover, .hero-nav-next:hover { background-color: #fc5732 !important; }
      `}</style>
    </section>
  );
}
