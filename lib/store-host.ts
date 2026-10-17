import { cookies, headers } from "next/headers";
import { PREVIEW_COOKIE, PREVIEW_HEADER } from "@/themes/registry";
import { storeIdFromHost } from "./store-id";

/**
 * Header yang memberi tahu API toko mana yang sedang dibuka.
 *
 * X-Store-Host berisi host pembeli (subdomain platform atau domain sendiri); backend memakainya
 * untuk memilih toko dan untuk mengembalikan login Google ke toko yang benar. X-Store-Id tetap
 * dikirim: identifier dari subdomain (STORE_ROOT_DOMAIN) atau STORE_ID untuk localhost dan
 * deployment satu toko.
 */
export function storeHeaders(host: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = { "X-Store-Id": storeIdFromHost(host) };
  if (host) result["X-Store-Host"] = host;
  return result;
}

/** Host yang dibuka pembeli; di balik proxy X-Forwarded-Host didahulukan. */
export function requestHost(source: Headers): string | null {
  return source.get("x-forwarded-host")?.split(",")[0]?.trim() || source.get("host");
}

/** Untuk Server Component dan fungsi server lain yang tidak memegang objek request. */
export async function currentStoreHeaders(): Promise<Record<string, string>> {
  return storeHeaders(requestHost(await headers()));
}

/**
 * Token pratinjau pemilik toko di request ini, belum diperiksa: dari ?preview= (iframe builder,
 * diteruskan proxy.ts lewat header) atau dari cookie yang dipasang /preview (tab baru).
 */
export async function requestPreviewToken(): Promise<{ token: string | null; embedded: boolean }> {
  const [headerList, jar] = await Promise.all([headers(), cookies()]);
  const embeddedToken = headerList.get(PREVIEW_HEADER);
  return { token: embeddedToken ?? jar.get(PREVIEW_COOKIE)?.value ?? null, embedded: Boolean(embeddedToken) };
}
