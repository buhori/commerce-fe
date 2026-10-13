import { NextResponse, type NextRequest } from "next/server";
import { catalogUrl, readCatalogFilter } from "./lib/catalog-url";
import { isThemeId, PREVIEW_HEADER, PREVIEW_RESPONSE_HEADERS, THEME_PREVIEW_COOKIE } from "./themes/registry";

// Sama dengan PREVIEW_TOKEN di lib/store-api.ts (proxy tidak mengimpor modul server).
const PREVIEW_TOKEN = /^[A-Za-z0-9_-]{20,400}\.[A-Za-z0-9_-]{43}$/;

/**
 * - `?preview=<token>`: iframe builder di panel. Token diteruskan ke halaman lewat header (iframe
 *   dari situs lain tidak bisa menyimpan cookie); backend yang memeriksa token itu.
 * - `?theme=<id>`: pratinjau tema untuk developer (THEME_PREVIEW=true) disimpan ke cookie, lalu
 *   diarahkan ke URL yang sama tanpa parameter; `?theme=store` kembali ke tema dari panel.
 */
export function proxy(request: NextRequest) {
  // Pencarian dan urutan dulu tinggal di "/"; katalog sekarang di /products. 307 sungguhan
  // (bukan pengalihan lewat halaman), supaya bookmark dan mesin pencari ikut pindah.
  const search = request.nextUrl.searchParams;
  if (request.nextUrl.pathname === "/" && !search.has("preview") && (search.has("q") || search.has("sort") || search.has("filter"))) {
    return NextResponse.redirect(new URL(catalogUrl(readCatalogFilter(search)), request.url));
  }

  const preview = request.nextUrl.searchParams.get("preview");
  if (preview !== null) {
    const forwarded = new Headers(request.headers);
    forwarded.delete(PREVIEW_HEADER);
    if (PREVIEW_TOKEN.test(preview)) forwarded.set(PREVIEW_HEADER, preview);
    const response = NextResponse.next({ request: { headers: forwarded } });
    for (const [name, value] of Object.entries(PREVIEW_RESPONSE_HEADERS)) response.headers.set(name, value);
    return response;
  }
  

  if (process.env.THEME_PREVIEW !== "true" || !request.nextUrl.searchParams.has("theme")) return NextResponse.next();

  const url = request.nextUrl.clone();
  const theme = url.searchParams.get("theme");
  url.searchParams.delete("theme");
  const response = NextResponse.redirect(url);
  if (isThemeId(theme)) {
    response.cookies.set(THEME_PREVIEW_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  } else {
    response.cookies.delete(THEME_PREVIEW_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    { source: "/((?!_next|api|auth|favicon.ico).*)", has: [{ type: "query", key: "theme" }] },
    { source: "/((?!_next|api|auth|favicon.ico).*)", has: [{ type: "query", key: "preview" }] },
    { source: "/", has: [{ type: "query", key: "q" }] },
    { source: "/", has: [{ type: "query", key: "sort" }] },
    { source: "/", has: [{ type: "query", key: "filter" }] },
  ],
};
