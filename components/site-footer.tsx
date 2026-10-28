import Link from "next/link";
import { getPages, type Store } from "@/lib/store-api";
import { publicAddress } from "@/lib/store-shared";
import { Icon } from "./icons";
import { StoreBrand } from "./store-brand";
import { BuiltWith } from "@/sdk/components";
import { displayPhone, e164 } from "@/lib/phone";
import { BrandingProvider } from "./branding";
import { getActiveTheme } from "@/themes/active";

export async function SiteFooter({ store: fullStore }: { store: Store }) {
  const [pages, theme] = await Promise.all([getPages(), getActiveTheme()]);
  const { Footer } = theme.components;
  // Alamat yang disembunyikan pemilik toko sudah kosong di sini, jadi footer tema mana pun mematuhinya.
  const store = { ...fullStore, address: publicAddress(fullStore) };
  // <BuiltWith /> in either footer reads this to hide itself on whitelabel stores.
  if (Footer) return <BrandingProvider hidden={store.hide_branding}><Footer store={store} pages={pages} /></BrandingProvider>;

  // Kode negara toko (bawaan Indonesia, 62); lihat lib/phone.ts.
  const phoneLink = e164(store.phone_country_code, store.phone);
  const phone = displayPhone(store.phone_country_code, store.phone);

  return (
    <BrandingProvider hidden={store.hide_branding}>
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
          {(store.email || phone || store.address) && (
            <div className="contact-info">
              <h2>Kontak</h2>
              {store.email && <a href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a>}
              {phone && (phoneLink ? <a href={`tel:${phoneLink}`}><Icon name="phone" />{phone}</a> : <span><Icon name="phone" />{phone}</span>)}
              {store.address && <p><Icon name="pin" />{store.address}</p>}
            </div>
          )}
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} {store.name}</span>
          <BuiltWith />
        </div>
      </footer>
    </BrandingProvider>
  );
}
