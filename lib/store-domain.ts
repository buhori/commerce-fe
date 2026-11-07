import { cookies, headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { canonicalRedirect, REQUEST_PATH_HEADER } from "./canonical-host";
import { readSignedAccessCookie, SIGNED_ACCESS_COOKIE, signedPage } from "./signed-access";
import { getStore } from "./store-api";
import { requestHost, requestPreviewToken } from "./store-host";

/**
 * Toko yang sudah terhubung ke domain sendiri hanya tampil di domain itu: subdomain platform
 * (mis. kopi.sellosy.com) dan pasangan www-nya dialihkan permanen (308) ke `store.url`, dengan path
 * dan query yang sama, supaya pembeli dan mesin pencari tidak melihat dua alamat. Pratinjau pemilik
 * toko tidak dialihkan. Dipanggil dari root layout, sebelum apa pun dirender.
 *
 * Link invoice/ulasan dari email yang masih memakai subdomain: tanda tangannya sudah dipindah proxy.ts ke cookie
 * subdomain itu, yang tidak ikut ke domain toko. Tanda tangannya dibawa lagi di query dengan pengalihan
 * sementara (tidak diingat browser), lalu proxy di domain toko memindahkannya ke cookie dan membersihkan URL.
 */
export async function redirectToStoreDomain(): Promise<void> {
  const store = await getStore().catch(() => null);
  if (!store?.url) return;
  const { token } = await requestPreviewToken();
  if (token) return;
  const source = await headers();
  const target = canonicalRedirect(requestHost(source), store.url, source.get(REQUEST_PATH_HEADER), process.env.STORE_ROOT_DOMAIN);
  if (!target) return;
  // Halaman bertanda tangan selalu sementara: pengalihan permanen yang diingat browser akan melewati proxy
  // subdomain berikutnya, sehingga tanda tangan dari link email tidak sampai ke domain toko.
  if (signedPage(new URL(target).pathname)) {
    const access = readSignedAccessCookie((await cookies()).get(SIGNED_ACCESS_COOKIE)?.value);
    redirect(access ? `${target}?${new URLSearchParams(access)}` : target);
  }
  permanentRedirect(target);
}
