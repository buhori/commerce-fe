import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Modul lib/ murni dimuat sungguhan, termasuk modul relatif yang diimpornya.
function loadModule(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, URLSearchParams,
    require: (name) => {
      if (name.startsWith("./")) return loadModule(new URL(`${name}.ts`, new URL(file, import.meta.url)).href);
      return {};
    },
  });
  return exports;
}

const { priceView, discountEndDate } = loadModule("../lib/price.ts");
const { readDiscount, readPricing, readProductPage } = loadModule("../lib/store-shared.ts");
const { getCartUnitPrice, getCartOriginalUnitPrice } = loadModule("../lib/cart.ts");
const { readCoupon, couponErrorMessage, fieldError, readOrderDiscount, readOrder } = loadModule("../lib/checkout.ts");
const { priceRange } = loadModule("../lib/seo.ts");

const plain = (value) => JSON.parse(JSON.stringify(value));
const percent = { type: "percent", value: 20, max_discount: null, ends_at: "2026-10-31T23:59:59+07:00", label: "-20%" };
const fixed = { type: "fixed", value: 5000, max_discount: null, ends_at: null, label: "-Rp5.000" };

test("a product without a discount shows only its price", () => {
  assert.deepEqual(plain(priceView({ price: 100000, final_price: 100000, discount: null })), { final: 100000, original: null, label: null, endsAt: null });
});

test("percent and fixed discounts strike through the normal price and carry the backend label", () => {
  assert.deepEqual(plain(priceView({ price: 100000, final_price: 80000, discount: percent })),
    { final: 80000, original: 100000, label: "-20%", endsAt: "2026-10-31T23:59:59+07:00" });
  assert.deepEqual(plain(priceView({ price: 50000, final_price: 45000, discount: fixed })),
    { final: 45000, original: 50000, label: "-Rp5.000", endsAt: null });
});

test("variants use their own price, or the product's price and discount when they have none", () => {
  const product = { price: 100000, final_price: 80000, discount: percent };
  // Varian berharga sendiri dengan final_price dari backend; label diambil dari diskon produk.
  assert.deepEqual(plain(priceView({ price: 150000, final_price: 120000 }, product)),
    { final: 120000, original: 150000, label: "-20%", endsAt: "2026-10-31T23:59:59+07:00" });
  // Varian tanpa harga sendiri mengikuti harga dan potongan produk.
  assert.equal(priceView({ price: null }, product).final, 80000);
  assert.equal(priceView({ price: null }, product).original, 100000);
  // Varian berharga sendiri tanpa final_price (backend lama): tidak ada potongan yang dikarang.
  assert.deepEqual(plain(priceView({ price: 150000 }, product)), { final: 150000, original: null, label: null, endsAt: null });
});

test("a missing or broken final_price falls back to the price, never showing a discount", () => {
  for (const final_price of [undefined, null, "80000", -1, NaN, Infinity]) {
    assert.deepEqual(plain(priceView({ price: 100000, final_price, discount: percent })), { final: 100000, original: null, label: null, endsAt: null });
  }
});

test("the original price is only shown when it is actually higher than the final price", () => {
  assert.equal(priceView({ price: 100000, final_price: 100000, discount: percent }).original, null);
  assert.equal(priceView({ price: 100000, final_price: 100000, discount: percent }).label, null);
  // Harga akhir lebih tinggi dari harga normal itu janggal: tagihan tetap final, tanpa coretan.
  assert.deepEqual(plain(priceView({ price: 100000, final_price: 120000 })), { final: 120000, original: null, label: null, endsAt: null });
  // Potongan tanpa diskon yang terbaca tetap dicoret, hanya tanpa lencana.
  assert.deepEqual(plain(priceView({ price: 100000, final_price: 90000, discount: { type: "percent" } })), { final: 90000, original: 100000, label: null, endsAt: null });
  assert.deepEqual(plain(priceView(null)), { final: 0, original: null, label: null, endsAt: null });
});

test("discount end dates use the store's calendar date only", () => {
  const date = discountEndDate("2026-10-31T23:59:59+07:00");
  assert.deepEqual([date.getFullYear(), date.getMonth(), date.getDate()], [2026, 9, 31]);
  for (const value of [null, undefined, "", "besok", 42]) assert.equal(discountEndDate(value), null);
});

test("discounts from the backend are validated, broken ones are dropped", () => {
  assert.deepEqual(plain(readDiscount({ ...percent, label: " -20% ", max_discount: 25000 })), { ...percent, max_discount: 25000 });
  assert.deepEqual(plain(readDiscount({ ...fixed, max_discount: "x", ends_at: "" })), fixed);
  for (const value of [null, undefined, "20%", 20, [], { ...percent, type: "bogo" }, { ...percent, value: -5 }, { ...percent, label: "" }, { ...percent, label: 7 }]) {
    assert.equal(readDiscount(value), null);
  }
});

test("product readers keep valid pricing, drop garbage, and leave old responses unchanged", () => {
  const old = { id: 1, slug: "kopi", name: "Kopi", price: 50000 };
  assert.deepEqual(plain(readPricing(old)), old);
  const product = readPricing({ ...old, final_price: 40000, discount: percent, variants: [{ id: 2, price: null, final_price: 40000 }, { id: 3, price: 60000, final_price: "x" }, null] });
  assert.equal(product.final_price, 40000);
  assert.deepEqual(plain(product.discount), percent);
  assert.equal(product.variants[0].final_price, 40000);
  assert.equal(product.variants[1].final_price, undefined);
  assert.equal(product.variants[2], null);
  const garbage = readPricing({ ...old, final_price: "40000", discount: "diskon" });
  assert.equal(garbage.final_price, undefined);
  assert.equal(garbage.discount, null);
  assert.equal(priceView(garbage).original, null);

  const page = readProductPage({ data: [{ ...old, final_price: 45000, discount: fixed }, { ...old, id: 2, discount: { label: 1 } }] });
  assert.equal(priceView(page.data[0]).label, "-Rp5.000");
  assert.equal(page.data[1].discount, null);
});

test("cart lines use the backend unit price and strike through the original price only when it is higher", () => {
  const item = { id: 1, product_id: 1, amount: 2, product: { price: 100000, final_price: 80000 }, unit_price: 80000, original_unit_price: 100000 };
  assert.equal(getCartUnitPrice(item), 80000);
  assert.equal(getCartOriginalUnitPrice(item), 100000);
  assert.equal(getCartOriginalUnitPrice({ ...item, original_unit_price: 80000 }), null);
  assert.equal(getCartOriginalUnitPrice({ ...item, original_unit_price: "100000" }), null);
  // Backend lama tanpa unit_price: harga lama tetap dipakai, tanpa coretan.
  const legacy = { id: 1, product_id: 1, amount: 2, product: { price: 100000 } };
  assert.equal(getCartUnitPrice(legacy), 100000);
  assert.equal(getCartOriginalUnitPrice(legacy), null);
  assert.equal(getCartUnitPrice({ ...legacy, unit_price: "x" }), 100000);
  // Harga dari backend tetap terbaca walau detail varian gagal dimuat.
  assert.equal(getCartUnitPrice({ ...item, product_variant_id: 9, variant: null }), 80000);
});

test("applied coupons are read from the backend response", () => {
  const body = { data: { code: "HEMAT10", type: "percent", value: 10, discount: 15000, product_id: null, label: "-10%" } };
  assert.deepEqual(plain(readCoupon(body)), body.data);
  assert.deepEqual(plain(readCoupon({ code: " PRODUK ", type: "x", value: "5", discount: 0, product_id: 7 })),
    { code: "PRODUK", type: "fixed", value: 0, discount: 0, product_id: 7, label: "" });
  for (const value of [null, {}, { data: null }, { data: { code: "", discount: 1 } }, { data: { code: "A", discount: -1 } }, { data: { code: "A", discount: "1000" } }, { data: { code: "A" } }]) {
    assert.throws(() => readCoupon(value));
  }
});

test("coupon errors show the validation message for the field, never server details", () => {
  const invalid = { message: "The given data was invalid.", errors: { code: ["Kupon tidak ditemukan."] } };
  assert.equal(couponErrorMessage(422, invalid), "Kupon tidak ditemukan.");
  assert.equal(couponErrorMessage(422, { message: "Kupon sudah habis." }), "Kupon sudah habis.");
  assert.equal(couponErrorMessage(500, invalid), "Kupon belum dapat diperiksa. Silakan coba lagi.");
  assert.equal(couponErrorMessage(422, null), "Kupon belum dapat diperiksa. Silakan coba lagi.");
  assert.equal(fieldError({ errors: { coupon_code: ["Kupon kedaluwarsa."] } }, "coupon_code"), "Kupon kedaluwarsa.");
  for (const value of [null, "x", { errors: null }, { errors: { coupon_code: [] } }, { errors: { coupon_code: [42] } }]) {
    assert.equal(fieldError(value, "coupon_code"), null);
  }
});

test("orders read coupon fields defensively and old orders have no discount", () => {
  assert.deepEqual(plain(readOrderDiscount({ coupon_code: "HEMAT10", discount_amount: 15000 })), { coupon_code: "HEMAT10", discount_amount: 15000 });
  for (const value of [null, {}, { coupon_code: 5, discount_amount: "15000" }, { coupon_code: "", discount_amount: -1 }, { discount_amount: NaN }]) {
    assert.deepEqual(plain(readOrderDiscount(value)), { coupon_code: null, discount_amount: 0 });
  }
  const order = { id: 7, total: 100000, shipping_cost: 10000, grand_total: 95000, coupon_code: "HEMAT", discount_amount: 15000 };
  const read = readOrder({ data: order });
  assert.equal(read.coupon_code, "HEMAT");
  assert.equal(read.discount_amount, 15000);
  const legacy = readOrder({ ...order, coupon_code: undefined, discount_amount: undefined, grand_total: 110000 });
  assert.equal(legacy.coupon_code, null);
  assert.equal(legacy.discount_amount, 0);
});

test("structured data uses the discounted price shown on the page", () => {
  assert.deepEqual(plain(priceRange({ price: 100000, final_price: 80000 })), { low: 80000, high: 80000, count: 1 });
  assert.deepEqual(plain(priceRange({ price: 100000, final_price: 80000, variants: [{ price: null }, { price: 150000, final_price: 120000 }, { price: 90000 }] })),
    { low: 80000, high: 120000, count: 3 });
  assert.deepEqual(plain(priceRange({ price: 100000 })), { low: 100000, high: 100000, count: 1 });
});
