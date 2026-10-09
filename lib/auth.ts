import type { NextRequest } from "next/server";

export const CUSTOMER_COOKIE = "customer_token";
export const OAUTH_STATE_COOKIE = "oauth_state";
export const OAUTH_NEXT_COOKIE = "oauth_next";

export interface Customer {
  name: string;
  email: string;
  avatar: string | null;
  phone?: string | null;
  gender?: "male" | "female" | null;
  birth_date?: string | null;
  joined_at?: string | null;
}

/** Only same-site paths may be used after login, never another origin. */
export function safeNext(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}

/** Direct backend call from a route handler, with the same headers the proxy sends. */
export function backendFetch(request: NextRequest, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Store-Id", process.env.STORE_ID || "404");
  const guestToken = request.cookies.get("guest_token")?.value;
  if (guestToken) headers.set("X-Guest-Token", guestToken);
  const customerToken = request.cookies.get(CUSTOMER_COOKIE)?.value;
  if (customerToken) headers.set("Authorization", `Bearer ${customerToken}`);

  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  return fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

export const secureCookie = process.env.NODE_ENV === "production";
