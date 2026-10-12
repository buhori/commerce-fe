import type { NextRequest } from "next/server";

/**
 * Origin the browser used, e.g. https://demo.sellosy.com. Behind a reverse proxy request.nextUrl is
 * Next's own listen address (http://localhost:3001), so read the forwarded scheme and host instead.
 * Next fills both from Host and the socket when no proxy sets them, so local development is unchanged.
 */
export function publicOrigin(request: NextRequest): string {
  const first = (name: string) => request.headers.get(name)?.split(",")[0].trim() || null;
  const host = first("x-forwarded-host") ?? first("host");
  if (!host) return request.nextUrl.origin;
  const proto = first("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}

/** Absolute URL on the public origin, for redirects. */
export function publicUrl(request: NextRequest, path: string): URL {
  return new URL(path, publicOrigin(request));
}

/** CSRF guard for state-changing route handlers: a browser-sent Origin must be this site. */
export function isForeignOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin !== publicOrigin(request);
}
