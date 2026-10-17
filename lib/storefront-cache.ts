import { createHash, timingSafeEqual } from "node:crypto";

/*
 * Server-side cache of public store API reads (lib/store-api.ts), dropped by the backend through
 * POST /api/revalidate whenever the merchant changes something the storefront shows.
 *
 * Tenants never share entries: Next.js keys a cached fetch on its URL *and headers*, and every
 * store API request carries X-Store-Id and X-Store-Host. The tags below only decide what gets
 * dropped together; they are built from the same two headers, because the storefront does not
 * know the store's numeric id before asking the API.
 */

/** Fallback lifetime: a missed webhook heals itself after this many seconds. */
export function storeCacheSeconds(): number {
  const value = Number(process.env.STORE_CACHE_SECONDS);
  return Number.isSafeInteger(value) && value > 0 ? value : 300;
}

/**
 * Caching is on only when the backend can drop it (REVALIDATE_SECRET is set); without that,
 * e.g. local development, every read goes to the API as before.
 */
export function storeCacheEnabled(): boolean {
  return Boolean(process.env.REVALIDATE_SECRET?.trim());
}

/** "Demo.Sellosy.com:3000" and "demo.sellosy.com." become "demo.sellosy.com". */
export function normalizeHost(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(host) ? host : null;
}

/** X-Store-Id value: a numeric id or a store identifier (subdomain label). */
function normalizeRef(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const ref = String(value).trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(ref) ? ref : null;
}

export const refTag = (ref: string) => `store:ref:${ref}`;
export const hostTag = (host: string) => `store:host:${host}`;

/** Tags for one cached read, from the store headers it was sent with (lib/store-host.ts). */
export function storeCacheTags(headers: Record<string, string>): string[] {
  const ref = normalizeRef(headers["X-Store-Id"]);
  const host = normalizeHost(headers["X-Store-Host"]);
  return [...(ref ? [refTag(ref)] : []), ...(host ? [hostTag(host)] : [])];
}

const MAX_KEYS = 32;

/**
 * Tags to drop for a revalidation request from the backend:
 * `{ store_id, refs?: string[], hosts?: string[] }` (refs: id and identifier; hosts: subdomain
 * and custom domains). Null when the body is not such a request.
 */
export function revalidationTags(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { store_id: storeId, refs, hosts } = body as Record<string, unknown>;
  if (!Number.isSafeInteger(storeId) || (storeId as number) < 1) return null;
  if ((refs !== undefined && !Array.isArray(refs)) || (hosts !== undefined && !Array.isArray(hosts))) return null;
  const refList = (refs as unknown[] | undefined) ?? [];
  const hostList = (hosts as unknown[] | undefined) ?? [];
  if (refList.length > MAX_KEYS || hostList.length > MAX_KEYS) return null;

  const tags = new Set([refTag(String(storeId))]);
  for (const ref of refList.map(normalizeRef)) if (ref) tags.add(refTag(ref));
  for (const host of hostList.map(normalizeHost)) if (host) tags.add(hostTag(host));
  return [...tags];
}

/** `Authorization: Bearer <secret>` against REVALIDATE_SECRET, in constant time. */
export function revalidationAuthorized(authorization: string | null, secret: string | undefined): boolean {
  const expected = secret?.trim();
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!expected || !match) return false;
  // Hashing first gives equal lengths, so the comparison leaks neither content nor length.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(match[1].trim()), digest(expected));
}
