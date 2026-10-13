import { NextResponse, type NextRequest } from "next/server";
import { secureCookie } from "@/lib/auth";
import { publicUrl } from "@/lib/request-origin";
import { getPreview } from "@/lib/store-api";
import { PREVIEW_COOKIE, PREVIEW_RESPONSE_HEADERS } from "@/themes/registry";

/**
 * Tombol pratinjau di panel toko membuka /preview?token=…: token yang sah disimpan di cookie
 * browser ini saja, lalu diarahkan ke beranda. `?exit=1` mengakhiri pratinjau.
 */
export async function GET(request: NextRequest) {
  // Token ada di URL permintaan ini; pengalihan membuangnya dari bilah alamat.
  const response = NextResponse.redirect(publicUrl(request, "/"));
  for (const [name, value] of Object.entries(PREVIEW_RESPONSE_HEADERS)) response.headers.set(name, value);
  const token = request.nextUrl.searchParams.get("token");
  const preview = request.nextUrl.searchParams.has("exit") ? null : await getPreview(token);

  if (preview && token) {
    // Backend menyimpan token 2 jam; cookie tidak perlu hidup lebih lama dari itu.
    response.cookies.set(PREVIEW_COOKIE, token, { httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/", maxAge: 2 * 60 * 60 });
  } else {
    response.cookies.delete(PREVIEW_COOKIE);
  }
  return response;
}
