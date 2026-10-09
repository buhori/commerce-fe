import Link from "next/link";
import { AccountMenu } from "./account-menu";
import { CartIndicator } from "./cart-indicator";
import { Icon } from "./icons";
import { StoreBrand } from "./store-brand";

export function StoreHeader({ name, logo, query = "" }: { name: string; logo?: string | null; query?: string }) {
  return (
    <header className="store-header">
      <div className="container store-header-inner">
        <Link className="store-header-name" href="/" aria-label={`${name} — Beranda`}>
          <StoreBrand key={logo} name={name} logo={logo} />
        </Link>
        {/* A plain GET form: search works before JavaScript loads. */}
        <form className="header-search" action="/" method="get" role="search">
          <Icon name="search" aria-hidden="true" />
          <input type="search" name="q" defaultValue={query} placeholder={`Cari di ${name}`}
            aria-label="Cari produk" maxLength={100} enterKeyHint="search" />
        </form>
        <div className="store-header-actions">
          <AccountMenu />
          <CartIndicator />
        </div>
      </div>
    </header>
  );
}
