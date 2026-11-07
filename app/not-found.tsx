import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

/** Halaman tidak ditemukan: milik tema bila ada, selain itu tampilan sederhana dengan header dan footer toko. */
export default async function NotFound() {
  const [store, theme] = await Promise.all([getStore().catch(() => null), getActiveTheme()]);
  if (!store) {
    return <main className="page"><div className="container empty-state"><h1>Halaman tidak ditemukan</h1></div></main>;
  }
  const { NotFoundPage: ThemeNotFoundPage } = theme.components;

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      {ThemeNotFoundPage ? <ThemeNotFoundPage store={store} /> : (
        <main className="page">
          <div className="container empty-state">
            <h1>Halaman tidak ditemukan</h1>
            <p>Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
            <Link className="button" href="/">Kembali ke beranda</Link>
          </div>
        </main>
      )}
      <SiteFooter store={store} />
    </>
  );
}
