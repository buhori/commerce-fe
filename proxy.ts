import { NextResponse, type NextRequest } from "next/server";
import { REQUEST_PATH_HEADER } from "./lib/canonical-host";
import { catalogUrl, readCatalogFilter } from "./lib/catalog-url";
import { ORDER_ACCESS_COOKIE, rememberOrderAccess } from "./lib/order-access";
import { readSignedAccess, SIGNED_ACCESS_COOKIE, signedAccessCookie, signedAccessMaxAge, signedPage } from "./lib/signed-access";
import { isThemeId, PREVIEW_HEADER, PREVIEW_RESPONSE_HEADERS, THEME_PREVIEW_COOKIE } from "./themes/registry";

// Sama dengan PREVIEW_TOKEN di lib/store-api.ts (proxy tidak mengimpor modul server).
const PREVIEW_TOKEN = /^[A-Za-z0-9_-]{20,400}\.[A-Za-z0-9_-]{43}$/;

/**
 * - `?preview=<token>`: iframe builder di panel. Token diteruskan ke halaman lewat header (iframe
 *   dari situs lain tidak bisa menyimpan cookie); backend yang memeriksa token itu.
 * - `?theme=<id>`: pratinjau tema untuk developer (THEME_PREVIEW=true) disimpan ke cookie, lalu
 *   diarahkan ke URL yang sama tanpa parameter; `?theme=store` kembali ke tema dari panel.
 * - `/payment/{id}?token=<token>`: link "Bayar Sekarang" dari WhatsApp. Tokennya disimpan di cookie HttpOnly
 *   (lib/order-access.ts), lalu diarahkan ke URL yang sama tanpa token, supaya tidak tertinggal di riwayat.
 * - `/invoice/{id}` dan `/review/{id}` dengan `?expires=…&signature=…` (link dari email): tanda tangannya
 *   disimpan di cookie HttpOnly khusus path itu (lib/signed-access.ts), lalu diarahkan ke URL tanpa query.
 * - Path dan query setiap halaman diteruskan ke layout (REQUEST_PATH_HEADER), yang mengalihkan
 *   subdomain platform ke domain toko sendiri (lib/canonical-host.ts). Pengalihannya di layout,
 *   bukan di sini, karena butuh data toko dan fetch di proxy tidak di-cache.
 */
export function proxy(request: NextRequest) {
  // Pencarian dan urutan dulu tinggal di "/"; katalog sekarang di /products. 308 (permanen,
  // bukan pengalihan lewat halaman), supaya bookmark dan mesin pencari ikut pindah.
  const search = request.nextUrl.searchParams;
  if (request.nextUrl.pathname === "/" && !search.has("preview") && (search.has("q") || search.has("sort") || search.has("filter"))) {
    return NextResponse.redirect(new URL(catalogUrl(readCatalogFilter(search)), request.url), 308);
  }

  const payment = request.nextUrl.pathname.match(/^\/payment\/(\d{1,10})$/);
  const accessToken = search.get("token");
  if (payment && accessToken !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("token");
    const response = NextResponse.redirect(url);
    const value = rememberOrderAccess(request.cookies.get(ORDER_ACCESS_COOKIE)?.value, payment[1], accessToken);
    if (value) {
      response.cookies.set(ORDER_ACCESS_COOKIE, value, {
        path: "/", httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  const signedPath = signedPage(request.nextUrl.pathname);
  if (signedPath && (search.has("expires") || search.has("signature"))) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("expires");
    url.searchParams.delete("signature");
    const response = NextResponse.redirect(url);
    const access = readSignedAccess(search.get("expires"), search.get("signature"));
    const maxAge = access ? signedAccessMaxAge(access) : 0;
    // Link kedaluwarsa atau rusak: tanpa cookie, halamannya menyatakan link tidak berlaku.
    if (access && maxAge > 0) {
      response.cookies.set(SIGNED_ACCESS_COOKIE, signedAccessCookie(access), {
        path: signedPath, httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge,
      });
    }
    return response;
  }

  // Selalu ditimpa: nilai dari pengunjung tidak dipakai.
  const forwarded = new Headers(request.headers);
  forwarded.set(REQUEST_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);
  forwarded.delete(PREVIEW_HEADER);

  const preview = request.nextUrl.searchParams.get("preview");
  if (preview !== null) {
    if (PREVIEW_TOKEN.test(preview)) forwarded.set(PREVIEW_HEADER, preview);
    const response = NextResponse.next({ request: { headers: forwarded } });
    for (const [name, value] of Object.entries(PREVIEW_RESPONSE_HEADERS)) response.headers.set(name, value);
    return response;
  }

  if (process.env.THEME_PREVIEW !== "true" || !request.nextUrl.searchParams.has("theme")) {
    return NextResponse.next({ request: { headers: forwarded } });
  }

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
  // Semua halaman (untuk REQUEST_PATH_HEADER); aset Next, route API, dan login tidak.
  matcher: ["/((?!_next|api|auth|favicon.ico).*)"],
};
