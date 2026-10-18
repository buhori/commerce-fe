import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/checkout.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const {
  readOrder, readOnlinePayment, readPaymentMethods, paymentMethodSections, usesOnlinePayment, shouldPollPayment,
  paymentChangeErrorMessage, readHttpsUrl, readAppUrl,
} = exports;

// Objects from the vm context have another Object.prototype, so compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

const bill = (overrides = {}) => ({
  public_id: "pay_123", method: "va_bca", method_label: "BCA Virtual Account", provider: "Xendit Payment",
  amount: 160000, currency: "IDR", status: "pending", action: null, error_message: null,
  paid_at: null, expires_at: "2026-10-18T10:00:00.000000Z", ...overrides,
});

const order = (online_payment, overrides = {}) => readOrder({ data: {
  id: 9, status: "pending", total: 150000, shipping_cost: 10000, unique_payment_code: null, grand_total: 160000,
  payment: { method: { code: "plugin", name: "Pembayaran online" }, bank_account: null },
  online_payment, ...overrides,
} });

test("payment methods keep plugin metadata and only http(s) provider logos", () => {
  const rows = readPaymentMethods([
    { code: "bank_transfer", name: "Transfer Bank", icon: "bank" },
    { code: "payment-xendit:va_bca", name: "BCA Virtual Account", icon: "https://cdn.example.com/bca.png", group: "bank_transfer", provider: "Xendit Payment", online: true },
    { code: "payment-xendit:ovo", name: "OVO", icon: "javascript:alert(1)", group: "ewallet", provider: "Xendit Payment", online: true },
  ]);
  assert.deepEqual(plain(rows[0]), { code: "bank_transfer", name: "Transfer Bank", icon: "bank", online: false, group: null, provider: null });
  assert.deepEqual(plain(rows[1]), {
    code: "payment-xendit:va_bca", name: "BCA Virtual Account", icon: "https://cdn.example.com/bca.png",
    online: true, group: "bank_transfer", provider: "Xendit Payment",
  });
  assert.equal(rows[2].icon, null);
  // `online` must be exactly true; anything else stays a store method.
  assert.equal(readPaymentMethods([{ code: "x", name: "X", online: "true", group: "qr" }])[0].online, false);
});

test("store methods come first, online methods are grouped in a fixed order", () => {
  const methods = readPaymentMethods([
    { code: "qris", name: "QRIS" },
    { code: "p:ovo", name: "OVO", group: "ewallet", online: true },
    { code: "p:va_bni", name: "BNI VA", group: "bank_transfer", online: true },
    { code: "p:qris", name: "QRIS Dinamis", group: "qr", online: true },
    { code: "p:paylater", name: "Kredivo", group: "paylater", online: true },
    { code: "p:other", name: "Lainnya", group: null, online: true },
    { code: "p:va_bri", name: "BRI VA", group: "bank_transfer", online: true },
  ]);
  const sections = paymentMethodSections(methods);
  assert.deepEqual(plain(sections.map(({ key, label, methods }) => [key, label, methods.map((m) => m.code)])), [
    ["store", "Bayar langsung ke toko", ["qris"]],
    ["online-bank_transfer", "Pembayaran online · Virtual account", ["p:va_bni", "p:va_bri"]],
    ["online-qr", "Pembayaran online · QRIS", ["p:qris"]],
    ["online-ewallet", "Pembayaran online · E-wallet", ["p:ovo"]],
    ["online-other", "Pembayaran online lainnya", ["p:paylater", "p:other"]],
  ]);
  // Without online methods the list is not split under headings.
  assert.deepEqual(plain(paymentMethodSections(readPaymentMethods([{ code: "qris", name: "QRIS" }])).map((s) => s.label)), [null]);
  assert.deepEqual(plain(paymentMethodSections([])), []);
});

test("orders without online_payment read it as null", () => {
  assert.equal(order(undefined).online_payment, null);
  assert.equal(order(null).online_payment, null);
  assert.equal(order("pay_123").online_payment, null);
  assert.equal(order({ status: "pending" }).online_payment, null);
});

test("online_payment fields are normalized and the amount falls back to the order total", () => {
  const read = order(bill({ amount: "160000", currency: "", provider: " ", status: "weird", paid_at: "not a date" })).online_payment;
  assert.equal(read.public_id, "pay_123");
  assert.equal(read.method_label, "BCA Virtual Account");
  assert.equal(read.amount, 160000);
  assert.equal(read.currency, "IDR");
  assert.equal(read.provider, null);
  // Unknown statuses are shown as "being checked" rather than prompting a new payment.
  assert.equal(read.status, "needs_review");
  assert.equal(read.paid_at, null);
  assert.equal(read.expires_at, "2026-10-18T10:00:00.000000Z");
  assert.equal(readOnlinePayment(bill({ method_label: null })).method_label, "va_bca");
  for (const status of ["pending", "paid", "failed", "expired", "needs_review"]) {
    assert.equal(readOnlinePayment(bill({ status })).status, status);
  }
  assert.equal(readOnlinePayment(bill({ status: "failed", error_message: "  Gateway menolak tagihan.  " })).error_message, "Gateway menolak tagihan.");
});

test("redirect actions only accept https URLs", () => {
  const action = (url) => readOnlinePayment(bill({ action: { type: "redirect", url } })).action;
  assert.deepEqual(plain(action("https://checkout.xendit.co/web/abc")), { type: "redirect", url: "https://checkout.xendit.co/web/abc" });
  assert.equal(action("http://checkout.xendit.co/web/abc"), null);
  assert.equal(action("javascript:alert(1)"), null);
  assert.equal(action("//evil.example.com"), null);
  assert.equal(action("/payment/9"), null);
  assert.equal(action(42), null);
});

test("display actions keep VA fields as text with string instructions only", () => {
  const read = readOnlinePayment(bill({ action: { type: "display", display: {
    kind: "virtual_account", bank: "BCA", account_number: "8808 1234 5678", account_name: "Toko Demo",
    instructions: ["Buka m-BCA", "", 7, "<b>Bayar</b>"],
  } } }));
  assert.deepEqual(plain(read.action), { type: "display", display: {
    kind: "virtual_account", bank: "BCA", account_number: "8808 1234 5678", account_name: "Toko Demo",
    payment_code: null, amount: 160000, instructions: ["Buka m-BCA", "<b>Bayar</b>"],
  } });
  const code = readOnlinePayment(bill({ action: { type: "display", display: { payment_code: "ALFA123", amount: 165000 } } })).action;
  assert.equal(code.display.payment_code, "ALFA123");
  assert.equal(code.display.amount, 165000);
  assert.deepEqual(plain(code.display.instructions), []);
  // Nothing to pay with: no number and no code.
  assert.equal(readOnlinePayment(bill({ action: { type: "display", display: { bank: "BCA" } } })).action, null);
  assert.equal(readOnlinePayment(bill({ action: { type: "display" } })).action, null);
});

test("qr actions need a QR string of sane length", () => {
  const qr = (qr_string, amount) => readOnlinePayment(bill({ action: { type: "qr", qr_string, amount } })).action;
  assert.deepEqual(plain(qr("00020101021226...6304ABCD", 160000)), { type: "qr", qr_string: "00020101021226...6304ABCD", amount: 160000 });
  assert.equal(qr("0002010102", undefined).amount, 160000);
  assert.equal(qr("", 1), null);
  assert.equal(qr(null, 1), null);
  assert.equal(qr("x".repeat(5000), 1), null);
});

test("deeplink actions drop script-capable mobile URLs and non-https desktop URLs", () => {
  const link = (mobile_url, desktop_url) => readOnlinePayment(bill({ action: { type: "deeplink", mobile_url, desktop_url } })).action;
  assert.deepEqual(plain(link("gojek://gopay/merchanttransfer?tref=1", "https://gopay.example.com/pay/1")),
    { type: "deeplink", mobile_url: "gojek://gopay/merchanttransfer?tref=1", desktop_url: "https://gopay.example.com/pay/1" });
  assert.deepEqual(plain(link("javascript:alert(1)", "https://gopay.example.com/pay/1")),
    { type: "deeplink", mobile_url: null, desktop_url: "https://gopay.example.com/pay/1" });
  assert.deepEqual(plain(link("shopeeid://pay?x=1", "http://plain.example.com")),
    { type: "deeplink", mobile_url: "shopeeid://pay?x=1", desktop_url: null });
  assert.equal(link("data:text/html,hi", "javascript:alert(1)"), null);
  assert.equal(link(null, null), null);
});

test("app URLs reject executable schemes, whitespace and control characters", () => {
  assert.equal(readAppUrl("ovo://pay"), "ovo://pay");
  assert.equal(readAppUrl("https://app.example.com/x"), "https://app.example.com/x");
  assert.equal(readAppUrl("intent://pay#Intent;scheme=dana;end"), "intent://pay#Intent;scheme=dana;end");
  for (const unsafe of ["javascript:alert(1)", "JavaScript:alert(1)", "vbscript:x", "data:text/html,x", "file:///etc/passwd",
    "blob:https://a/b", "java\nscript:alert(1)", "ovo://pay\u0000", "ovo:// pay", "noscheme", ":x", ""]) {
    assert.equal(readAppUrl(unsafe), null, unsafe);
  }
  assert.equal(readHttpsUrl("https://a.example.com"), "https://a.example.com");
  assert.equal(readHttpsUrl("http://a.example.com"), null);
});

test("none and unknown action types", () => {
  assert.deepEqual(plain(readOnlinePayment(bill({ action: { type: "none" } })).action), { type: "none" });
  assert.equal(readOnlinePayment(bill({ action: { type: "html", html: "<script>" } })).action, null);
  assert.equal(readOnlinePayment(bill({ action: "redirect" })).action, null);
});

test("the online view applies to plugin orders, not after switching to a manual method", () => {
  const pending = order(bill());
  assert.equal(usesOnlinePayment(pending), true);
  assert.equal(shouldPollPayment(pending), true);
  // Switched to bank transfer: the replaced bill is still the latest one, but the manual UI applies.
  const switched = order(bill({ status: "failed" }), { payment: { method: { code: "bank_transfer", name: "Transfer Bank" }, bank_account: null } });
  assert.equal(usesOnlinePayment(switched), false);
  assert.equal(shouldPollPayment(switched), false);
  assert.equal(usesOnlinePayment(order(null)), false);
  // Polling stops once the bill or the order is no longer pending.
  assert.equal(shouldPollPayment(order(bill({ status: "paid" }))), false);
  assert.equal(shouldPollPayment(order(bill({ status: "failed" }))), false);
  assert.equal(shouldPollPayment(order(bill(), { status: "paid" })), false);
  assert.equal(shouldPollPayment(order(bill(), { status: "cancelled" })), false);
});

test("payment change errors prefer field errors and hide 5xx details", () => {
  assert.equal(paymentChangeErrorMessage(422, { message: "Pesanan ini sudah tidak menunggu pembayaran." }), "Pesanan ini sudah tidak menunggu pembayaran.");
  assert.equal(paymentChangeErrorMessage(422, { message: "Ringkasan", errors: { payment_method: ["Metode tidak tersedia."] } }), "Metode tidak tersedia.");
  assert.equal(paymentChangeErrorMessage(422, { message: "Ringkasan", errors: { bank_account_id: ["Pilih rekening."] } }), "Pilih rekening.");
  assert.equal(paymentChangeErrorMessage(500, { message: "SQLSTATE" }), "Metode pembayaran belum dapat diganti. Silakan coba lagi.");
  assert.equal(paymentChangeErrorMessage(404, null), "Metode pembayaran belum dapat diganti. Silakan coba lagi.");
});
