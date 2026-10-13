import Link from "next/link";
import { BuiltWith, pageUrl, type FooterProps } from "@sellosy/theme";
import s from "./editorial.module.css";

export function Footer({ store, pages }: FooterProps) {
  return (
    <footer className={s.footer} id="kontak">
      <div className={s.footerInner}>
        <div className={s.footerBrand}>
          <p className={s.footerName}>{store.name}</p>
          {store.description && <p>{store.description}</p>}
        </div>
        {pages.length > 0 && (
          <nav aria-label="Informasi toko">
            <p className={s.footerTitle}>Informasi</p>
            <ul>{pages.map((page) => <li key={page.slug}><Link href={pageUrl(page.slug)}>{page.title}</Link></li>)}</ul>
          </nav>
        )}
        {(store.address || store.phone || store.email) && (
          <div>
            <p className={s.footerTitle}>Kunjungi kami</p>
            <ul>
              {store.address && <li>{store.address}</li>}
              {store.phone && <li>{store.phone}</li>}
              {store.email && <li><a href={`mailto:${store.email}`}>{store.email}</a></li>}
            </ul>
          </div>
        )}
      </div>
      <div className={s.footerBottom}>
        <span>© {new Date().getFullYear()} {store.name}</span>
        <BuiltWith className={s.builtWith} />
      </div>
    </footer>
  );
}
