import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/canonical-host.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports, URL });
const { canonicalRedirect } = exports;

test("the platform subdomain of a store with its own domain moves there, path and query kept", () => {
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", "/products/arabika?ref=ig", "sellosy.com"), "https://kopi.id/products/arabika?ref=ig");
  assert.equal(canonicalRedirect("Kopi.Sellosy.com:443", "https://kopi.id/", "/", "sellosy.com"), "https://kopi.id/");
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", null, "sellosy.com"), "https://kopi.id/");
});

test("www and the bare domain go to whichever the store uses", () => {
  assert.equal(canonicalRedirect("www.kopi.id", "https://kopi.id", "/cart", "sellosy.com"), "https://kopi.id/cart");
  assert.equal(canonicalRedirect("kopi.id", "https://www.kopi.id", "/cart", null), "https://www.kopi.id/cart");
});

test("the store's own address, stores without a domain and unrelated hosts stay", () => {
  assert.equal(canonicalRedirect("kopi.id", "https://kopi.id", "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.sellosy.com", "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect("localhost:3000", "https://kopi.id", "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect("a.b.sellosy.com", "https://kopi.id", "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", "/", ""), null);
  assert.equal(canonicalRedirect("kopi.sellosy.com", null, "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect("kopi.sellosy.com", "javascript:alert(1)", "/", "sellosy.com"), null);
  assert.equal(canonicalRedirect(null, "https://kopi.id", "/", "sellosy.com"), null);
});

test("only a relative path is carried over", () => {
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", "//evil.test/x", "sellosy.com"), "https://kopi.id/");
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", "/\\evil.test", "sellosy.com"), "https://kopi.id/");
  assert.equal(canonicalRedirect("kopi.sellosy.com", "https://kopi.id", "https://evil.test", "sellosy.com"), "https://kopi.id/");
});
