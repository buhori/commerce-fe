import Link from "next/link";
import { getPages, type Store } from "@/lib/store-api";
import { Icon } from "./icons";
import { StoreBrand } from "./store-brand";

export async function SiteFooter({ store }: { store: Store }) {
  const pages = await getPages();
  const rawPhone = store.phone?.replace(/\D/g, "") || "";
  const countryCode = store.phone_country_code?.replace(/\D/g, "") || "";
  const phone = rawPhone.startsWith(countryCode) ? rawPhone : `${countryCode}${rawPhone.replace(/^0/, "")}`;

  return (
    <footer className="site-footer" id="kontak">
      <div className="container footer-main">
        <div>
          <strong className="footer-store"><StoreBrand key={store.logo} name={store.name} logo={store.logo} /></strong>
          {store.description && <p>{store.description}</p>}
        </div>
        {pages.length > 0 && (
          <nav className="footer-links" aria-label="Informasi toko">
            <h2>Informasi</h2>
            {pages.map((page) => <Link key={page.slug} href={`/${page.slug}`}>{page.title}</Link>)}
          </nav>
        )}
        {(store.email || rawPhone || store.address) && (
          <div className="contact-info">
            <h2>Kontak</h2>
            {store.email && <a href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a>}
            {rawPhone && <a href={`tel:+${phone}`}><Icon name="phone" />+{phone}</a>}
            {store.address && <p><Icon name="pin" />{store.address}</p>}
          </div>
        )}
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} {store.name}</div>
    </footer>
  );
}
