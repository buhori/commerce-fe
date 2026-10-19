import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// lib/compare.ts dan lib/share.ts tanpa impor: cukup ditranspilasi lalu dijalankan.
function loadModule(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, JSON, Number, Set, Map });
  return exports;
}

const compare = loadModule("../lib/compare.ts");
const { shareLinks } = loadModule("../lib/share.ts");
const item = (id) => ({ id, slug: `produk-${id}`, name: `Produk ${id}`, image: null });
const plain = (value) => JSON.parse(JSON.stringify(value));

test("stored compare list survives broken or tampered localStorage", () => {
  assert.deepEqual(plain(compare.readCompareItems(null)), []);
  assert.deepEqual(plain(compare.readCompareItems("{not json")), []);
  assert.deepEqual(plain(compare.readCompareItems(JSON.stringify({ id: 1 }))), []);
  // Duplikat, bentuk salah, dan kelebihan dari batas dibuang.
  const raw = JSON.stringify([item(1), item(1), { id: "2", slug: "x", name: "x", image: null }, item(3), item(4), item(5), item(6)]);
  assert.deepEqual(plain(compare.readCompareItems(raw)).map((row) => row.id), [1, 3, 4, 5]);
});

test("toggling adds, removes, and refuses past the limit", () => {
  let state = compare.toggleCompareItem([], item(1));
  assert.deepEqual(plain(state), { items: [item(1)], full: false });
  state = compare.toggleCompareItem(state.items, item(1));
  assert.deepEqual(plain(state.items), []);

  const full = [1, 2, 3, 4].map(item);
  assert.equal(compare.toggleCompareItem(full, item(5)).full, true);
  assert.equal(compare.toggleCompareItem(full, item(5)).items.length, 4);
  // Produk yang sudah ada tetap bisa dihapus walau daftar penuh.
  assert.deepEqual(plain(compare.toggleCompareItem(full, item(2)).items).map((row) => row.id), [1, 3, 4]);
});

test("compare URL ids are numeric, unique, and capped", () => {
  assert.deepEqual(plain(compare.readCompareIds("12, 34,abc,12,-5,0,56,78,90")), [12, 34, 56, 78]);
  assert.deepEqual(plain(compare.readCompareIds(["12", "34"])), [12, 34]);
  assert.deepEqual(plain(compare.readCompareIds(undefined)), []);
  assert.equal(compare.compareUrl([12, 34]), "/compare?p=12,34");
  assert.equal(compare.compareUrl([]), "/compare");
});

test("specification rows are merged by label and marked when they differ", () => {
  const rows = plain(compare.compareSpecRows([
    [{ label: "Bahan", value: "Katun" }, { label: "Berat", value: "1 kg" }],
    [{ label: "bahan ", value: "katun" }, { label: "Warna", value: "Hitam" }],
  ]));
  assert.deepEqual(rows, [
    { label: "Bahan", values: ["Katun", "katun"], differs: false },
    { label: "Berat", values: ["1 kg", null], differs: true },
    { label: "Warna", values: [null, "Hitam"], differs: true },
  ]);
});

test("share links encode the product URL and title for each app", () => {
  const links = plain(shareLinks({ url: "https://kopi.sellosy.com/products/kopi-gayo?a=1&b=2", title: "Kopi Gayo & Teman" }));
  assert.deepEqual(links.map((link) => link.target), ["whatsapp", "facebook", "x", "telegram"]);
  const byTarget = Object.fromEntries(links.map((link) => [link.target, new URL(link.href)]));
  assert.equal(byTarget.whatsapp.searchParams.get("text"), "Kopi Gayo & Teman\nhttps://kopi.sellosy.com/products/kopi-gayo?a=1&b=2");
  assert.equal(byTarget.facebook.searchParams.get("u"), "https://kopi.sellosy.com/products/kopi-gayo?a=1&b=2");
  assert.equal(byTarget.x.searchParams.get("text"), "Kopi Gayo & Teman");
  assert.equal(byTarget.telegram.searchParams.get("url"), "https://kopi.sellosy.com/products/kopi-gayo?a=1&b=2");
});
