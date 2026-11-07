'use client';

import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { catalogUrl, useProductFeed, type CatalogSort, type Category, type ProductListing } from '@sellosy/theme';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toAmbazProduct } from '../../../lib/adapt';
import { HomeProductCard } from '../../home/components/HomeProductCard';
import { FeaturedSlider, type FeaturedCardTheme } from '../../home/components/FeaturedSlider';
import { MobileFilterDrawer, IconFilter } from './MobileFilterDrawer';
import { SORT_OPTIONS } from '../../../lib/constants';
import type { Product } from '../../../types/product';

/* ── Icons ── */

/* 2-col icon */
function IconCol2() {
  return (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5.5 12.5" width="12" height="14">
      <path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z" fillRule="evenodd" />
      <path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z" fillRule="evenodd" />
    </svg>
  );
}

/* 3-col icon */
function IconCol3() {
  return (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9.5 12.5" width="14" height="14">
      <path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z" fillRule="evenodd" />
      <path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z" fillRule="evenodd" />
      <path d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z" fillRule="evenodd" />
    </svg>
  );
}

/* 4-col icon */
function IconCol4() {
  return (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.5 12.5" width="16" height="14">
      <path d="M.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 01.75 0z" fillRule="evenodd" />
      <path d="M4.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 014.75 0z" fillRule="evenodd" />
      <path d="M8.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 018.75 0z" fillRule="evenodd" />
      <path d="M12.75 0a.76.76 0 01.75.75v11a.76.76 0 01-.75.75.76.76 0 01-.75-.75v-11A.76.76 0 0112.75 0z" fillRule="evenodd" />
    </svg>
  );
}

/* Sort icon */
function IconSort() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" width="16" height="10" fill="currentColor">
      <path d="m0 0h16v2h-16zm0 4h12v2h-12zm0 4h8v2h-8z" />
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

/* ── Shop theme ── */

export interface ShopPageTheme {
  headerBg: string;
  toolbarBg: string;
  sidebarBg: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  accentColor: string;
  inputBg: string;
  tagBg: string;
}

const DEFAULT_THEME: ShopPageTheme = {
  headerBg: 'rgb(247, 248, 252)',
  toolbarBg: 'rgb(247, 248, 252)',
  sidebarBg: 'rgb(247, 248, 252)',
  textColor: '#222',
  mutedColor: '#555',
  borderColor: '#e5e5e5',
  accentColor: '#222',
  inputBg: '#fff',
  tagBg: '#fff',
};

const ShopThemeCtx = createContext<ShopPageTheme>(DEFAULT_THEME);

/* ── Filter Group ── */

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const theme = useContext(ShopThemeCtx);
  return (
    <div style={{ borderBottom: `1px solid ${theme.borderColor}`, paddingBottom: '20px', marginBottom: '20px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="filter-group-title"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', fontWeight: 700, color: theme.textColor, padding: '0 0 4px' }}
      >
        {title}
        <span style={{ transition: 'transform 300ms ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-flex' }}>
          <IconChevronDown size={14} />
        </span>
      </button>
      {isOpen && <div style={{ paddingTop: '14px' }}>{children}</div>}
    </div>
  );
}

/* ── Custom Checkbox ── */

function FilterCheckbox({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  const theme = useContext(ShopThemeCtx);
  return (
    <label className="filter-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 0', fontSize: '14px', color: theme.mutedColor }}>
      <span
        className="filter-cb"
        style={{
          width: '20px', height: '20px', borderRadius: '3px', flexShrink: 0,
          border: checked ? `2px solid ${theme.accentColor}` : `2px solid ${theme.borderColor}`,
          backgroundColor: checked ? theme.accentColor : theme.inputBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 200ms ease',
        }}
      >
        {checked && (
          <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
            <path d="M1.5 3.5L2.83333 4.75L4.16667 6L9.5 1" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{label}</span>
      {count !== undefined && <span style={{ color: theme.borderColor, marginLeft: 'auto', fontSize: '15px' }}>{count}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

/* ── Filter Sidebar ── */

/* ── Active Filter Tag ── */

function IconCloseSmall() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.48627 9.32917L2.82849 3.67098" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.88539 9.38504L8.42932 3.61524" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  const theme = useContext(ShopThemeCtx);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', color: theme.mutedColor, border: `1px solid ${theme.borderColor}`, borderRadius: '40px', backgroundColor: theme.tagBg, marginBottom: '8px', marginRight: '8px' }}>
      {label}
      <button className="filter-tag-remove" onClick={onRemove} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: theme.mutedColor, padding: 0 }}>
        <IconCloseSmall />
      </button>
    </span>
  );
}

/* ── Filter Sidebar ── */

/*
 * Sidebar filter Ambaz dengan filter yang didukung katalog platform: kategori (boleh lebih dari satu). Grup demo
 * Ambaz lain (stok, harga, merek, warna, ukuran) tidak punya data di toko, jadi tidak ditampilkan.
 */
function FilterSidebar({ categories, selected, onToggle, onRemoveAll }: {
  categories: Category[];
  selected: number[];
  onToggle: (id: number) => void;
  onRemoveAll: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const theme = useContext(ShopThemeCtx);

  if (categories.length === 0) return null;
  const active = categories.filter((c) => selected.includes(c.id));

  return (
    <div style={{ backgroundColor: theme.sidebarBg, borderRadius: '8px', padding: '28px', overflow: 'hidden' }}>
      {/* Header with Remove all */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 className="filter-group-title" style={{ fontSize: '20px', fontWeight: 700, color: theme.textColor, margin: 0 }}>Filter:</h3>
        {active.length > 0 && (
          <button className="filter-remove-all" onClick={onRemoveAll} style={{ fontSize: '14px', color: '#F15B41', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Remove all
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {active.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap' }}>
          {active.map((c) => <FilterTag key={c.id} label={`Category: ${c.name}`} onRemove={() => onToggle(c.id)} />)}
        </div>
      )}

      <FilterGroup title="Category">
        {(showMore ? categories : categories.slice(0, 10)).map((c) => (
          <FilterCheckbox key={c.id} label={c.name} checked={selected.includes(c.id)} onChange={() => onToggle(c.id)} />
        ))}
        {categories.length > 10 && (
          <button onClick={() => setShowMore(!showMore)} className="filter-show-more" style={{ fontSize: '14px', color: theme.textColor, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 0' }}>
            {showMore ? '- Show less' : '+ Show more'}
          </button>
        )}
      </FilterGroup>
    </div>
  );
}

/* ── Pagination ── */

/*
 * Pagination Ambaz bernomor; katalog platform memuat halaman berikutnya setelah produk terakhir (tanpa nomor
 * halaman), jadi produk berikutnya dimuat otomatis saat digulir, dengan tombol bergaya Ambaz bila perlu.
 */
function ShopLoadMore({ feed }: { feed: ReturnType<typeof useProductFeed> }) {
  const theme = useContext(ShopThemeCtx);
  if (!feed.hasMore) return null;
  return (
    <div ref={feed.sentinel} aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '50px', paddingBottom: '10px' }}>
      {feed.status === 'error' && <p role="alert" style={{ fontSize: '15px', color: theme.mutedColor }}>The next products could not be loaded.</p>}
      {feed.status === 'loading' ? <div className="filter-spinner" /> : (feed.status === 'error' || !feed.autoLoad) && (
        <button
          onClick={() => void feed.loadMore()}
          style={{ padding: '12px 32px', borderRadius: '40px', border: 'none', backgroundColor: theme.accentColor, color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
        >
          Load more
        </button>
      )}
    </div>
  );
}


/* ── Main Component ── */

interface ShopPageContentProps {
  /** Halaman pertama produk dari platform (null bila gagal dimuat). */
  listing: ProductListing | null;
  /** Semua kategori toko, untuk filter. */
  categories: Category[];
  /** Kategori halaman /c/{slug}; null untuk /products. */
  category: Category | null;
  /** Kategori yang dipilih lewat filter (?category_id[]=…). */
  categoryIds: number[];
  q: string;
  sort: CatalogSort | undefined;
  /** Base href for linking to product detail pages. */
  productHrefBase?: string;
  title?: string;
  homeLabel?: string;
  homeHref?: string;
  breadcrumbLabel?: string;
  cardTheme?: FeaturedCardTheme;
  shopTheme?: Partial<ShopPageTheme>;
  /** Custom card renderer — when provided, replaces the built-in HomeProductCard. */
  renderCard?: (product: Product, index: number) => React.ReactNode;
}

/** Urutan Ambaz ↔ urutan katalog platform. */
const TO_SORT: Record<string, CatalogSort | undefined> = { featured: undefined, 'best-selling': 'top_sale', 'price-asc': 'price_asc', 'price-desc': 'price_desc', newest: 'latest' };
const FROM_SORT: Record<string, string> = { top_sale: 'best-selling', price_asc: 'price-asc', price_desc: 'price-desc', latest: 'newest', top_rating: 'featured' };

/**
 * Halaman toko/kategori Ambaz (features/shop/components/ShopPageContent.tsx) dengan katalog platform: kategori, urutan,
 * pencarian, dan muat-lanjut dari /products dan /c/{slug}.
 */
export function ShopPageContent(props: ShopPageContentProps) {
  // Daftar dimulai ulang saat kategori, pencarian, atau urutan berganti.
  return <ShopPageInner key={JSON.stringify(props.listing?.query ?? null)} {...props} />;
}

const EMPTY_LISTING: ProductListing = { items: [], hasMore: false, lastProductId: null, query: {} };

function ShopPageInner({
  listing,
  categories,
  category,
  categoryIds,
  q,
  sort: platformSort,
  productHrefBase = '/products',
  title = 'PRODUCTS',
  homeLabel = 'Home',
  homeHref = '/',
  breadcrumbLabel = 'Products',
  cardTheme,
  shopTheme,
  renderCard,
}: ShopPageContentProps) {
  const theme: ShopPageTheme = { ...DEFAULT_THEME, ...shopTheme };
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const viewCols: 2 | 3 | 4 = viewParam === '2' ? 2 : viewParam === '3' ? 3 : 4;
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const feed = useProductFeed(listing ?? EMPTY_LISTING);
  const products = feed.products.map((product) => toAmbazProduct(product));
  const sort = platformSort ? FROM_SORT[platformSort] ?? 'featured' : 'featured';
  const selectedCategories = useMemo(() => (category ? [category.id] : categoryIds), [category, categoryIds]);

  /** Alamat katalog untuk pilihan baru; tampilan kolom (?view) ikut dibawa. */
  const go = useCallback((next: { categoryIds?: number[]; sort?: string }) => {
    const ids = next.categoryIds ?? selectedCategories;
    const single = ids.length === 1 ? categories.find((c) => c.id === ids[0]) : undefined;
    let url = catalogUrl({
      category: single?.slug,
      categoryIds: single ? [] : ids,
      q: q || undefined,
      sort: TO_SORT[next.sort ?? sort],
    });
    if (viewParam) url += `${url.includes('?') ? '&' : '?'}view=${viewParam}`;
    router.push(url, { scroll: false });
  }, [selectedCategories, categories, q, sort, viewParam, router]);

  const setViewCols = useCallback((cols: 2 | 3 | 4) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', String(cols));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const toggleCategory = (id: number) =>
    go({ categoryIds: selectedCategories.includes(id) ? selectedCategories.filter((c) => c !== id) : [...selectedCategories, id] });

  return (
    <ShopThemeCtx.Provider value={theme}>
      {/* Page Header */}
      <div className="container-main" style={{ paddingTop: '30px' }}>
        <div style={{ backgroundColor: theme.headerBg, borderRadius: '10px', height: '120px', display: 'flex', alignItems: 'center', padding: '0 40px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, color: theme.textColor, marginBottom: '6px' }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
              <Link href={homeHref} style={{ color: theme.mutedColor, textDecoration: 'underline', textUnderlineOffset: '3px' }}>{homeLabel}</Link>
              <span style={{ color: '#bbb' }}>/</span>
              <span style={{ color: theme.textColor }}>{breadcrumbLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', backgroundColor: theme.toolbarBg, borderRadius: '0', padding: '0 20px', marginBottom: '30px', marginTop: '20px' }}>
          {/* Left: Desktop view toggles — hidden at <=749px */}
          <div className="shop-view-toggles" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {([
              { cols: 2 as const, Icon: IconCol2 },
              { cols: 3 as const, Icon: IconCol3 },
              { cols: 4 as const, Icon: IconCol4 },
            ]).map(({ cols, Icon }) => (
              <button
                key={cols}
                onClick={() => setViewCols(cols)}
                style={{
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid', borderColor: viewCols === cols ? theme.accentColor : theme.borderColor,
                  backgroundColor: viewCols === cols ? theme.accentColor : theme.inputBg,
                  color: viewCols === cols ? '#fff' : theme.mutedColor,
                  cursor: 'pointer', borderRadius: '4px', transition: 'all 200ms ease',
                }}
              >
                <Icon />
              </button>
            ))}
          </div>

          {/* Left: Mobile "Filter and sort" button — shown only at <=749px */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="shop-mobile-filter-btn"
            aria-label="Open filter and sort"
          >
            <IconFilter size={18} />
            <span>Filter and sort</span>
          </button>

          {/* Right: Sort + count (desktop).
              On mobile the Sort dropdown is hidden and only the count remains. */}
          <div className="shop-sort-group" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Sort By dropdown — hidden at <=749px via .shop-sort-dropdown */}
            <div className="shop-sort-dropdown" style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: 600, color: theme.textColor, letterSpacing: '0.5px',
                }}
              >
                <IconSort />
                SORT BY
              </button>

              {sortOpen && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 28px)', right: 0,
                    minWidth: '260px', backgroundColor: theme.inputBg, border: `1px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '10px 0', zIndex: 50,
                    animation: 'slideUp 200ms ease-out',
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className="sort-dropdown-item"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px',
                        fontSize: '15px', color: theme.textColor, cursor: 'pointer',
                      }}
                      onClick={() => { go({ sort: o.value }); setSortOpen(false); }}
                    >
                      <span style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: sort === o.value ? `5px solid ${theme.accentColor}` : `2px solid ${theme.borderColor}`,
                        display: 'inline-block', transition: 'all 200ms ease',
                      }} />
                      {o.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Product count (katalog platform memuat bertahap, jadi yang tampil adalah jumlah yang sudah dimuat) */}
            <span style={{ fontSize: '15px', fontWeight: 500, color: theme.textColor, minWidth: '90px', textAlign: 'right', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ animation: 'filterFadeIn 400ms ease' }}>
                {listing ? `${products.length}${feed.hasMore ? '+' : ''} products` : ''}
              </span>
            </span>
          </div>
        </div>

        {/* Main content: Filter + Products */}
        <div className="shop-main-row" style={{ display: 'flex', gap: '40px', paddingBottom: '60px' }}>
          {/* Sidebar — hidden at <=749px (replaced by mobile drawer) */}
          <div className="shop-sidebar" style={{ width: '290px', flexShrink: 0 }}>
            <FilterSidebar
              categories={categories}
              selected={selectedCategories}
              onToggle={toggleCategory}
              onRemoveAll={() => go({ categoryIds: [] })}
            />
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, position: 'relative' }}>
            {!listing && (
              <p role="alert" style={{ fontSize: '16px', color: theme.mutedColor, padding: '40px 0' }}>
                Products could not be loaded. <a href="" style={{ textDecoration: 'underline' }}>Try again</a>
              </p>
            )}
            {listing && products.length === 0 && (
              <p style={{ fontSize: '16px', color: theme.mutedColor, padding: '40px 0' }}>
                {q ? `No products found for “${q}”.` : 'No products in this collection yet.'}
              </p>
            )}

            <div className="shop-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${viewCols}, 1fr)`, gap: '24px' }}>
              {products.map((product, i) => (
                renderCard ? (
                  <div key={product.id} style={{ minWidth: 0 }}>{renderCard(product, i)}</div>
                ) : (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    hrefBase={productHrefBase}
                    {...cardTheme}
                  />
                )
              ))}
            </div>

            <ShopLoadMore feed={feed} />
          </div>
        </div>
      </div>

      {/* You may also like — same as homepage Featured Collection Slider */}
      <div style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <FeaturedSlider query={{ sort: 'best-selling' }} productHrefBase={productHrefBase} cardTheme={cardTheme} />
      </div>

      {/* Mobile Filter & Sort drawer — renders always but slides off-screen
          when closed. Only opened by the mobile toolbar button at <=749px. */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={{ categories }}
        selected={{ categories: selectedCategories, sort }}
        productCount={listing && !feed.hasMore ? products.length : null}
        onApply={(payload) => go({ categoryIds: payload.categoryIds, sort: payload.sort })}
        onRemoveAll={() => go({ categoryIds: [], sort: 'featured' })}
      />

      <style>{`
        /* ── Mobile filter toolbar ──
           The desktop toolbar has a 3-button view toggle on the left and a
           SORT BY dropdown on the right. At <=749px they are replaced with a
           single "Filter and sort" button on the left; the product count on
           the right stays. */
        .shop-mobile-filter-btn {
          display: none;
        }
        @media (max-width: 749px) {
          .shop-view-toggles { display: none !important; }
          .shop-sort-dropdown { display: none !important; }
          .shop-mobile-filter-btn {
            display: inline-flex;
            align-items: center;
            /* Fluid scaling across the mobile range — font/padding/gap all
               shrink gradually as viewport narrows, so the button never
               snaps to a smaller size and stays touch-friendly. */
            gap: clamp(5px, 1.6vw, 8px);
            padding: clamp(7px, 2.2vw, 10px) clamp(12px, 4vw, 18px);
            background-color: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: clamp(12px, 3.5vw, 15px);
            font-weight: 500;
            color: #222;
            cursor: pointer;
            white-space: nowrap;
            transition: background-color 180ms ease, border-color 180ms ease;
          }
          .shop-mobile-filter-btn svg {
            width: clamp(14px, 4.2vw, 18px);
            height: auto;
          }
          .shop-mobile-filter-btn:hover {
            background-color: #f4f4f4;
            border-color: #c9c9c9;
          }
          .shop-sidebar { display: none !important; }
          .shop-main-row { gap: 0 !important; }
        }

        /* Responsive product grid overrides — these beat the inline
           gridTemplateColumns (set from the 2/3/4 view toggle) at tablet
           and mobile widths so the shop stays readable below 992px. */
        @media (max-width: 991px) {
          .shop-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 18px !important;
          }
        }
        @media (max-width: 749px) {
          .shop-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }

        .sort-dropdown-item:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .filter-group-title:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .filter-checkbox-row:hover .filter-cb {
          border-color: #222 !important;
        }
        .filter-show-more:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .filter-remove-all:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .filter-tag-remove:hover {
          text-decoration: underline;
        }
        .filter-spinner {
          width: 24px;
          height: 24px;
          border: 2.5px solid #e0e0e0;
          border-top-color: #222;
          border-radius: 50%;
          animation: filterSpin 0.6s linear infinite;
        }
        @keyframes filterSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes filterFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </ShopThemeCtx.Provider>
  );
}
