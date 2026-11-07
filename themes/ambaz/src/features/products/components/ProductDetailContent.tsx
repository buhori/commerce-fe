'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import { RichText, useAddToCart, type Spec } from '@sellosy/theme';
import { useUIStore } from '../../../store/uiStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useCompareStore } from '../../../store/compareStore';
import { useProducts } from '../hooks/useProducts';
import { setUI } from '../../../store/uiStore';
import { formatPrice } from '../../../utils/formatPrice';
import { calculateDiscount } from '../../../utils/calculateDiscount';
import { FeaturedSlider } from '../../home/components/FeaturedSlider';
import { TrustBadges } from '../../../components/shared/TrustBadges';
import { HomeProductCard } from '../../home/components/HomeProductCard';
import type { Product } from '../../../types/product';

/* ══════════════════════════════════
   ICONS
   ══════════════════════════════════ */

function IconBag({ size = 18 }: { size?: number }) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M9 6H15C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6ZM7 6C7 3.23858 9.23858 1 12 1C14.7614 1 17 3.23858 17 6H20C20.5523 6 21 6.44772 21 7V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V7C3 6.44772 3.44772 6 4 6H7ZM5 8V20H19V8H5ZM9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10H17C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10H9Z" /></svg>);
}
function IconChevronDown({ size = 14 }: { size?: number }) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" /></svg>);
}
function IconArrowLeft({ size = 16 }: { size?: number }) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z" /></svg>);
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z" /></svg>);
}

/* ══════════════════════════════════
   IMAGE GALLERY (with thumbnail slider)
   ══════════════════════════════════ */

function ProductGallery({ images, onActiveChange }: { images: { id: string; src: string; alt: string }[]; onActiveChange?: (index: number) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [mainHeight, setMainHeight] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const lightboxSwiperRef = useRef<SwiperType | null>(null);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const mainWrapRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleThumbClick = (index: number) => {
    setActiveIndex(index);
    onActiveChange?.(index);
    swiperRef.current?.slideTo(index);
  };

  const handleThumbScroll = (direction: 'prev' | 'next') => {
    if (!thumbContainerRef.current) return;
    const amount = thumbContainerRef.current.clientWidth * 0.7;
    thumbContainerRef.current.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  // Measure main image height for thumbnail container
  useEffect(() => {
    const el = mainWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setMainHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll thumbnails to keep active one visible
  useEffect(() => {
    if (!thumbContainerRef.current) return;
    const activeThumb = thumbContainerRef.current.children[activeIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setZooming(false);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const lightboxPrev = () => {
    const newIdx = (lightboxIndex - 1 + images.length) % images.length;
    setLightboxIndex(newIdx);
    lightboxSwiperRef.current?.slideTo(newIdx);
  };

  const lightboxNext = () => {
    const newIdx = (lightboxIndex + 1) % images.length;
    setLightboxIndex(newIdx);
    lightboxSwiperRef.current?.slideTo(newIdx);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="pdp-gallery-flex">
      {/* Thumbnails — vertical desktop, horizontal mobile (≤749) */}
      {images.length > 1 && (
        <div className="pdp-thumb-wrap">
          {/* Mobile-only horizontal scroll arrows (hidden ≥750 via CSS) */}
          <button
            type="button"
            aria-label="Previous thumbnails"
            className="pdp-thumb-arrow pdp-thumb-arrow-prev"
            onClick={() => handleThumbScroll('prev')}
          >
            <IconArrowLeft size={14} />
          </button>
          <div
            ref={thumbContainerRef}
            className="pdp-thumb-vertical"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: mainHeight > 0 ? `${mainHeight}px` : '700px', overflowY: 'auto' }}
          >
            {images.map((img, i) => (
              <button key={img.id} onClick={() => handleThumbClick(i)} className="pdp-thumb-btn" style={{
                position: 'relative', width: '100%', aspectRatio: '3 / 4',
                overflow: 'hidden', flexShrink: 0,
                border: activeIndex === i ? '2px solid #222' : '2px solid transparent',
                cursor: 'pointer', backgroundColor: '#f5f5f5', padding: 0,
                transition: 'border-color 200ms ease',
              }}>
                <Image unoptimized src={img.src} alt={img.alt} fill style={{ objectFit: 'cover' }} sizes="(max-width: 749px) 100px, 90px" />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next thumbnails"
            className="pdp-thumb-arrow pdp-thumb-arrow-next"
            onClick={() => handleThumbScroll('next')}
          >
            <IconArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Main Image Swiper + Zoom Panel */}
      <div className="pdp-main-col">
        {/* Aspect ratio wrapper — gives Swiper a real height (overridden to explicit height ≤749) */}
        <div
          ref={mainWrapRef}
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={handleMouseMove}
          className="pdp-main-image-wrap"
          style={{ position: 'relative', width: '100%', backgroundColor: '#f5f5f5', overflow: 'hidden', cursor: zooming ? 'crosshair' : 'default' }}
        >
          {/* Invisible spacer to establish 3:4 aspect ratio (collapses to 0 ≤749) */}
          <div className="pdp-main-image-spacer" style={{ width: '100%', paddingBottom: '133.33%' }} />

          {/* Swiper fills spacer via absolute positioning */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: '.pdp-swiper-prev',
                nextEl: '.pdp-swiper-next',
              }}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              onSlideChange={(swiper) => { setActiveIndex(swiper.activeIndex); onActiveChange?.(swiper.activeIndex); }}
              className="pdp-gallery-swiper"
              style={{ width: '100%', height: '100%' }}
              speed={400}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={img.id} style={{ width: '100%', height: '100%' }}>
                  <img
                    src={img.src} alt={img.alt}
                    onClick={() => openLightbox(idx)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Navigation Arrows — stop zoom on hover */}
          <button className="pdp-swiper-prev pdp-swiper-arrow" aria-label="Previous image"
            onMouseEnter={() => setZooming(false)} onMouseLeave={() => setZooming(true)}>
            <IconArrowLeft size={16} />
          </button>
          <button className="pdp-swiper-next pdp-swiper-arrow" aria-label="Next image"
            onMouseEnter={() => setZooming(false)} onMouseLeave={() => setZooming(true)}>
            <IconArrowRight size={16} />
          </button>

          {/* Hover lens indicator (hidden ≤749) */}
          {zooming && (
            <div className="pdp-zoom-lens" style={{
              position: 'absolute', width: '120px', height: '120px',
              border: '1.5px solid rgba(0,0,0,0.15)', backgroundColor: 'rgba(255,255,255,0.2)',
              pointerEvents: 'none', zIndex: 10,
              left: `clamp(0px, calc(${zoomPos.x}% - 60px), calc(100% - 120px))`,
              top: `clamp(0px, calc(${zoomPos.y}% - 60px), calc(100% - 120px))`,
            }} />
          )}
        </div>

        {/* Zoom Panel — absolute inside the main image column, confined to its bounds (hidden ≤749) */}
        {zooming && images[activeIndex] && (
          <div className="pdp-zoom-panel" style={{
            position: 'absolute',
            top: 0,
            left: 'calc(100% + 30px)',
            width: '520px',
            height: `${Math.min(520, mainHeight)}px`,
            backgroundColor: '#fff', overflow: 'hidden', zIndex: 9999,
            border: '1px solid #e5e5e5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: '100%', height: '520px',
              /* Quote the URL so paths with spaces (e.g. "/grocery shop img/...") stay intact */
              backgroundImage: `url("${encodeURI(images[activeIndex].src)}")`,
              backgroundSize: '250%',
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: 'no-repeat',
            }} />
          </div>
        )}
      </div>

      {/* ══ LIGHTBOX — rendered via portal to document.body ══ */}
      {lightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pdpLightboxIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Counter — top left */}
          <span style={{ position: 'absolute', top: '18px', left: '24px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500, zIndex: 10 }}>
            {lightboxIndex + 1} / {images.length}
          </span>

          {/* Close — top right */}
          <button onClick={closeLightbox} className="pdp-lightbox-close" style={{ position: 'absolute', top: '14px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '8px', display: 'flex', zIndex: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>

          {/* Prev arrow */}
          <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); }} className="pdp-lightbox-arrow" style={{
            position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer',
            transition: 'background-color 200ms ease',
          }}>
            <IconArrowLeft size={22} />
          </button>

          {/* Next arrow */}
          <button onClick={(e) => { e.stopPropagation(); lightboxNext(); }} className="pdp-lightbox-arrow" style={{
            position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer',
            transition: 'background-color 200ms ease',
          }}>
            <IconArrowRight size={22} />
          </button>

          {/* Center — Main image, full height */}
          <img
            key={images[lightboxIndex]?.id}
            src={images[lightboxIndex]?.src || ''}
            alt={images[lightboxIndex]?.alt || ''}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'calc(100vw - 140px)', maxHeight: 'calc(100vh - 40px)',
              objectFit: 'contain', display: 'block',
              animation: 'pdpLightboxFade 250ms ease',
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

/* ══════════════════════════════════
   ACCORDION (general — FAQ, Reviews etc.)
   ══════════════════════════════════ */


/* ══════════════════════════════════
   PRODUCT INFO ACCORDION (right panel — Description, Shipping, Returns)
   ══════════════════════════════════ */

function ProductInfoAccordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  const [openIndex, setOpenIndex] = useState(0); // first open by default
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} style={{ borderTop: i === 0 ? '1px solid #e5e5e5' : 'none', borderBottom: '1px solid #e5e5e5' }}>
            <button
              onClick={() => toggle(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '20px 0', fontSize: '20px', fontWeight: 600,
                color: '#222', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {item.title}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
                <svg aria-hidden="true" focusable="false" role="presentation" viewBox="0 0 10 6" width="12" height="12">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor" />
                </svg>
              </span>
            </button>
            <div
              ref={(el) => { contentRefs.current[i] = el; }}
              style={{
                maxHeight: isOpen ? `${contentRefs.current[i]?.scrollHeight || 1000}px` : '0',
                overflow: 'hidden',
                transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div style={{ paddingBottom: '22px', fontSize: '15px', color: '#555', lineHeight: 1.7 }}>
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════
   FAQ ACCORDION (product page — 50/50 layout)
   ══════════════════════════════════ */


/* ══════════════════════════════════
   PAIRS WELL WITH SLIDER
   ══════════════════════════════════ */

function PairsWellWith({ products, productHrefBase = '/products' }: { products: Product[]; productHrefBase?: string }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const { openQuickView } = useUIStore();
  // Chunk products into slides of 3 — 3 rows visible at a time
  const chunkSize = 3;
  const slides: Product[][] = [];
  for (let i = 0; i < products.length; i += chunkSize) {
    slides.push(products.slice(i, i + chunkSize));
  }
  const totalDots = slides.length;

  return (
    <div className="pdp-pairs-section" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '24px' }}>
      <h3 className="pdp-pairs-title" style={{ fontSize: '18px', fontWeight: 600, color: '#222', marginBottom: '16px' }}>Pairs well with</h3>

      {/* Slider — CSS transform horizontal slide like hero */}
      <div className="pdp-pairs-track-wrap" style={{ overflow: 'hidden' }}>
        <div className="pdp-pairs-track" style={{ display: 'flex', transition: 'transform 500ms ease', transform: `translateX(-${activeSlide * 100}%)` }}>
          {slides.map((group, gi) => (
            <div key={gi} className="pdp-pairs-slide" style={{ flex: '0 0 100%', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {group.map((p) => (
                <div key={p.id} className="pdp-pairs-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Link href={`${productHrefBase}/${p.slug}`} style={{ width: '70px', height: '85px', position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5', flexShrink: 0, display: 'block' }}>
                    <Image unoptimized src={p.images[0]?.src || ''} alt={p.name} fill style={{ objectFit: 'cover' }} sizes="70px" />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`${productHrefBase}/${p.slug}`} style={{ fontSize: '15px', fontWeight: 600, color: '#222', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                      {p.name}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.compareAtPrice && <span style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(p.compareAtPrice)}</span>}
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#222' }}>{formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openQuickView(p)}
                    className="pdp-pairs-quick-add"
                    style={{
                      padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                      color: '#222', backgroundColor: '#fff',
                      border: '1.5px solid #222', cursor: 'pointer',
                      transition: 'all 200ms ease', flexShrink: 0,
                    }}
                  >
                    Quick Add
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero-style pagination — exactly 2 dots */}
      {totalDots > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)} aria-label={`Slide ${i + 1}`} style={{
              width: activeSlide === i ? '18px' : '10px', height: activeSlide === i ? '18px' : '10px',
              borderRadius: '50%', border: activeSlide === i ? '1.5px solid #222' : 'none',
              backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, cursor: 'pointer', transition: 'all 300ms ease',
            }}>
              <span style={{ width: activeSlide === i ? '8px' : '10px', height: activeSlide === i ? '8px' : '10px', borderRadius: '50%', backgroundColor: activeSlide === i ? '#222' : '#bbb', display: 'block', transition: 'all 300ms ease' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════ */

interface ProductDetailContentProps {
  /** Produk toko dalam bentuk Product Ambaz (lib/adapt). */
  product: Product;
  /** Opsi beli untuk useAddToCart platform (varian, stok, harga, pre-order, WhatsApp). */
  purchase: Parameters<typeof useAddToCart>[0];
  /** Ringkasan deskripsi (teks biasa) di bawah harga; deskripsi lengkap (HTML) ada di akordeon. */
  excerpt: string;
  /** Spesifikasi produk dari panel (berat, ukuran, dll.). */
  specs: Spec[];
  /** Kategori pertama produk, untuk produk terkait. */
  categoryId: number | null;
  /** Base href for related product cards. Default: "/products". */
  productHrefBase?: string;
}

/**
 * Halaman produk Ambaz (features/products/components/ProductDetailContent.tsx) dengan produk toko. Pembelian lewat
 * useAddToCart platform (varian, stok, pre-order, perawatan toko, WhatsApp); bagian demo Ambaz yang tidak punya data
 * di toko (panduan ukuran, formulir tanya, FAQ, ulasan contoh, teks kebijakan) tidak ikut. Ulasan asli dipasang
 * platform di bawah halaman.
 */
export function ProductDetailContent({
  product,
  purchase,
  excerpt,
  specs,
  categoryId,
  productHrefBase = '/products',
}: ProductDetailContentProps) {
  const related = useProducts(categoryId ? { category: categoryId } : { sort: 'best-selling' });
  const relatedData = { products: related.data.products.filter((p) => p.id !== product.id) };
  const cart = useAddToCart(purchase);
  const { toggleItem: toggleWishlist, isInWishlist, available: wishlistAvailable } = useWishlistStore();
  const { toggleItem: toggleCompare, isInCompare } = useCompareStore();

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const quantity = cart.quantity;
  const setQuantity = cart.changeQuantity;
  const addingToCart = cart.activeAction === 'cart';
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [stickyCartVisible, setStickyCartVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const footerObserverRef = useRef<IntersectionObserver | null>(null);

  // Ambaz memilih warna pertama sejak awal; varian platform dipilih bersamaan (yang masih tersedia lebih dulu).
  const selectColor = useCallback((name: string) => {
    setSelectedColor(name);
    const variant = product.variants.find((v) => v.color === name);
    if (variant) cart.selectVariant(Number(variant.id));
  }, [product.variants, cart]);
  const firstColor = (product.variants.find((v) => v.available) ?? product.variants[0])?.color ?? '';
  useEffect(() => {
    if (firstColor && !cart.selectedVariant) selectColor(firstColor);
  }, [firstColor]); // eslint-disable-line react-hooks/exhaustive-deps -- sekali per produk

  // Berhasil masuk keranjang: Ambaz membuka laci keranjang.
  useEffect(() => {
    if (cart.feedback?.added) setUI({ cartDrawerOpen: true });
  }, [cart.feedback]);

  // Hide sticky bar as soon as the footer enters the viewport
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footer);
    footerObserverRef.current = observer;
    return () => observer.disconnect();
  }, []);

  // Sticky cart: callback ref to observe Add to Cart section
  const addToCartCallbackRef = useCallback((node: HTMLDivElement | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      addToCartRef.current = node;
      const observer = new IntersectionObserver(
        ([entry]) => setStickyCartVisible(!entry.isIntersecting),
        { threshold: 0 }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  const activeColor = selectedColor || product.colors[0]?.name || '';
  const activeSize = selectedSize || product.sizes[0] || '';
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const buyLabel = cart.soldOut ? 'Sold out' : cart.preorder ? 'Pre-order' : null;
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);
  const relatedProducts = relatedData?.products?.slice(0, 6) || [];

  const handleWishlistClick = () => {
    setWishlistLoading(true);
    setTimeout(() => {
      toggleWishlist({ productId: product.id, name: product.name, price: product.price, compareAtPrice: product.compareAtPrice, image: product.images[0]?.src || '', image2: product.images[1]?.src || '', slug: product.slug, badge: product.badge, colors: product.colors.map(c => ({ name: c.name, value: c.value })), vendor: product.vendor });
      setWishlistLoading(false);
    }, 500);
  };

  const handleCompareClick = () => {
    setCompareLoading(true);
    setTimeout(() => {
      toggleCompare(product);
      setCompareLoading(false);
    }, 500);
  };

  const handleAddToCart = () => { void cart.add('cart'); };
  const handleBuyNow = () => { void cart.add('buy'); };


  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="container-main" style={{ paddingBlock: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#777', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Home</Link>
          <span style={{ color: '#bbb', fontSize: '11px' }}>›</span>
          <span style={{ color: '#222' }}>{product.name}</span>
        </div>
      </div>

      {/* ── Product Section — gallery sticky, info scrolls (stacks ≤749) ── */}
      <div className="container-main pdp-product-section">
        <div className="pdp-product-grid">

          {/* ═══ LEFT: Gallery (sticky on desktop, dropped ≤991) ═══ */}
          <div className="pdp-product-gallery-col">
            <div className="pdp-gallery-sticky">
              <ProductGallery images={product.images} onActiveChange={setActiveGalleryIndex} />
            </div>
          </div>

          {/* ═══ RIGHT: Info (scrolls) ═══ */}
          <div className="pdp-product-info">
            <div>
              {/* Vendor */}
              <p className="pdp-info-vendor" style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{product.vendor}</p>

              {/* Title */}
              <h1 className="pdp-info-title" style={{ fontSize: '32px', fontWeight: 600, color: '#222', marginBottom: '12px' }}>{product.name}</h1>

              {/* Rating */}
              <div className="pdp-info-rating" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                {Array.from({ length: 5 }).map((_, i) => (<span key={i} className="pdp-info-star" style={{ fontSize: '16px', color: i < Math.floor(product.rating) ? '#F5C518' : '#ddd' }}>★</span>))}
                <span className="pdp-info-review-count" style={{ fontSize: '14px', color: '#888' }}>{product.reviewCount} Reviews</span>
              </div>

              {/* Price */}
              <div className="pdp-info-price-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                {cart.originalPriceLabel && <span className="pdp-info-compare-at" style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through' }}>{cart.originalPriceLabel}</span>}
                <span className="pdp-info-price" style={{ fontSize: '24px', fontWeight: 700, color: '#222' }}>{cart.priceLabel}</span>
                {product.badge === 'sale' && <span style={{ backgroundColor: '#F15B41', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '3px' }}>Sale</span>}
                {(cart.discountLabel || discount > 0) && <span style={{ backgroundColor: '#222', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '3px' }}>{cart.discountLabel ?? `-${discount}%`}</span>}
              </div>

              {/* Description */}
              {excerpt && <p className="pdp-info-description" style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, marginBottom: '24px' }}>{excerpt}</p>}

              {/* Color */}
              {product.colors.length > 0 && (
                <div className="pdp-info-color" style={{ marginBottom: '20px' }}>
                  <p className="pdp-info-field-label" style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Variant: <span style={{ fontWeight: 400, color: '#555' }}>{activeColor}</span></p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {product.colors.map((c) => (
                      <button key={c.name} onClick={() => selectColor(c.name)} title={c.name} aria-label={c.name} aria-pressed={activeColor === c.name} disabled={product.variants.find((v) => v.color === c.name)?.available === false && !cart.preorder} className="pdp-info-color-swatch" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c.value, border: activeColor === c.name ? '3px solid #222' : '2px solid #e0e0e0', cursor: 'pointer', transition: 'border-color 200ms ease' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              {product.sizes.length > 0 && (
                <div className="pdp-info-size" style={{ marginBottom: '20px' }}>
                  <p className="pdp-info-field-label" style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Size: <span style={{ fontWeight: 400, color: '#555' }}>{activeSize}</span></p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {product.sizes.map((s) => (
                      <button key={s} onClick={() => setSelectedSize(s)} className="pdp-info-size-btn" style={{ minWidth: '44px', height: '44px', padding: '0 14px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, border: activeSize === s ? '2px solid #222' : '1px solid #e0e0e0', backgroundColor: activeSize === s ? '#222' : '#fff', color: activeSize === s ? '#fff' : '#222', cursor: 'pointer', transition: 'all 200ms ease' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart */}
              <div ref={addToCartCallbackRef} className="pdp-info-qty-block" style={{ marginBottom: '16px' }}>
                <p className="pdp-info-field-label" style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Quantity</p>
                <div className="pdp-info-qty-row" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="pdp-qty-stepper" style={{ display: 'inline-flex', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="pdp-qty-step-btn" style={{ width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}>−</button>
                    <span className="pdp-qty-value" style={{ width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 500, borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} disabled={quantity >= cart.max} className="pdp-qty-step-btn" style={{ width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}>+</button>
                  </div>
                  <button onClick={handleAddToCart} disabled={addingToCart || cart.disabled} className="pdp-add-to-cart-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 0', backgroundColor: addingToCart ? '#555' : '#222', color: '#fff', fontSize: '16px', fontWeight: 600, border: 'none', borderRadius: '0', cursor: addingToCart ? 'wait' : 'pointer', transition: 'background-color 250ms ease', opacity: addingToCart ? 0.8 : 1 }}
                    onMouseEnter={(e) => { if (!addingToCart) e.currentTarget.style.backgroundColor = '#F15B41'; }}
                    onMouseLeave={(e) => { if (!addingToCart) e.currentTarget.style.backgroundColor = '#222'; }}
                  >{addingToCart ? 'Adding...' : buyLabel && !cart.preorder ? buyLabel : <><IconBag size={18} /> {cart.preorder ? 'Pre-order' : 'Add to cart'}</>}</button>
                </div>
                {cart.feedback && !cart.feedback.added && <p role="alert" style={{ marginTop: '10px', fontSize: '14px', color: cart.feedback.error ? '#b42318' : '#555' }}>{cart.feedback.message}</p>}
                {cart.checkoutNote && <p role="status" style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>{cart.checkoutNote}</p>}
              </div>

              {/* Buy it now (pre-order: tombol di atas sudah langsung ke checkout pre-order) */}
              {!cart.preorder && <button onClick={handleBuyNow} disabled={cart.disabled || !!cart.checkoutNote || cart.activeAction === 'buy'} className="pdp-buy-now-btn" style={{ width: '100%', padding: '14px 0', backgroundColor: '#fff', color: '#222', fontSize: '16px', fontWeight: 600, border: '1.5px solid #222', borderRadius: '0', cursor: 'pointer', marginBottom: '20px', transition: 'all 250ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#222'; }}
              >{cart.activeAction === 'buy' ? 'Processing...' : 'Buy it now'}</button>}

              {/* Wishlist + Compare */}
              <div className="pdp-info-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                {wishlistAvailable && <button
                  onClick={handleWishlistClick}
                  disabled={wishlistLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: wishlistLoading ? 'wait' : 'pointer', color: inWishlist ? '#F15B41' : '#555', fontSize: '16px', padding: 0, transition: 'color 200ms ease', opacity: wishlistLoading ? 0.5 : 1 }}
                >
                  {wishlistLoading ? (
                    <span className="pdp-btn-spinner" style={{ width: '18px', height: '18px' }} />
                  ) : inWishlist ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18">
                      <path fill="currentColor" d="M417.84 448a15.94 15.94 0 01-11.35-4.72L40.65 75.26a16 16 0 0122.7-22.56l365.83 368a16 16 0 01-11.34 27.3zM364.92 80c-48.09 0-80 29.55-96.92 51-16.88-21.48-48.83-51-96.92-51a107.37 107.37 0 00-31 4.55L168 112c22.26 0 45.81 9 63.94 26.67a123 123 0 0121.75 28.47 16 16 0 0028.6 0 123 123 0 0121.77-28.51C322.19 121 342.66 112 364.92 112c43.15 0 78.62 36.33 79.07 81 .54 53.69-22.75 99.55-57.38 139.52l22.63 22.77c3-3.44 5.7-6.64 8.14-9.6 40-48.75 59.15-98.8 58.61-153C475.37 130.52 425.54 80 364.92 80zM268 432C180.38 372.51 91 297.6 92 193a83.69 83.69 0 012.24-18.39L69 149.14a115.1 115.1 0 00-9 43.49c-.54 54.22 18.63 104.27 58.61 153 18.77 22.87 52.8 59.45 131.39 112.8a31.84 31.84 0 0036 0c20.35-13.81 37.7-26.5 52.58-38.11l-22.66-22.81C300.25 409.6 284.09 421.05 268 432z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18">
                      <path fill="currentColor" d="M462.3 62.7c-54.5-46.4-136-38.7-186.6 13.5L256 96.6l-19.7-20.3C195.5 34.1 113.2 8.7 49.7 62.7c-62.8 53.6-66.1 149.8-9.9 207.8l193.5 199.8c6.2 6.4 14.4 9.7 22.6 9.7 8.2 0 16.4-3.2 22.6-9.7L472 270.5c56.4-58 53.1-154.2-9.7-207.8zm-13.1 185.6L256.4 448.1 62.8 248.3c-38.4-39.6-46.4-115.1 7.7-161.2 54.8-46.8 119.2-12.9 142.8 11.5l42.7 44.1 42.7-44.1c23.2-24 88.2-58 142.8-11.5 54 46 46.1 121.5 7.7 161.2z" />
                    </svg>
                  )}
                  {wishlistLoading ? 'Loading...' : inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>}
                <button
                  onClick={handleCompareClick}
                  disabled={compareLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: compareLoading ? 'wait' : 'pointer', color: inCompare ? '#F15B41' : '#555', fontSize: '16px', padding: 0, transition: 'color 200ms ease', opacity: compareLoading ? 0.5 : 1 }}
                >
                  {compareLoading ? (
                    <span className="pdp-btn-spinner" style={{ width: '18px', height: '18px' }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <line x1="17" y1="3" x2="17" y2="21" />
                      <path d="M10 18l-3 3l-3 -3" />
                      <line x1="7" y1="21" x2="7" y2="3" />
                      <path d="M20 6l-3 -3l-3 3" />
                    </svg>
                  )}
                  {compareLoading ? 'Loading...' : inCompare ? 'Remove from Compare' : 'Add to Compare'}
                </button>
              </div>

              {/* Share */}
              <div className="pdp-share-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', position: 'relative' }}>
                {/* Facebook */}
                <button
                  onClick={() => { const url = encodeURIComponent(window.location.href); window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400'); }}
                  className="pdp-share-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '14px', padding: 0, transition: 'color 200ms ease' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>
                  Facebook
                </button>

                {/* Twitter / X */}
                <button
                  onClick={() => { const url = encodeURIComponent(window.location.href); const text = encodeURIComponent(product.name); window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400'); }}
                  className="pdp-share-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '14px', padding: 0, transition: 'color 200ms ease' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Twitter
                </button>

                {/* Pinterest */}
                <button
                  onClick={() => { const url = encodeURIComponent(window.location.href); const media = encodeURIComponent(window.location.origin + (product.images[0]?.src || '')); const desc = encodeURIComponent(product.name); window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, '_blank', 'width=600,height=400'); }}
                  className="pdp-share-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '14px', padding: 0, transition: 'color 200ms ease' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 21.54C10 21.83 10.97 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 15.72 3.97 18.97 6.91 20.73C6.81 19.71 6.19 17.15 6.19 17.15L7.85 10.34C7.85 10.34 7.41 9.47 7.41 8.18C7.41 6.15 8.59 4.63 10.06 4.63C11.3 4.63 11.9 5.56 11.9 6.68C11.9 7.94 11.11 9.84 10.69 11.59C10.34 13.06 11.44 14.26 12.89 14.26C15.52 14.26 17.13 10.91 17.13 7.32C17.13 4.46 15.15 2.42 12.08 2.42C8.5 2.42 6.31 5.09 6.31 8.03C6.31 9.13 6.63 9.85 7.16 10.41C7.39 10.67 7.43 10.78 7.35 11.08L7.06 12.23C6.97 12.58 6.72 12.68 6.4 12.54C4.48 11.7 3.54 9.63 3.54 7.74C3.54 4.03 6.52 0.15 12.42 0.15C17.15 0.15 20.28 3.66 20.28 7.42C20.28 12.28 17.46 15.94 13.42 15.94C11.93 15.94 10.53 15.14 10.06 14.23L9.21 17.53C8.93 18.6 8.27 19.94 7.78 20.78C8.81 21.09 9.9 21.26 11.03 21.26" /></svg>
                  Pin it
                </button>

                {/* Share (native) */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href });
                    } else {
                      setShareMenuOpen(!shareMenuOpen);
                    }
                  }}
                  className="pdp-share-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '14px', padding: 0, transition: 'color 200ms ease' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  Share
                </button>

                {/* Share dropdown panel */}
                {shareMenuOpen && (
                  <div
                    className="pdp-share-dropdown"
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 100,
                      backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '20px 24px',
                      width: '320px',
                      animation: 'pdpShareDropIn 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#222' }}>Share link</span>
                      <button onClick={() => setShareMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: '2px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>

                    {/* Product preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f7f7f7', borderRadius: '6px', marginBottom: '18px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#eee' }}>
                        <Image unoptimized src={product.images[0]?.src || ''} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="44px" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name} - {formatPrice(product.price)}</p>
                        <p style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typeof window !== 'undefined' ? window.location.href : ''}</p>
                      </div>
                    </div>

                    {/* Share options label */}
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Share using</p>

                    {/* Share grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { name: 'Nearby Sharing', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>), action: () => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); } },
                        { name: 'WhatsApp', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>), action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(product.name + ' ' + window.location.href)}`, '_blank'); } },
                        { name: 'Phone call', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>), action: () => {} },
                        { name: 'Gmail', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>), action: () => { window.open(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(window.location.href)}`, '_blank'); } },
                        { name: 'Facebook', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>), action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400'); } },
                        { name: 'LinkedIn', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>), action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400'); } },
                        { name: 'Twitter', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="#555"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>), action: () => { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`, '_blank', 'width=600,height=400'); } },
                        { name: 'Copy link', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>), action: () => { navigator.clipboard.writeText(window.location.href); setShareMenuOpen(false); } },
                      ].map((item) => (
                        <button key={item.name} onClick={() => { item.action(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', borderRadius: '8px', transition: 'background-color 150ms ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {item.icon}
                          <span style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap' }}>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pairs Well With — Slider with hero pagination */}
              {relatedProducts.length > 0 && <PairsWellWith products={relatedProducts} productHrefBase={productHrefBase} />}

              {/* ── Ask About This Product: chat WhatsApp toko (platform), bila produk punya nomor chat ── */}
              {(cart.whatsappUrl || cart.whatsappNote) && (
                <div className="pdp-info-links" style={{ borderTop: '1px solid #e5e5e5', marginTop: '24px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '6px' }}>
                  {cart.whatsappUrl ? (
                    <a href={cart.whatsappUrl} target="_blank" rel="noopener noreferrer" className="pdp-info-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#222' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      Ask About This product
                    </a>
                  ) : <p style={{ fontSize: '14px', color: '#777' }}>{cart.whatsappNote}</p>}
                </div>
              )}

              {/* ── Accordion: Description, Shipping and Returns, Return Policies ── */}
              <div className="pdp-info-accordion-wrap" style={{ marginTop: '16px' }}>
                <ProductInfoAccordion items={[
                  ...(product.description ? [{ title: 'Description', content: <RichText html={product.description} /> }] : []),
                  ...(specs.length > 0 ? [{
                    title: 'Specifications',
                    content: (
                      <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 40%) 1fr', gap: '10px 16px' }}>
                        {specs.map((spec) => <div key={spec.label} style={{ display: 'contents' }}><dt style={{ color: '#222', fontWeight: 600 }}>{spec.label}</dt><dd style={{ margin: 0 }}>{spec.value}</dd></div>)}
                      </dl>
                    ),
                  }] : []),
                ]} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── You May Also Like ── */}
      <div className="pdp-related-section">
        <FeaturedSlider
          title="You may also like"
          query={categoryId ? { sort: 'best-selling' } : { sort: 'newest' }}
          excludeId={product.id}
          productHrefBase={productHrefBase}
        />
      </div>

      {/* ── Trust Badges ── */}
      <div className="pdp-trust-section" style={{ marginTop: '80px' }}><TrustBadges /></div>

      {/* ── Recently Viewed (Ambaz) — di toko: produk lain di kategori yang sama; tidak tampil bila tidak ada ── */}
      {categoryId && relatedData.products.length > 0 && <div className="container-main pdp-recently-section">
        <h2 style={{ fontSize: 'clamp(22px, 2.4vw, 28px)', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 'clamp(22px, 2.4vw, 30px)' }}>More from this category</h2>
        {relatedData.products.length > 0 && (
          <div className="pdp-recently-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(14px, 1.8vw, 24px)' }}>
            {relatedData.products.slice(0, 4).map((p, i) => (
              <HomeProductCard key={p.id} product={p} index={i} hrefBase={productHrefBase} />
            ))}
          </div>
        )}
      </div>}

      {/* Mobile spacer — prevents the sticky bar from overlapping the last section / footer */}
      <div className="pdp-sticky-spacer" />

      {/* ── Sticky Bottom Add to Cart Bar ── */}
      <div
        className="pdp-sticky-bar"
        style={{
          position: 'fixed', left: 0, right: 0, zIndex: 9998,
          backgroundColor: '#fff', borderTop: '1px solid #e5e5e5',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
          transform: (stickyCartVisible && !footerVisible) ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="container-main pdp-sticky-inner">
          {/* Product thumbnail + name — shows currently active gallery image */}
          <div className="pdp-sticky-product" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.1vw, 14px)', minWidth: 0 }}>
            <div style={{ width: 'clamp(52px, 6vw, 80px)', height: 'clamp(58px, 7vw, 90px)', overflow: 'hidden', position: 'relative', backgroundColor: '#f5f5f5', flexShrink: 0, borderRadius: '4px' }}>
              <Image unoptimized src={product.images[activeGalleryIndex]?.src || product.images[0]?.src || ''} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 1200px) 70px, 80px" />
            </div>
            <span className="pdp-sticky-name" style={{ fontSize: 'clamp(12px, 1.2vw, 14px)', fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
          </div>

          {/* Variant selector */}
          {product.variants.length > 0 && <select
            className="pdp-sticky-variant"
            value={cart.selectedVariant ? String(cart.selectedVariant.id) : ''}
            onChange={(e) => { const v = product.variants.find((x) => x.id === e.target.value); if (v) selectColor(v.color); }}
            style={{ padding: 'clamp(9px, 1vw, 12px) clamp(24px, 2.5vw, 34px) clamp(9px, 1vw, 12px) clamp(12px, 1.3vw, 16px)', fontSize: 'clamp(12px, 1.1vw, 13px)', border: '1px solid #e0e0e0', borderRadius: '6px', color: '#222', backgroundColor: '#fff', maxWidth: '260px' }}
          >
            {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available && !cart.preorder}>{v.color} - {formatPrice(v.price)}</option>)}
          </select>}

          {/* Quantity stepper */}
          <div className="pdp-sticky-qty" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 'clamp(32px, 3.4vw, 40px)', height: 'clamp(38px, 4vw, 46px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(15px, 1.6vw, 18px)', color: '#555' }}>−</button>
            <span style={{ width: 'clamp(30px, 3vw, 36px)', height: 'clamp(38px, 4vw, 46px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(12px, 1.2vw, 14px)', fontWeight: 500, borderLeft: '1px solid #e0e0e0', borderRight: '1px solid #e0e0e0', color: '#222' }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} disabled={quantity >= cart.max} style={{ width: 'clamp(32px, 3.4vw, 40px)', height: 'clamp(38px, 4vw, 46px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(15px, 1.6vw, 18px)', color: '#555' }}>+</button>
          </div>

          {/* Add to Cart */}
          <button className="pdp-sticky-atc" onClick={handleAddToCart} disabled={addingToCart || cart.disabled} style={{ backgroundColor: addingToCart ? '#555' : '#222', color: '#fff', fontSize: 'clamp(12px, 1.2vw, 14px)', fontWeight: 600, border: 'none', cursor: addingToCart ? 'wait' : 'pointer', transition: 'background-color 200ms ease', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { if (!addingToCart) e.currentTarget.style.backgroundColor = '#F15B41'; }}
            onMouseLeave={(e) => { if (!addingToCart) e.currentTarget.style.backgroundColor = '#222'; }}
          >{addingToCart ? 'Adding...' : buyLabel ?? 'Add to cart'}</button>

          {/* Buy it now */}
          {!cart.preorder && <button className="pdp-sticky-buy" onClick={handleBuyNow} disabled={cart.disabled || !!cart.checkoutNote} style={{ backgroundColor: '#fff', color: '#222', fontSize: 'clamp(12px, 1.2vw, 14px)', fontWeight: 600, border: '1.5px solid #222', cursor: 'pointer', transition: 'all 200ms ease', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#222'; }}
          >Buy it now</button>}
        </div>
      </div>

      {/* ── Gallery styles ── */}
      <style>{`
        /* Recently Viewed: 3-up at the 992–1199 breakpoint so each card
           has more breathing room than the compressed 4-up layout. */
        @media (min-width: 992px) and (max-width: 1199px) {
          .pdp-recently-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }

        .pdp-thumb-vertical::-webkit-scrollbar { width: 0; display: none; }
        .pdp-thumb-vertical { scrollbar-width: none; }

        .pdp-swiper-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
          width: 36px; height: 36px; border-radius: 0; border: 1px solid #e0e0e0;
          background: #fff; color: #222; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: background-color 200ms ease, color 200ms ease, opacity 200ms ease;
        }
        .pdp-swiper-arrow:hover { background: #222; color: #fff; border-color: #222; }
        .pdp-swiper-arrow.swiper-button-disabled { opacity: 0.3; cursor: default; }
        .pdp-swiper-arrow.swiper-button-disabled:hover { background: #fff; color: #222; border-color: #e0e0e0; }
        .pdp-swiper-prev { left: 16px; }
        .pdp-swiper-next { right: 16px; }

        /* Hide default Swiper navigation */
        .swiper-button-next, .swiper-button-prev { display: none !important; }

        /* Ensure Swiper slides fill the container height */
        .pdp-gallery-swiper, .pdp-gallery-swiper .swiper-wrapper, .pdp-gallery-swiper .swiper-slide {
          height: 100% !important;
        }

        /* Info links hover */
        .pdp-info-link:hover {
          color: #F15B41 !important;
        }

        /* Pairs well with Quick Add button */
        .pdp-pairs-quick-add:hover {
          background-color: #222 !important;
          color: #fff !important;
        }

        /* Lightbox */
        @keyframes pdpLightboxIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pdpLightboxFade {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .pdp-lightbox-arrow:hover {
          background: rgba(255,255,255,0.25) !important;
        }
        .pdp-lightbox-close:hover {
          opacity: 0.6;
        }

        /* Ask modal animations */
        @keyframes pdpOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pdpModalSlideDown {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Ask modal input focus */
        .pdp-ask-input:focus {
          border-color: #222 !important;
        }
        .pdp-ask-input::placeholder {
          color: #aaa;
        }

        /* Ask modal send button hover */
        .pdp-ask-send:hover {
          background-color: #F15B41 !important;
        }

        /* Wishlist/Compare loading spinner */
        .pdp-btn-spinner {
          display: inline-block;
          border: 2px solid #ddd;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: pdpSpinBtn 500ms linear infinite;
        }
        @keyframes pdpSpinBtn {
          to { transform: rotate(360deg); }
        }

        /* Share buttons — underline text */
        .pdp-share-btn {
          text-decoration: underline !important;
          text-underline-offset: 3px !important;
          text-decoration-color: #ccc !important;
        }
        .pdp-share-btn:hover {
          color: #222 !important;
          text-decoration-color: #222 !important;
        }

        /* Share dropdown animation */
        @keyframes pdpShareDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ══════════════════════════════════
           PRODUCT MAIN SLIDER + CONTENT (top of product detail)
           Resource MD: blueprint/component/product-main-slider.md
           ══════════════════════════════════ */
        /* Base — desktop default (≥992) */
        .pdp-product-section {
          padding-bottom: 80px;
          overflow: visible;
        }
        .pdp-product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px, 3.6vw, 50px);
          align-items: start;
          overflow: visible;
        }
        .pdp-product-gallery-col {
          align-self: stretch;
          overflow: visible;
          z-index: 10;
        }
        .pdp-gallery-sticky {
          position: sticky;
          top: 110px;
        }
        .pdp-product-info {
          position: relative;
          z-index: 1;
        }
        /* Gallery internals (base) */
        .pdp-gallery-flex { display: flex; gap: 16px; }
        .pdp-thumb-wrap { width: 90px; flex-shrink: 0; position: relative; }
        .pdp-main-col { flex: 1; position: relative; }
        /* Mobile thumb arrows hidden by default */
        .pdp-thumb-arrow { display: none; }

        /* 750–991 — TBD (intentionally untouched until spec confirmed) */

        /* ≤991 — stacked layout: image on top, horizontal thumb strip, info below.
           Disables the desktop 50/50 grid + sticky gallery + hover-zoom across
           the entire 320–991 range (per user's "remove that layout adjustment").
           Image height clamps to 700px at viewports ≥749 (per the calc). */
        @media (max-width: 991px) {
          .pdp-product-section {
            padding-bottom: clamp(40px, 8vw, 60px);
            overflow-x: hidden !important;
          }

          /* 1-column grid.
             min-width: 0 on the grid items is critical — without it, a grid
             item's intrinsic min-content width can expand the 1fr track and
             let nested flex children (like the thumb strip with 64×7 thumbs)
             break out of the container. */
          .pdp-product-grid {
            grid-template-columns: 1fr;
            gap: clamp(20px, 5vw, 32px);
            min-width: 0;
          }
          .pdp-product-gallery-col,
          .pdp-product-info {
            min-width: 0 !important;
          }
          /* Drop sticky on mobile so gallery scrolls naturally */
          .pdp-product-gallery-col {
            align-self: auto;
            z-index: auto;
          }
          .pdp-gallery-sticky {
            position: static;
            top: auto;
          }

          /* Reorder: main image on top, thumb strip below
             — DOM order is thumb-wrap then main-col, so column-reverse flips it visually.
             min-width: 0 on the flex items so they don't expand to content min-content. */
          .pdp-gallery-flex {
            flex-direction: column-reverse;
            gap: 12px;
            min-width: 0;
          }

          /* Thumb wrap stretches full-width with horizontal scroll arrows */
          .pdp-thumb-wrap {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            position: relative;
          }
          .pdp-main-col {
            min-width: 0 !important;
            max-width: 100% !important;
          }
          /* Horizontal thumb strip with overflow scroll */
          .pdp-thumb-vertical {
            flex-direction: row !important;
            max-height: none !important;
            overflow-y: hidden !important;
            overflow-x: auto;
            gap: 8px !important;
            padding: 0 36px;
            scroll-behavior: smooth;
          }
          .pdp-thumb-btn {
            width: clamp(70px, 18vw, 100px) !important;
            height: auto !important;
          }
          /* Thumb scroll arrows */
          .pdp-thumb-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1px solid #e0e0e0;
            background: #fff;
            color: #222;
            cursor: pointer;
            z-index: 5;
            padding: 0;
            transition: background-color 180ms ease, color 180ms ease;
          }
          .pdp-thumb-arrow:hover { background: #222; color: #fff; border-color: #222; }
          .pdp-thumb-arrow-prev { left: 0; }
          .pdp-thumb-arrow-next { right: 0; }

          /* Main image: explicit fluid height 400 → 700 across 320 → 749.
             Algebra: 0.7×vw + 176px. Clamped at the ends. */
          .pdp-main-image-wrap {
            height: clamp(400px, calc(70vw + 176px), 700px);
          }
          .pdp-main-image-spacer { padding-bottom: 0 !important; }

          /* Hide hover-zoom artifacts at touch-device sizes */
          .pdp-zoom-lens, .pdp-zoom-panel { display: none !important; }

          /* Swiper arrows on the main image scale slightly down */
          .pdp-product-gallery-col .pdp-swiper-arrow {
            width: 32px;
            height: 32px;
          }

          /* Info column — fluid scale-down via clamp().
             All clamps tuned so they hit roughly:
              320vw → mobile-min  /  749vw → desktop value */
          .pdp-info-vendor {
            font-size: clamp(11px, 3.1vw, 12px) !important;
            letter-spacing: 1.2px !important;
            margin-bottom: 8px !important;
          }
          .pdp-info-title {
            font-size: clamp(22px, 6vw, 28px) !important;
            margin-bottom: 16px !important;
          }
          .pdp-info-rating { gap: 4px !important; margin-bottom: 20px !important; }
          .pdp-info-star { font-size: clamp(14px, 4vw, 16px) !important; }
          .pdp-info-review-count { font-size: clamp(12px, 3.4vw, 14px) !important; }
          .pdp-info-price-row {
            gap: clamp(8px, 2.2vw, 12px) !important;
            margin-bottom: 22px !important;
          }
          .pdp-info-compare-at { font-size: clamp(15px, 4.4vw, 18px) !important; }
          .pdp-info-price { font-size: clamp(20px, 5.4vw, 24px) !important; }
          .pdp-info-description {
            font-size: clamp(13px, 3.6vw, 15px) !important;
            line-height: 1.65 !important;
            margin-bottom: 26px !important;
          }
          .pdp-info-color, .pdp-info-size {
            margin-bottom: 24px !important;
          }
          .pdp-info-field-label {
            font-size: clamp(13px, 3.7vw, 15px) !important;
            margin-bottom: 12px !important;
          }
          .pdp-info-color-swatch {
            width: clamp(26px, 7.2vw, 32px) !important;
            height: clamp(26px, 7.2vw, 32px) !important;
          }
          .pdp-info-size-btn {
            min-width: clamp(38px, 10.8vw, 44px) !important;
            height: clamp(38px, 10.8vw, 44px) !important;
            padding: 0 clamp(10px, 3vw, 14px) !important;
            font-size: clamp(13px, 3.6vw, 14px) !important;
          }

          /* Quantity row — pill stepper + pill add-to-cart */
          .pdp-info-qty-block { margin-bottom: 20px !important; }
          .pdp-info-qty-row { gap: clamp(10px, 2.8vw, 14px) !important; }
          .pdp-qty-stepper {
            border-radius: 999px !important;
          }
          .pdp-qty-step-btn {
            width: clamp(36px, 9.6vw, 40px) !important;
            height: clamp(40px, 11vw, 44px) !important;
            font-size: clamp(16px, 4.4vw, 18px) !important;
          }
          .pdp-qty-value {
            width: clamp(36px, 9.6vw, 40px) !important;
            height: clamp(40px, 11vw, 44px) !important;
            font-size: clamp(13px, 3.6vw, 15px) !important;
          }
          .pdp-add-to-cart-btn {
            border-radius: 999px !important;
            padding: clamp(12px, 3.2vw, 14px) 0 !important;
            font-size: clamp(14px, 3.8vw, 16px) !important;
          }
          .pdp-buy-now-btn {
            border-radius: 999px !important;
            padding: clamp(12px, 3.2vw, 14px) 0 !important;
            font-size: clamp(14px, 3.8vw, 16px) !important;
            margin-bottom: 24px !important;
          }

          /* Wishlist + Compare row */
          .pdp-info-actions-row {
            gap: clamp(16px, 4.6vw, 24px) !important;
            margin-bottom: 24px !important;
            flex-wrap: wrap;
          }

          /* Share row */
          .pdp-share-row {
            gap: clamp(14px, 4vw, 20px) !important;
            margin-bottom: 28px !important;
            flex-wrap: wrap;
            row-gap: 12px;
          }

          /* Share dropdown — constrain width so it never overflows the viewport at 320–360vw */
          .pdp-share-dropdown {
            width: min(320px, calc(100vw - 32px)) !important;
            padding: 16px 18px !important;
          }

          /* Bottom info links */
          .pdp-info-links {
            margin-top: 24px !important;
            padding-top: 22px !important;
            gap: 16px !important;
          }

          /* PairsWellWith — hidden entirely across 320–991 per user spec */
          .pdp-pairs-section {
            display: none !important;
          }
        }

        /* ≤749 — narrowest band: show exactly 3 thumbs at a time in the strip,
           sized off viewport so we never overflow the container.
           Math: usable_w = 100vw − 48px (container-main side gutters)
                          − 64px (thumb-vertical arrow padding 32×2)
                          − 16px (two 8px gaps)
                = 100vw − 128px
           Each thumb = usable_w / 3.
           All width / box-sizing / overflow rules are !important so the
           strip can't escape the container regardless of inheritance. */
        @media (max-width: 749px) {
          .pdp-thumb-wrap {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .pdp-thumb-vertical {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 32px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
          .pdp-thumb-btn {
            flex: 0 0 calc((100vw - 128px) / 3) !important;
            width: calc((100vw - 128px) / 3) !important;
            max-width: calc((100vw - 128px) / 3) !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
        }

        /* ══════════════════════════════════
           FAQ SECTION (product detail)
           Resource MD: blueprint/component/faq-section.md
           ══════════════════════════════════ */
        /* Base — fluid clamp() values (max out at ≥1200 desktop default).
           Use padding-block (not the shorthand) so container-main's
           horizontal padding-inline gutters are preserved. */
        .pdp-faq-section {
          padding-block: clamp(48px, 6vw, 80px);
        }
        .pdp-faq-header {
          text-align: center;
          margin-bottom: clamp(28px, 3.5vw, 40px);
        }
        .pdp-faq-title {
          font-size: clamp(22px, 2.4vw, 28px);
          font-weight: 600;
          color: #222;
          margin-bottom: 8px;
        }
        .pdp-faq-subtitle {
          font-size: clamp(13px, 1.2vw, 14px);
          color: #888;
        }
        .pdp-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          align-items: stretch;
        }
        .pdp-faq-left {
          padding-right: clamp(24px, 4vw, 60px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: clamp(560px, 62vw, 750px);
        }
        .pdp-faq-right {
          position: relative;
          height: clamp(560px, 62vw, 750px);
          overflow: hidden;
        }
        /* FaqAccordion (used only here) */
        .pdp-faq-q-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: clamp(16px, 1.8vw, 22px) 0;
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 600;
          color: #222;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: clamp(12px, 1.3vw, 16px);
        }
        .pdp-faq-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          position: relative;
        }
        .pdp-faq-icon { width: 20px; height: 20px; }
        .pdp-faq-answer-body {
          padding-bottom: clamp(16px, 1.8vw, 22px);
          font-size: clamp(13px, 1.2vw, 14px);
          color: #555;
          line-height: 1.7;
          white-space: pre-line;
        }

        /* 992–1199 — fixed image height 600, columns stay 50/50 */
        @media (min-width: 992px) and (max-width: 1199px) {
          .pdp-faq-left { min-height: 600px; }
          .pdp-faq-right { height: 600px; }
        }

        /* 750–991 — stacked, image first @ 600 */
        @media (min-width: 750px) and (max-width: 991px) {
          .pdp-faq-section { padding-block: clamp(36px, 5vw, 48px); }
          .pdp-faq-header { margin-bottom: clamp(20px, 3vw, 28px); }
          .pdp-faq-title { font-size: clamp(20px, 2.6vw, 22px); }
          .pdp-faq-subtitle { font-size: clamp(13px, 1.5vw, 14px); }
          .pdp-faq-grid {
            grid-template-columns: 1fr;
            gap: clamp(20px, 3vw, 28px);
          }
          .pdp-faq-left {
            padding-right: 0;
            min-height: 0;
          }
          .pdp-faq-right { height: 600px; order: -1; }
          .pdp-faq-q-btn {
            padding: clamp(13px, 1.7vw, 16px) 0;
            font-size: clamp(17px, 2.2vw, 20px);
            gap: clamp(10px, 1.3vw, 14px);
          }
          .pdp-faq-answer-body {
            padding-bottom: clamp(13px, 1.7vw, 16px);
            font-size: clamp(13px, 1.5vw, 14px);
          }
        }

        /* ≤749 — stacked, image first @ 400, fluid scale-down */
        @media (max-width: 749px) {
          .pdp-faq-section { padding-block: 0; }
          .pdp-faq-header { margin-bottom: clamp(16px, 4vw, 24px); }
          .pdp-faq-title { font-size: clamp(18px, 5vw, 22px); }
          .pdp-faq-subtitle { font-size: clamp(12px, 3.4vw, 14px); }
          .pdp-faq-grid {
            grid-template-columns: 1fr;
            gap: clamp(16px, 4vw, 24px);
          }
          .pdp-faq-left {
            padding-right: 0;
            min-height: 0;
          }
          .pdp-faq-right { height: 400px; order: -1; }
          .pdp-faq-q-btn {
            padding: clamp(12px, 3.4vw, 16px) 0;
            font-size: clamp(15px, 4.4vw, 18px);
            gap: clamp(8px, 2.5vw, 12px);
          }
          .pdp-faq-answer-body {
            padding-bottom: clamp(12px, 3.4vw, 16px);
            font-size: clamp(12px, 3.4vw, 14px);
          }
          .pdp-faq-icon-wrap {
            width: clamp(18px, 5vw, 22px);
            height: clamp(18px, 5vw, 22px);
          }
          .pdp-faq-icon {
            width: clamp(14px, 4.2vw, 18px);
            height: clamp(14px, 4.2vw, 18px);
          }
        }

        /* ── Ask About Product Modal ── */
        .pdp-ask-overlay { padding-top: 80px; }
        .pdp-ask-modal { max-width: 560px; padding: 36px 40px; }
        .pdp-ask-fields-row { grid-template-columns: 1fr 1fr; }

        /* ── Sticky Add to Cart Bar ── */
        .pdp-sticky-bar {
          bottom: 0;
          height: clamp(92px, 10vw, 120px);
          overflow: hidden;
        }
        .pdp-sticky-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(12px, 1.6vw, 24px);
          width: 100%;
          height: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .pdp-sticky-product { flex: 0 0 auto; min-width: 0; }
        .pdp-sticky-name { max-width: clamp(110px, 14vw, 180px); }
        .pdp-sticky-variant {
          margin-left: clamp(8px, 3vw, 76px);
          margin-right: clamp(8px, 3vw, 76px);
          min-width: clamp(130px, 14vw, 170px);
          max-width: 100%;
          flex-shrink: 1;
          box-sizing: border-box;
        }
        .pdp-sticky-qty { flex-shrink: 0; }
        .pdp-sticky-atc {
          padding: clamp(11px, 1.2vw, 14px) clamp(18px, 2.5vw, 30px);
          flex-shrink: 0;
        }
        .pdp-sticky-buy {
          padding: clamp(11px, 1.2vw, 14px) clamp(18px, 2.5vw, 30px);
          flex-shrink: 0;
        }
        /* Spacer: hidden by default, only present at mobile */
        .pdp-sticky-spacer { display: none; }

        /* ── Section padding — desktop default (moved from inline styles) ── */
        .pdp-reviews-section { padding-bottom: clamp(48px, 6vw, 80px); }
        .pdp-recently-section { padding-bottom: clamp(48px, 6vw, 80px); }

        /* TrustBadges marquee section: drop its built-in 70px top/bottom
           padding when rendered inside the PDP. The shared component still
           keeps that padding for home-page usage. */
        .pdp-trust-section > section {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }

        /* ── Recently Viewed: 3 cards at 750–991px ── */
        @media (min-width: 750px) and (max-width: 991px) {
          .pdp-recently-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .pdp-recently-grid .fc-card > div:not([class]) a { font-size: clamp(13px, 1.6vw, 15px) !important; }
          .pdp-recently-grid .fc-card > div:not([class]) span { font-size: clamp(12px, 1.4vw, 14px) !important; }
        }

        @media (max-width: 749px) {
          /* Modal overlay — tighter top padding so modal is reachable */
          .pdp-ask-overlay { padding-top: clamp(20px, 5vw, 50px); }
          /* Modal box — full width minus 16px each side, reduced padding */
          .pdp-ask-modal {
            max-width: calc(100% - 32px);
            padding: clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px);
          }

          /* Sticky bar is hidden at mobile — spacer is not needed */
          .pdp-sticky-spacer { display: none; }
          .pdp-sticky-bar { display: none; }

          /* ── Recently Viewed: 2 cards per row ── */
          .pdp-recently-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(10px, 2.5vw, 16px) !important;
          }
          /* Name link scales fluidly with viewport width */
          .pdp-recently-grid .fc-card > div:not([class]) a {
            font-size: clamp(11px, 3.4vw, 14px) !important;
          }
          /* Price and compare-price spans scale with name */
          .pdp-recently-grid .fc-card > div:not([class]) span {
            font-size: clamp(10px, 3vw, 13px) !important;
          }
          /* Tighten gap between card image and text below it */
          .pdp-recently-grid .fc-card > a:first-child {
            margin-bottom: clamp(8px, 2vw, 12px) !important;
          }
        }

        /* ── PDP inter-section spacing — mobile 320–749px ── */
        /* Zero internal section padding; margin-top is the sole gap source.
           Recently Viewed keeps a 60px padding-bottom so there's a gap
           between it and the footer (it's the last section). */
        @media (max-width: 749px) {
          .pdp-product-section  { padding-bottom: 0; }
          .pdp-reviews-section  { padding-bottom: 0; margin-top: 60px; }
          .pdp-related-section  { margin-top: 60px; }
          .pdp-trust-section    { margin-top: 60px !important; }
          .pdp-faq-section      { margin-top: 60px; }
          .pdp-recently-section { padding-bottom: 60px; margin-top: 60px; }
        }

        @media (max-width: 499px) {
          /* Stack Name + Email into a single column */
          .pdp-ask-fields-row { grid-template-columns: 1fr; }
          .pdp-ask-modal { max-width: 100%; }
        }
      `}</style>
    </>
  );
}
