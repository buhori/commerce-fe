'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '../../../utils/formatPrice';
import { useUIStore } from '../../../store/uiStore';
import { useCompareStore } from '../../../store/compareStore';
import { useWishlistStore } from '../../../store/wishlistStore';
import type { Product } from '../../../types/product';

/* ── Remix Icons ── */

function IconHeart({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12.001 4.52853C14.35 2.42 17.98 2.49 20.2426 4.75736C22.5053 7.02472 22.583 10.637 20.4786 12.993L11.9999 21.485L3.52138 12.993C1.41705 10.637 1.49571 7.01901 3.75736 4.75736C6.02157 2.49315 9.64519 2.41687 12.001 4.52853ZM18.827 6.1701C17.3279 4.66794 14.9076 4.60701 13.337 6.01687L12.0019 7.21524L10.6661 6.01781C9.09098 4.60597 6.67506 4.66808 5.17157 6.17157C3.68183 7.66131 3.60704 10.0473 4.97993 11.6232L11.9999 18.6543L19.0201 11.6232C20.3935 10.0467 20.319 7.66525 18.827 6.1701Z" />
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

/* ── Countdown Timer ── */

interface CountdownTimerProps {
  /** Chip background color. Defaults to `#000` (fashion). */
  backgroundColor?: string;
}

export function CountdownTimer({ backgroundColor = '#000', target: end }: CountdownTimerProps & { target?: string | null } = {}) {
  const [time, setTime] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });

  useEffect(() => {
    /* Akhir diskon produk (platform); demo Ambaz memakai tanggal tetap. */
    const target = end ? new Date(end.replace(' ', 'T')).getTime() : Date.now();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [end]);

  return (
    <div className="fc-countdown" style={{ display: 'flex', gap: '5px' }}>
      {[
        { val: time.days, label: 'Days' },
        { val: time.hrs, label: 'Hrs' },
        { val: time.min, label: 'Min' },
        { val: time.sec, label: 'Sec' },
      ].map((t) => (
        <div key={t.label} className="fc-countdown-cell" style={{ backgroundColor, color: '#fff', borderRadius: '4px', padding: '6px 10px', textAlign: 'center', minWidth: '42px' }}>
          <div className="fc-countdown-val" style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>{t.val}</div>
          <div className="fc-countdown-lbl" style={{ fontSize: '11px', fontWeight: 400, lineHeight: 1.3, opacity: 0.85 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Scrolling Marquee Text ── */

export function ScrollingText() {
  return (
    <div style={{ overflow: 'hidden', backgroundColor: '#000', padding: '10px 0', width: '100%' }}>
      <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} style={{ fontSize: '14px', color: '#fff', fontWeight: 500, marginRight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>★</span> HOT SALE ITEM &nbsp;&nbsp; <span style={{ fontSize: '16px' }}>★</span> UP TO 50% OFF &nbsp;&nbsp;
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Product Card ── */

interface ProductCardProps {
  product: Product;
  index: number;
  /** Optional override for the product detail href base. Defaults to `/products`. */
  hrefBase?: string;
  /** Override whether this card shows the countdown overlay. Defaults to `index === 0` (fashion). */
  showCountdown?: boolean;
  /** Override whether this card shows the scrolling-text marquee. Defaults to `index === 2` (fashion). */
  showScrollText?: boolean;
  /** Optional fixed image height (e.g. `"340px"`). When omitted, the image uses the
      default 3:4 aspect ratio (fashion). */
  imageHeight?: string;
  /** Recolors the product name, price, "+N" chip, swatch tooltip, and the
      action-button hover tooltip background. Defaults to the fashion palette. */
  themeColor?: string;
  /** Background color of the in-card countdown chips. Defaults to `#000`. */
  countdownBg?: string;
  /** When true, forces the mobile-style layout at every breakpoint:
      action overlay always visible with only Wishlist + Compare,
      Quick Add + Quick View surfaced in a static row under the image.
      Used by the pet-food shop page. */
  compact?: boolean;
}

export function HomeProductCard({
  product,
  index,
  hrefBase = '/products',
  showCountdown,
  showScrollText,
  imageHeight,
  themeColor,
  countdownBg,
  compact = false,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const { openQuickView } = useUIStore();
  const { toggleItem: toggleCompare, isInCompare } = useCompareStore();
  const { toggleItem: toggleWishlist, isInWishlist, available: wishlistAvailable } = useWishlistStore();
  const inCompare = isInCompare(product.id);
  const inWishlist = isInWishlist(product.id);
  const defaultImg1 = product.images[0]?.src || '';
  const defaultImg2 = product.images[1]?.src || defaultImg1;
  // Demo Ambaz: hitung mundur di kartu pertama, teks promo di kartu ketiga. Di toko hanya untuk produk yang
  // memang sedang diskon (dengan batas waktu untuk hitung mundur).
  const hasCountdown = (showCountdown ?? index === 0) && !!product.countdownEnd;
  const hasScrollText = (showScrollText ?? index === 2) && product.badge === 'sale';
  const productHref = `${hrefBase}/${product.slug}`;

  // Build unique color images for smooth transitions
  const colorImages = product.colors.reduce<Record<string, string>>((acc, c) => {
    const variant = product.variants.find(v => v.color === c.name);
    if (variant) acc[c.name] = variant.image;
    return acc;
  }, {});
  const activeColorImage = hoveredColor ? colorImages[hoveredColor] : null;

  const nameColor = themeColor ?? '#222';
  const priceColor = themeColor ?? (product.compareAtPrice ? '#F15B41' : '#222');
  const chipColor = themeColor ?? '#F15B41';
  const tooltipBg = themeColor ?? '#222';

  return (
    <div
      className={`fc-card${compact ? ' fc-card--compact' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setHoveredColor(null); }}
      style={{ position: 'relative', ['--fc-tooltip-bg' as string]: tooltipBg }}
    >
      <Link
        href={productHref}
        style={{
          display: 'block',
          position: 'relative',
          ...(imageHeight ? { height: imageHeight } : { aspectRatio: '3 / 4' }),
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '14px',
        }}
      >
        {/* Default image */}
        <Image unoptimized src={defaultImg1} alt={product.name} fill style={{ objectFit: 'cover', transition: 'opacity 400ms ease', opacity: (hovered && !hoveredColor) || activeColorImage ? 0 : 1 }} sizes="(max-width: 749px) 50vw, 25vw" />
        {/* Hover image (when no color selected) */}
        <Image unoptimized src={defaultImg2} alt={`${product.name} hover`} fill style={{ objectFit: 'cover', transition: 'opacity 400ms ease', opacity: hovered && !hoveredColor ? 1 : 0 }} sizes="(max-width: 749px) 50vw, 25vw" />
        {/* Color variant images — each stacked, instant switch */}
        {Object.entries(colorImages).map(([colorName, imgSrc]) => (
          <Image key={colorName} src={imgSrc} alt={`${product.name} ${colorName}`} fill style={{ objectFit: 'cover', transition: 'opacity 150ms ease', opacity: hoveredColor === colorName ? 1 : 0, zIndex: hoveredColor === colorName ? 2 : 1 }} sizes="(max-width: 749px) 50vw, 25vw" />
        ))}

        {product.badge && (
          <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: product.badge === 'sale' ? '#F15B41' : product.badge === 'new' ? '#222' : '#F15B41', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '3px', zIndex: 3, textTransform: 'capitalize' }}>
            {product.badge}
          </span>
        )}

        <div className="fc-actions-overlay" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 3, transition: 'opacity 300ms ease, transform 300ms ease', opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(10px)' }}>
          {wishlistAvailable && <div style={{ position: 'relative' }} className="fc-tooltip-wrap">
            <button aria-label="Wishlist" className={`fc-action-btn ${inWishlist ? 'fc-action-btn-dark' : 'fc-action-btn-light'}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist({ productId: product.id, name: product.name, price: product.price, compareAtPrice: product.compareAtPrice, image: defaultImg1, image2: defaultImg2, slug: product.slug, badge: product.badge, colors: product.colors.map(c => ({ name: c.name, value: c.value })), vendor: product.vendor }); }}>
              <IconHeart size={18} />
            </button>
            <span className="fc-tooltip">{inWishlist ? 'Already Wishlisted' : 'Wishlist'}</span>
          </div>}
          <div style={{ position: 'relative' }} className="fc-tooltip-wrap">
            <button
              aria-label="Compare"
              className={`fc-action-btn ${inCompare ? 'fc-action-btn-dark' : 'fc-action-btn-light'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(product);
              }}
            >
              {inCompare ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <IconCompare size={18} />
              )}
            </button>
            <span className="fc-tooltip">{inCompare ? 'Added' : 'Compare'}</span>
          </div>
          <div style={{ position: 'relative' }} className="fc-tooltip-wrap fc-quickview-wrap">
            <button aria-label="Quick view" className="fc-action-btn fc-action-btn-light" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}><IconEye size={18} /></button>
            <span className="fc-tooltip">Quick view</span>
          </div>
        </div>

        {hasCountdown && (
          <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 3, transition: 'opacity 300ms ease', opacity: hovered ? 0 : 1, pointerEvents: hovered ? 'none' : 'auto' }}>
            <CountdownTimer backgroundColor={countdownBg} target={product.countdownEnd} />
          </div>
        )}

        {hasScrollText && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, transition: 'opacity 300ms ease', opacity: hovered ? 0 : 1, pointerEvents: hovered ? 'none' : 'auto' }}>
            <ScrollingText />
          </div>
        )}

        <div className="fc-quick-add-overlay" style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', zIndex: 4, transition: 'opacity 300ms ease, transform 300ms ease', opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(16px)' }}>
          <button className="fc-quick-add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}><IconBag size={18} /> Quick Add</button>
        </div>
      </Link>

      {/* Mobile-only action row (shown at ≤ 749px): two icon buttons below
          the image — Quick Add (bag) + Quick View (eye). Mirrors the
          screenshot's mobile layout so users don't need hover to reach them. */}
      <div className="fc-mobile-actions">
        <button
          type="button"
          className="fc-mobile-action-btn"
          aria-label="Quick add"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
        >
          <IconBag size={18} />
        </button>
        <button
          type="button"
          className="fc-mobile-action-btn"
          aria-label="Quick view"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product); }}
        >
          <IconEye size={18} />
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link
          href={productHref}
          style={{ fontSize: '15px', fontWeight: 500, color: nameColor, textDecoration: 'none', transition: 'color 150ms ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F15B41'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = nameColor; }}
        >
          {product.name}
        </Link>
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {product.compareAtPrice && <span style={{ fontSize: '14px', color: '#999', textDecoration: 'line-through' }}>{formatPrice(product.compareAtPrice)}</span>}
          <span style={{ fontSize: '15px', fontWeight: 600, color: priceColor }}>{formatPrice(product.price)}</span>
        </div>
        {product.colors.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative' }}>
            {product.colors.slice(0, 3).map((c) => (
              <span
                key={c.name}
                onMouseEnter={() => setHoveredColor(c.name)}
                onMouseLeave={() => setHoveredColor(null)}
                style={{
                  width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.value,
                  border: hoveredColor === c.name ? '2px solid #222' : (c.value === '#FFFFFF' ? '1px solid #ddd' : '1px solid transparent'),
                  display: 'inline-block', cursor: 'pointer', transition: 'border-color 200ms ease, transform 200ms ease',
                  transform: hoveredColor === c.name ? 'scale(1.2)' : 'scale(1)',
                  position: 'relative',
                }}
              />
            ))}
            {product.colors.length > 3 && <span style={{ fontSize: '13px', color: chipColor, fontWeight: 500 }}>+{product.colors.length - 3}</span>}
            {/* Color name tooltip */}
            {hoveredColor && (
              <span style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: tooltipBg, color: '#fff', fontSize: '11px', fontWeight: 500,
                padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap', pointerEvents: 'none',
                animation: 'fadeIn 150ms ease',
              }}>
                {hoveredColor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline styles to guarantee they apply */}
      <style>{`
        .fc-action-btn {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: background-color 200ms ease, color 200ms ease, transform 200ms ease, box-shadow 200ms ease !important;
        }
        .fc-action-btn:hover { transform: scale(1.08) !important; }

        .fc-action-btn-light {
          background-color: #fff !important;
          color: #333 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
        }
        .fc-action-btn-light:hover { background-color: #222 !important; color: #fff !important; }

        .fc-action-btn-dark {
          background-color: #222 !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .fc-action-btn-dark:hover { background-color: #000 !important; }

        .fc-tooltip {
          position: absolute !important;
          right: calc(100% + 8px) !important;
          top: 50% !important;
          transform: translateY(-50%) translateX(6px) !important;
          background-color: var(--fc-tooltip-bg, #222) !important;
          color: #fff !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding: 6px 12px !important;
          border-radius: 4px !important;
          white-space: nowrap !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 200ms ease, transform 200ms ease !important;
        }
        .fc-tooltip-wrap:hover .fc-tooltip {
          opacity: 1 !important;
          transform: translateY(-50%) translateX(0) !important;
        }

        .fc-quick-add-btn {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          background-color: #fff !important;
          color: #222 !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          padding: 13px 0 !important;
          border: none !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
          transition: background-color 250ms ease, color 250ms ease, box-shadow 250ms ease !important;
        }
        .fc-quick-add-btn:hover {
          background-color: #000 !important;
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15) !important;
        }

        /* Mobile action row — hidden on desktop, revealed at ≤ 749px
           (or always when the card is in compact mode). */
        .fc-mobile-actions {
          display: none;
        }

        /* ── Compact mode (≤ 991px only) ──
           From 992px down to 0, the overlay becomes always-visible with
           only Wishlist + Compare, and Quick Add + Quick View live in a
           static row directly below the image (no gap). At ≥ 992px the
           card reverts to its normal hover-based layout (3 icons in the
           overlay + Quick Add pill on image hover). Used by the pet-food
           shop page. */
        @media (max-width: 991px) {
          .fc-card--compact .fc-actions-overlay {
            opacity: 1 !important;
            transform: none !important;
          }
          .fc-card--compact .fc-quickview-wrap {
            display: none !important;
          }
          .fc-card--compact .fc-quick-add-overlay {
            display: none !important;
          }
          .fc-card--compact .fc-mobile-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin-top: 0;
            margin-bottom: 14px;
          }
          .fc-card--compact .fc-mobile-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: clamp(38px, 5.2vw, 44px);
            background: #fff;
            border: none;
            color: #444;
            cursor: pointer;
            padding: 0;
            transition: background-color 180ms ease, color 180ms ease;
          }
          .fc-card--compact .fc-mobile-action-btn + .fc-mobile-action-btn {
            border-left: 1px solid #eee;
          }
          .fc-card--compact .fc-mobile-action-btn:hover {
            background: #f5f5f5;
          }
          /* Use object-fit: contain so tall pet-food product shots aren't
             aggressively cropped by the card's fixed image area. */
          .fc-card--compact > a:first-child img {
            object-fit: contain !important;
            background-color: #f5f5f5;
          }
        }

        /* ≤ 749px — product card image shrinks smoothly; hover effects
           disabled; layout matches mobile screenshot:
             • top-right action buttons always visible (no hover needed)
             • Quick Add hover-overlay hidden (replaced by the new row)
             • new static 2-button row below image (bag + eye)
             • product images use contain to avoid aggressive cropping
        */
        @media (max-width: 749px) {
          .fc-card > a:first-child {
            height: clamp(200px, 44vw, 340px) !important;
            aspect-ratio: auto !important;
            margin-bottom: 0 !important;
          }
          .fc-card > a:first-child img {
            object-fit: contain !important;
            background-color: #f5f5f5;
          }
          .fc-actions-overlay {
            opacity: 1 !important;
            transform: none !important;
          }
          /* Only Wishlist + Compare on the image overlay at mobile — Quick
             View is surfaced in the static row below the image instead. */
          .fc-quickview-wrap {
            display: none !important;
          }
          .fc-quick-add-overlay {
            display: none !important;
          }
          .fc-mobile-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin-top: 0;
            margin-bottom: 14px;
          }
          .fc-mobile-action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 44px;
            background: #fff;
            border: none;
            color: #444;
            cursor: pointer;
            padding: 0;
            transition: background-color 180ms ease, color 180ms ease;
          }
          .fc-mobile-action-btn + .fc-mobile-action-btn {
            border-left: 1px solid #eee;
          }
          .fc-mobile-action-btn:active {
            background: #f5f5f5;
          }
          .fc-action-btn:hover {
            transform: none !important;
          }
          .fc-action-btn-light:hover {
            background-color: #fff !important;
            color: #333 !important;
          }
          .fc-action-btn-dark:hover {
            background-color: #222 !important;
            color: #fff !important;
          }
          .fc-quick-add-btn:hover {
            background-color: #fff !important;
            color: #222 !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
          }
          .fc-tooltip-wrap:hover .fc-tooltip {
            opacity: 0 !important;
          }

          /* Countdown timer on the 3rd card — shrink smoothly as viewport
             narrows. clamp() scales cell padding, min-width, and typography
             together so the ticker stays proportional on every mobile size. */
          .fc-countdown {
            gap: clamp(3px, 0.8vw, 5px) !important;
          }
          .fc-countdown-cell {
            padding: clamp(4px, 1.2vw, 6px) clamp(6px, 1.8vw, 10px) !important;
            min-width: clamp(30px, 8vw, 42px) !important;
            border-radius: 4px !important;
          }
          .fc-countdown-val {
            font-size: clamp(11px, 3vw, 16px) !important;
          }
          .fc-countdown-lbl {
            font-size: clamp(8px, 2vw, 11px) !important;
          }
        }
      `}</style>
    </div>
  );
}
