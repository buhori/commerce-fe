import Link from "next/link";
import { getStore } from "@/lib/store-api";
import { accountsEnabled } from "@/lib/store-shared";
import { AccountMenu } from "./account-menu";
import { CartIndicator } from "./cart-indicator";
import { Icon } from "./icons";
import { StoreBrand } from "./store-brand";
import { StoreNav } from "./store-nav";

export async function StoreHeader({ name, logo, query = "" }: { name: string; logo?: string | null; query?: string }) {
  // getStore di-cache per request, jadi tidak menambah panggilan API.
  const accounts = accountsEnabled(await getStore().catch(() => null));
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
          {/* Paket tanpa akun pembeli: semua belanja sebagai tamu, tanpa tombol Masuk. */}
          {accounts && <AccountMenu />}
          <CartIndicator />
        </div>
      </div>
      <StoreNav />
    </header>
  );
}
