import type { NextRequest } from "next/server";
import { CUSTOMER_COOKIE, secureCookie } from "./auth";
import { requestHost, storeHeaders } from "./store-host";

export async function apiProxy(request: NextRequest, path: string) {
  const headers = new Headers({
    Accept: request.headers.get("accept") || "application/json",
    ...storeHeaders(requestHost(request.headers)),
  });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);
  const guestToken = request.cookies.get("guest_token")?.value;
  if (guestToken) headers.set("X-Guest-Token", guestToken);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  for (const name of ["Authorization", "X-XSRF-TOKEN"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Token pembeli disimpan HttpOnly, jadi hanya proxy ini yang bisa meneruskannya.
  const customerToken = request.cookies.get(CUSTOMER_COOKIE)?.value;
  if (customerToken) headers.set("Authorization", `Bearer ${customerToken}`);

  try {
    const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
    const upstream = await fetch(new URL(`${baseUrl.replace(/\/$/, "")}${path}`), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        // Raw bytes, not text: a multipart upload carries binary file data.
        : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const responseHeaders = new Headers(upstream.headers);
    // Fetch decompresses the body. Transport headers cannot describe the new hop.
    const connectionHeaders = upstream.headers.get("connection")?.split(",") || [];
    for (const name of [
      ...connectionHeaders.map((name) => name.trim()).filter(Boolean),
      "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
      "te", "trailer", "transfer-encoding", "upgrade",
      "content-encoding", "content-length", "set-cookie",
    ]) responseHeaders.delete(name);
    responseHeaders.set("Cache-Control", "no-store");
    // Token pembeli ditolak (kedaluwarsa, dicabut, atau kunci Passport berganti): buang cookienya,
    // supaya request berikutnya berjalan sebagai tamu, bukan 401 terus-menerus.
    if (upstream.status === 401 && customerToken) responseHeaders.append("Set-Cookie", expiredCustomerCookie());
    for (const value of upstream.headers.getSetCookie()) {
      // Scope backend cookies to the storefront so the browser can persist them.
      responseHeaders.append("Set-Cookie", value
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*Path=[^;]*/gi, "") + "; Path=/");
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    // Only a transport failure has no backend response to forward.
    return Response.json(
      { message: "Backend tidak dapat dihubungi.", source: "proxy" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

/** Set-Cookie yang menghapus token pembeli; atributnya sama dengan saat dipasang di callback login. */
export function expiredCustomerCookie() {
  return `${CUSTOMER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
}
