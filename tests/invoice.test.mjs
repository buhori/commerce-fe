import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// lib/invoice.ts tanpa Next.js: modul yang diimpornya diganti stub secukupnya.
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/invoice.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports,
  require: (name) => ({
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    react: { cache: (fn) => fn },
    "./auth": { CUSTOMER_COOKIE: "customer_token" },
    "./checkout": { readOrderDiscount: () => ({}) },
    "./store-host": { currentStoreHeaders: async () => ({}) },
  })[name],
});
const { readInvoiceAccess } = exports;

test("a signed invoice link is read from the query string only when both parts look right", () => {
  const signature = "a".repeat(64);

  assert.deepEqual({ ...readInvoiceAccess({ expires: "1793000000", signature }) }, { expires: "1793000000", signature });
  assert.equal(readInvoiceAccess({}), null);
  assert.equal(readInvoiceAccess({ expires: "1793000000" }), null);
  assert.equal(readInvoiceAccess({ expires: "kapan-saja", signature }), null);
  assert.equal(readInvoiceAccess({ expires: "1793000000", signature: "bukan-tanda-tangan" }), null);
  // Parameter ganda (array) tidak dipakai.
  assert.equal(readInvoiceAccess({ expires: ["1", "2"], signature }), null);
});
