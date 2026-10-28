import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Modul murni tanpa import: cukup ditranspilasi dan dijalankan.
function loadModule(file) {
  const url = new URL(file, import.meta.url);
  const exports = {};
  const source = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => { throw new Error(`Unexpected import ${name}`); } });
  return exports;
}

const reviews = loadModule("../lib/reviews.ts");
const { readItemReview } = loadModule("../lib/checkout.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

test("product reviews read only valid rows, and a broken answer means no reviews yet", () => {
  const page = reviews.readReviewPage({
    data: [
      { id: 7, rating: 5, comment: "Bagus", name: "Rina S.", variant: "50 ml", created_at: "2026-10-28T08:00:00+07:00" },
      { id: 8, rating: 9, comment: "rusak" },
      { id: "x", rating: 4 },
      { id: 9, rating: 4, comment: "  ", name: "" },
    ],
    meta: { current_page: 1, last_page: 3 },
    summary: { rating: 4.54, count: 2, distribution: { 5: 1, 4: 1, 3: "a" } },
  });
  assert.deepEqual(plain(page.reviews.map((review) => review.id)), [7, 9]);
  assert.equal(page.reviews[1].comment, null);
  assert.equal(page.reviews[1].name, "Pembeli");
  assert.equal(page.summary.rating, 4.5);
  assert.deepEqual(plain(page.summary.distribution), { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 });
  assert.equal(page.lastPage, 3);

  for (const broken of [null, "x", { summary: { rating: 0, count: 3 } }]) {
    const empty = reviews.readReviewPage(broken);
    assert.equal(empty.summary.rating, null);
    assert.equal(empty.summary.count, 0);
  }
});

test("an order item review is read from the backend feedback row", () => {
  assert.deepEqual(plain(readItemReview({ rating: 4, feedback: "Wangi" })), { rating: 4, comment: "Wangi" });
  assert.deepEqual(plain(readItemReview({ rating: 5.0, feedback: " " })), { rating: 5, comment: null });
  for (const value of [null, {}, { rating: 0 }, { rating: 6 }]) assert.equal(readItemReview(value), null);
});
