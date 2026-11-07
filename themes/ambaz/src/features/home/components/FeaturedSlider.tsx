'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useProducts, type ProductsParams } from '../../products/hooks/useProducts';
import { HomeProductCard } from './HomeProductCard';

import 'swiper/css';

/* ── Nav Icons (same as Categories) ── */

function IconArrowLeftS({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z" />
    </svg>
  );
}

function IconArrowRightS({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z" />
    </svg>
  );
}

/* ── Component ── */

/** Theme + layout overrides passed through to each HomeProductCard. */
export interface FeaturedCardTheme {
  showCountdown?: boolean;
  showScrollText?: boolean;
  imageHeight?: string;
  themeColor?: string;
  countdownBg?: string;
  /** Force the compact (mobile-style) layout at every breakpoint. */
  compact?: boolean;
}

interface FeaturedSliderProps {
  /** Produk toko yang ditampilkan (platform): urutan/kategori, mis. { sort: 'best-selling' }. */
  query?: ProductsParams;
  /** Lewati produk ini (mis. produk yang sedang dibuka). */
  excludeId?: string;
  /** Base href for product detail links. */
  productHrefBase?: string;
  /** Optional card theming for non-fashion storefronts (pet-food etc.). */
  cardTheme?: FeaturedCardTheme;
  /** Section heading. Default: 'Featured Collection'. */
  title?: string;
  /** Cap the number of slides shown. Default: no cap (existing behavior —
   *  up to 12 products). Pass e.g. 6 for a smaller catalog storefront. */
  count?: number;
}

export function FeaturedSlider({ query, excludeId, productHrefBase, cardTheme, title = 'Featured Collection', count }: FeaturedSliderProps = {}) {
  const { data, isLoading } = useProducts(query);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const all = data?.products ?? [];
  // Fashion catalog has >27 items — prefer the tail so the slider shows different
  // products than the grid above. Catalogs too small for a full tail slice
  // (pet-food, nutrition, megastore's 16 items, etc.) fall back to the first
  // 12 so the slider isn't empty or, worse, left with just 1-7 leftover items.
  // Demo Ambaz mengambil ekor katalognya; di toko cukup 12 produk pertama dari urutan yang diminta.
  const basePool = all.filter((product) => product.id !== excludeId).slice(0, 12);
  const products = count ? basePool.slice(0, count) : basePool;
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="fs-section">
      <div className="container-main">
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, color: '#222' }}>{title}</h2>
        </div>

        {/* Slider */}
        <div style={{ position: 'relative' }}>
          {products.length > 0 ? (
            <Swiper
              modules={[Navigation]}
              onSwiper={setSwiperInstance}
              slidesPerView={2}
              breakpoints={{
                750: { slidesPerView: 3 },
                992: { slidesPerView: 4 },
              }}
              spaceBetween={24}
              loop={products.length > 4}
              speed={600}
              style={{ overflow: 'hidden' }}
            >
              {products.map((product, i) => (
                <SwiperSlide key={product.id}>
                  <HomeProductCard
                    product={product}
                    index={i + 15}
                    hrefBase={productHrefBase}
                    {...cardTheme}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="animate-shimmer" style={{ aspectRatio: '3/4', borderRadius: '4px', marginBottom: '14px' }} />
                  <div className="animate-shimmer" style={{ height: '16px', width: '70%', margin: '0 auto 8px', borderRadius: '4px' }} />
                  <div className="animate-shimmer" style={{ height: '14px', width: '40%', margin: '0 auto', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Nav arrows — same style as Categories, hidden by default */}
          <button onClick={() => swiperInstance?.slidePrev()} aria-label="Previous" className="fs-nav-prev">
            <IconArrowLeftS size={20} />
          </button>
          <button onClick={() => swiperInstance?.slideNext()} aria-label="Next" className="fs-nav-next">
            <IconArrowRightS size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .fs-nav-prev,
        .fs-nav-next {
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid #e0e0e0;
          background-color: #fff;
          color: #222;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 400ms ease, transform 400ms ease, background-color 250ms ease, border-color 250ms ease, color 250ms ease;
        }
        .fs-nav-prev { left: 8px; transform: translateY(-50%); }
        .fs-nav-next { right: 8px; transform: translateY(-50%); }

        .fs-section:hover .fs-nav-prev { opacity: 1; }
        .fs-section:hover .fs-nav-next { opacity: 1; }

        .fs-nav-prev:hover,
        .fs-nav-next:hover { background-color: #000; border-color: #000; color: #fff; }

        @media (min-width: 992px) and (max-width: 1199px) {
          .fs-section .fc-card > a:first-child {
            height: clamp(300px, 28vw, 360px);
            aspect-ratio: auto;
          }
        }

        /* Hide nav arrows on mobile — swipe is the primary interaction there,
           and the hover state that reveals the buttons doesn't exist on touch. */
        @media (max-width: 749px) {
          .fs-nav-prev,
          .fs-nav-next { display: none !important; }
        }
      `}</style>
    </section>
  );
}
