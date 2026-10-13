import { NextResponse, type NextRequest } from "next/server";
import { isThemeId, THEME_PREVIEW_COOKIE } from "./themes/registry";

/**
 * Pratinjau tema untuk developer (THEME_PREVIEW=true): `?theme=editorial` disimpan ke cookie lalu
 * diarahkan ke URL yang sama tanpa parameter itu; `?theme=store` kembali ke tema dari panel.
 * Tanpa THEME_PREVIEW, parameter ini diabaikan.
 */
export function proxy(request: NextRequest) {
  if (process.env.THEME_PREVIEW !== "true") return NextResponse.next();

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
  matcher: [{ source: "/((?!_next|api|auth|favicon.ico).*)", has: [{ type: "query", key: "theme" }] }],
};
