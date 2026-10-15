import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { QueryProvider } from "@/components/query-provider";
import { PreviewBridge } from "@/components/preview-bridge";
import { ThemePreviewBar } from "@/components/theme-preview-bar";
import { getPreviewState } from "@/lib/preview";
import { htmlLang, rootMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getStore, StoreApiError } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Judul serif tema Boutique; tidak di-preload karena tema lain tidak memakainya.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  preload: false,
});

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
  const [missing, lang] = await getStore().then(
    (store) => [false, htmlLang(store.language)] as const,
    (error: unknown) => [error instanceof StoreApiError && error.status === 404, htmlLang(null)] as const,
  );
  const [theme, preview] = await Promise.all([getActiveTheme(), getPreviewState()]);
  return (
    <html
      lang={lang}
      data-theme={theme.id}
      className={`${jakarta.variable} ${fraunces.variable} ${theme.className} h-full antialiased`}
    >
      <body className="storefront-shell min-h-full flex flex-col">
        {missing ? (
          <main className="unavailable">
            <h1>Toko tidak ditemukan</h1>
            <p>Alamat ini belum dipakai toko mana pun. Periksa lagi ejaan alamatnya.</p>
          </main>
        ) : (
          <QueryProvider><CartProvider>{children}</CartProvider></QueryProvider>
        )}
        {preview && !preview.embedded && <ThemePreviewBar themeName={preview.theme?.name ?? null} draft={preview.draft} />}
        {preview?.embedded && <PreviewBridge />}
      </body>
    </html>
  );
}
