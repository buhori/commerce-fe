import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync(new URL("../lib/home-sections.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports },
);
const { readHomeSections, safeLink, paragraphs } = exports;

test("a store without a published layout keeps the built-in home", () => {
  assert.equal(readHomeSections({ data: null }), null);
  assert.equal(readHomeSections({}), null);
  assert.throws(() => readHomeSections({ data: "oops" }));
});

test("known widgets are kept in order, unknown or incomplete ones are skipped", () => {
  const sections = readHomeSections({ data: [
    { id: "section-0", type: "banner", settings: { height: "short", slides: [
      { image: "https://cdn.test/a.webp", title: "Promo", button_label: "Belanja", link: "/c/kopi" },
      { image: "https://cdn.test/b.webp", button_label: "Tanpa tujuan", link: "javascript:alert(1)" },
      { image: "javascript:alert(1)", title: "Gambar tidak aman" },
    ] } },
    { id: "section-9", type: "banner", settings: { slides: [{ title: "Tanpa gambar" }] } },
    { id: "section-1", type: "script", settings: { html: "<script>" } },
    { id: "section-2", type: "product-list", settings: { title: "Kopi", source: "category", category_ids: [3, 5, "x", -1], product_ids: [9], limit: 4, layout: "row" } },
    { id: "section-3", type: "product-list", settings: { source: "category", category_ids: [] } },
    { id: "section-10", type: "product-list", settings: { source: "manual", product_ids: [] } },
    { id: "section-11", type: "product-list", settings: { source: "top_sale", limit: 99 } },
    { id: "section-4", type: "video", settings: { video_id: "dQw4w9WgXcQ" } },
    { id: "section-5", type: "video", settings: { video_id: "\"><script>" } },
    { id: "section-6", type: "image", settings: { image: "javascript:alert(1)" } },
    { id: "section-7", type: "testimonials", settings: { items: [{ quote: "Enak", name: "Rina" }, { quote: "", name: "x" }] } },
  ] });

  assert.deepEqual(sections.map((section) => section.id), ["section-0", "section-2", "section-11", "section-4", "section-7"]);
  // Urutan sumber (terlaris) tanpa pilihan; jumlah di luar daftar menjadi 8.
  assert.equal(sections[2].settings.source, "top_sale");
  assert.equal(sections[2].settings.limit, 8);
  assert.equal(sections[0].settings.height, "short");
  // Slide tanpa gambar aman dibuang; tombol hanya ada bila slide punya tautan.
  assert.deepEqual(sections[0].settings.slides.map((slide) => [slide.title, slide.button_label, slide.link]), [["Promo", "Belanja", "/c/kopi"], [null, null, null]]);
  // Kategori yang tidak sah dibuang; produk pilihan hanya untuk sumber "manual".
  assert.deepEqual(JSON.parse(JSON.stringify(sections[1].settings)), { title: "Kopi", subtitle: null, source: "category", category_ids: [3, 5], product_ids: [], limit: 4, layout: "row" });
  assert.equal(sections[4].settings.items.length, 1);
});

test("links stay on the store or on the web", () => {
  assert.equal(safeLink("/c/kopi"), "/c/kopi");
  assert.equal(safeLink("https://instagram.com/kopi"), "https://instagram.com/kopi");
  for (const value of ["javascript:alert(1)", "//evil.test", "data:text/html,x", "", null, 42]) {
    assert.equal(safeLink(value), null);
  }
});

test("text widgets become paragraphs on blank lines", () => {
  assert.deepEqual([...paragraphs("Satu\nbaris\n\nDua\n\n\n")], ["Satu\nbaris", "Dua"]);
  assert.equal(paragraphs(null).length, 0);
});
