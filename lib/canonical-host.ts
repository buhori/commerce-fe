/** Header tempat proxy.ts meneruskan path dan query halaman ke layout (Server Component tidak tahu URL-nya). */
export const REQUEST_PATH_HEADER = "x-sellosy-path";

function hostname(host: string | null | undefined): string | null {
  const value = host?.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return value || null;
}

/** Hanya path relatif yang dipakai; selain itu (mis. `//evil.test`) menjadi beranda. */
function safePath(path: string | null | undefined): string {
  return path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
}

/**
 * Alamat tujuan bila toko dibuka dari alamat selain alamat utamanya (`store.url` dari backend: domain
 * sendiri bila sudah terhubung), atau null bila tidak perlu dialihkan. Yang dialihkan hanya alamat
 * lain milik toko yang sama: subdomain platform (`{identifier}.{rootDomain}`) dan pasangan www/tanpa www
 * dari domain utamanya. Host lain (localhost, deployment satu toko) dibiarkan.
 */
export function canonicalRedirect(
  requestHost: string | null | undefined,
  canonicalUrl: string | null | undefined,
  path: string | null | undefined,
  rootDomain: string | null | undefined,
): string | null {
  let canonical: URL;
  try {
    canonical = new URL(canonicalUrl ?? "");
  } catch {
    return null;
  }
  if (canonical.protocol !== "https:" && canonical.protocol !== "http:") return null;

  const current = hostname(requestHost);
  const target = hostname(canonical.host);
  if (!current || !target || current === target) return null;

  const root = hostname(rootDomain)?.replace(/^\./, "");
  const platformSubdomain = Boolean(root) && current.endsWith(`.${root}`) && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(current.slice(0, -(root!.length + 1)));
  const wwwVariant = current === `www.${target}` || target === `www.${current}`;
  if (!platformSubdomain && !wwwVariant) return null;

  return `${canonical.origin}${safePath(path)}`;
}
