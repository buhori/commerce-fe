'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUIStore } from '../../../store/uiStore';
import { useCartStore } from '../../../store/cartStore';
import { formatPrice } from '../../../utils/formatPrice';
import { useRouter } from 'next/navigation';
import { useProduct } from '../../products/hooks/useProducts';

/* ── Icons ── */

function IconClose({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 17" fill="currentColor">
      <path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" />
    </svg>
  );
}

function IconBag({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M9 6H15C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6ZM7 6C7 3.23858 9.23858 1 12 1C14.7614 1 17 3.23858 17 6H20C20.5523 6 21 6.44772 21 7V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V7C3 6.44772 3.44772 6 4 6H7ZM5 8V20H19V8H5ZM9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10H17C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10H9Z" />
    </svg>
  );
}

function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
    </svg>
  );
}

/* ── Component ── */

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView } = useUIStore();
  const { addItem } = useCartStore();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Kartu hanya membawa ringkasan; varian dan galeri lengkap dimuat dari platform.
  const { data: detail } = useProduct(quickViewProduct?.id ?? null);
  const product = quickViewProduct && detail?.id === quickViewProduct.id ? detail : quickViewProduct;

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]?.name || '');
      setSelectedSize(product.sizes[0] || '');
      setQuantity(1);
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- reset saat produk lain dibuka

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQuickView(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [product, closeQuickView]);

  if (!product) return null;

  const activeColor = selectedColor || product.colors[0]?.name || '';
  const activeSize = selectedSize || product.sizes[0] || '';

  const handleAddToCart = () => {
    // Produk tanpa varian langsung ditambahkan; dengan varian, varian sesuai warna yang dipilih.
    const variant = product.variants.find(
      (v) => v.color === activeColor && (v.size === activeSize || !v.size)
    ) || product.variants[0];
    if (product.variants.length > 0 && !variant) return;
    const added = addItem({
      productId: product.id, variantId: variant?.id ?? '',
      name: product.name, slug: product.slug, image: variant?.image ?? product.images[0]?.src ?? '',
      color: activeColor, size: activeSize,
      price: variant?.price ?? product.price, compareAtPrice: variant?.compareAtPrice ?? product.compareAtPrice,
      quantity, vendor: product.vendor,
    });
    closeQuickView();
    return added;
  };
  const soldOut = product.availability === 'out-of-stock';
  // Harga varian yang dipilih (varian platform bisa punya harga sendiri).
  const shown = product.variants.find((v) => v.color === activeColor) ?? product;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeQuickView}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999, animation: 'qvFadeIn 200ms ease',
        }}
      />

      {/* Modal */}
      <div className="qv-modal">

        {/* Close button — position: absolute removes it from grid/flex flow;
            always anchored to top-right of the modal regardless of layout */}
        <button
          onClick={closeQuickView}
          className="qv-close-btn"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1.5px solid #e0e0e0', background: '#fff',
            cursor: 'pointer', color: '#666', zIndex: 10,
            transition: 'border-color 250ms ease, color 250ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#222'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#666'; }}
          aria-label="Close"
        >
          <IconClose size={14} />
        </button>

        {/* ═══ LEFT: Product Image ═══ */}
        <div className="qv-img-col">
          <Image
            unoptimized
            src={product.images[0]?.src || ''}
            alt={product.name}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center center' }}
            sizes="(max-width: 991px) min(600px, 95vw), 600px"
          />
        </div>

        {/* ═══ RIGHT: Product Details ═══ */}
        <div className="qv-detail-col">

          {/* Product name — paddingRight clears the close button at desktop */}
          <h2 className="qv-product-name" style={{ fontSize: '24px', fontWeight: 700, color: '#222', marginBottom: '10px', paddingRight: '56px' }}>
            {product.name}
          </h2>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            {shown.compareAtPrice && (
              <span className="qv-price-compare" style={{ fontSize: '16px', color: '#999', textDecoration: 'line-through' }}>
                {formatPrice(shown.compareAtPrice)}
              </span>
            )}
            <span className="qv-price-current" style={{ fontSize: '20px', fontWeight: 700, color: '#222' }}>
              {formatPrice(shown.price)}
            </span>
          </div>

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p className="qv-selector-label" style={{ fontSize: '15px', color: '#222', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600 }}>Color:</span> {activeColor}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className="qv-color-swatch"
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: c.value,
                      border: activeColor === c.name ? '3px solid #222' : '2px solid #e0e0e0',
                      cursor: 'pointer', transition: 'border-color 200ms ease',
                    }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p className="qv-selector-label" style={{ fontSize: '15px', color: '#222', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600 }}>Size:</span> {activeSize}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className="qv-size-btn"
                    style={{
                      minWidth: '44px', height: '44px', padding: '0 14px',
                      borderRadius: '4px', fontSize: '14px', fontWeight: 500,
                      border: activeSize === s ? '2px solid #222' : '1px solid #e0e0e0',
                      backgroundColor: activeSize === s ? '#222' : '#fff',
                      color: activeSize === s ? '#fff' : '#222',
                      cursor: 'pointer', transition: 'all 200ms ease',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <p className="qv-selector-label" style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '10px' }}>Quantity</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="qv-qty-btn"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}
              >−</button>
              <span
                className="qv-qty-count"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 500, borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="qv-qty-btn"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}
              >+</button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={() => void handleAddToCart()}
            disabled={soldOut}
            className="qv-add-to-cart"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '16px 0', backgroundColor: '#222', color: '#fff',
              fontSize: '16px', fontWeight: 600, border: 'none', borderRadius: '40px',
              cursor: 'pointer', marginBottom: '12px', transition: 'background-color 250ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F15B41'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#222'; }}
          >
            <IconBag size={18} />
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>

          {/* Buy it now */}
          <button
            disabled={soldOut}
            onClick={() => void handleAddToCart()?.then(() => router.push('/checkout'))}
            className="qv-buy-now"
            style={{
              width: '100%', padding: '16px 0', backgroundColor: '#fff', color: '#222',
              fontSize: '16px', fontWeight: 600, border: '1.5px solid #222', borderRadius: '40px',
              cursor: 'pointer', marginBottom: '20px', transition: 'all 250ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#222'; }}
          >
            Buy it now
          </button>

          {/* View full details */}
          <Link
            href={`/products/${encodeURIComponent(product.slug)}`}
            onClick={closeQuickView}
            className="qv-full-details"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '15px', color: '#222', textDecoration: 'underline',
              textUnderlineOffset: '3px', fontWeight: 500,
              transition: 'color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#F15B41'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#222'; }}
          >
            View full details
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>

      <style>{`
        /* ─── modal base ─── */
        .qv-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          width: 1200px;
          max-width: 95vw;
          height: 720px;
          background-color: #fff;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: qvScaleIn 300ms ease;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* ─── image column ─── */
        .qv-img-col {
          position: relative;
          background-color: #f0eeeb;
          height: 720px;
          overflow: hidden;
        }

        /* ─── detail column ─── */
        .qv-detail-col {
          padding: 32px;
          overflow-y: auto;
          height: 720px;
          position: relative;
        }

        /* ─── 1400px → 992px: side-by-side, reduce size gradually ─── */
        @media (max-width: 1399px) {
          .qv-modal { height: clamp(580px, 56vw, 720px); }
          .qv-img-col { height: clamp(580px, 56vw, 720px); }
          .qv-detail-col {
            height: clamp(580px, 56vw, 720px);
            padding: clamp(24px, 2.5vw, 32px);
          }
          .qv-product-name  { font-size: clamp(20px, 1.8vw, 24px)   !important; }
          .qv-price-current { font-size: clamp(17px, 1.6vw, 20px)   !important; }
          .qv-price-compare { font-size: clamp(14px, 1.2vw, 16px)   !important; }
          .qv-selector-label { font-size: clamp(13px, 1.2vw, 15px)  !important; }
          .qv-color-swatch {
            width:  clamp(30px, 2.5vw, 36px) !important;
            height: clamp(30px, 2.5vw, 36px) !important;
          }
          .qv-size-btn {
            height:    clamp(38px, 3.5vw, 44px) !important;
            font-size: clamp(12px, 1.2vw, 14px) !important;
          }
          .qv-qty-btn {
            width:     clamp(34px, 3vw, 40px) !important;
            height:    clamp(34px, 3vw, 40px) !important;
            font-size: clamp(15px, 1.5vw, 18px) !important;
          }
          .qv-qty-count {
            width:     clamp(34px, 3vw, 40px) !important;
            height:    clamp(34px, 3vw, 40px) !important;
            font-size: clamp(13px, 1.2vw, 15px) !important;
          }
          .qv-add-to-cart {
            padding:   clamp(13px, 1.2vw, 16px) 0 !important;
            font-size: clamp(14px, 1.4vw, 16px) !important;
          }
          .qv-buy-now {
            padding:   clamp(13px, 1.2vw, 16px) 0 !important;
            font-size: clamp(14px, 1.4vw, 16px) !important;
          }
          .qv-full-details { font-size: clamp(13px, 1.2vw, 15px) !important; }
        }

        /* ─── ≤991px: stacked — image on top, details below ─── */
        @media (max-width: 991px) {
          .qv-modal {
            display: flex !important;
            flex-direction: column;
            width: min(600px, 95vw);
            height: auto;
            max-height: 90vh;
            overflow-x: hidden;
            overflow-y: auto;
          }
          .qv-img-col {
            flex-shrink: 0;
            height: clamp(280px, 60vw, 600px);
          }
          .qv-detail-col {
            height: auto;
            overflow-y: visible;
            padding: clamp(20px, 4vw, 28px);
          }
          .qv-product-name {
            font-size: clamp(18px, 4.5vw, 22px) !important;
            padding-right: 56px !important;
          }
          .qv-price-current { font-size: clamp(16px, 4vw, 19px)    !important; }
          .qv-price-compare { font-size: clamp(13px, 3.5vw, 15px)  !important; }
          .qv-selector-label { font-size: clamp(13px, 3.5vw, 14px) !important; }
          .qv-color-swatch {
            width:  clamp(28px, 6vw, 34px) !important;
            height: clamp(28px, 6vw, 34px) !important;
          }
          .qv-size-btn {
            height:    clamp(36px, 8vw, 42px) !important;
            font-size: clamp(12px, 3vw, 14px) !important;
          }
          .qv-qty-btn {
            width:     clamp(32px, 7vw, 38px) !important;
            height:    clamp(32px, 7vw, 38px) !important;
            font-size: clamp(15px, 4vw, 18px) !important;
          }
          .qv-qty-count {
            width:     clamp(32px, 7vw, 38px) !important;
            height:    clamp(32px, 7vw, 38px) !important;
            font-size: clamp(13px, 3.5vw, 15px) !important;
          }
          .qv-add-to-cart {
            padding:   clamp(12px, 3vw, 15px) 0 !important;
            font-size: clamp(14px, 3.5vw, 15px) !important;
          }
          .qv-buy-now {
            padding:   clamp(12px, 3vw, 15px) 0 !important;
            font-size: clamp(14px, 3.5vw, 15px) !important;
          }
          .qv-full-details { font-size: clamp(13px, 3.5vw, 14px) !important; }
        }

        /* ─── keyframes ─── */
        @keyframes qvFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes qvScaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
