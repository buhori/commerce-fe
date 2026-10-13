import Link from "next/link";
import { SearchForm, SmartLink, StoreLogo, type HeaderProps, type NavigationLink } from "@sellosy/theme";
import { HeaderActions } from "./header-actions";
import { ChevronIcon, MenuIcon, SearchIcon } from "./icons";
import s from "./editorial.module.css";

function NavItem({ link }: { link: NavigationLink }) {
  return (
    <li className={s.navItem}>
      <SmartLink link={link}>
        {link.label}
        {link.children.length > 0 && <ChevronIcon className={s.chevron} />}
      </SmartLink>
      {link.children.length > 0 && (
        <ul className={s.dropdown}>
          {link.children.map((child, index) => <li key={`${index}-${child.label}`}><SmartLink link={child} /></li>)}
        </ul>
      )}
    </li>
  );
}

export function Header({ store, navigation, query, accounts }: HeaderProps) {
  return (
    <>
      {store.description && <p className={s.announce}>{store.description}</p>}
      <header className={s.header}>
        {/* Menu HP tanpa JavaScript: <details> membuka dan menutup daftar. */}
        <details className={s.mobileMenu}>
          <summary aria-label="Menu"><MenuIcon /></summary>
          <div className={s.mobilePanel}>
            <SearchForm className={s.search} defaultValue={query} placeholder="Cari produk"><SearchIcon /></SearchForm>
            <ul>
              <li><Link href="/">Semua produk</Link></li>
              {navigation.map((link, index) => (
                <li key={`${index}-${link.label}`}>
                  <SmartLink link={link} />
                  {link.children.length > 0 && (
                    <ul>{link.children.map((child, childIndex) => <li key={`${childIndex}-${child.label}`}><SmartLink link={child} /></li>)}</ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </details>

        <ul className={s.nav}>
          {navigation.map((link, index) => <NavItem key={`${index}-${link.label}`} link={link} />)}
        </ul>

        <Link href="/" className={s.logo} aria-label={`${store.name} — Beranda`}>
          <StoreLogo key={store.logo} name={store.name} logo={store.logo} />
        </Link>

        <div className={s.actions}>
          <SearchForm className={`${s.search} ${s.headerSearch}`} defaultValue={query} placeholder="Cari"><SearchIcon /></SearchForm>
          <HeaderActions accounts={accounts} />
        </div>
      </header>
    </>
  );
}
