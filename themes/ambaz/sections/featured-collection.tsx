"use client";

import { useState } from "react";
import type { SectionRenderProps } from "@sellosy/theme";
import type { featuredCollection } from "../manifest";
import { HomeProductCard } from "../src/features/home/components/HomeProductCard";
import { toAmbazProduct } from "../src/lib/adapt";

/** FeaturedCollection Ambaz (features/home/components/FeaturedCollection.tsx) dengan produk toko. */
export function FeaturedCollection({ settings: s, data, editor }: SectionRenderProps<typeof featuredCollection>) {
  const [showMore, setShowMore] = useState(false);
  const products = data.products.map((product) => toAmbazProduct(product));
  if (products.length === 0) return null;
  const initialProducts = products.slice(0, s.initial);
  const extraProducts = products.slice(s.initial);

  return (
    <section {...editor}>
      <div className="container-main">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#222", marginBottom: "10px" }}>{s.title}</h2>
          {s.subtitle && <p style={{ fontSize: "15px", color: "#777" }}>{s.subtitle}</p>}
        </div>

        <div className="fc-grid">
          {initialProducts.map((product, i) => <HomeProductCard key={product.id} product={product} index={i} />)}
          {showMore && extraProducts.map((product, i) => (
            <div key={product.id} style={{ animation: "fcFadeInUp 400ms ease forwards", animationDelay: `${i * 60}ms`, opacity: 0 }}>
              <HomeProductCard product={product} index={i + s.initial} />
            </div>
          ))}
        </div>

        {!showMore && extraProducts.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button onClick={() => setShowMore(true)} className="fc-load-more-btn" style={{ minWidth: "160px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {s.button}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .fc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .fc-grid > * { min-width: 0; }
        @media (min-width: 750px) { .fc-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
        @media (min-width: 992px) { .fc-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; } }
        .fc-load-more-btn { display: inline-block; padding: 12px 36px; font-size: 15px; font-weight: 500; color: #222; border: 1.5px solid #222; border-radius: 40px; text-decoration: none; background: none; cursor: pointer; transition: background-color 250ms ease, color 250ms ease; }
        .fc-load-more-btn:hover { background-color: #222; color: #fff; }
        @keyframes fcFadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}
