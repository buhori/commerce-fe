import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/checkout.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { readOrder, paymentCompleted } = exports;

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

test("the poster waits until the buyer has paid: confirmed, gateway paid, or proof sent", () => {
  assert.equal(paymentCompleted(order()), false);
  assert.equal(paymentCompleted(order({ status: "paid" })), true);
  assert.equal(paymentCompleted(order({ status: "delivering" })), true);
  assert.equal(paymentCompleted(order({}, { has_proof: true })), true);
  assert.equal(paymentCompleted(order({ status: "cancelled" }, { has_proof: true })), false);
  assert.equal(paymentCompleted({ status: "pending", proof_uploaded: false, online_payment: { status: "paid" } }), true);
  assert.equal(paymentCompleted({ status: "pending", proof_uploaded: false, online_payment: { status: "pending" } }), false);
});
