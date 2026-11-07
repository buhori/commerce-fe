'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useCustomer } from '@sellosy/theme';
import { useCartStore } from '../../../store/cartStore';
import { QuantitySelector } from '../../../components/ui/QuantitySelector';
import { FeaturedSlider } from '../../home/components/FeaturedSlider';
import { formatPrice } from '../../../utils/formatPrice';
import { FREE_SHIPPING_THRESHOLD, GIFT_WRAP_PRICE } from '../../../lib/constants';

const ACCENT = '#c96742';


/* ── Icons ───────────────────────────────────────────────────── */

function IcoTruck({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1" y="3" width="14" height="12" rx="1" />
      <path d="M15 8h4l3 3.5V18h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="18.5" cy="18.5" r="2" />
    </svg>
  );
}

function IcoReturn({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.13" />
    </svg>
  );
}

function IcoShield({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IcoGift({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IcoPercent() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function IcoLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IcoClose() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease', flexShrink: 0 }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

/* ── Shared sub-components ───────────────────────────────────── */

function TrustBadges() {
  const badges = [
    { Icon: IcoTruck, title: 'Fast Shipping', desc: 'Tracked delivery' },
    { Icon: IcoReturn, title: 'Easy Returns', desc: 'Contact us about your order' },
    { Icon: IcoShield, title: 'Secure Payment', desc: 'Protected checkout' },
  ];
  return (
    <div className="cp-trust">
      {badges.map(({ Icon, title, desc }) => (
        <div key={title} className="cp-trust-card">
          <Icon />
          <p className="cp-trust-title">{title}</p>
          <p className="cp-trust-desc">{desc}</p>
        </div>
      ))}
    </div>
  );
}

function GiftOptions({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="cp-gift-box">
      <h3 className="cp-gift-heading">
        <IcoGift /> Gift Options
      </h3>
      <label className="cp-gift-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="cp-gift-check"
        />
        <span>
          For <strong>{formatPrice(GIFT_WRAP_PRICE)}</strong> per item, please wrap the products in this order.
        </span>
      </label>
    </div>
  );
}

function AccordionSection({
  icon, title, children, defaultOpen = true,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cp-accord">
      <button className="cp-accord-head" onClick={() => setOpen(!open)}>
        <span className="cp-accord-icon">{icon}</span>
        <span className="cp-accord-title">{title}</span>
        <IcoChevron open={open} />
      </button>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="cp-accord-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

/**
 * Halaman keranjang Ambaz dengan keranjang platform. Formulir demo Ambaz (kode promo, estimasi ongkir, catatan) tidak
 * punya fungsi; kupon dan ongkir ada di checkout platform, jadi panelnya menjelaskan itu. `maintenance`: toko dalam
 * perawatan, keranjang tetap bisa diubah tetapi checkout ditutup.
 */
export function CartPageContent({ maintenance = false, maintenanceNote = '' }: { maintenance?: boolean; maintenanceNote?: string }) {
  const { items, lines, status, pending, message, removeItem, updateQuantity, getSubtotal, getFreeShippingRemaining } = useCartStore();
  const { customer } = useCustomer();
  const [giftWrap, setGiftWrap] = useState(false);
  const limitOf = (productId: string, variantId: string) =>
    lines.find((line) => String(line.productId) === productId && String(line.variantId ?? '') === variantId)?.stockLimit ?? null;
  const stockProblem = lines.some((line) => line.stockLimit !== null && line.quantity > line.stockLimit);

  const subtotal = getSubtotal();
  const shippingRemaining = getFreeShippingRemaining();
  const giftTotal = giftWrap ? items.reduce((s, i) => s + i.quantity, 0) * GIFT_WRAP_PRICE : 0;
  const total = subtotal + giftTotal;
  const shippingPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (status === 'loading') {
    return (
      <>
        <div className="container-main" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
          <h1 className="cp-page-title">Your Shopping Cart</h1>
          <p className="cp-account-text" aria-busy="true">Loading your cart…</p>
        </div>
        <style>{cpStyles}</style>
      </>
    );
  }

  /* ── Empty state ─────────────────────────────────── */
  if (items.length === 0) {
    return (
      <>
        <div className="container-main" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
          <h1 className="cp-page-title">Your Shopping Cart</h1>

          <div className="cp-empty-center">
            {status === 'error' && <p className="cp-account-text" role="alert">Your cart could not be loaded. Please refresh the page.</p>}
            <Link href="/products" className="cp-return-btn">Return to shop</Link>
            {!customer && <div className="cp-account-block">
              <h2 className="cp-account-heading">Have an account?</h2>
              <p className="cp-account-text">
                <Link href="/login?next=%2Fcart" className="cp-login-link">Log in</Link>{' '}to check out faster.
              </p>
            </div>}
          </div>

          <TrustBadges />
          {GIFT_WRAP_PRICE > 0 && <GiftOptions checked={false} onChange={() => {}} />}
        </div>

        <div style={{ paddingBottom: '80px' }}>
          <FeaturedSlider title="You may also like" />
        </div>
        <style>{cpStyles}</style>
      </>
    );
  }

  /* ── Filled cart ─────────────────────────────────── */
  return (
    <>
      <div className="container-main" style={{ paddingTop: '36px', paddingBottom: '80px' }}>
        <h1 className="cp-page-title">Your Shopping Cart</h1>
        {message && <p role="alert" className="cp-alert">{message}</p>}

        <div className="cp-layout">

          {/* ── Left column ── */}
          <div className="cp-left">

            {/* Cart items box */}
            <div className="cp-cart-box">
              <div className="cp-cart-head">
                <span className="cp-cart-label">Your cart</span>
                <span className="cp-cart-count">{items.length} product{items.length !== 1 ? 's' : ''}</span>
              </div>

              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="cp-item" style={{ position: 'relative' }}>
                  <Link href={`/products/${item.slug}`} className="cp-item-img">
                    <Image
                      unoptimized
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="100px"
                      style={{ objectFit: 'contain' }}
                    />
                  </Link>
                  <div className="cp-item-body">
                    {item.vendor && <span className="cp-item-vendor">{item.vendor}</span>}
                    <p className="cp-item-name">{item.name}</p>
                    {item.color && <p className="cp-item-attr">Variant: {item.color}</p>}
                    {(() => {
                      const limit = limitOf(item.productId, item.variantId);
                      if (limit === null) return null;
                      if (item.quantity > limit) return <p className="cp-item-attr" role="alert" style={{ color: '#b42318' }}>{limit === 0 ? 'Out of stock — remove this item to check out.' : `Only ${limit} left — reduce the quantity.`}</p>;
                      return limit <= 5 ? <p className="cp-item-attr">Only {limit} left</p> : null;
                    })()}
                    {item.size && item.size !== 'default' && (
                      <p className="cp-item-attr">Size:{item.size}</p>
                    )}
                    <div className="cp-item-foot">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={(qty) => updateQuantity(item.productId, item.variantId, qty)}
                        max={limitOf(item.productId, item.variantId) ?? 99}
                        disabled={pending}
                      />
                      <span className="cp-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    disabled={pending}
                    className="cp-item-x"
                    aria-label="Remove item"
                    style={{ position: 'absolute', top: '18px', right: '20px' }}
                  >
                    <IcoClose />
                  </button>
                </div>
              ))}
            </div>

            <TrustBadges />
            {GIFT_WRAP_PRICE > 0 && <GiftOptions checked={giftWrap} onChange={setGiftWrap} />}
          </div>

          {/* ── Right sidebar ── */}
          <div className="cp-right">

            {/* Promo code: dipakai di checkout platform. */}
            <AccordionSection icon={<IcoPercent />} title="Promo Code">
              <p className="cp-char-count" style={{ fontSize: '14px', lineHeight: 1.6 }}>Enter your discount code at checkout; the discount is applied to your order total there.</p>
            </AccordionSection>

            {/* Estimate shipping: dihitung di checkout dari alamat pengiriman. */}
            <AccordionSection icon={<IcoTruck size={14} />} title="Estimate Shipping">
              <p className="cp-char-count" style={{ fontSize: '14px', lineHeight: 1.6 }}>Shipping options and costs are calculated at checkout from your delivery address.</p>
            </AccordionSection>

            {/* Order summary */}
            <div className="cp-summary">
              <h3 className="cp-summary-title">Order Summary</h3>

              {FREE_SHIPPING_THRESHOLD > 0 && <>
              <p className="cp-ship-msg">
                {shippingRemaining > 0
                  ? <>{formatPrice(shippingRemaining)} away from Free Standard Shipping.</>
                  : 'You qualify for free standard shipping!'
                }
              </p>

              <div className="cp-progress-track">
                <div className="cp-progress-fill" style={{ width: `${shippingPct}%` }} />
                <div className="cp-progress-thumb" style={{ left: `calc(${shippingPct}% - 14px)` }}>
                  <IcoTruck size={11} />
                </div>
              </div>
              </>}

              <div className="cp-totals">
                <div className="cp-total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {giftWrap && (
                  <div className="cp-total-row">
                    <span>Gift wrapping</span>
                    <span>{formatPrice(giftTotal)}</span>
                  </div>
                )}
                <div className="cp-total-row cp-total-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <p className="cp-tax-note">Taxes and shipping calculated at checkout</p>

              {stockProblem ? (
                <p className="cp-alert" role="alert">Adjust items that exceed the available stock before checking out.</p>
              ) : maintenance ? (
                <>
                  <button className="cp-checkout-btn" disabled><IcoLock /> Secure Checkout</button>
                  <p className="cp-tax-note" role="status">{maintenanceNote}</p>
                </>
              ) : (
                <Link href="/checkout" className="cp-checkout-btn">
                  <IcoLock /> Secure Checkout
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      <FeaturedSlider title="You may also like" />
      <style>{cpStyles}</style>
    </>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */

const cpStyles = `
  /* page title */
  .cp-page-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 80px;
  }

  /* ── empty state ── */
  .cp-empty-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 0 36px;
  }
  .cp-return-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: ${ACCENT};
    color: #fff;
    font-size: 16px;
    font-weight: 500;
    padding: 13px 36px;
    border-radius: 9999px;
    text-decoration: none;
    transition: opacity 0.2s;
    margin-bottom: 36px;
  }
  .cp-return-btn:hover { opacity: 0.85; }
  .cp-account-block { text-align: center; }
  .cp-account-heading {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 5px;
  }
  .cp-account-text { font-size: 15px; color: var(--color-body); }
  .cp-login-link { color: var(--color-heading); text-decoration: underline; }

  /* ── trust badges ── */
  .cp-trust {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 0;
  }
  .cp-trust-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 24px 18px;
    color: #666;
  }
  .cp-trust-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-heading);
    margin-top: 12px;
    margin-bottom: 5px;
  }
  .cp-trust-desc {
    font-size: 13.5px;
    color: ${ACCENT};
  }

  /* ── gift options ── */
  .cp-gift-box {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 20px 24px;
  }
  .cp-gift-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 16.5px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 14px;
  }
  .cp-gift-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: var(--color-body);
    cursor: pointer;
  }
  .cp-gift-check {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
    cursor: pointer;
    accent-color: ${ACCENT};
  }

  /* ── two-column layout ── */
  .cp-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 30%;
    gap: 24px;
    align-items: start;
  }
  /* 80px gap between left-column sections */
  .cp-left { display: flex; flex-direction: column; gap: 80px; }

  /* right sidebar: bordered card + sticky */
  .cp-right {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    background: #fff;
    scrollbar-width: none;
  }
  .cp-right::-webkit-scrollbar { display: none; }

  /* ── your cart box ── */
  .cp-cart-box {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
  }
  .cp-cart-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #e8e8e8;
  }
  .cp-cart-label {
    font-size: 16.5px;
    font-weight: 700;
    color: var(--color-heading);
  }
  .cp-cart-count {
    font-size: 14.5px;
    color: #888;
  }

  /* ── cart item row ── */
  .cp-item {
    display: flex;
    gap: 18px;
    padding: 22px 24px 22px 20px;
    border-bottom: 1px solid #e8e8e8;
  }
  .cp-item:last-child { border-bottom: none; }
  .cp-item-img {
    position: relative;
    width: 100px;
    height: 110px;
    flex-shrink: 0;
    background: #f5f5f5;
    border-radius: 6px;
    overflow: hidden;
    display: block;
  }
  .cp-item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding-right: 34px;
  }
  .cp-item-vendor {
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${ACCENT};
    margin-bottom: 3.5px;
  }
  .cp-item-x {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border: 1px solid #d0d0d0;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #888;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .cp-item-x:hover { background: #f5f5f5; border-color: #999; color: #333; }
  .cp-item-name {
    font-size: 16.5px;
    font-weight: 600;
    color: var(--color-heading);
    line-height: 1.4;
    margin-bottom: 3.5px;
  }
  .cp-item-attr {
    font-size: 14.5px;
    color: ${ACCENT};
    line-height: 1.6;
  }
  .cp-item-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 14px;
  }
  .cp-item-price {
    font-size: 17.5px;
    font-weight: 600;
    color: var(--color-heading);
  }

  /* ── accordion sections (inside bordered cp-right card) ── */
  .cp-accord {
    border-bottom: 1px solid #e5e5e5;
  }
  .cp-accord:last-of-type {
    border-bottom: none;
  }
  .cp-accord-head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 17px 20px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  .cp-accord-head:hover { background: #fafafa; }
  .cp-accord-icon {
    display: flex;
    align-items: center;
    color: #666;
    flex-shrink: 0;
  }
  .cp-accord-title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-heading);
  }
  .cp-accord-body {
    padding: 0 20px 20px;
  }

  /* ── promo code ── */
  .cp-promo-row { display: flex; gap: 9px; align-items: center; }
  .cp-promo-input {
    flex: 1;
    height: 44px;
    border: 1px solid #e0e0e0;
    border-radius: 9999px;
    padding: 0 16px;
    font-size: 14.5px;
    color: var(--color-heading);
    outline: none;
    font-family: inherit;
    background: #fff;
    min-width: 0;
  }
  .cp-promo-input::placeholder { color: #aaa; }
  .cp-promo-input:focus { border-color: #bbb; }
  .cp-apply-btn {
    background: ${ACCENT};
    color: #fff;
    font-size: 14.5px;
    font-weight: 600;
    padding: 0 22px;
    height: 44px;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.2s;
    font-family: inherit;
  }
  .cp-apply-btn:hover { opacity: 0.85; }

  /* ── estimate shipping ── */
  .cp-ship-fields { display: flex; flex-direction: column; gap: 9px; }
  .cp-field-label {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--color-heading);
    margin-bottom: 1px;
  }
  .cp-select {
    width: 100%;
    height: 42px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0 12px;
    font-size: 14.5px;
    color: #555;
    background: #fff;
    outline: none;
    cursor: pointer;
    font-family: inherit;
  }
  .cp-select:focus { border-color: #bbb; }
  .cp-input-wrap { position: relative; }
  .cp-text-input {
    width: 100%;
    height: 42px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0 38px 0 12px;
    font-size: 14.5px;
    color: var(--color-heading);
    outline: none;
    background: #fff;
    font-family: inherit;
  }
  .cp-text-input::placeholder { color: #aaa; }
  .cp-text-input:focus { border-color: #bbb; }
  .cp-input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    display: flex;
    pointer-events: none;
  }
  .cp-calc-btn {
    width: 100%;
    background: ${ACCENT};
    color: #fff;
    font-size: 15.5px;
    font-weight: 600;
    height: 46px;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: inherit;
    margin-top: 6px;
  }
  .cp-calc-btn:hover { opacity: 0.85; }

  /* ── order instructions ── */
  .cp-notes-wrap { display: flex; flex-direction: column; gap: 7px; }
  .cp-notes-area {
    width: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 11px 13px;
    font-size: 14.5px;
    color: var(--color-heading);
    outline: none;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
    background: #fff;
    min-height: 90px;
  }
  .cp-notes-area:focus { border-color: #bbb; }
  .cp-char-count { font-size: 12.5px; color: #aaa; text-align: right; }

  /* ── order summary (bottom of right card) ── */
  .cp-summary {
    padding: 20px 20px 22px;
    border-top: 1px solid #e5e5e5;
  }
  .cp-summary-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 14px;
  }
  .cp-ship-msg {
    font-size: 14.5px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .cp-progress-track {
    position: relative;
    width: 100%;
    height: 5px;
    background: #e8e8e8;
    border-radius: 9999px;
    overflow: visible;
    margin-bottom: 28px;
    margin-top: 4px;
  }
  .cp-progress-fill {
    height: 100%;
    background: #e87070;
    border-radius: 9999px;
    transition: width 0.5s ease;
  }
  .cp-progress-thumb {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    background: #fff;
    border: 2px solid #e87070;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e87070;
    transition: left 0.5s ease;
    z-index: 1;
  }
  .cp-totals {
    border-top: 1px solid #e8e8e8;
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .cp-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    color: #666;
    padding: 5.5px 0;
  }
  .cp-total-row span:last-child { color: var(--color-heading); }
  .cp-total-bold {
    border-top: 1px solid #e8e8e8;
    margin-top: 6px;
    padding-top: 10px;
    font-size: 16.5px;
    font-weight: 700;
  }
  .cp-total-bold span { color: var(--color-heading) !important; font-weight: 700; }
  .cp-alert { margin: 0 0 16px; padding: 12px 16px; border-radius: 6px; background: #fdecea; color: #b42318; font-size: 14px; }
  .cp-checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cp-tax-note {
    font-size: 13px;
    color: #aaa;
    margin: 11px 0 18px;
    line-height: 1.4;
  }
  .cp-checkout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    background: #111;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    height: 54px;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s;
    font-family: inherit;
    letter-spacing: 0.01em;
  }
  .cp-checkout-btn:hover { background: #2d2d2d; }

  /* ── responsive ── */
  @media (max-width: 749px) {
    .cp-layout { grid-template-columns: 1fr; }
    .cp-trust { grid-template-columns: 1fr; }
    .cp-left { gap: 40px; }
    .cp-right {
      position: static;
      max-height: none;
      overflow-y: visible;
    }
  }
  @media (min-width: 750px) and (max-width: 1023px) {
    .cp-layout { grid-template-columns: minmax(0, 1fr) 280px; }
  }
`;
