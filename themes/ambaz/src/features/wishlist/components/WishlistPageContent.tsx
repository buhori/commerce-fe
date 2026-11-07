'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlistStore, type WishlistItem } from '../../../store/wishlistStore';
import { useUIStore } from '../../../store/uiStore';
import { useCompareStore } from '../../../store/compareStore';
import { formatPrice } from '../../../utils/formatPrice';

import type { Product } from '../../../types/product';

/* ── Icons ── */

function IconTrash({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z" />
    </svg>
  );
}

function IconCompare({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.7" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="15 4 19 4 19 8" />
      <line x1="14.75" y1="9.25" x2="19" y2="4" />
      <line x1="5" y1="19" x2="9" y2="15" />
      <polyline points="15 19 19 19 19 15" />
      <line x1="5" y1="5" x2="19" y2="19" />
    </svg>
  );
}

function IconEye({ size = 18 }: { size?: number }) {
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

/* ── Helpers ── */

function wishlistItemToProduct(item: WishlistItem): Product {
  return {
    id: item.productId,
    slug: item.slug,
    name: item.name,
    vendor: item.vendor,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    currency: 'IDR',
    images: [{ id: '1', src: item.image, alt: item.name }],
    variants: [],
    colors: item.colors.map((c) => ({ name: c.name, value: c.value, type: 'hex' as const })),
    sizes: [],
    category: '',
    tags: [],
    brand: '',
    availability: 'in-stock',
    badge: item.badge as Product['badge'],
    description: '',
    features: [],
    rating: 0,
    reviewCount: 0,
    reviews: [],
    relatedProducts: [],
    pairsWellWith: [],
    createdAt: '',
    sku: '',
    countdownEnd: null,
  };
}

/* ── Component ── */

/** Wishlist Ambaz dengan wishlist akun pembeli (platform). Tamu diminta masuk dulu. */
export function WishlistPageContent() {
  const { items, guest, status, removeItem } = useWishlistStore();
  const productHrefBase = '/products';
  const shopHref = '/products';

  const handleRemove = (id: string) => removeItem(id);
  const { openQuickView } = useUIStore();
  const { toggleItem: toggleCompare } = useCompareStore();

  // Ringkasan wishlist tanpa daftar varian: quick view memuat varian dan memasukkan yang dipilih ke keranjang.
  const handleQuickAdd = (item: WishlistItem) => openQuickView(wishlistItemToProduct(item));

  const handleQuickView = (item: WishlistItem) => openQuickView(wishlistItemToProduct(item));
  const handleCompare = (item: WishlistItem) => toggleCompare(wishlistItemToProduct(item));



  return (
    <>
      {/* Header */}
      <div style={{ backgroundColor: 'rgb(247, 248, 252)', padding: '40px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 600, color: '#222' }}>Wishlist</h1>
      </div>

      <div className="container-main" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {status === 'loading' ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontSize: '16px', color: '#777' }}>Loading your wishlist…</p>
        ) : guest ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#222', marginBottom: '20px' }}>Log in to see your wishlist</h2>
            <Link href="/login?next=%2Fwishlist" style={{ display: 'inline-block', padding: '16px 36px', backgroundColor: '#000', color: '#fff', fontSize: '18px', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#222', marginBottom: '20px' }}>Empty Wishlist</h2>
            <Link
              href={shopHref}
              style={{ display: 'inline-block', padding: '16px 36px', backgroundColor: '#000', color: '#fff', fontSize: '18px', fontWeight: 600, textDecoration: 'none', transition: 'background-color 250ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F15B41'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#000'; }}
            >
              Continue Browsing
            </Link>
          </div>
        ) : (
          <div className="wl-grid">
            {items.map((item, i) => (
              <WishlistCard key={item.productId} item={item} index={i} onRemove={handleRemove} onQuickAdd={handleQuickAdd} onQuickView={handleQuickView} onCompare={handleCompare} productHrefBase={productHrefBase} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* ─── grid ─── */
        .wl-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }

        /* ─── mobile buttons row — hidden at desktop ─── */
        .wl-mobile-btns { display: none; width: 100%; }
        .wl-mobile-btn-bag,
        .wl-mobile-btn-eye {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 13px 0;
          border: none;
          cursor: pointer;
          background-color: #fff;
          color: #222;
          transition: background-color 200ms ease;
        }
        .wl-mobile-btn-bag:hover,
        .wl-mobile-btn-eye:hover { background-color: #f5f5f5; }

        /* ─── ≤991px: 1-column layout, always-visible actions, static buttons row ─── */
        @media (max-width: 991px) {
          .wl-grid { grid-template-columns: 1fr; }

          .wl-img-link {
            height: 650px !important;
            aspect-ratio: unset !important;
            margin-bottom: 0 !important;
          }

          .wl-actions-overlay {
            opacity: 1 !important;
            transform: translateX(0) !important;
          }

          .wl-eye-btn { display: none; }

          .wl-quick-add-overlay { display: none !important; }

          .wl-mobile-btns { display: flex; margin-bottom: 14px; }
        }

        /* ─── ≤749px: fluid image height 650px → 290px ─── */
        @media (max-width: 749px) {
          .wl-img-link { height: clamp(290px, 86vw, 650px) !important; }
        }
      `}</style>
    </>
  );
}

/* ── Wishlist Product Card ── */

function WishlistCard({ item, index, onRemove, onQuickAdd, onQuickView, onCompare, productHrefBase }: {
  item: WishlistItem;
  index: number;
  onRemove: (id: string) => void;
  onQuickAdd: (item: WishlistItem) => void;
  onQuickView: (item: WishlistItem) => void;
  onCompare: (item: WishlistItem) => void;
  productHrefBase: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="wl-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      {/* Image */}
      <Link
        href={`${productHrefBase}/${item.slug}`}
        className="wl-img-link"
        style={{ display: 'block', position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '14px' }}
      >
        <Image unoptimized src={item.image} alt={item.name} fill style={{ objectFit: 'cover', transition: 'opacity 500ms ease', opacity: hovered ? 0 : 1 }} sizes="(max-width: 749px) 100vw, 25vw" />
        <Image unoptimized src={item.image2 || item.image} alt={`${item.name} hover`} fill style={{ objectFit: 'cover', transition: 'opacity 500ms ease', opacity: hovered ? 1 : 0 }} sizes="(max-width: 749px) 100vw, 25vw" />

        {/* Badge */}
        {item.badge && (
          <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: item.badge === 'sale' ? '#F15B41' : '#222', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '3px', zIndex: 3, textTransform: 'capitalize' }}>
            {item.badge}
          </span>
        )}

        {/* Action buttons — top-right */}
        <div
          className="wl-actions-overlay"
          style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 3, transition: 'opacity 300ms ease, transform 300ms ease', opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(10px)' }}
        >
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(item.productId); }} className="fc-action-btn fc-action-btn-light" aria-label="Remove">
            <IconTrash size={18} />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompare(item); }} className="fc-action-btn fc-action-btn-light" aria-label="Compare">
            <IconCompare size={18} />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(item); }} className="fc-action-btn fc-action-btn-dark wl-eye-btn" aria-label="Quick view">
            <IconEye size={18} />
          </button>
        </div>

        {/* Quick Add — hover overlay inside image */}
        <div
          className="wl-quick-add-overlay"
          style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', zIndex: 4, transition: 'opacity 300ms ease, transform 300ms ease', opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(16px)' }}
        >
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickAdd(item); }} className="fc-quick-add-btn">
            <IconBag size={18} /> Quick Add
          </button>
        </div>
      </Link>

      {/* Mobile: Quick Add + Quick View row */}
      <div className="wl-mobile-btns">
        <button
          className="wl-mobile-btn-bag"
          aria-label="Quick add"
          onClick={() => onQuickAdd(item)}
        >
          <IconBag size={18} />
        </button>
        <button
          className="wl-mobile-btn-eye"
          aria-label="Quick view"
          onClick={() => onQuickView(item)}
        >
          <IconEye size={18} />
        </button>
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center' }}>
        <Link href={`${productHrefBase}/${item.slug}`} style={{ fontSize: '15px', fontWeight: 500, color: '#222', textDecoration: 'none', transition: 'color 150ms ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F15B41'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#222'; }}
        >
          {item.name}
        </Link>
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {item.compareAtPrice && <span style={{ fontSize: '14px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(item.compareAtPrice)}</span>}
          <span style={{ fontSize: '15px', fontWeight: 600, color: item.compareAtPrice ? '#F15B41' : '#222' }}>{formatPrice(item.price)}</span>
        </div>
        {item.colors.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {item.colors.slice(0, 3).map((c) => (
              <span key={c.name} style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.value, border: c.value === '#FFFFFF' ? '1px solid #ddd' : '1px solid transparent', display: 'inline-block' }} />
            ))}
            {item.colors.length > 3 && <span style={{ fontSize: '13px', color: '#F15B41', fontWeight: 500 }}>+{item.colors.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
