import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync(new URL("../lib/catalog-url.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports, URLSearchParams },
);
const { readCatalogFilter, catalogUrl, readSort } = exports;
const plain = (value) => JSON.parse(JSON.stringify(value));

test("filter_value works as a single value or an array, from Next params or URLSearchParams", () => {
  assert.deepEqual(plain(readCatalogFilter({ filter: "category", "filter_value[]": ["3", "5"] })), { productIds: [], categoryIds: [3, 5] });
  assert.deepEqual(plain(readCatalogFilter({ filter: "category", filter_value: "3" })), { productIds: [], categoryIds: [3] });
  assert.deepEqual(
    plain(readCatalogFilter(new URLSearchParams("filter=id&filter_value[]=81623&filter_value[]=9921&filter_value[]=81623"))),
    { productIds: [81623, 9921], categoryIds: [] },
  );
});

test("sort comes from filter=sort or an explicit sort, which wins and combines with other filters", () => {
  assert.equal(readCatalogFilter({ filter: "sort", filter_value: "top_sale" }).sort, "top_sale");
  assert.equal(readCatalogFilter({ filter: "category", "filter_value[]": "3", sort: "top_rating" }).sort, "top_rating");
  assert.equal(readCatalogFilter({ filter: "sort", filter_value: "top_sale", sort: "price_asc" }).sort, "price_asc");
  assert.equal(readSort("newest"), "latest");
});

test("unknown filters, sorts and malformed ids are ignored", () => {
  assert.deepEqual(plain(readCatalogFilter({ filter: "price", filter_value: "1" })), { productIds: [], categoryIds: [] });
  assert.deepEqual(plain(readCatalogFilter({ filter: "sort", filter_value: "cheapest" })), { productIds: [], categoryIds: [] });
  assert.deepEqual(plain(readCatalogFilter({ filter: "id", "filter_value[]": ["0", "-1", "abc", "1e3", "99999999999"] })), { productIds: [], categoryIds: [] });
  assert.equal(readCatalogFilter({ filter: "id", "filter_value[]": Array.from({ length: 80 }, (_, i) => String(i + 1)) }).productIds.length, 50);
});

test("catalog URLs use the filter grammar, and read back to the same choice", () => {
  assert.equal(catalogUrl(), "/products");
  assert.equal(catalogUrl({ sort: "top_sale" }), "/products?filter=sort&filter_value=top_sale");
  assert.equal(catalogUrl({ categoryIds: [3, 5] }), "/products?filter=category&filter_value%5B%5D=3&filter_value%5B%5D=5");
  assert.equal(catalogUrl({ productIds: [7], sort: "latest" }), "/products?filter=id&filter_value%5B%5D=7&sort=latest");
  assert.equal(catalogUrl({ q: " kopi ", sort: "price_asc" }), "/products?q=kopi&sort=price_asc");
  assert.equal(catalogUrl({ category: "biji kopi", sort: "latest" }), "/c/biji%20kopi?sort=latest");

  for (const choice of [{ sort: "top_rating" }, { categoryIds: [3, 5], sort: "top_sale" }, { productIds: [9, 2] }, { q: "teh" }]) {
    const read = plain(readCatalogFilter(new URLSearchParams(catalogUrl(choice).split("?")[1] ?? "")));
    assert.deepEqual(read, plain({ productIds: [], categoryIds: [], ...choice }));
  }
});
