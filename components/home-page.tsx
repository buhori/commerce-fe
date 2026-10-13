import { ButtonLink } from "@/components/ui/button";
import { HomeBuilderPage } from "./home-builder-page";
import { SiteFooter } from "./site-footer";
import { StoreHeader } from "./store-header";
import { getPreviewState } from "@/lib/preview";
import { getHomeSections, getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

/**
 * Beranda: murni susunan dari builder milik tema yang tampil (tema aktif, atau tema/draf yang
 * dipratinjau pemilik). Tidak ada beranda cadangan; susunan kosong berarti beranda kosong.
 */
export async function HomePage() {
  const [storeResult, theme, preview] = await Promise.all([
    getStore().then((store) => store, () => null),
    getActiveTheme(),
    getPreviewState(),
  ]);

  if (!storeResult) {
    return (
      <main className="unavailable">
        <h1>Toko belum dapat ditampilkan</h1>
        <p>Koneksi ke toko sedang terganggu.</p>
        <ButtonLink reloadDocument href="">Coba lagi</ButtonLink>
      </main>
    );
  }

  const store = storeResult;
  const sections = await getHomeSections(preview?.token ?? null).catch(() => undefined);

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      {sections === undefined ? (
        <main className="page home-page">
          <div className="container empty-state" role="alert">
            <h1>Beranda belum dapat dimuat</h1>
            <ButtonLink reloadDocument href="/">Coba lagi</ButtonLink>
          </div>
        </main>
      ) : (
        <HomeBuilderPage store={store} sections={sections ?? []} components={theme.components.sections} />
      )}
      <SiteFooter store={store} />
    </>
  );
}
