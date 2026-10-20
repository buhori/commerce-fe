import { ButtonLink } from "@/components/ui/button";
import { BuilderSections } from "./builder-sections";
import { MaintenanceNotice } from "./maintenance-notice";
import { SiteFooter } from "./site-footer";
import { StoreHeader } from "./store-header";
import { getPreviewState } from "@/lib/preview";
import { getHomeSections, getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

/**
 * Beranda: murni susunan dari builder milik tema yang tampil (tema aktif, atau tema/draf yang
 * dipratinjau pemilik). Beranda yang belum pernah diterbitkan dikirim backend sebagai susunan awal
 * builder (banner dan produk terbaru); susunan yang sengaja dikosongkan berarti beranda kosong.
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
      {/* Di luar susunan builder supaya tampil di semua tema, termasuk saat beranda gagal dimuat. */}
      {store.maintenance.active && <div className="container home-maintenance"><MaintenanceNotice reason={store.maintenance.reason} /></div>}
      {sections === undefined ? (
        <main className="page home-page">
          <div className="container empty-state" role="alert">
            <h1>Beranda belum dapat dimuat</h1>
            <ButtonLink reloadDocument href="/">Coba lagi</ButtonLink>
          </div>
        </main>
      ) : (
        <main className="page home-page home-builder">
          <h1 className="sr-only">{store.name}</h1>
          <BuilderSections store={store} sections={sections ?? []} components={theme.components.sections} compact />
        </main>
      )}
      <SiteFooter store={store} />
    </>
  );
}
