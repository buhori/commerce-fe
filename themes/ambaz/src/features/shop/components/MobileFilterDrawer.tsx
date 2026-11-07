'use client';

import { useEffect, useRef, useState } from 'react';
import { SORT_OPTIONS } from '../../../lib/constants';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/* ── Icons ── */

function IconFilter({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconClose({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
    </svg>
  );
}

/* Provided arrow icon — used on main rows (points right) and as the
   sub-view back button (rotated 180°). Single-sourced so the two match. */
function IconArrow({ size = 14, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 14 10"
      fill="none"
      width={size}
      height={(size * 10) / 14}
      aria-hidden="true"
      focusable="false"
      style={{ transform: flip ? 'rotate(180deg)' : undefined, transition: 'transform 220ms ease-in-out' }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.537.808a.5.5 0 01.817-.162l4 4a.5.5 0 010 .708l-4 4a.5.5 0 11-.708-.708L11.793 5.5H1a.5.5 0 010-1h10.793L8.646 1.354a.5.5 0 01-.109-.546z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
    </svg>
  );
}

/* ── Shared subcomponents ── */

function FilterCheckbox({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  // Single button — no nested <input> + <label>. The previous setup fired
  // onChange twice per tap (once from the span's onClick, once from the
  // label delegating to the hidden input), which cancelled the toggle.
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', cursor: 'pointer', fontSize: '15px', color: '#222',
        background: 'none', border: 'none', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            width: '20px', height: '20px', border: `1.5px solid ${checked ? '#222' : '#c5c5c5'}`,
            borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: checked ? '#222' : '#fff', transition: 'all 180ms ease',
            flexShrink: 0,
          }}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count !== undefined && <span style={{ fontSize: '15px', color: '#555' }}>{count}</span>}
    </button>
  );
}

/* ── Types ── */

/*
 * Filter yang didukung katalog platform: kategori (boleh lebih dari satu) dan urutan. Filter demo Ambaz lain
 * (stok, harga, ukuran, merek, warna) tidak punya data di toko, jadi barisnya tidak ditampilkan.
 */
type SubKey = 'category';

interface PendingState {
  categories: number[];
  sort: string;
}

export interface MobileFilterApplyPayload {
  categoryIds: number[];
  sort: string;
}

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: { categories: { id: number; name: string }[] } | undefined;
  selected: PendingState;
  productCount: number | null;
  onApply: (payload: MobileFilterApplyPayload) => void;
  onRemoveAll: () => void;
}

/* ── Component ── */

export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  selected,
  productCount,
  onApply,
  onRemoveAll,
}: MobileFilterDrawerProps) {
  const [view, setView] = useState<'main' | SubKey>('main');
  const [sortOpen, setSortOpen] = useState(false);
  const [pending, setPending] = useState<PendingState>(selected);

  // Isi pilihan dari URL saat laci dibuka (bukan setiap render induk).
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; });
  useEffect(() => {
    if (open) {
      setPending(selectedRef.current);
      setView('main');
      setSortOpen(false);
    }
  }, [open]);

  // Lock body scroll while open — uses the project's shared hook so
  // document.body gets the `.scroll-locked` class (same pattern as drawers
  // and modals elsewhere). Global CSS then hides MobileBottomNav while
  // locked so it can't peek through the drawer at the bottom.
  useLockBodyScroll(open);

  const handleApply = () => {
    onApply({ categoryIds: pending.categories, sort: pending.sort });
    onClose();
  };

  const handleRemoveAll = () => {
    setPending({ categories: [], sort: 'featured' });
    onRemoveAll();
    onClose();
  };

  const handleClearSub = (key: SubKey) => {
    if (key === 'category') setPending((p) => ({ ...p, categories: [] }));
  };

  const rows: { key: SubKey; label: string }[] = filters && filters.categories.length > 0 ? [
    { key: 'category', label: 'Category' },
  ] : [];

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === pending.sort)?.label ?? 'Featured';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 320ms ease-in-out',
          zIndex: 1000,
        }}
      />

      {/* Drawer — slides in from the right, flush to all viewport edges.
          Using top/bottom:0 (plus 100dvh fallback on the class) guarantees
          the drawer covers the exact visible viewport — no bottom gap on
          devices where 100dvh under-measures, no chance of MobileBottomNav
          peeking through below the footer. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filter and sort"
        className="mfd-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(400px, 100vw)',
          backgroundColor: '#fff',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 340ms ease-in-out',
          boxShadow: open ? '0 0 40px rgba(0,0,0,0.18)' : 'none',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ position: 'relative', padding: '14px 20px 12px', borderBottom: '1px solid #eee', textAlign: 'center', flex: '0 0 auto' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#222' }}>Filter and sort</h2>
          {productCount !== null && <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{productCount} products</p>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '14px', right: '18px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#222', padding: '4px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Sliding pane (main ↔ sub) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              width: '200%',
              height: '100%',
              transform: view === 'main' ? 'translateX(0)' : 'translateX(-50%)',
              transition: 'transform 340ms ease-in-out',
            }}
          >
            {/* ── Main view ── */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <nav style={{ padding: '2px 0', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {rows.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    className="mfd-row"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '15px', color: '#222', textAlign: 'left',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 160ms ease',
                    }}
                  >
                    {label}
                    <IconArrow size={14} />
                  </button>
                ))}

                {/* Sort by (inline, accordion-style expand) */}
                <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', color: '#222' }}>SORT BY</span>
                    <button
                      type="button"
                      onClick={() => setSortOpen((v) => !v)}
                      aria-expanded={sortOpen}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'none',
                        border: sortOpen ? '1px solid #222' : '1px solid transparent',
                        padding: '8px 12px', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '15px', color: '#222',
                        transition: 'border-color 220ms ease-in-out',
                      }}
                    >
                      {activeSortLabel}
                      <span style={{ transition: 'transform 260ms ease-in-out', transform: sortOpen ? 'rotate(180deg)' : 'none', display: 'inline-flex' }}>
                        <IconChevronDown size={14} />
                      </span>
                    </button>
                  </div>

                  {/* Accordion: grid-template-rows 0fr → 1fr so the list
                      opens/closes smoothly and auto-sizes to content.
                      The list is anchored to the right (under the trigger)
                      and capped at ~240px so all options fit without any
                      internal scroll. */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: sortOpen ? '1fr' : '0fr',
                      opacity: sortOpen ? 1 : 0,
                      transition: 'grid-template-rows 320ms ease-in-out, opacity 260ms ease-in-out',
                      marginTop: sortOpen ? '10px' : '0',
                    }}
                  >
                    <div style={{ overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '240px', maxWidth: '100%', border: '1px solid #222', borderRadius: '2px', backgroundColor: '#fff' }}>
                        {SORT_OPTIONS.map((o) => {
                          const active = pending.sort === o.value;
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => {
                                setPending((p) => ({ ...p, sort: o.value }));
                                setSortOpen(false);
                              }}
                              style={{
                                display: 'block', width: '100%',
                                padding: '6px 12px',
                                backgroundColor: active ? '#2546f0' : '#fff',
                                color: active ? '#fff' : '#222',
                                border: 'none', textAlign: 'left', cursor: 'pointer',
                                fontSize: '13px', lineHeight: 1.4,
                                transition: 'background-color 180ms ease-in-out, color 180ms ease-in-out',
                              }}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Footer (main) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 20px', borderTop: '1px solid #eee', backgroundColor: '#fff', flex: '0 0 auto' }}>
                <button type="button" onClick={handleRemoveAll} style={{ fontSize: '14px', color: '#222', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 500 }}>
                  Remove all
                </button>
                <button type="button" onClick={handleApply} className="mfd-apply-btn">
                  Apply
                </button>
              </div>
            </div>

            {/* ── Sub view ── */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '14px 20px', overflow: 'hidden', minHeight: 0 }}>
                <button
                  type="button"
                  onClick={() => setView('main')}
                  aria-label="Back to filters"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#222', fontWeight: 500, marginBottom: '20px', padding: 0 }}
                >
                  <IconArrow size={14} flip />
                  {view !== 'main' && view.charAt(0).toUpperCase() + view.slice(1)}
                </button>

                {/* Content per sub-view. */}
                {filters && view === 'category' && (
                  <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
                    {filters.categories.map((c) => {
                      const checked = pending.categories.includes(c.id);
                      return (
                        <FilterCheckbox
                          key={c.id}
                          label={c.name}
                          checked={checked}
                          onChange={() => setPending((p) => ({ ...p, categories: checked ? p.categories.filter((id) => id !== c.id) : [...p.categories, c.id] }))}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer (sub) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 20px', borderTop: '1px solid #eee', backgroundColor: '#fff', flex: '0 0 auto' }}>
                <button type="button" onClick={() => view !== 'main' && handleClearSub(view)} style={{ fontSize: '14px', color: '#222', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 500 }}>
                  Clear
                </button>
                <button type="button" onClick={() => setView('main')} className="mfd-apply-btn">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        /* Height is derived from top:0 + bottom:0 on the aside — no explicit
           height is set, otherwise CSS would over-constrain the box and make
           the browser honor the height while ignoring bottom, which can push
           the footer offscreen on viewports where 100vh > visible area. */
        .mfd-row:hover { background-color: #f9f9f9; }
        .mfd-apply-btn {
          min-width: 140px;
          padding: 13px 28px;
          background-color: #000;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 40px;
          cursor: pointer;
          transition: background-color 220ms ease;
        }
        .mfd-apply-btn:hover { background-color: #F15B41; }
      `}</style>
    </>
  );
}

export { IconFilter };
