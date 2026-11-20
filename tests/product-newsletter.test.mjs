import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, JSON, Object, Error });
  return exports;
}

const { readNewsletterEmail, subscribeToProduct } = loadModule("../lib/product-newsletter.ts");
const { productView } = (() => {
  // product-view mengimpor ./format dan ./store-shared; cukup versi tiruan yang dibutuhkan di sini.
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/product-view.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, Set, Array,
    require: (name) => name === "./store-shared"
      ? { preorderDays: (product) => product?.preorder_duration ?? 0 }
      : { formatWeight: (grams) => `${grams} g` },
  });
  return exports;
})();

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => (typeof body === "string" ? JSON.parse(body) : body) };
}

test("emails are trimmed and checked before they are sent", () => {
  assert.deepEqual({ ...readNewsletterEmail("  budi@example.test ") }, { email: "budi@example.test", error: null });
  assert.equal(readNewsletterEmail("").error, "Masukkan alamat email.");
  assert.equal(readNewsletterEmail("budi@example").error, "Alamat email belum benar.");
  assert.equal(readNewsletterEmail(`${"a".repeat(250)}@b.test`).error, "Alamat email belum benar.");
});

test("subscribing posts the email to the product's newsletter route", async () => {
  const calls = [];
  await subscribeToProduct(123, "budi@example.test", async (url, init) => {
    calls.push({ url, init });
    return response(201, { message: "ok" });
  });
  assert.equal(calls[0].url, "/api/products/123/newsletter");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, JSON.stringify({ email: "budi@example.test" }));
});

test("backend rejections surface their first validation message", async () => {
  await assert.rejects(
    subscribeToProduct(1, "x@y.z", async () => response(422, { message: "The given data was invalid.", errors: { email: ["Alamat email belum benar."] } })),
    { message: "Alamat email belum benar." },
  );
  await assert.rejects(subscribeToProduct(1, "x@y.z", async () => response(422, { message: "Produk ini sudah bisa dibeli." })), { message: "Produk ini sudah bisa dibeli." });
  await assert.rejects(subscribeToProduct(1, "x@y.z", async () => response(429, { message: "Too Many Attempts." })), { message: "Terlalu banyak percobaan. Coba lagi sebentar lagi." });
  await assert.rejects(subscribeToProduct(1, "x@y.z", async () => response(500, "<html>")), { message: "Email belum dapat disimpan. Silakan coba lagi." });
});

test("a newsletter product reads as coming soon, even with stock or a pre-order period", () => {
  const base = { id: 1, slug: "kopi", name: "Kopi", price: 1000, stock: 10, preorder_duration: 0, variants: [] };
  assert.deepEqual({ ...productView({ ...base, newsletter: true, preorder_duration: 7 }).availability }, { tone: "soon", text: "Segera hadir" });
  assert.equal(productView({ ...base, newsletter: true }).newsletter, true);
  assert.equal(productView(base).newsletter, false);
  assert.equal(productView(base).availability.tone, "ok");
});
