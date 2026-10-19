import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// lib/store-events.ts tanpa impor: cukup ditranspilasi lalu dijalankan.
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/store-events.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports, JSON, CustomEvent, Array, Object });
const events = exports;
const plain = (value) => JSON.parse(JSON.stringify(value));

const pixel = {
  plugin: "analytics-meta-pixel", key: "meta-pixel", src: "https://sellosy.com/plugins/meta-pixel.js?v=1.0.0",
  location: "head", loading: "async", pages: ["all", "checkout"], consent_category: "marketing", config: { pixel_id: "1234567890123456" },
};

test("plugin scripts from the API are sanitized", () => {
  const scripts = plain(events.readPluginScripts([
    pixel,
    { ...pixel, plugin: "Bad Plugin" },
    { ...pixel, key: "x", src: "javascript:alert(1)" },
    { ...pixel, key: "y", pages: ["somewhere"] },
    { ...pixel, key: "z", location: "footer", loading: "eager", pages: ["home", "nope"], config: ["not", "an", "object"] },
    null,
  ]));
  assert.deepEqual(scripts.map((script) => script.key), ["meta-pixel", "z"]);
  assert.deepEqual(scripts[1], { ...pixel, key: "z", location: "head", loading: "async", pages: ["home"], config: null });
  assert.deepEqual(plain(events.readPluginScripts(undefined)), []);
});

test("store paths map to page types, and all excludes checkout", () => {
  const types = ["/", "/products/kopi-gayo", "/products", "/c/kopi", "/cart", "/checkout", "/payment/123", "/profile/orders"]
    .map((path) => events.storePageType(path));
  assert.deepEqual(types, ["home", "product", "collection", "collection", "cart", "checkout", "thank_you", "other"]);

  assert.equal(events.scriptRunsOn({ pages: ["all"] }, "product"), true);
  assert.equal(events.scriptRunsOn({ pages: ["all"] }, "checkout"), false);
  assert.equal(events.scriptRunsOn({ pages: ["all", "checkout"] }, "checkout"), true);
  assert.equal(events.scriptRunsOn({ pages: ["product"] }, "home"), false);
});

test("plugin config is written as data that cannot break out of the script tag", () => {
  const code = events.pluginConfigScript([{ ...pixel, config: { pixel_id: "</script><script>alert(1)</script>", line: "a b" } }]);
  assert.equal(code.includes("</script>"), false);
  assert.equal(code.includes(" "), false);

  const window = { __plugins: { other: { a: 1 } } };
  vm.runInNewContext(code, { window, Object });
  assert.deepEqual(plain(window.__plugins), {
    other: { a: 1 },
    "analytics-meta-pixel": { pixel_id: "</script><script>alert(1)</script>", line: "a b" },
  });
});

test("events are dispatched and kept for plugins that load later", () => {
  const dispatched = [];
  const target = { dispatchEvent: (event) => dispatched.push([event.type, event.detail]) };

  events.emitStoreEvent("store:page_viewed", { page_type: "home", url: "https://kopi.test/" }, target);
  events.emitStoreEvent("store:product_viewed", { product_id: 7, name: "Kopi", price: 98000, currency: "IDR", category: null }, target);

  assert.deepEqual(plain(dispatched.map(([type]) => type)), ["store:page_viewed", "store:product_viewed"]);
  assert.deepEqual(plain(target.__storeEvents.map((event) => event.name)), ["store:page_viewed", "store:product_viewed"]);

  for (let index = 0; index < 120; index += 1) events.emitStoreEvent("store:page_viewed", { page_type: "other", url: "x" }, target);
  assert.equal(target.__storeEvents.length, 100);
});

test("a purchase is reported once per order per browser", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };

  assert.equal(events.firstPurchaseView("ord_1", storage), true);
  assert.equal(events.firstPurchaseView("ord_1", storage), false);
  assert.equal(events.firstPurchaseView("ord_2", storage), true);
  // Penyimpanan diblokir: tidak bisa dijaga, tetap dilaporkan.
  assert.equal(events.firstPurchaseView("ord_1", null), true);
});
