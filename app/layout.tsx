import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { QueryProvider } from "@/components/query-provider";
import { getStore, StoreApiError, storeThemeKey } from "@/lib/store-api";
import { resolveTheme } from "@/themes/registry";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
  const { store, missing } = await getStore().then(
    (store) => ({ store, missing: false }),
    (error: unknown) => ({ store: null, missing: error instanceof StoreApiError && error.status === 404 }),
  );
  const theme = resolveTheme(storeThemeKey(store), process.env.STORE_THEME);
  return (
    <html
      lang="id"
      data-theme={theme}
      className={`${jakarta.variable} h-full antialiased`}
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
      </body>
    </html>
  );
}
