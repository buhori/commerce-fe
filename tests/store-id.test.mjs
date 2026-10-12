import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(env) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL("../lib/store-id.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    process: { env },
    require: (name) => {
      if (name === "next/headers") return { headers: async () => new Headers() };
      throw new Error(`unexpected import ${name}`);
    },
  });
  return exports.storeIdFromHost;
}

test("a subdomain of the root domain selects the store by identifier", () => {
  const storeIdFromHost = load({ STORE_ROOT_DOMAIN: "sellosy.com", STORE_ID: "404" });
  assert.equal(storeIdFromHost("demo.sellosy.com"), "demo");
  assert.equal(storeIdFromHost("Toko-Baju.Sellosy.com:443"), "toko-baju");
});

test("other hosts fall back to STORE_ID", () => {
  const storeIdFromHost = load({ STORE_ROOT_DOMAIN: "sellosy.com", STORE_ID: "7" });
  assert.equal(storeIdFromHost("sellosy.com"), "7");
  assert.equal(storeIdFromHost("localhost:3000"), "7");
  assert.equal(storeIdFromHost("demo.example.com"), "7");
  assert.equal(storeIdFromHost("evil-sellosy.com"), "7");
  assert.equal(storeIdFromHost("a.b.sellosy.com"), "7");
  assert.equal(storeIdFromHost("-demo.sellosy.com"), "7");
  assert.equal(storeIdFromHost(null), "7");
});

test("without STORE_ROOT_DOMAIN every request uses STORE_ID", () => {
  assert.equal(load({ STORE_ID: "7" })("demo.sellosy.com"), "7");
  assert.equal(load({})("demo.sellosy.com"), "404");
});
