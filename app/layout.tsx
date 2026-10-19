import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { CompareTray } from "@/components/compare-tray";
import { PluginScripts } from "@/components/plugin-scripts";
import { QueryProvider } from "@/components/query-provider";
import { PreviewBridge } from "@/components/preview-bridge";
import { ThemePreviewBar } from "@/components/theme-preview-bar";
import { getPreviewState } from "@/lib/preview";
import { htmlLang, rootMetadata } from "@/lib/seo";
import { pluginConfigScript, type PluginScript } from "@/lib/store-events";
import { getSiteSeo } from "@/lib/site-seo";
import { getStore, StoreApiError } from "@/lib/store-api";
import { htmlFontClassName } from "@/lib/store-fonts";
import { storeStyleCss, type StoreStyle } from "@/lib/store-style";
import { getActiveTheme } from "@/themes/active";

// Dasar SEO semua halaman: metadataBase dari alamat publik toko, template judul "%s | {toko}",
// dan noindex untuk toko yang menutup diri atau pratinjau pemilik.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSeo();
  return {
    ...rootMetadata(site),
    icons: { icon: site.store?.favicon || site.store?.logo || "/icon.svg" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // API membalas 404 bila subdomain/domain tidak terdaftar sebagai toko mana pun.
  const [missing, lang, style, scripts] = await getStore().then(
    (store) => [false, htmlLang(store.language), store.style ?? null, store.plugin_scripts] as const,
    (error: unknown) => [error instanceof StoreApiError && error.status === 404, htmlLang(null), null as StoreStyle | null, [] as PluginScript[]] as const,
  );
  const [theme, preview] = await Promise.all([getActiveTheme(), getPreviewState()]);
  // Warna/font pilihan toko ikut dirender server (tanpa kedipan tema bawaan); kosong = tema apa adanya.
  const styleCss = storeStyleCss(style, theme.id);
  return (
    <html
      lang={lang}
      data-theme={theme.id}
      className={`${htmlFontClassName(style)} ${theme.className} h-full antialiased`}
    >
      <body className="storefront-shell min-h-full flex flex-col">
        {styleCss && <style dangerouslySetInnerHTML={{ __html: styleCss }} />}
        {/* Konfigurasi plugin (data, bukan kode plugin) harus ada sebelum script plugin dimuat. */}
        {scripts.length > 0 && <script dangerouslySetInnerHTML={{ __html: pluginConfigScript(scripts) }} />}
        {missing ? (
          <main className="unavailable">
            <h1>Toko tidak ditemukan</h1>
            <p>Alamat ini belum dipakai toko mana pun. Periksa lagi ejaan alamatnya.</p>
          </main>
        ) : (
          <QueryProvider><CartProvider>{children}<CompareTray /></CartProvider></QueryProvider>
        )}
        {!missing && !preview?.embedded && <PluginScripts scripts={scripts} />}
        {preview && !preview.embedded && <ThemePreviewBar themeName={preview.theme?.name ?? null} draft={preview.draft} />}
        {preview?.embedded && <PreviewBridge />}
      </body>
    </html>
  );
}
