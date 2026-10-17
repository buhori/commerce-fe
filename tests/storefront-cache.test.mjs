import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const ENV = { STORE_API_URL: "http://backend.test/api", STORE_ID: "404", REVALIDATE_SECRET: "s3cret-value" };

/** Loads a TS module for real; relative and "@/lib/…" imports too, next/* stubbed. */
function load(file, { env = ENV, fetch = async () => ({ ok: true, json: async () => ({}) }), headers = {}, cookie, revalidated = [] } = {}) {
  const url = new URL(file, import.meta.url);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, fetch, URL, URLSearchParams, AbortSignal, Headers, Response, Request,
    process: { env },
    require: (name) => {
      const options = { env, fetch, headers, cookie, revalidated };
      if (name === "node:crypto") return crypto;
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/cache") return { revalidateTag: (tag, profile) => revalidated.push([tag, profile]) };
      if (name === "next/headers") {
        return {
          headers: async () => new Headers({ host: "kopi.sellosy.test", ...headers }),
          cookies: async () => ({ get: (key) => (key === "preview_token" && cookie ? { value: cookie } : undefined) }),
        };
      }
      if (name === "@/themes/registry") return load("../themes/registry.ts", options);
      if (name.startsWith("@/lib/")) return load(`../lib/${name.slice(6)}.ts`, options);
      if (name.startsWith("./")) return load(new URL(`${name}.ts`, url).href, options);
      return {};
    },
  });
  return exports;
}

const cache = load("../lib/storefront-cache.ts");

test("cached reads are tagged with the store ref and host the request was sent with", () => {
  assert.deepEqual([...cache.storeCacheTags({ "X-Store-Id": "Kopi", "X-Store-Host": "Kopi.Sellosy.test:3000" })], ["store:ref:kopi", "store:host:kopi.sellosy.test"]);
  assert.deepEqual([...cache.storeCacheTags({ "X-Store-Id": "404" })], ["store:ref:404"]);
  assert.deepEqual([...cache.storeCacheTags({ "X-Store-Id": "../x", "X-Store-Host": "bad host" })], []);
});

test("a revalidation request names every ref and host of one store", () => {
  assert.deepEqual([...cache.revalidationTags({ store_id: 12, refs: ["12", "kopi", "Kopi"], hosts: ["kopi.sellosy.com", "www.kopisaya.com", "<script>"] })], [
    "store:ref:12", "store:ref:kopi", "store:host:kopi.sellosy.com", "store:host:www.kopisaya.com",
  ]);
  assert.deepEqual([...cache.revalidationTags({ store_id: 7 })], ["store:ref:7"]);
  for (const body of [null, [], "12", {}, { store_id: "12" }, { store_id: 0 }, { store_id: 1, refs: "kopi" }, { store_id: 1, hosts: Array(33).fill("a.test") }]) {
    assert.equal(cache.revalidationTags(body), null, JSON.stringify(body));
  }
});

test("only the exact bearer secret authorizes a revalidation", () => {
  assert.equal(cache.revalidationAuthorized("Bearer s3cret-value", "s3cret-value"), true);
  assert.equal(cache.revalidationAuthorized("bearer  s3cret-value ", "s3cret-value"), true);
  for (const header of [null, "", "s3cret-value", "Bearer s3cret", "Bearer s3cret-value2", "Basic s3cret-value"]) {
    assert.equal(cache.revalidationAuthorized(header, "s3cret-value"), false, String(header));
  }
  // No secret configured: nothing is accepted, not even an empty token.
  assert.equal(cache.revalidationAuthorized("Bearer ", ""), false);
  assert.equal(cache.revalidationAuthorized("Bearer x", undefined), false);
});

const post = (body, authorization = "Bearer s3cret-value") => new Request("http://shop.test/api/revalidate", {
  method: "POST",
  headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

test("the revalidate route expires the store's tags immediately", async () => {
  const revalidated = [];
  const { POST } = load("../app/api/revalidate/route.ts", { revalidated });
  const response = await POST(post({ store_id: 12, refs: ["12", "kopi"], hosts: ["kopi.sellosy.com"] }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(revalidated.map(([tag, profile]) => [tag, { ...profile }]), [
    ["store:ref:12", { expire: 0 }], ["store:ref:kopi", { expire: 0 }], ["store:host:kopi.sellosy.com", { expire: 0 }],
  ]);
});

test("the revalidate route rejects a wrong secret and malformed bodies without revalidating", async () => {
  const revalidated = [];
  const { POST } = load("../app/api/revalidate/route.ts", { revalidated });

  assert.equal((await POST(post({ store_id: 12 }, "Bearer nope"))).status, 401);
  assert.equal((await POST(post({ store_id: 12 }, null))).status, 401);
  assert.equal((await POST(post("not json"))).status, 422);
  assert.equal((await POST(post({ refs: ["kopi"] }))).status, 422);

  const { POST: unconfigured } = load("../app/api/revalidate/route.ts", { revalidated, env: { ...ENV, REVALIDATE_SECRET: "" } });
  assert.equal((await unconfigured(post({ store_id: 12 }, "Bearer "))).status, 401);
  assert.deepEqual(revalidated, []);
});

/** Records each store API request's path and Next.js cache options. */
function recordingFetch(body = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ path: new URL(url).pathname + new URL(url).search, cache: init.cache, next: init.next && { ...init.next, tags: [...init.next.tags] }, headers: init.headers });
    return { ok: true, json: async () => body };
  };
  return { calls, fetch };
}

test("public store reads are cached per store with a fallback lifetime", async () => {
  const { calls, fetch } = recordingFetch({ data: [] });
  const api = load("../lib/store-api.ts", { fetch, headers: { "x-forwarded-host": "kopisaya.com" } });
  await api.getNavigation();
  await api.getProducts({ sort: "latest" });

  for (const call of calls) {
    assert.equal(call.cache, undefined);
    assert.deepEqual(call.next, { revalidate: 300, tags: ["store:ref:404", "store:host:kopisaya.com"] });
    // The cache key includes these headers, so stores never share an entry.
    assert.equal(call.headers["X-Store-Host"], "kopisaya.com");
    assert.equal(call.headers["X-Store-Id"], "404");
  }
});

test("searches, previews, and storefronts without a revalidation secret are never cached", async () => {
  const { calls, fetch } = recordingFetch({ data: [] });
  await load("../lib/store-api.ts", { fetch }).getProducts({ q: "kopi" });
  await load("../lib/store-api.ts", { fetch }).getHomeSections("a".repeat(30) + "." + "b".repeat(43));
  await load("../lib/store-api.ts", { fetch, env: { ...ENV, REVALIDATE_SECRET: "" } }).getNavigation();

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.cache, "no-store", call.path);
    assert.equal(call.next, undefined, call.path);
  }
  assert.ok(calls[1].headers["X-Preview-Token"]);
});

test("the store says whether the built-with badge is hidden; anything but true keeps it", async () => {
  const storeWith = (extra) => load("../lib/store-api.ts", { fetch: recordingFetch({ id: 1, name: "Kopi", ...extra }).fetch }).getStore();
  assert.equal((await storeWith({ hide_branding: true })).hide_branding, true);
  for (const value of [undefined, false, "true", 1, null]) {
    assert.equal((await storeWith({ hide_branding: value })).hide_branding, false, String(value));
  }
});
