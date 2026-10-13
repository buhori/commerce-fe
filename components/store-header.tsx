import Link from "next/link";
import { getNavigation, getStore } from "@/lib/store-api";
import { accountsEnabled } from "@/lib/store-shared";
import { AccountMenu } from "./account-menu";
import { CartIndicator } from "./cart-indicator";
import { Icon } from "./icons";
import { StoreBrand } from "./store-brand";
import { StoreNav } from "./store-nav";
import { getActiveTheme } from "@/themes/active";

export async function StoreHeader({ name, logo, query = "" }: { name: string; logo?: string | null; query?: string }) {
  // getStore di-cache per request, jadi tidak menambah panggilan API.
  const [store, theme] = await Promise.all([getStore().catch(() => null), getActiveTheme()]);
  const accounts = accountsEnabled(store);
  const { Header } = theme.components;
  if (Header && store) {
    // Backend lama belum punya /navigations; menu cukup kosong.
    const navigation = await getNavigation().catch(() => []);
    return <Header store={store} navigation={navigation} query={query} accounts={accounts} />;
  }

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
