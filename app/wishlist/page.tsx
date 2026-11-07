import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { getStore } from "@/lib/store-api";
import { getActiveTheme } from "@/themes/active";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: true } };

/** Wishlist sebagai halaman tema; tema tanpa halaman wishlist memakai halaman akun (/profile/wishlist). */
export default async function WishlistPage() {
  const [store, theme] = await Promise.all([getStore(), getActiveTheme()]);
  const { WishlistPage: ThemeWishlistPage } = theme.components;
  if (!ThemeWishlistPage) redirect("/profile/wishlist");

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <ThemeWishlistPage store={store} />
      <SiteFooter store={store} />
    </>
  );
}
