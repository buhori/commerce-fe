import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/request-origin.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports, URL });
const { publicOrigin, publicUrl, isForeignOrigin, localPath } = exports;

// Next behind nginx: nextUrl is the internal listen address, the public host arrives forwarded.
const request = (headers, nextOrigin = "http://localhost:3001") => ({
  headers: new Headers(headers),
  nextUrl: new URL(nextOrigin),
});
const proxied = (extra = {}) => request({
  host: "demo.sellosy.com",
  "x-forwarded-host": "demo.sellosy.com",
  "x-forwarded-proto": "https",
  ...extra,
});

test("behind the proxy the public origin comes from the forwarded host and scheme", () => {
  assert.equal(publicOrigin(proxied()), "https://demo.sellosy.com");
  assert.equal(publicUrl(proxied(), "/login?error=google").href, "https://demo.sellosy.com/login?error=google");
});

test("same-site browser requests pass, other sites are rejected", () => {
  assert.equal(isForeignOrigin(proxied({ origin: "https://demo.sellosy.com" })), false);
  assert.equal(isForeignOrigin(proxied()), false);
  assert.equal(isForeignOrigin(proxied({ origin: "https://evil.example" })), true);
  assert.equal(isForeignOrigin(proxied({ origin: "https://toko-lain.sellosy.com" })), true);
  assert.equal(isForeignOrigin(proxied({ origin: "http://demo.sellosy.com" })), true);
  assert.equal(isForeignOrigin(proxied({ origin: "http://localhost:3001" })), true);
});

test("without a proxy (next dev) the origin is the local host", () => {
  const local = request({ host: "localhost:3000", "x-forwarded-host": "localhost:3000", "x-forwarded-proto": "http", origin: "http://localhost:3000" }, "http://localhost:3000");
  assert.equal(publicOrigin(local), "http://localhost:3000");
  assert.equal(isForeignOrigin(local), false);
});

test("the preview entry only redirects to a plain path on this store", () => {
  assert.equal(localPath("/summer-sale"), "/summer-sale");
  assert.equal(localPath("/"), "/");
  assert.equal(localPath("/c/kopi"), "/c/kopi");
  for (const value of [null, undefined, "", "summer-sale", "//evil.test", "/\\evil.test", "https://evil.test", "/a//b", "/a?x=1", "/a#b", "/%2F%2Fevil.test", `/${"a".repeat(200)}`]) {
    assert.equal(localPath(value), "/", String(value));
  }
});
