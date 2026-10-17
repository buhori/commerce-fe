import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, URLSearchParams });
  return exports;
}

// Seperti di catalog.test.mjs: store-api dimuat sungguhan bersama modul lib/ yang diimpornya, dengan fetch palsu.
function loadStoreApi(file, fetch) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, fetch, URL, URLSearchParams, AbortSignal, Headers,
    process: { env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" } },
    require: (name) => {
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/headers") return { headers: async () => new Headers({ host: "toko.sellosy.test" }), cookies: async () => ({ get: () => undefined }) };
      if (name.startsWith("./")) return loadStoreApi(new URL(`${name}.ts`, new URL(file, import.meta.url)).href, fetch);
      return {};
    },
  });
  return exports;
}

const storeWith = (body) => loadStoreApi("../lib/store-api.ts", async () => ({ ok: true, json: async () => body })).getStore();

const { readStoreMaintenance, MAINTENANCE_NOTE } = loadModule("../lib/store-shared.ts");
const { checkoutErrorMessage } = loadModule("../lib/checkout.ts");

const STORE_ERROR = "Toko sedang dalam perawatan. Pesanan belum bisa dibuat untuk sementara.";

test("store maintenance keeps every known reason while active", () => {
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: "manual" }) }, { active: true, reason: "manual" });
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: "setup" }) }, { active: true, reason: "setup" });
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: "unpublished" }) }, { active: true, reason: "unpublished" });
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: null }) }, { active: true, reason: null });
});

test("store maintenance drops unknown reasons", () => {
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: "courier" }) }, { active: true, reason: null });
  assert.deepEqual({ ...readStoreMaintenance({ active: true, reason: 1 }) }, { active: true, reason: null });
});

test("only active: true puts the store in maintenance; old backends stay open", () => {
  for (const value of [undefined, null, "yes", true, [], {}, { active: "true" }, { active: 1 }, { reason: "manual" }]) {
    assert.deepEqual({ ...readStoreMaintenance(value) }, { active: false, reason: null }, JSON.stringify(value));
  }
  // Alasan tanpa perawatan aktif tidak berarti apa-apa.
  assert.deepEqual({ ...readStoreMaintenance({ active: false, reason: "setup" }) }, { active: false, reason: null });
});

test("getStore always returns a normalized maintenance flag", async () => {
  assert.deepEqual({ ...(await storeWith({ name: "Toko" })).maintenance }, { active: false, reason: null });
  assert.deepEqual({ ...(await storeWith({ name: "Toko", maintenance: { active: true, reason: "setup" } })).maintenance }, { active: true, reason: "setup" });
  assert.deepEqual({ ...(await storeWith({ name: "Toko", maintenance: { active: "1", reason: "manual" } })).maintenance }, { active: false, reason: null });
});

test("the inline maintenance note is short buyer-facing text", () => {
  assert.equal(MAINTENANCE_NOTE, "Toko sedang dalam perawatan; pesanan belum bisa dibuat.");
});

test("checkout errors prefer the store error over Laravel's summary message", () => {
  const body = { message: `${STORE_ERROR} (and 1 more error)`, errors: { store: [STORE_ERROR], address_id: ["Alamat tidak valid."] } };
  assert.equal(checkoutErrorMessage(422, body), STORE_ERROR);
});

test("checkout errors fall back to the message, then to a generic text", () => {
  assert.equal(checkoutErrorMessage(422, { message: "Stok tidak cukup.", errors: { items: ["Stok tidak cukup."] } }), "Stok tidak cukup.");
  assert.equal(checkoutErrorMessage(422, { message: "Stok tidak cukup.", errors: { store: [] } }), "Stok tidak cukup.");
  assert.equal(checkoutErrorMessage(422, { message: "Stok tidak cukup.", errors: { store: "bukan daftar" } }), "Stok tidak cukup.");
  assert.equal(checkoutErrorMessage(422, { errors: null }), "Pesanan belum dapat dibuat. Silakan coba lagi.");
  assert.equal(checkoutErrorMessage(400, null), "Pesanan belum dapat dibuat. Silakan coba lagi.");
});

test("server errors never show the backend's text, even a store error", () => {
  assert.equal(checkoutErrorMessage(500, { message: "SQLSTATE[HY000]", errors: { store: [STORE_ERROR] } }), "Pesanan belum dapat dibuat. Silakan coba lagi.");
});
