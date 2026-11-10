import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/checkout.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { readOrder } = exports;

const order = (fields = {}, payment = {}) => readOrder({ data: {
  id: 9, status: "pending", total: 50000, shipping_cost: 10000, grand_total: 60000,
  payment: { method: { code: "bank_transfer", name: "Transfer bank" }, bank_account: null, ...payment },
  ...fields,
} });

test("the store's anti-fraud poster is read as an absolute http(s) URL only", () => {
  assert.equal(order({ fraud_poster: "https://cdn.example.com/stores/1/posters/a.webp" }).fraud_poster, "https://cdn.example.com/stores/1/posters/a.webp");
  assert.equal(order().fraud_poster, null);
  assert.equal(order({ fraud_poster: "javascript:alert(1)" }).fraud_poster, null);
  assert.equal(order({ fraud_poster: "" }).fraud_poster, null);
});

const dialog = readFileSync(new URL("../components/fraud-poster.tsx", import.meta.url), "utf8");
const payment = readFileSync(new URL("../components/order-payment.tsx", import.meta.url), "utf8");

test("the poster opens on the first visit to the payment page, whatever the payment status", () => {
  assert.match(payment, /\{order\.fraud_poster && \(\s*<FraudPosterDialog/);
});

test("the poster closes only through its confirm button", () => {
  assert.match(dialog, />Saya Mengerti Dan Waspada<\/Button>/);
  // Escape dibatalkan, tidak ada tombol X atau klik di luar, dan penutupan lain membuka modal lagi.
  assert.match(dialog, /onCancel=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(dialog, /if \(!confirmed\.current\) dialog\.current\?\.showModal\(\)/);
  assert.doesNotMatch(dialog, /aria-label="Tutup"|event\.target === event\.currentTarget/);
  assert.equal((dialog.match(/\.close\(\)/g) ?? []).length, 1);
});
