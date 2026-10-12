import { headers } from "next/headers";

/**
 * Store sent as X-Store-Id. With STORE_ROOT_DOMAIN=sellosy.com, demo.sellosy.com selects the
 * store whose identifier is "demo"; any other host falls back to STORE_ID.
 */
export function storeIdFromHost(host: string | null | undefined): string {
  const fallback = process.env.STORE_ID || "404";
  const root = process.env.STORE_ROOT_DOMAIN?.trim().toLowerCase().replace(/^\./, "");
  if (!host || !root) return fallback;
  const hostname = host.trim().toLowerCase().replace(/:\d+$/, "");
  if (!hostname.endsWith(`.${root}`)) return fallback;
  const subdomain = hostname.slice(0, -(root.length + 1));
  // One DNS label only: a.b.sellosy.com is not a store.
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain) ? subdomain : fallback;
}

/** Store for the current request, for server components and server-side fetches. */
export async function currentStoreId(): Promise<string> {
  return storeIdFromHost((await headers()).get("host"));
}
