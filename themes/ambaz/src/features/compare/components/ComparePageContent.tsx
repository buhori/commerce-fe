'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompareRestore, type Spec } from '@sellosy/theme';
import type { Product } from '../../../types/product';
import { useCompareStore } from '../../../store/compareStore';
import { useUIStore } from '../../../store/uiStore';
import { useCartStore } from '../../../store/cartStore';
import { formatPrice } from '../../../utils/formatPrice';


/* ── Icons ── */

function IconEye({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3ZM12.0003 19C16.2359 19 19.8603 16.052 20.7777 12C19.8603 7.94803 16.2359 5 12.0003 5C7.7646 5 4.14022 7.94803 3.22278 12C4.14022 16.052 7.7646 19 12.0003 19ZM12.0003 16.5C9.51498 16.5 7.50026 14.4853 7.50026 12C7.50026 9.51472 9.51498 7.5 12.0003 7.5C14.4855 7.5 16.5003 9.51472 16.5003 12C16.5003 14.4853 14.4855 16.5 12.0003 16.5ZM12.0003 14.5C13.381 14.5 14.5003 13.3807 14.5003 12C14.5003 10.6193 13.381 9.5 12.0003 9.5C10.6196 9.5 9.50026 10.6193 9.50026 12C9.50026 13.3807 10.6196 14.5 12.0003 14.5Z" />
    </svg>
  );
}

function IconBag({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M9 6H15C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6ZM7 6C7 3.23858 9.23858 1 12 1C14.7614 1 17 3.23858 17 6H20C20.5523 6 21 6.44772 21 7V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V7C3 6.44772 3.44772 6 4 6H7ZM5 8V20H19V8H5ZM9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10H17C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10H9Z" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconChevronLeft({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

function IconChevronRight({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

/* ── Component ── */

/**
 * Bandingkan produk Ambaz dengan daftar bandingkan platform: produk dari /compare?p=… (dimuat platform), daftar
 * pilihan disimpan di browser. Baris Ambaz yang tidak ada datanya di toko (ukuran, merek) diganti spesifikasi produk.
 */
export function ComparePageContent({ products, specs, restore }: { products: Product[]; specs: Spec[][]; restore: boolean }) {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  /* Update visibleCount on resize */
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setVisibleCount(w < 750 ? 1 : w < 1200 ? 2 : 4);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const items = products;

  /* Clamp slideIndex when items are removed or visibleCount changes */
  useEffect(() => {
    if (items.length === 0) return;
    const maxIndex = Math.max(0, items.length - visibleCount);
    setSlideIndex((prev) => (prev > maxIndex ? maxIndex : prev));
  }, [items.length, visibleCount]);

  const productHrefBase = '/products';
  const shopHref = '/products';
  const { removeItem } = useCompareStore();
  const handleRemove = (id: string) => {
    removeItem(id);
    const remaining = items.filter((p) => p.id !== id).map((p) => p.id);
    router.replace(remaining.length ? `/compare?p=${remaining.join(',')}` : '/compare');
  };
  const { openQuickView } = useUIStore();
  const { addItem } = useCartStore();

  // Produk bervarian dipilih variannya dulu lewat quick view; tanpa varian langsung masuk keranjang.
  const handleAddToCart = (product: typeof items[0]) => {
    if (product.variants.length > 0) return openQuickView(product);
    void addItem({
      productId: product.id, variantId: '', name: product.name, slug: product.slug,
      image: product.images[0]?.src ?? '', color: '', size: '',
      price: product.price, compareAtPrice: product.compareAtPrice, quantity: 1, vendor: product.vendor,
    });
  };
  const specLabels = [...new Set(specs.flat().map((spec) => spec.label))];
  const specOf = (index: number, label: string) => specs[index]?.find((spec) => spec.label === label)?.value ?? '—';

  /* Slider calculations */
  const visibleItems = items.slice(slideIndex, slideIndex + visibleCount);
  const showSlider = items.length > visibleCount;
  const canPrev = slideIndex > 0;
  const canNext = slideIndex + visibleCount < items.length;
  const labelWidth = visibleCount >= 4 ? '200px' : visibleCount === 2 ? '160px' : '120px';
  const gridCols = `${labelWidth} repeat(${visibleItems.length}, 1fr)`;

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="container-main" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 600, color: '#222', marginBottom: '16px' }}>Compare Products</h1>
        {restore && <CompareRestore />}
        <p style={{ fontSize: '16px', color: '#777', marginBottom: '30px' }}>No products to compare. Add products using the compare button.</p>
        <Link href={shopHref} style={{ display: 'inline-block', padding: '14px 36px', backgroundColor: '#000', color: '#fff', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container-main" style={{ paddingTop: '40px', paddingBottom: '80px' }}>

        {/* Title */}
        <h1 className="cp-h1">Compare Products</h1>

        {/* Slider navigation */}
        {showSlider && (
          <div className="cp-slider-nav">
            <span className="cp-nav-info">
              {slideIndex + 1}–{Math.min(slideIndex + visibleCount, items.length)} of {items.length}
            </span>
            <button
              className="cp-nav-btn"
              onClick={() => setSlideIndex((s) => s - 1)}
              disabled={!canPrev}
              aria-label="Previous"
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              className="cp-nav-btn"
              onClick={() => setSlideIndex((s) => s + 1)}
              disabled={!canNext}
              aria-label="Next"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Compare Table */}
        <div style={{ border: '1px solid #e5e5e5', overflow: 'hidden' }}>

          {/* ── Product Cards Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid #e5e5e5' }}>
            {/* Empty label cell */}
            <div style={{ padding: '20px', borderRight: '1px solid #e5e5e5' }} />

            {visibleItems.map((product) => (
              <div key={product.id} className="cp-product-card" style={{ borderRight: '1px solid #e5e5e5' }}>
                {/* Remove */}
                <button
                  onClick={() => handleRemove(product.id)}
                  style={{ fontSize: '14px', color: '#F15B41', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'block', margin: '0 auto 16px' }}
                >
                  Remove
                </button>

                {/* Image */}
                <Link
                  href={`${productHrefBase}/${product.slug}`}
                  className="cp-product-img-link"
                  style={{ display: 'block', position: 'relative', width: '100%', maxWidth: '200px', height: '260px', margin: '0 auto 16px', backgroundColor: '#f5f5f5', overflow: 'hidden' }}
                >
                  <Image unoptimized src={product.images[0]?.src || ''} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 749px) 50vw, 200px" />
                </Link>

                {/* Name */}
                <Link
                  href={`${productHrefBase}/${product.slug}`}
                  className="cp-product-name"
                  style={{ fontSize: '16px', fontWeight: 500, color: '#222', textDecoration: 'none', display: 'block', marginBottom: '6px', transition: 'color 200ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F15B41'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#222'; }}
                >
                  {product.name}
                </Link>

                {/* Price */}
                <p className="cp-product-price" style={{ fontSize: '16px', fontWeight: 600, color: '#F15B41', marginBottom: '16px' }}>
                  {formatPrice(product.price)}
                </p>

                {/* Action buttons */}
                <div className="cp-action-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <button
                    className="cp-action-btn"
                    onClick={() => openQuickView(product)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#222', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 200ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#222'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#222'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                  >
                    <IconEye size={15} /> QUICK VIEW
                  </button>
                  <button
                    className="cp-action-btn"
                    onClick={() => handleAddToCart(product)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, color: '#222', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 200ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#222'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#222'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
                  >
                    <IconBag size={15} /> QUICK ADD
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Comparison Rows ── */}
          {[
            {
              label: 'Availability',
              render: (p: typeof items[0]) => (
                <span className="cp-value-span" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: p.availability === 'out-of-stock' ? '#b42318' : '#22c55e' }}>
                  {p.availability !== 'out-of-stock' && <IconCheckCircle />} {p.availability === 'out-of-stock' ? 'Out of stock' : p.availability === 'pre-order' ? 'Pre-order' : 'In Stock'}
                </span>
              ),
            },
            {
              label: 'Variants',
              render: (p: typeof items[0]) => (
                <span className="cp-value-span" style={{ fontSize: '14px', color: '#555' }}>
                  {p.colors.length ? p.colors.map((c) => c.name).join(', ') : '—'}
                </span>
              ),
            },
            {
              label: 'Category',
              render: (p: typeof items[0]) => (
                <span className="cp-value-span" style={{ fontSize: '14px', color: '#555' }}>{p.vendor || '—'}</span>
              ),
            },
            ...specLabels.map((label) => ({
              label,
              render: (p: typeof items[0]) => (
                <span className="cp-value-span" style={{ fontSize: '14px', color: '#555' }}>{specOf(items.indexOf(p), label)}</span>
              ),
            })),
          ].map((row, rowIdx) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                borderBottom: '1px solid #e5e5e5',
                backgroundColor: rowIdx % 2 === 0 ? '#f9f9fb' : '#fff',
              }}
            >
              <div className="cp-label-cell" style={{ padding: '16px 20px', fontWeight: 600, fontSize: '15px', color: '#222', borderRight: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
                {row.label}
              </div>
              {visibleItems.map((product) => (
                <div key={product.id} className="cp-value-cell" style={{ padding: '16px 20px', textAlign: 'center', borderRight: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {row.render(product)}
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>

      <style>{`
        /* ─── title ─── */
        .cp-h1 { font-size: 36px; font-weight: 600; color: #222; text-align: center; margin-bottom: 40px; }

        /* ─── slider nav ─── */
        .cp-slider-nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 16px;
        }
        .cp-nav-info { font-size: 14px; color: #555; }
        .cp-nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid #e0e0e0;
          background: #fff;
          cursor: pointer;
          border-radius: 50%;
          color: #222;
          transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
        }
        .cp-nav-btn:hover:not(:disabled) { background: #222; color: #fff; border-color: #222; }
        .cp-nav-btn:disabled { opacity: 0.3; cursor: default; }

        /* ─── product card ─── */
        .cp-product-card { padding: 20px; text-align: center; }

        /* ─── ≤1199px: tablet — 2-item slider ─── */
        @media (max-width: 1199px) {
          .cp-h1 { font-size: clamp(22px, 3vw, 36px); margin-bottom: clamp(20px, 3vw, 40px); }
          .cp-product-card { padding: clamp(12px, 1.8vw, 20px); }
          .cp-product-img-link { height: clamp(180px, 22vw, 260px) !important; max-width: 240px !important; }
          .cp-product-name { font-size: clamp(13px, 1.6vw, 16px) !important; }
          .cp-product-price { font-size: clamp(13px, 1.6vw, 16px) !important; }
          .cp-action-btn {
            padding: clamp(8px, 1.1vw, 10px) clamp(10px, 1.4vw, 18px) !important;
            font-size: clamp(11px, 1.2vw, 13px) !important;
            gap: clamp(4px, 0.6vw, 6px) !important;
          }
          .cp-action-btns { gap: clamp(6px, 1vw, 10px) !important; }
          .cp-label-cell {
            padding: clamp(10px, 1.4vw, 16px) clamp(12px, 1.6vw, 20px) !important;
            font-size: clamp(12px, 1.4vw, 15px) !important;
          }
          .cp-value-cell { padding: clamp(10px, 1.4vw, 16px) clamp(12px, 1.6vw, 20px) !important; }
          .cp-value-span { font-size: clamp(12px, 1.4vw, 14px) !important; }
          .cp-nav-btn { width: 34px; height: 34px; }
          .cp-nav-info { font-size: clamp(12px, 1.4vw, 14px); }
        }

        /* ─── ≤749px: mobile — 1-item slider ─── */
        @media (max-width: 749px) {
          .cp-h1 { font-size: clamp(20px, 5.5vw, 28px); margin-bottom: clamp(14px, 4vw, 22px); }
          .cp-product-card { padding: clamp(10px, 3vw, 16px); }
          .cp-product-img-link { height: clamp(160px, 48vw, 220px) !important; max-width: 100% !important; }
          .cp-product-name { font-size: clamp(13px, 3.5vw, 15px) !important; }
          .cp-product-price { font-size: clamp(13px, 3.5vw, 15px) !important; }
          .cp-action-btns { flex-direction: column !important; gap: 8px !important; }
          .cp-action-btn {
            width: 100%;
            justify-content: center;
            padding: clamp(9px, 2.5vw, 12px) 0 !important;
            font-size: clamp(11px, 3vw, 13px) !important;
          }
          .cp-label-cell {
            padding: clamp(10px, 2.5vw, 14px) clamp(8px, 2vw, 14px) !important;
            font-size: clamp(11px, 3vw, 13px) !important;
          }
          .cp-value-cell { padding: clamp(10px, 2.5vw, 14px) clamp(8px, 2vw, 14px) !important; }
          .cp-value-span { font-size: clamp(11px, 3vw, 13px) !important; }
          .cp-nav-btn { width: 32px; height: 32px; }
          .cp-nav-info { font-size: clamp(11px, 3vw, 13px); }
        }
      `}</style>
    </>
  );
}
