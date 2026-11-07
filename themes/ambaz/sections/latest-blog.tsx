"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { SectionRenderProps } from "@sellosy/theme";
import type { latestBlog } from "../manifest";
import { IconArrowLeftS, IconArrowRightS } from "./icons";

import "swiper/css";

/** LatestBlog Ambaz: artikel blog toko yang dipilih di customizer; tanpa artikel, section tidak tampil. */
export function LatestBlog({ settings: s, data, editor }: SectionRenderProps<typeof latestBlog>) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const posts = data.posts;
  if (posts.length === 0) return null;

  return (
    <section {...editor} className="blog-section" style={{ backgroundColor: "#fff" }}>
      <div className="container-main">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#222" }}>{s.title}</h2>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ overflow: "hidden", padding: "8px 0 14px" }}>
            <Swiper modules={[Navigation]} onSwiper={setSwiperInstance} slidesPerView={1} breakpoints={{ 750: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }}
              spaceBetween={24} loop={posts.length > 3} speed={600} style={{ overflow: "visible" }}>
              {posts.map((post) => (
                <SwiperSlide key={post.slug}>
                  <div className="blog-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderRadius: "10px", overflow: "hidden", backgroundColor: "#fff", height: "500px", display: "flex", flexDirection: "column" }}>
                    <Link href={`/blog/${post.slug}`} style={{ display: "block", position: "relative", flex: 1, overflow: "hidden", backgroundColor: "#f5f5f5" }}>
                      {post.cover_image && <Image unoptimized src={post.cover_image} alt={post.title} fill className="blog-card-img" style={{ objectFit: "cover", transition: "transform 500ms ease" }} sizes="(max-width: 749px) 100vw, 33vw" />}
                    </Link>
                    <div style={{ padding: "20px 20px 24px" }}>
                      <Link href={`/blog/${post.slug}`} className="blog-card-title">{post.title}</Link>
                      <div style={{ marginTop: "14px" }}>
                        <Link href={`/blog/${post.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 500, color: "#222" }}>
                          {s.link_label}<IconArrowRightS size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {posts.length > 1 && <>
            <button onClick={() => swiperInstance?.slidePrev()} aria-label="Previous" className="blog-nav-prev"><IconArrowLeftS size={20} /></button>
            <button onClick={() => swiperInstance?.slideNext()} aria-label="Next" className="blog-nav-next"><IconArrowRightS size={20} /></button>
          </>}
        </div>
      </div>
      <style>{`
        .blog-card-title { display: inline; font-size: 24px; font-weight: 600; color: #222; line-height: 1.5; background-image: linear-gradient(#222, #222); background-size: 0% 1.5px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 400ms ease; }
        .blog-card:hover .blog-card-img { transform: scale(1.05); }
        .blog-card:hover .blog-card-title { background-size: 100% 1.5px; }
        .blog-nav-prev, .blog-nav-next { position: absolute; top: 35%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e0e0e0; background-color: #fff; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease; }
        .blog-nav-prev { left: 8px; }
        .blog-nav-next { right: 8px; }
        .blog-section:hover .blog-nav-prev, .blog-section:hover .blog-nav-next { opacity: 1; }
        .blog-nav-prev:hover, .blog-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }
      `}</style>
    </section>
  );
}
