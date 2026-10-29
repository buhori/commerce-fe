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
      { id: 7, rating: 5, comment: "Bagus", name: "Rina S.", variant: "50 ml", created_at: "2026-10-28T08:00:00+07:00", media: [{ type: "image", url: "https://cdn.test/a.webp" }, { type: "video", url: "ftp://x" }] },
      { id: 8, rating: 9, comment: "rusak" },
      { id: "x", rating: 4 },
      { id: 9, rating: 4, comment: "  ", name: "" },
    ],
    meta: { current_page: 1, last_page: 3 },
    summary: { rating: 4.54, count: 2, distribution: { 5: 1, 4: 1, 3: "a" } },
  });
  assert.deepEqual(plain(page.reviews.map((review) => review.id)), [7, 9]);
  assert.deepEqual(plain(page.reviews[0].media), [{ type: "image", url: "https://cdn.test/a.webp" }]);
  assert.deepEqual(plain(page.reviews[1].media), []);
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
  assert.deepEqual(plain(readItemReview({ rating: 4, feedback: "Wangi" })), { rating: 4, comment: "Wangi", media: [] });
  assert.deepEqual(plain(readItemReview({ rating: 5.0, feedback: " " })), { rating: 5, comment: null, media: [] });
  // Media dari detail pesanan (FileManager: public_url) atau dari POST ulasan (url); yang rusak dibuang.
  assert.deepEqual(plain(readItemReview({ rating: 5, media: [
    { type: "image", public_url: "https://cdn.test/a.webp" },
    { type: "video", url: "https://cdn.test/b.mp4" },
    { type: "audio", url: "https://cdn.test/c.mp3" },
    { type: "image", url: "javascript:alert(1)" },
  ] })).media, [{ type: "image", url: "https://cdn.test/a.webp" }, { type: "video", url: "https://cdn.test/b.mp4" }]);
  for (const value of [null, {}, { rating: 0 }, { rating: 6 }]) assert.equal(readItemReview(value), null);
});

test("the review page order reads only a valid order and skips broken item rows", () => {
  const { readReviewOrder } = loadModule("../lib/checkout.ts");
  const order = readReviewOrder({
    data: {
      order_id: 812537934,
      invoice_number: "INV/UFA/2026/10/0014",
      reviewable: true,
      items: [
        { id: 981801156, amount: 1, price: 296845, product: { name: "Serum Pagi", images: [{ public_url: "https://cdn.test/a.webp" }] }, variant: { label: "50 ml" }, review: { rating: 4, feedback: "Bagus" } },
        { id: 5, amount: 1, price: 1000, product: null },
      ],
    },
  });

  assert.deepEqual(plain(order), {
    orderId: 812537934,
    invoiceNumber: "INV/UFA/2026/10/0014",
    reviewable: true,
    reviewMedia: false,
    items: [{ id: 981801156, name: "Serum Pagi", variant: "50 ml", amount: 1, price: 296845, preorder_duration: 0, image: "https://cdn.test/a.webp", review: { rating: 4, comment: "Bagus", media: [] } }],
  });
  assert.equal(readReviewOrder({ data: { order_id: "x" } }), null);
  assert.equal(readReviewOrder(null), null);
  assert.equal(plain(readReviewOrder({ data: { order_id: 7 } })).reviewable, false);
});
