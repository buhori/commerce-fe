"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  formatPrice, priceView, ProductImage, productUrl, SearchForm, SectionLink, SmartLink, StoreLogo, useCartCount, useCustomer, useWishlistCount,
  type NavigationLink, type SectionRenderProps,
} from "@sellosy/theme";
import type { mainHeader } from "../manifest";
import { CartDrawer } from "../src/features/cart/components/CartDrawer";
import { QuickViewModal } from "../src/features/quickview/components/QuickViewModal";
import { setUI } from "../src/store/uiStore";
import { IconArrowDownS, IconClose, IconHeart, IconMenu, IconSearch, IconShoppingBag, IconToggle, IconUser } from "./icons";

type Props = SectionRenderProps<typeof mainHeader>;

/** Kunci gulir halaman selama laci terbuka, dan tutup dengan Escape. */
function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);
}

function Logo({ settings: s, store }: Pick<Props, "settings" | "store">) {
  return (
    <Link href="/" className="ambaz-logo" aria-label={`${store.name} — Beranda`} style={{ width: `${s.logo_width}px` }}>
      {s.logo
        ? <Image src={s.logo.url} alt={s.logo.alt || store.name} width={s.logo_width} height={Math.round(s.logo_width * 0.28)} unoptimized priority style={{ objectFit: "contain", width: "100%", height: "auto" }} />
        : <StoreLogo key={store.logo} name={store.name} logo={store.logo} />}
    </Link>
  );
}

function CountBadge({ count }: { count: number }) {
  return <span className="ambaz-count">{count > 99 ? "99+" : count}</span>;
}

/** DesktopNav + DropdownMenu Ambaz, dengan menu dari Navigasi toko (satu tingkat sub-menu). */
type MegaBlock = Props["blocks"][number]["settings"];

/** Tata letak menu satu item: dari block Mega menu yang namanya cocok, atau otomatis dari isi sub-menunya. */
function menuLayout(item: NavigationLink, mega: MegaBlock | undefined): "dropdown" | "columns" | "cards" {
  if (item.children.length === 0) return "dropdown";
  if (mega && mega.layout !== "auto") return mega.layout;
  if (item.children.some((child) => child.children.length > 0)) return "columns";
  // Kartu otomatis hanya bila sub-menunya kategori dan setidaknya satu punya gambar.
  if (item.children.every((child) => child.category) && item.children.some((child) => child.category?.image)) return "cards";
  return mega?.image ? "columns" : "dropdown";
}

/**
 * MegaMenu Ambaz (layout/Header/MegaMenu.tsx). Kolom: sub-menu menjadi judul kolom, tautan tingkat ketiga menjadi
 * isinya, dengan gambar promo dari block. Kartu: sub-menu kategori dengan gambar dan jumlah produk.
 */
function MegaMenu({ item, layout, mega }: { item: NavigationLink; layout: "columns" | "cards"; mega: MegaBlock | undefined }) {
  if (layout === "cards") {
    const cards = item.children.slice(0, mega?.cards ?? 5);
    return (
      <div className="ambaz-mega">
        <div className="container-main" style={{ minHeight: "420px", paddingTop: "30px", paddingBottom: "30px", display: "flex", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: "24px", width: "100%" }}>
            {cards.map((card, i) => (
              <SmartLink key={`${card.label}-${i}`} link={card} className="category-card-link">
                <span className="category-card-img" style={{ display: "block", position: "relative", width: "100%", height: "280px", backgroundColor: "#f7f7f7", overflow: "hidden", marginBottom: "14px" }}>
                  {card.category?.image && <Image unoptimized src={card.category.image} alt={card.label} fill style={{ objectFit: "cover", transition: "transform 400ms ease" }} sizes="(max-width: 1200px) 33vw, 20vw" />}
                </span>
                <span className="category-card-label">{card.label}</span>
                {card.category && <span className="category-card-count">{card.category.products} Items</span>}
              </SmartLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const columns = item.children;
  const promo = mega?.image ?? null;
  return (
    <div className="ambaz-mega">
      <div className="container-main" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)${promo ? " 1fr" : ""}`, gap: "24px" }}>
          {columns.map((column, i) => (
            <div key={`${column.label}-${i}`}>
              <h4 className="ambaz-mega-heading">{column.href ? <SmartLink link={column} /> : column.label}</h4>
              {column.children.length > 0 && (
                <ul className="ambaz-mega-links">
                  {column.children.map((link, j) => <li key={`${link.label}-${j}`}><SmartLink link={link} /></li>)}
                </ul>
              )}
            </div>
          ))}
          {promo && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", backgroundColor: "#f7f7f7", borderRadius: "4px", overflow: "hidden" }}>
                {mega?.link
                  ? <SectionLink href={mega.link.href}><Image unoptimized src={promo.url} alt={promo.alt || mega.title} fill style={{ objectFit: "cover" }} sizes="280px" /></SectionLink>
                  : <Image unoptimized src={promo.url} alt={promo.alt || mega?.title || ""} fill style={{ objectFit: "cover" }} sizes="280px" />}
              </div>
              {(mega?.title || mega?.subtitle) && (
                <div style={{ textAlign: "center", paddingTop: "16px" }}>
                  {mega.title && <p style={{ fontSize: "16px", fontWeight: 700, color: "#222", letterSpacing: "1px" }}>{mega.title}</p>}
                  {mega.subtitle && (mega.link
                    ? <SectionLink href={mega.link.href} className="ambaz-mega-promo-link">{mega.subtitle}</SectionLink>
                    : <p style={{ fontSize: "13px", color: "#555", marginTop: "4px", letterSpacing: "1px" }}>{mega.subtitle}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** DesktopNav + DropdownMenu/MegaMenu Ambaz, dengan menu dari Navigasi toko. */
function DesktopNav({ items, megas }: { items: NavigationLink[]; megas: MegaBlock[] }) {
  const [active, setActive] = useState<number | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);
  const enter = (i: number) => {
    if (timeout.current) clearTimeout(timeout.current);
    setActive(i);
  };
  const leave = () => { timeout.current = setTimeout(() => setActive(null), 150); };
  const megaFor = (item: NavigationLink) => megas.find((mega) => mega.menu.trim().toLowerCase() === item.label.trim().toLowerCase());

  return (
    <nav className="ambaz-nav" aria-label="Menu utama">
      {items.map((item, i) => {
        const mega = megaFor(item);
        const layout = menuLayout(item, mega);
        return (
          <div key={`${item.label}-${i}`} className={`ambaz-nav-item${layout === "dropdown" ? "" : " is-mega"}`} onMouseEnter={() => enter(i)} onMouseLeave={leave}
            onFocus={() => enter(i)} onBlur={leave}>
            <SmartLink link={item} className={`ambaz-nav-link${active === i ? " is-active" : ""}`}>
              {item.label}
              {item.children.length > 0 && (
                <span className="ambaz-nav-chevron" style={{ transform: active === i ? "rotate(180deg)" : "rotate(0deg)" }}><IconArrowDownS /></span>
              )}
            </SmartLink>
            {item.children.length > 0 && active === i && (layout === "dropdown" ? (
              <div className="ambaz-dropdown">
                {item.children.map((child, j) => <SmartLink key={`${child.label}-${j}`} link={child} />)}
              </div>
            ) : <MegaMenu item={item} layout={layout} mega={mega} />)}
          </div>
        );
      })}
    </nav>
  );
}

function Drawer({ open, onClose, side, width, label, children }: { open: boolean; onClose: () => void; side: "start" | "end"; width: string; label: string; children: ReactNode }) {
  useOverlay(open, onClose);
  return (
    <div className="ambaz-scope">
      <div className="ambaz-drawer-overlay" data-open={open || undefined} onClick={onClose} />
      <div className={`ambaz-drawer ambaz-drawer-${side}`} data-open={open || undefined} style={{ width }} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open} inert={!open}>
        <div className="ambaz-drawer-body">{children}</div>
      </div>
    </div>
  );
}

/** MobileNav Ambaz: akordeon menu, wishlist, dan blok akun. */
function MobileNav({ open, onClose, items, accounts, wishlist, settings, store }: {
  open: boolean; onClose: () => void; items: NavigationLink[]; accounts: boolean; wishlist: { available: boolean; count: number } | null;
} & Pick<Props, "settings" | "store">) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));
  const { customer } = useCustomer();
  const pathname = usePathname();
  const close = () => {
    onClose();
    setTimeout(() => setExpanded({}), 400);
  };

  return (
    <Drawer open={open} onClose={close} side="start" width="550px" label="Menu">
      <div className="ambaz-mnav-head">
        <div onClick={close}><Logo settings={settings} store={store} /></div>
        <button type="button" onClick={close} aria-label="Tutup menu" className="ambaz-mnav-close"><IconClose size={30} /></button>
      </div>
      <nav aria-label="Menu utama">
        {items.map((item, i) => {
          const children = item.children;
          return (
            <div key={`${item.label}-${i}`}>
              <div className="ambaz-mnav-row">
                <span onClick={close} className="ambaz-mnav-label"><SmartLink link={item} /></span>
                {children.length > 0 && (
                  <button type="button" onClick={() => toggle(String(i))} aria-expanded={!!expanded[i]}
                    aria-label={`${expanded[i] ? "Tutup" : "Buka"} ${item.label}`} className="ambaz-mnav-toggle">
                    <IconToggle open={!!expanded[i]} />
                  </button>
                )}
              </div>
              {children.length > 0 && (
                <div className="ambaz-collapse" data-open={expanded[i] || undefined}>
                  <div>
                    {children.map((child, j) => {
                      const key = `${i}-${j}`;
                      if (child.children.length === 0) {
                        return <span key={`${child.label}-${j}`} onClick={close} className="ambaz-mnav-child"><SmartLink link={child} /></span>;
                      }
                      // Kolom mega menu: akordeon tingkat kedua seperti MobileNav Ambaz.
                      return (
                        <div key={`${child.label}-${j}`}>
                          <div className="ambaz-mnav-row ambaz-mnav-row-sub">
                            <span onClick={close} className="ambaz-mnav-label ambaz-mnav-label-sub">{child.href ? <SmartLink link={child} /> : <span>{child.label}</span>}</span>
                            <button type="button" onClick={() => toggle(key)} aria-expanded={!!expanded[key]} aria-label={`${expanded[key] ? "Tutup" : "Buka"} ${child.label}`} className="ambaz-mnav-toggle">
                              <IconToggle open={!!expanded[key]} />
                            </button>
                          </div>
                          <div className="ambaz-collapse" data-open={expanded[key] || undefined}>
                            <div>
                              {child.children.map((link, k) => (
                                <span key={`${link.label}-${k}`} onClick={close} className="ambaz-mnav-child ambaz-mnav-grandchild"><SmartLink link={link} /></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {wishlist?.available && (
        <Link href="/wishlist" onClick={close} className="ambaz-mnav-wishlist">
          <span style={{ position: "relative", display: "inline-flex" }}>
            <IconHeart size={22} />
            <span className="ambaz-mnav-badge">{wishlist.count}</span>
          </span>
          Wishlist
        </Link>
      )}

      {accounts && (
        <div className="ambaz-mnav-account">
          <h4>My account</h4>
          {customer ? (
            <Link href="/profile" onClick={close} className="ambaz-btn-solid"><IconUser size={18} />{customer.name.split(" ")[0]}</Link>
          ) : (
            <>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} onClick={close} className="ambaz-btn-solid"><IconUser size={18} />Log in</Link>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} onClick={close} className="ambaz-btn-outline">Register</Link>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

/** SearchDrawer Ambaz: pencarian lewat /products?q=, pencarian populer, dan produk pilihan toko. */
function SearchDrawer({ open, onClose, query, settings: s, products, currency }: {
  open: boolean; onClose: () => void; query: string; products: Props["data"]["products"]; currency: string;
} & Pick<Props, "settings">) {
  const terms = s.popular_searches.split(",").map((term) => term.trim()).filter(Boolean);
  return (
    <Drawer open={open} onClose={onClose} side="end" width="420px" label="Cari produk">
      <div className="ambaz-search-head">
        <SearchForm className="ambaz-search-form" defaultValue={query} placeholder={s.search_placeholder}>
          <IconSearch size={24} />
        </SearchForm>
        <button type="button" onClick={onClose} aria-label="Tutup pencarian" className="ambaz-search-close"><IconClose size={24} /></button>
      </div>
      <div className="ambaz-search-body">
        {terms.length > 0 && (
          <div style={{ paddingTop: "24px", marginBottom: "24px" }}>
            <h4 className="ambaz-search-title" style={{ fontSize: "20px", marginBottom: "14px" }}>{s.popular_title}</h4>
            <div className="ambaz-search-terms">
              {terms.map((term) => <Link key={term} href={`/products?q=${encodeURIComponent(term)}`} onClick={onClose}>{term}</Link>)}
            </div>
          </div>
        )}
        {products.length > 0 && (
          <>
            <h4 className="ambaz-search-title" style={{ fontSize: "24px", marginBottom: "16px" }}>{s.products_title}</h4>
            {products.map((product) => {
              const price = priceView(product);
              return (
                <Link key={product.id} href={productUrl(product.slug)} onClick={onClose} className="ambaz-search-product">
                  <div className="ambaz-search-thumb"><ProductImage src={product.images} name={product.name} /></div>
                  <div>
                    <p className="ambaz-search-name">{product.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {price.original !== null && <span className="ambaz-search-was">{formatPrice(price.original, currency)}</span>}
                      <span className="ambaz-search-price">{formatPrice(price.final, currency)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </Drawer>
  );
}

/**
 * Header bawaan Ambaz (layout/Header/Header.tsx + DesktopNav, HeaderActions, MobileNav, SearchDrawer). Keranjang
 * membuka halaman /cart platform, akun dan wishlist hanya tampil bila paket toko punya akun pembeli.
 */
export function MainHeader({ settings: s, data, blocks, store, page, editor }: Props) {
  const header = page.template === "header" ? page : { navigation: [], query: "", accounts: false };
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCartCount();
  const wishlist = useWishlistCount();
  const { customer } = useCustomer();
  const pathname = usePathname();
  const showWishlist = header.accounts && s.show_wishlist && wishlist.available;

  // Pindah halaman menutup laci yang masih terbuka.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <>
      <header {...editor} className={`ambaz-header main-header${s.sticky ? " is-sticky" : ""}`}>
        <div className="container-main ambaz-header-grid">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifySelf: "start" }}>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Buka menu" className="mobile-menu-btn"><IconMenu /></button>
            <div className="fashion-logo-desktop"><Logo settings={s} store={store} /></div>
          </div>

          <div className="desktop-nav-wrapper"><DesktopNav items={header.navigation} megas={blocks.map((block) => block.settings)} /></div>
          <div className="fashion-logo-mobile"><Logo settings={s} store={store} /></div>

          <div className="header-actions">
            <button type="button" onClick={() => setSearchOpen(true)} className="ambaz-icon-btn" aria-label="Cari produk"><IconSearch /></button>
            {header.accounts && (
              <Link href={customer ? "/profile" : `/login?next=${encodeURIComponent(pathname)}`} className="ambaz-icon-btn fha-hide-mobile"
                aria-label={customer ? `Profil ${customer.name}` : "Masuk"}>
                <IconUser />
              </Link>
            )}
            {showWishlist && (
              <Link href="/wishlist" className="ambaz-icon-btn fha-hide-mobile" aria-label={`Wishlist: ${wishlist.count} produk`}>
                <IconHeart />
                <CountBadge count={wishlist.count} />
              </Link>
            )}
            {/* Ambaz: ikon keranjang membuka laci keranjang (tautan /cart tetap untuk tanpa JavaScript). */}
            <Link href="/cart" className="ambaz-icon-btn" aria-label={`Buka keranjang${count === null ? "" : `: ${count} barang`}`}
              onClick={(e) => { e.preventDefault(); setUI({ cartDrawerOpen: true }); }}>
              <IconShoppingBag />
              <CountBadge count={count ?? 0} />
            </Link>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={header.navigation} accounts={header.accounts}
        wishlist={showWishlist ? wishlist : null} settings={s} store={store} />
      <div className="ambaz-scope"><CartDrawer /><QuickViewModal /></div>
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} query={header.query} settings={s} products={data.products} currency={store.currency} />

      <style>{`
        .ambaz-header { position: relative; z-index: 200; background-color: #fff; height: 90px; border-bottom: 1px solid #e5e5e5; }
        .ambaz-header.is-sticky { position: sticky; top: 0; }
        .ambaz-header-grid { height: 100%; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; }
        .ambaz-logo { display: inline-flex; align-items: center; color: #222; font-size: 24px; font-weight: 700; white-space: nowrap; }
        .ambaz-logo .store-brand-logo { position: relative; display: block; width: 100%; height: 40px; }
        .mobile-menu-btn { display: none; align-items: center; justify-content: center; color: #222; padding: 0; }
        .fashion-logo-mobile { display: none; }
        .ambaz-nav { display: flex; align-items: center; gap: 32px; }
        .ambaz-nav-item { position: relative; }
        .ambaz-nav-item.is-mega { position: static; }
        .ambaz-mega { position: absolute; top: 100%; left: 0; right: 0; background-color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.08); z-index: 300; animation: ambazMenuDown 300ms ease-out; max-height: calc(100vh - 140px); overflow-y: auto; }
        .ambaz-mega-heading { font-size: 15px; font-weight: 700; color: #222; margin-bottom: 18px; }
        .ambaz-mega-heading a:hover { color: #F15B41; }
        .ambaz-mega-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; }
        .ambaz-mega-links a, .ambaz-mega-links span { font-size: 14px; color: #555; transition: color 150ms ease; }
        .ambaz-mega-links a:hover { color: #F15B41; }
        .ambaz-mega-promo-link { display: inline-block; font-size: 13px; color: #555; margin-top: 4px; letter-spacing: 1px; }
        .ambaz-mega-promo-link:hover { color: #F15B41; }
        .category-card-link { display: block; text-decoration: none; color: inherit; text-align: left; }
        .category-card-label { position: relative; display: inline-block; padding-bottom: 4px; font-size: 18px; font-weight: 700; color: #222; line-height: 1.3; }
        .category-card-label::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background-color: #222; transition: width 300ms ease, left 300ms ease; }
        .category-card-link:hover .category-card-label::after { width: 100%; left: 0; }
        .category-card-link:hover .category-card-img img { transform: scale(1.05); }
        .category-card-count { display: block; font-size: 14px; color: #888; margin-top: 4px; }
        .ambaz-nav-link { display: flex; align-items: center; gap: 4px; font-size: 17px; font-weight: 500; color: #222; padding: 8px 0; white-space: nowrap; transition: color 150ms ease; }
        .ambaz-nav-link:hover, .ambaz-nav-link.is-active { color: #F15B41; }
        .ambaz-nav-chevron { display: inline-flex; transition: transform 300ms ease; }
        .ambaz-dropdown { position: absolute; top: 100%; left: 0; min-width: 260px; background: #fff; border: 1px solid #f0f0f0; border-radius: 0 0 6px 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); z-index: 300; padding: 14px 0; max-height: calc(100vh - 160px); overflow-y: auto; animation: ambazMenuDown 300ms ease-out; }
        .ambaz-dropdown > * { display: block; padding: 10px 24px; font-size: 15px; color: #444; white-space: nowrap; transition: color 150ms ease; }
        .ambaz-dropdown > a:hover { color: #F15B41; }
        @keyframes ambazMenuDown { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .header-actions { display: flex; align-items: center; gap: 18px; justify-self: end; }
        .ambaz-icon-btn { position: relative; display: flex; align-items: center; justify-content: center; color: #222; padding: 0; transition: color 150ms ease; }
        .ambaz-icon-btn:hover { color: #F15B41; }
        .ambaz-count { position: absolute; top: -6px; right: -8px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9999px; background: #F15B41; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1; }
        @media (max-width: 715px) {
          .mobile-menu-btn { display: flex; }
          .desktop-nav-wrapper, .fashion-logo-desktop, .fha-hide-mobile { display: none; }
          .fashion-logo-mobile { display: flex; justify-content: center; align-items: center; }
        }

        .ambaz-drawer-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: opacity 240ms ease; }
        .ambaz-drawer-overlay[data-open] { opacity: 1; pointer-events: auto; transition: opacity 420ms ease; }
        .ambaz-drawer { position: fixed; top: 0; bottom: 0; z-index: 9999; max-width: 100vw; background: #fff; display: flex; flex-direction: column; box-shadow: 0 0 24px rgba(0,0,0,0.1); transition: transform 300ms cubic-bezier(0.4, 0, 1, 1); will-change: transform; }
        .ambaz-drawer[data-open] { transform: translateX(0) !important; transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1); }
        .ambaz-drawer-start { left: 0; transform: translateX(-100%); }
        .ambaz-drawer-end { right: 0; transform: translateX(100%); }
        .ambaz-drawer-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

        .ambaz-mnav-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 12px 18px 20px; border-bottom: 1px solid #eee; }
        .ambaz-mnav-close { width: 44px; height: 44px; margin-right: -4px; color: #222; display: flex; align-items: center; justify-content: center; }
        .ambaz-mnav-row { display: flex; align-items: stretch; justify-content: space-between; border-bottom: 1px solid #eee; }
        .ambaz-mnav-label { flex: 1; display: flex; }
        .ambaz-mnav-label > * { flex: 1; display: flex; align-items: center; padding: 16px 20px; font-size: 15px; font-weight: 500; color: #222; }
        .ambaz-mnav-toggle { width: 54px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #222; }
        .ambaz-collapse { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .ambaz-collapse[data-open] { grid-template-rows: 1fr; opacity: 1; }
        .ambaz-collapse > div { overflow: hidden; min-height: 0; }
        .ambaz-mnav-child > * { display: block; padding: 14px 36px; font-size: 14px; font-weight: 500; color: #222; border-bottom: 1px solid #f0f0f0; }
        .ambaz-mnav-row-sub { border-bottom-color: #f0f0f0; }
        .ambaz-mnav-label-sub > * { padding-left: 36px; font-size: 14px; }
        .ambaz-mnav-grandchild > * { padding-left: 52px; }
        .ambaz-mnav-wishlist { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid #eee; color: #222; font-size: 15px; font-weight: 500; }
        .ambaz-mnav-badge { position: absolute; top: -8px; right: -10px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9999px; background: #222; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .ambaz-mnav-account { padding: 28px 20px 20px; }
        .ambaz-mnav-account h4 { font-size: 22px; font-weight: 700; color: #222; margin: 0 0 18px; }
        .ambaz-btn-solid, .ambaz-btn-outline { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; border-radius: 40px; padding: 14px 24px; font-size: 15px; font-weight: 600; }
        .ambaz-btn-solid { background: #222; color: #fff; margin-bottom: 12px; }
        .ambaz-btn-outline { background: transparent; color: #222; border: 1.5px solid #222; }

        .ambaz-search-head { display: flex; align-items: center; gap: 12px; margin: 24px 24px 0; padding-bottom: 14px; border-bottom: 1.5px solid #222; }
        .ambaz-search-form { flex: 1; display: flex; align-items: center; gap: 12px; color: #222; }
        .ambaz-search-form input { flex: 1; min-width: 0; font: inherit; font-size: 18px; color: #222; border: none; outline: none; background: none; padding: 0; }
        .ambaz-search-close { display: flex; align-items: center; justify-content: center; color: #222; }
        .ambaz-search-body { flex: 1; overflow-y: auto; padding: 0 24px 24px; }
        .ambaz-search-title { font-weight: 700; color: #222; }
        .ambaz-search-terms { display: flex; flex-wrap: wrap; gap: 12px; }
        .ambaz-search-terms a { font-size: 16px; color: #555; transition: color 200ms ease; }
        .ambaz-search-terms a:hover { color: #F15B41; }
        .ambaz-search-product { display: flex; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: inherit; }
        .ambaz-search-thumb { position: relative; width: 60px; height: 70px; border-radius: 4px; overflow: hidden; background: #f5f5f5; flex-shrink: 0; }
        .ambaz-search-thumb .product-placeholder span { display: none; }
        .ambaz-search-name { font-size: 16px; font-weight: 600; color: #222; margin-bottom: 5px; }
        .ambaz-search-was { font-size: 14px; color: #999; text-decoration: line-through; }
        .ambaz-search-price { font-size: 15px; font-weight: 600; color: #222; }
      `}</style>
    </>
  );
}
