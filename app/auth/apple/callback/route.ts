import { NextResponse, type NextRequest } from "next/server";
import { backendFetch, CUSTOMER_COOKIE, OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, safeNext, secureCookie } from "@/lib/auth";

// Apple answers with a cross-site form POST (response_mode=form_post). Browsers do not send
// SameSite=Lax cookies on that request, so neither the state nor the guest cart is visible.
// Step 1 relays the same fields back to this URL as a POST from our own page, which is
// same-site; step 2 (relay=1) then sees every cookie and finishes the login.
const FIELDS = ["code", "state", "user", "error"] as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function relayPage(form: FormData) {
  const inputs = FIELDS
    .map((name) => [name, form.get(name)] as const)
    .filter((entry): entry is readonly [typeof FIELDS[number], string] => typeof entry[1] === "string")
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
    .join("");
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Masuk…</title></head>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
<form method="post" action="/auth/apple/callback">${inputs}<input type="hidden" name="relay" value="1"><noscript><button type="submit">Lanjutkan masuk</button></noscript></form>
<p>Menyelesaikan proses masuk…</p>
<script>document.forms[0].submit()</script>
</body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // same-origin, not no-referrer: some browsers then send `Origin: null` on the relay POST.
      "Referrer-Policy": "same-origin",
    },
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.redirect(new URL("/login?error=apple", request.url), 303);
  if (form.get("relay") !== "1") return relayPage(form);

  // The relay only ever comes from our own page.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return Response.json({ message: "Permintaan tidak diizinkan." }, { status: 403 });
  }

  const state = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const next = safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const code = form.get("code");

  // 303: the browser follows with a GET, never repeating this POST.
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url), 303);
    // The state is single-use.
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/auth" });
    response.cookies.delete({ name: OAUTH_NEXT_COOKIE, path: "/auth" });
    return response;
  };
  const fail = (reason: string) => redirect(`/login?error=${reason}&next=${encodeURIComponent(next)}`);

  if (form.get("error")) return fail("cancelled");
  if (typeof code !== "string" || !code || !state || form.get("state") !== state) return fail("state");

  let token: string | undefined;
  let reason = "apple";
  try {
    const response = await backendFetch(request, "/auth/apple/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, name: readName(form.get("user")) }),
    });
    if (response.ok) token = (await response.json()).token;
    else if (response.status === 403) reason = "blocked";
    else if (response.status === 409) reason = "apple_linked";
  } catch {
    // Reported as a generic Apple failure.
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
  // The guest cart, addresses and orders now belong to the account.
  response.cookies.delete("guest_token");
  return response;
}

// Apple sends the name only on the first authorization, as JSON in the `user` field.
function readName(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  try {
    const name = (JSON.parse(value) as { name?: { firstName?: unknown; lastName?: unknown } }).name;
    const full = [name?.firstName, name?.lastName].filter((part): part is string => typeof part === "string" && part.trim() !== "").join(" ").trim();
    return full ? full.slice(0, 255) : null;
  } catch {
    return null;
  }
}
