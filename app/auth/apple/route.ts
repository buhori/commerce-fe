import { NextResponse, type NextRequest } from "next/server";
import { backendFetch, OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, safeNext, secureCookie } from "@/lib/auth";

// Starts "Masuk dengan Apple": the state cookie ties Apple's answer to this browser.
export async function GET(request: NextRequest) {
  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  let url: string | undefined;
  try {
    const response = await backendFetch(request, `/auth/apple/url?state=${state}`);
    if (response.ok) url = (await response.json()).url;
  } catch {
    // Handled below like any other failure.
  }
  if (!url) return NextResponse.redirect(new URL(`/login?error=apple&next=${encodeURIComponent(next)}`, request.url));

  const redirect = NextResponse.redirect(url);
  // Lax is enough: Apple's cross-site POST is relayed as a same-site POST before these are read.
  const options = { httpOnly: true, secure: secureCookie, sameSite: "lax" as const, path: "/auth", maxAge: 600 };
  redirect.cookies.set(OAUTH_STATE_COOKIE, state, options);
  redirect.cookies.set(OAUTH_NEXT_COOKIE, next, options);
  return redirect;
}
