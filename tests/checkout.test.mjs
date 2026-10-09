import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/checkout.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { readRegions, resetRegionChildren, readAddresses, readShippingMethods, readPaymentMethods, readShippingCost, readBankAccounts, readOrder } = exports;

test("region responses accept arrays/wrappers and only direct children of the selected parent", () => {
  assert.equal(readRegions([{ code: "11", name: "Aceh" }, { code: "11.02", name: "Kabupaten" }], 0).length, 1);
  const rows = readRegions({ data: [{ code: "11.02", name: "Kabupaten" }, { code: "12.02", name: "Wrong province" }, { code: "11.02.01", name: "Too deep" }] }, 1, "11");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].code, "11.02");
  assert.equal(readRegions([{ code: "11.02.01", name: "Kecamatan" }], 2, "11.02")[0].code, "11.02.01");
  assert.equal(readRegions([{ code: "11.02.01.0001", name: "Desa" }], 3, "11.02.01")[0].code, "11.02.01.0001");
  assert.throws(() => readRegions({ message: "failed" }, 0));
});

test("changing a parent clears all descendant selections", () => {
  const regions = [{ code: "11" }, { code: "11.02" }, { code: "11.02.01" }, { code: "11.02.01.0001" }];
  const province = resetRegionChildren(regions, 0, { code: "12" });
  assert.equal(province[0].code, "12");
  assert.ok(province.slice(1).every((entry) => entry === null));
  const district = resetRegionChildren(regions, 2, { code: "11.02.02" });
  assert.equal(district[0], regions[0]);
  assert.equal(district[1], regions[1]);
  assert.equal(district[2].code, "11.02.02");
  assert.equal(district[3], null);
});

test("address lists validate saved identifiers instead of treating arbitrary responses as saved addresses", () => {
  const address = { id: 1, label: "Rumah", address_code: "11.02.01.0001", address: "Jalan Uji", recipent: "Penerima", contact: "08123456789" };
  assert.equal(readAddresses([address])[0], address);
  assert.equal(readAddresses({ data: [address] })[0], address);
  assert.throws(() => readAddresses({ message: "Unauthenticated" }));
  assert.throws(() => readAddresses([{ ...address, id: undefined }]));
});

test("shipping methods keep only rows with a usable id and name, and normalise a missing icon", () => {
  const rows = readShippingMethods([{ id: 1, icon: null, name: "JNE" }, { id: 2, icon: "jet.svg", name: "JET" }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 1);
  assert.equal(rows[0].name, "JNE");
  assert.equal(rows[1].icon, "jet.svg");
  assert.equal(readShippingMethods({ data: [{ id: 3, name: "Tiki" }] })[0].icon, null);
  assert.throws(() => readShippingMethods({ message: "failed" }));
  assert.throws(() => readShippingMethods([{ id: 0, name: "Tanpa id" }]));
  assert.throws(() => readShippingMethods([{ id: 1, name: "  " }]));
});

test("payment methods are keyed by code, so an unnamed or code-less row is rejected", () => {
  const rows = readPaymentMethods([{ code: "bank_transfer", name: "Transfer Bank", icon: null }, { code: "qris", name: "QRIS" }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].code, "bank_transfer");
  assert.equal(rows[0].name, "Transfer Bank");
  assert.equal(rows[1].icon, null);
  assert.equal(readPaymentMethods({ data: [{ code: "virtual_account", name: "Virtual Account" }] })[0].code, "virtual_account");
  assert.throws(() => readPaymentMethods({ message: "failed" }));
  assert.throws(() => readPaymentMethods([{ name: "Tanpa kode" }]));
  assert.throws(() => readPaymentMethods([{ code: "qris" }]));
});

test("shipping cost is only trusted when every weight and price field is a real non-negative number", () => {
  const quote = readShippingCost({ cost: 15000, weight: 1400, chargeable_weight: 2000 });
  assert.equal(quote.cost, 15000);
  assert.equal(quote.chargeable_weight, 2000);
  assert.equal(readShippingCost({ data: { cost: 0, weight: 0, chargeable_weight: 0 } }).cost, 0);
  assert.throws(() => readShippingCost({ message: "The address code field is required." }));
  assert.throws(() => readShippingCost({ cost: "15000", weight: 1400, chargeable_weight: 2000 }));
  assert.throws(() => readShippingCost({ cost: -1, weight: 1400, chargeable_weight: 2000 }));
  assert.throws(() => readShippingCost({ cost: 15000, weight: 1400 }));
  assert.throws(() => readShippingCost(null));
});

test("bank accounts drop server-only columns and reject rows missing a bank, name or number", () => {
  const rows = readBankAccounts([{ id: 2, store_id: 404, bank: "BCA", name: "Demo Store", number: "12345", deleted_at: null }]);
  assert.equal(rows.length, 1);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["bank", "id", "name", "number"]);
  assert.equal(readBankAccounts({ data: [{ id: 3, bank: "BNI", name: "Toko", number: "9" }] })[0].bank, "BNI");
  assert.throws(() => readBankAccounts({ message: "failed" }));
  assert.throws(() => readBankAccounts([{ id: 2, bank: "BCA", name: "Demo Store" }]));
  assert.throws(() => readBankAccounts([{ id: 0, bank: "BCA", name: "Demo Store", number: "1" }]));
});

test("order responses expose the amount to transfer and tolerate a payment without a bank account", () => {
  const order = readOrder({ data: {
    id: 2, status: "pending", total: 873000, shipping_cost: 9000, discount: 0,
    unique_payment_code: 976, grand_total: 882976,
    payment: { method: "bank_transfer", bank_account: { id: 2, bank: "BCA", name: "Demo Store", number: "12345" } },
    shipping: { status: "assigned", method: { id: 1, name: "JNE" } },
  } });
  assert.equal(order.grand_total, 882976);
  assert.equal(order.unique_payment_code, 976);
  assert.equal(order.bank_account.number, "12345");
  assert.equal(order.shipping_method, "JNE");

  const qris = readOrder({ id: 3, status: "pending", total: 1000, shipping_cost: 0, grand_total: 1000, unique_payment_code: null, payment: { method: "qris", bank_account: null }, shipping: null });
  assert.equal(qris.unique_payment_code, null);
  assert.equal(qris.bank_account, null);
  assert.equal(qris.shipping_method, null);

  assert.throws(() => readOrder({ message: "Keranjang kosong, tidak ada yang bisa di-checkout." }));
  assert.throws(() => readOrder({ id: 2, total: 1000, shipping_cost: 0 }));
});

test("order lines carry photos and pre-order data, skipping malformed rows", () => {
  const order = readOrder({ data: {
    id: 4, status: "pending", total: 20000, shipping_cost: 0, grand_total: 20000, preorder_ready_at: "2026-10-11",
    items: [
      { amount: 2, price: 10000, preorder_duration: 14, product: { name: "Tas", images: [{ public_url: "http://img/a.webp" }] }, variant: { label: "Merah" } },
      { amount: 1, price: 5000, product: { name: "Topi", images: [] }, variant: null },
      { amount: 1, price: 5000, product: null },
    ],
  } });
  assert.equal(order.preorder_ready_at, "2026-10-11");
  assert.deepEqual(JSON.parse(JSON.stringify(order.items)), [
    { name: "Tas", variant: "Merah", amount: 2, price: 10000, preorder_duration: 14, image: "http://img/a.webp" },
    { name: "Topi", variant: null, amount: 1, price: 5000, preorder_duration: 0, image: null },
  ]);
  const plain = readOrder({ id: 5, status: "pending", total: 1, shipping_cost: 0, grand_total: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(plain.items)), []);
  assert.equal(plain.preorder_ready_at, null);
});
