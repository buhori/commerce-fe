import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/checkout.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { readOrder, isManualPayment } = exports;

const qrisOrder = (qris_image) => readOrder({ data: {
  id: 7, status: "pending", total: 50000, shipping_cost: 10000, unique_payment_code: 123, grand_total: 60123,
  payment: { method: { code: "qris", name: "QRIS" }, bank_account: null, ...(qris_image === undefined ? {} : { qris_image }) },
} });

test("QRIS orders keep the store's absolute http(s) QRIS image", () => {
  const order = qrisOrder("https://api.example.com/storage/qris/toko.png");
  assert.equal(order.payment_method, "qris");
  assert.equal(order.qris_image, "https://api.example.com/storage/qris/toko.png");
  assert.equal(order.unique_payment_code, 123);
  assert.equal(order.bank_account, null);
  assert.equal(qrisOrder("  http://localhost:8000/storage/qris.webp ").qris_image, "http://localhost:8000/storage/qris.webp");
});

test("QRIS image rejects unsafe or relative values and defaults to null", () => {
  assert.equal(qrisOrder(undefined).qris_image, null);
  assert.equal(qrisOrder(null).qris_image, null);
  assert.equal(qrisOrder("").qris_image, null);
  assert.equal(qrisOrder("javascript:alert(1)").qris_image, null);
  assert.equal(qrisOrder("data:image/png;base64,AAAA").qris_image, null);
  assert.equal(qrisOrder("/storage/qris.png").qris_image, null);
  assert.equal(qrisOrder("storage/qris.png").qris_image, null);
  assert.equal(qrisOrder("//cdn.example.com/qris.png").qris_image, null);
  assert.equal(qrisOrder("https://").qris_image, null);
  assert.equal(qrisOrder(42).qris_image, null);
  // Pesanan tanpa relasi payment tetap terbaca.
  assert.equal(readOrder({ id: 8, total: 1000, shipping_cost: 0, grand_total: 1000 }).qris_image, null);
});

test("bank transfer and QRIS are the manual methods with a unique code and proof upload", () => {
  assert.equal(isManualPayment("bank_transfer"), true);
  assert.equal(isManualPayment("qris"), true);
  assert.equal(isManualPayment("cod"), false);
  assert.equal(isManualPayment(null), false);
  assert.equal(isManualPayment(undefined), false);
});
