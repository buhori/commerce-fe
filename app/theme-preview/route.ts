import { NextResponse, type NextRequest } from "next/server";
import { secureCookie } from "@/lib/auth";
import { publicUrl } from "@/lib/request-origin";
import { getThemePreview } from "@/lib/store-api";
import { THEME_PREVIEW_TOKEN_COOKIE } from "@/themes/registry";

/**
 * Tombol "Pratinjau" di panel toko membuka /theme-preview?token=…: token yang sah disimpan di
 * cookie browser ini saja, lalu pembeli diarahkan ke beranda. `?exit=1` mengakhiri pratinjau.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(publicUrl(request, "/"));
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const theme = request.nextUrl.searchParams.has("exit") ? null : await getThemePreview(token);

  if (theme && token) {
    // Backend menyimpan token 2 jam; cookie tidak perlu hidup lebih lama dari itu.
    response.cookies.set(THEME_PREVIEW_TOKEN_COOKIE, token, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: 2 * 60 * 60 });
  } else {
    response.cookies.delete(THEME_PREVIEW_TOKEN_COOKIE);
  }
  return response;
}
