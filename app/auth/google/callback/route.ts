import { NextResponse, type NextRequest } from "next/server";
import { backendFetch, CUSTOMER_COOKIE, OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, safeNext, secureCookie } from "@/lib/auth";

// Google sends the buyer back here. The code is exchanged server-side for a
// Passport token, which the browser only ever holds as an HttpOnly cookie.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const next = safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const code = params.get("code");

  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    // The state is single-use.
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/auth" });
    response.cookies.delete({ name: OAUTH_NEXT_COOKIE, path: "/auth" });
    return response;
  };
  const fail = (reason: string) => redirect(`/login?error=${reason}&next=${encodeURIComponent(next)}`);

  if (params.get("error")) return fail("cancelled");
  if (!code || !state || params.get("state") !== state) return fail("state");

  let token: string | undefined;
  let reason = "google";
  try {
    const response = await backendFetch(request, "/auth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (response.ok) token = (await response.json()).token;
    else if (response.status === 403) reason = "blocked";
  } catch {
    // Reported as a generic Google failure.
  }
  if (!token) return fail(reason);

  const response = redirect(next);
  response.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  // The guest cart and addresses now belong to the account.
  response.cookies.delete("guest_token");
  return response;
}
