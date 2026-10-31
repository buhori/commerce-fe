import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, URL, require: (name) => (name.startsWith("./") ? loadModule(new URL(`${name}.ts`, new URL(file, import.meta.url)).href) : {}) });
  return exports;
}

const { readTrackedOrder, trackingInputError } = loadModule("../lib/order-tracking.ts");
const { orderStatus, orderStep, shipmentStatusLabel, shipmentStatusTone } = loadModule("../lib/order-status.ts");
const { storeContactUrl } = loadModule("../lib/whatsapp.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

test("a tracked order is read from the backend answer, with history newest first as sent", () => {
  const order = readTrackedOrder({
    order_id: 3829104,
    invoice_number: "INV/KOPI/2026/10/0001",
    status: "delivering",
    created_at: "2026-10-28T02:00:00+00:00",
    items: [{ name: "Kopi Gayo 250 g", amount: 2 }, { name: "" }, null],
    shipment: {
      courier: "JNE REG",
      courier_logo: "javascript:alert(1)",
      tracking_number: "JO0330429056",
      tracking_url: "https://track.test/JO1",
      status: "delivering",
      history: [{ status: "delivering", note: "Kurir menuju alamat", at: "2026-10-29T03:00:00Z" }, { note: "tanpa status" }],
    },
  });

  assert.deepEqual(plain(order), {
    orderId: "3829104",
    invoiceNumber: "INV/KOPI/2026/10/0001",
    status: "delivering",
    createdAt: "2026-10-28T02:00:00+00:00",
    items: [{ name: "Kopi Gayo 250 g", amount: 2 }],
    shipment: {
      courier: "JNE REG",
      // Bukan http(s): dibuang, bukan dijadikan src.
      courierLogo: null,
      trackingNumber: "JO0330429056",
      trackingUrl: "https://track.test/JO1",
      status: "delivering",
      history: [{ status: "delivering", note: "Kurir menuju alamat", at: "2026-10-29T03:00:00Z" }],
    },
  });
});

test("an answer without id or status, or without a shipment, is handled", () => {
  assert.equal(readTrackedOrder(null), null);
  assert.equal(readTrackedOrder({ status: "paid" }), null);
  assert.equal(readTrackedOrder({ order_id: "12", status: "paid", shipment: null }).shipment, null);
});

test("the form asks for an order number and exactly four digits", () => {
  assert.equal(trackingInputError("", "5603"), "Masukkan nomor pesanan.");
  assert.equal(trackingInputError("#3829104", "56"), "Masukkan 4 digit terakhir nomor telepon.");
  assert.equal(trackingInputError("#3829104", "56a3"), "Masukkan 4 digit terakhir nomor telepon.");
  assert.equal(trackingInputError("INV/KOPI/2026/10/0001", "5603"), null);
});

test("statuses read in Indonesian, unknown ones as sent", () => {
  assert.deepEqual(plain(orderStatus("delivering")), { label: "Dikirim", tone: "primary" });
  assert.deepEqual(plain(orderStatus("mystery")), { label: "mystery", tone: "info" });
  assert.equal(shipmentStatusLabel("picked_up"), "Dijemput kurir");
});

test("contacting the store opens WhatsApp with a greeting", () => {
  const url = new URL(storeContactUrl("6281234567890", "Luneva Skincare"));
  assert.equal(url.origin + url.pathname, "https://wa.me/6281234567890");
  assert.equal(url.searchParams.get("text"), "Halo Luneva Skincare, saya ingin bertanya.");
});

test("the progress bar follows the order status; stopped orders have none", () => {
  assert.equal(orderStep("pending"), -1);
  assert.equal(orderStep("paid"), 0);
  assert.equal(orderStep("delivering"), 2);
  assert.equal(orderStep("done"), 3);
  assert.equal(orderStep("cancelled"), null);
  assert.equal(orderStep("mystery"), null);
});

test("courier statuses get a colour by how far the parcel got", () => {
  assert.equal(shipmentStatusTone("confirmed"), "warning");
  assert.equal(shipmentStatusTone("picked_up"), "info");
  assert.equal(shipmentStatusTone("delivered"), "success");
  assert.equal(shipmentStatusTone("returned"), "danger");
});

test("an order detail carries the same shipment block for signed-in buyers", () => {
  const { readOrder } = loadModuleWithImports("../lib/checkout.ts");
  const order = readOrder({ data: {
    id: 12, status: "delivering", total: 20000, shipping_cost: 9000, grand_total: 29000, items: [],
    shipment: { courier: "JNE REG", courier_logo: null, tracking_number: "JO0330429056", tracking_url: null, status: null, history: [] },
  } });
  assert.deepEqual(plain(order.shipment), { courier: "JNE REG", courierLogo: null, trackingNumber: "JO0330429056", trackingUrl: null, status: null, history: [] });
  assert.equal(readOrder({ data: { id: 12, status: "paid", total: 1, shipping_cost: 0, grand_total: 1, items: [] } }).shipment, null);
});

function loadModuleWithImports(file) {
  const url = new URL(file, import.meta.url);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, URL, URLSearchParams,
    require: (name) => (name.startsWith("./") ? loadModuleWithImports(new URL(`${name}.ts`, url).href) : {}),
  });
  return exports;
}
