import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { QueryProvider } from "@/components/query-provider";
import { ThemePreviewBar } from "@/components/theme-preview-bar";
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

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore().catch(() => null);
  return {
    title: "Toko Online",
    description: "Temukan produk pilihan untuk kebutuhan sehari-hari.",
    icons: { icon: store?.favicon || store?.logo || "/icon.svg" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // API membalas 404 bila subdomain/domain tidak terdaftar sebagai toko mana pun.
  const missing = await getStore().then(
    () => false,
    (error: unknown) => error instanceof StoreApiError && error.status === 404,
  );
  const theme = await getActiveTheme();
  return (
    <html
      lang="id"
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
        {theme.previewing && <ThemePreviewBar name={theme.previewing} />}
      </body>
    </html>
  );
}
