'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../../store/cartStore';
import { formatPrice } from '../../../utils/formatPrice';
import { FREE_SHIPPING_THRESHOLD, GIFT_WRAP_PRICE } from '../../../lib/constants';

/* ── Icons ── */

function IconClose({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}


function IconShipping({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconCoupon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M10.9042 2.1001L20.8037 3.51431L22.2179 13.4138L13.0255 22.6062C12.635 22.9967 12.0019 22.9967 11.6113 22.6062L1.71184 12.7067C1.32131 12.3162 1.32131 11.683 1.71184 11.2925L10.9042 2.1001ZM11.6113 4.22142L3.83316 11.9996L12.3184 20.4849L20.0966 12.7067L18.9833 4.33473L11.6113 4.22142ZM13.7327 10.5854C12.9516 9.80433 12.9516 8.53799 13.7327 7.75695C14.5137 6.9759 15.7801 6.9759 16.5611 7.75695C17.3422 8.53799 17.3422 9.80433 16.5611 10.5854C15.7801 11.3664 14.5137 11.3664 13.7327 10.5854Z" />
    </svg>
  );
}

/* ── Tab Panels ── */

type TabType = 'none' | 'shipping' | 'coupon';

/*
 * Panel Ambaz aslinya formulir demo (negara, kode pos, kupon) tanpa fungsi. Di toko, ongkir dihitung dan kupon
 * dipakai di checkout platform, jadi panelnya menjelaskan itu dengan tampilan yang sama.
 */
function InfoPanel({ title, text, onClose, onCheckout }: { title: string; text: string; onClose: () => void; onCheckout: () => void }) {
  return (
    <div style={{ padding: '24px' }}>
      <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#222', marginBottom: '16px' }}>{title}</h4>
      <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.6 }}>{text}</p>
      <Link
        href="/checkout"
        onClick={onCheckout}
        style={{ display: 'block', textAlign: 'center', width: '100%', padding: '14px', backgroundColor: '#F15B41', color: '#fff', fontSize: '16px', fontWeight: 600, border: 'none', borderRadius: '40px', cursor: 'pointer', marginTop: '20px' }}
      >
        Go to checkout
      </Link>
      <button onClick={onClose} style={{ display: 'block', margin: '14px auto 0', fontSize: '15px', fontWeight: 500, color: '#222', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Cancel
      </button>
    </div>
  );
}

/* ── Cart Drawer ── */

export function CartDrawer() {
  const { items, lines, isDrawerOpen, closeDrawer, removeItem, updateQuantity, message, pending, getSubtotal } = useCartStore();
  const productHrefBase = '/products';
  const shopHref = '/products';
  const limitOf = (productId: string, variantId: string) =>
    lines.find((line) => String(line.productId) === productId && String(line.variantId ?? '') === variantId)?.stockLimit ?? null;
  const [activeTab, setActiveTab] = useState<TabType>('none');
  const [giftWrap, setGiftWrap] = useState(false);
  const subtotal = getSubtotal();
  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setActiveTab('none');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isDrawerOpen, closeDrawer]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 9999, transition: 'opacity 250ms ease',
          opacity: isDrawerOpen ? 1 : 0, pointerEvents: isDrawerOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '460px', maxWidth: '100vw',
          backgroundColor: '#fff', zIndex: 9999, display: 'flex', flexDirection: 'column',
          transition: 'transform 350ms ease',
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: isDrawerOpen ? '-4px 0 24px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {/* Header — close button always, title only when items exist */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: items.length > 0 ? 'space-between' : 'flex-end', padding: '20px 24px', borderBottom: items.length > 0 ? '1px solid #f0f0f0' : 'none' }}>
          {items.length > 0 && <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#222' }}>Item added to your cart</h3>}
          <button onClick={closeDrawer} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: '#222' }} aria-label="Close cart">
            <IconClose size={22} />
          </button>
        </div>

        {/* Free shipping bar — only when items exist */}
        {message && <p role="alert" style={{ margin: '16px 24px 0', padding: '12px 16px', borderRadius: '6px', backgroundColor: '#fdecea', color: '#b42318', fontSize: '14px' }}>{message}</p>}
        {/* Batas gratis ongkir: hanya bila tema mengaturnya (FREE_SHIPPING_THRESHOLD > 0). */}
        {items.length > 0 && FREE_SHIPPING_THRESHOLD > 0 && <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: '15px', color: '#555', marginBottom: '10px' }}>
            {shippingRemaining > 0
              ? <>{formatPrice(shippingRemaining)} away from Free Standard Shipping.</>
              : <span style={{ color: '#22c55e', fontWeight: 600 }}>You qualify for Free Standard Shipping!</span>
            }
          </p>
          <div style={{ position: 'relative', height: '8px', backgroundColor: '#e5e5e5', borderRadius: '40px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${shippingPercent}%`, background: 'linear-gradient(90deg, #4ECDC4, #44B09E)', borderRadius: '40px', transition: 'width 500ms ease' }} />
          </div>
          <div style={{ position: 'relative', marginTop: '-14px', left: `calc(${Math.min(shippingPercent, 95)}% - 14px)`, width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #44B09E', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'left 500ms ease' }}>
            <IconShipping size={14} />
          </div>
        </div>}

        {/* Cart items — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '60px' }}>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#222', marginBottom: '20px' }}>Your cart is currently empty.</p>
              <Link
                href={shopHref}
                onClick={closeDrawer}
                style={{
                  display: 'inline-block', padding: '14px 36px', backgroundColor: '#F15B41',
                  color: '#fff', fontSize: '16px', fontWeight: 600, borderRadius: '40px',
                  textDecoration: 'none', transition: 'background-color 250ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F15B41'; }}
              >
                Return to shop
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} style={{ display: 'flex', gap: '16px', padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                {/* Thumbnail */}
                <Link href={`${productHrefBase}/${item.slug}`} onClick={closeDrawer} style={{ width: '90px', height: '110px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f5f5f5', flexShrink: 0, position: 'relative', display: 'block' }}>
                  <Image unoptimized src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="90px" />
                </Link>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#222', marginBottom: '5px' }}>{item.name}</h4>
                  {(item.color || item.size) && <p style={{ fontSize: '15px', color: '#666', marginBottom: '3px' }}>
                    {item.color && <><span style={{ fontWeight: 600, color: '#222' }}>Variant:</span> {item.color} &nbsp;&nbsp;</>}
                    {item.size && <><span style={{ fontWeight: 600, color: '#222' }}>Size:</span> {item.size}</>}
                  </p>}
                  <p style={{ fontSize: '17px', fontWeight: 600, color: '#F15B41', marginBottom: '12px' }}>{formatPrice(item.price)}</p>

                  {/* Quantity + remove */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                        disabled={pending || item.quantity <= 1}
                        style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}
                      >−</button>
                      <span style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 500, color: '#222', borderLeft: '1px solid #e5e5e5', borderRight: '1px solid #e5e5e5' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={pending || (limitOf(item.productId, item.variantId) ?? Infinity) <= item.quantity}
                        style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#222' }}
                      >+</button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      disabled={pending}
                      style={{ fontSize: '15px', color: '#222', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                    >
                      remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Gift wrap */}
          {items.length > 0 && GIFT_WRAP_PRICE > 0 && (
            <div style={{ padding: '18px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#222' }}
              />
              <span style={{ fontSize: '15px', color: '#555' }}>
                For {formatPrice(GIFT_WRAP_PRICE)} per item, please wrap the products in this order.
              </span>
            </div>
          )}
        </div>

        {/* Footer — tabs + subtotal + buttons */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid #e5e5e5' }}>
            {/* Tab buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f0f0f0' }}>
              {[
                { key: 'shipping' as TabType, icon: <IconShipping size={20} />, label: 'Shipping' },
                { key: 'coupon' as TabType, icon: <IconCoupon size={20} />, label: 'Coupon' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(activeTab === tab.key ? 'none' : tab.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 500,
                    color: activeTab === tab.key ? '#F15B41' : '#555',
                    transition: 'color 200ms ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active tab panel — slides up from below */}
            {activeTab !== 'none' && (
              <div style={{ animation: 'cartTabSlideUp 300ms ease-out' }}>
                {activeTab === 'shipping' && <InfoPanel title="Estimate shipping rates" text="Shipping options and costs are calculated at checkout from your delivery address." onClose={() => setActiveTab('none')} onCheckout={closeDrawer} />}
                {activeTab === 'coupon' && <InfoPanel title="Apply a discount code" text="Enter your discount code at checkout; the discount is applied to your order total there." onClose={() => setActiveTab('none')} onCheckout={closeDrawer} />}
              </div>
            )}

            {/* Subtotal + buttons */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '26px', fontWeight: 700, color: '#222' }}>Subtotal</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: '#222' }}>{formatPrice(subtotal)}</span>
              </div>
              <p style={{ fontSize: '15px', color: '#777', marginBottom: '18px' }}>Taxes and shipping calculated at checkout</p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  style={{
                    flex: 1, textAlign: 'center', padding: '14px 0', border: '1.5px solid #222',
                    borderRadius: '40px', fontSize: '15px', fontWeight: 600, color: '#222',
                    textDecoration: 'none', transition: 'all 250ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#222'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#222'; }}
                >
                  View cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  style={{
                    flex: 1, textAlign: 'center', padding: '14px 0', backgroundColor: '#F15B41',
                    color: '#fff', border: 'none', borderRadius: '40px', fontSize: '15px',
                    fontWeight: 600, textDecoration: 'none', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'background-color 250ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F15B41'; }}
                >
                  Check out
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cartTabSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
