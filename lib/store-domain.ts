import { headers } from "next/headers";
import { permanentRedirect } from "next/navigation";
import { canonicalRedirect, REQUEST_PATH_HEADER } from "./canonical-host";
import { getStore } from "./store-api";
import { requestHost, requestPreviewToken } from "./store-host";

/**
 * Toko yang sudah terhubung ke domain sendiri hanya tampil di domain itu: subdomain platform
 * (mis. kopi.sellosy.com) dan pasangan www-nya dialihkan permanen (308) ke `store.url`, dengan path
 * dan query yang sama, supaya pembeli dan mesin pencari tidak melihat dua alamat. Pratinjau pemilik
 * toko tidak dialihkan. Dipanggil dari root layout, sebelum apa pun dirender.
 */
export async function redirectToStoreDomain(): Promise<void> {
  const store = await getStore().catch(() => null);
  if (!store?.url) return;
  const { token } = await requestPreviewToken();
  if (token) return;
  const source = await headers();
  const target = canonicalRedirect(requestHost(source), store.url, source.get(REQUEST_PATH_HEADER), process.env.STORE_ROOT_DOMAIN);
  if (target) permanentRedirect(target);
}
