"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productUrl, type SectionRenderProps } from "@sellosy/theme";
import type { shopTheLook } from "../manifest";
import { HomeProductCard } from "../src/features/home/components/HomeProductCard";
import { toAmbazProduct } from "../src/lib/adapt";
import type { Product } from "../src/types/product";
import { formatPrice } from "../src/utils/formatPrice";
import { IconArrowLeftS, IconArrowRightS } from "./icons";

function LookbookPin({ top, left, product }: { top: number; left: number; product: Product }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: "absolute", top: `${top}%`, left: `${left}%`, zIndex: 5 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button aria-label={product.name} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
        style={{ width: "28px", height: "28px", borderRadius: "50%", border: "3px solid #fff", backgroundColor: hovered ? "#222" : "rgba(0,0,0,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", transition: "background-color 250ms ease, transform 250ms ease", transform: hovered ? "scale(1.15)" : "scale(1)" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff", display: "block" }} />
      </button>
      <div style={{ position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: `translateX(-50%) translateY(${hovered ? "0" : "6px"})`, backgroundColor: "#fff", borderRadius: "6px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "12px 16px", whiteSpace: "nowrap", opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none", transition: "opacity 250ms ease, transform 250ms ease", zIndex: 10 }}>
        <Link href={productUrl(product.slug)} style={{ textDecoration: "none" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#222", marginBottom: "2px" }}>{product.name}</p>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#F15B41" }}>{formatPrice(product.price)}</p>
        </Link>
      </div>
    </div>
  );
}

/** ShopTheLook Ambaz: kartu produk bergeser di kiri, foto lookbook dengan titik produk di kanan. */
export function ShopTheLook({ settings: s, data, blocks, editor }: SectionRenderProps<typeof shopTheLook>) {
  const allProducts = data.products.map((product) => toAmbazProduct(product));
  const [currentPage, setCurrentPage] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const perPage = 2;
  const totalPages = Math.max(1, Math.ceil(allProducts.length / perPage));
  const visibleProducts = allProducts.slice(currentPage * perPage, currentPage * perPage + perPage);
  // Titik tanpa produk pilihan memakai produk dari daftar, berurutan.
  let next = 0;
  const pins = blocks.map((block) => ({ id: block.id, top: block.settings.top, left: block.settings.left, product: block.data.product ? toAmbazProduct(block.data.product) : allProducts[next++] }))
    .filter((pin): pin is typeof pin & { product: Product } => Boolean(pin.product));

  const goToPage = useCallback((page: number) => { setCurrentPage(page); setAnimKey((k) => k + 1); }, []);
  const goPrev = useCallback(() => { setCurrentPage((p) => (p - 1 + totalPages) % totalPages); setAnimKey((k) => k + 1); }, [totalPages]);
  const goNext = useCallback(() => { setCurrentPage((p) => (p + 1) % totalPages); setAnimKey((k) => k + 1); }, [totalPages]);

  if (allProducts.length === 0 && !s.image) return null;

  return (
    <section {...editor} className="stl-section">
      <div className="container-main">
        <div className="stl-grid" style={{ display: "grid" }}>
          <div>
            <div style={{ textAlign: "left", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: 600, color: "#222" }}>{s.title}</h2>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {visibleProducts.map((product, i) => (
                  <div key={`${product.id}-${animKey}`} className="stl-card-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                    <HomeProductCard product={product} index={currentPage * perPage + i + 8} />
                  </div>
                ))}
              </div>
              {totalPages > 1 && <>
                <button onClick={goPrev} aria-label="Previous" className="stl-nav-prev"><IconArrowLeftS size={20} /></button>
                <button onClick={goNext} aria-label="Next" className="stl-nav-next"><IconArrowRightS size={20} /></button>
              </>}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => goToPage(i)} aria-label={`Page ${i + 1}`}
                    style={{ width: currentPage === i ? "18px" : "10px", height: currentPage === i ? "18px" : "10px", borderRadius: "50%", border: currentPage === i ? "1.5px solid #222" : "none", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", transition: "all 300ms ease" }}>
                    <span style={{ width: currentPage === i ? "8px" : "10px", height: currentPage === i ? "8px" : "10px", borderRadius: "50%", backgroundColor: currentPage === i ? "#222" : "#bbb", display: "block", transition: "all 300ms ease" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="stl-lookbook" style={{ position: "relative", overflow: "hidden", backgroundColor: "#f5f5f5" }}>
            {s.image && <Image unoptimized src={s.image.url} alt={s.image.alt || s.title} fill style={{ objectFit: "cover", objectPosition: "center top" }} sizes="50vw" />}
            {pins.map((pin) => <LookbookPin key={pin.id} top={pin.top} left={pin.left} product={pin.product} />)}
          </div>
        </div>
      </div>
      <style>{`
        .stl-grid { grid-template-columns: 1fr; gap: 32px; }
        .stl-lookbook { height: clamp(360px, 90vw, 600px); }
        @media (min-width: 992px) { .stl-grid { grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; } .stl-lookbook { height: 1000px; } }
        .stl-card-reveal { animation: stlRevealUp 600ms ease-out both; }
        @keyframes stlRevealUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .stl-nav-prev, .stl-nav-next { position: absolute; top: 40%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e0e0e0; background-color: #fff; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease; }
        .stl-nav-prev { left: 8px; }
        .stl-nav-next { right: 8px; }
        .stl-section:hover .stl-nav-prev, .stl-section:hover .stl-nav-next { opacity: 1; }
        .stl-nav-prev:hover, .stl-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }
      `}</style>
    </section>
  );
}
