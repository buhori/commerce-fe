import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// lib/theme-layout.ts dengan sdk/schema.ts yang asli (keduanya tanpa Next.js).
const schema = {};
vm.runInNewContext(compile("../sdk/schema.ts"), { exports: schema });
const exports = {};
vm.runInNewContext(compile("../lib/theme-layout.ts"), { exports, require: (name) => (name === "@/sdk/schema" ? schema : {}) });
const { readThemeLayout, resolveLayout } = exports;

// JSON bolak-balik: objek dari realm vm dibandingkan sebagai data biasa.
const plain = (value) => JSON.parse(JSON.stringify(value));

const schemas = {
  "promo-banners": {
    type: "promo-banners",
    name: "Banner promo",
    settings: [
      { id: "title", type: "text", label: "Judul", default: "Promo", maxLength: 10 },
      { id: "products", type: "product-source", label: "Produk", max: 4 },
      { id: "categories", type: "categories", label: "Kategori" },
    ],
    blocks: {
      banner: { name: "Banner", settings: [{ id: "image", type: "image", label: "Gambar" }, { id: "picks", type: "products", label: "Pilihan" }] },
    },
  },
  "main-article": {
    type: "main-article",
    name: "Artikel",
    settings: [{ id: "related", type: "posts", label: "Terkait" }, { id: "menu", type: "menu", label: "Menu" }, { id: "featured", type: "category", label: "Kategori" }],
  },
};

const product = (id) => ({ id, name: `Produk ${id}` });

function fakeLoaders({ failProducts = false } = {}) {
  const calls = { products: [], categories: 0, posts: [], navigation: 0 };
  return {
    calls,
    loaders: {
      products: async (query) => {
        calls.products.push(query);
        if (failProducts) throw new Error("down");
        return query.productIds ? query.productIds.map(product) : [1, 2, 3, 4, 5, 6].map(product);
      },
      categories: async () => {
        calls.categories += 1;
        return [{ id: 7, name: "Kopi" }, { id: 8, name: "Teh" }];
      },
      post: async (slug) => {
        calls.posts.push(slug);
        return slug === "hilang" ? null : { slug, title: slug };
      },
      navigation: async () => {
        calls.navigation += 1;
        return [{ label: "Beranda", href: "/", new_tab: false, children: [] }];
      },
    },
  };
}

test("the layout response is read defensively; data null means the built-in page", () => {
  assert.equal(readThemeLayout({ data: null }), null);
  assert.throws(() => readThemeLayout({ data: { theme: "ambaz" } }), /Invalid theme layout/);

  const layout = readThemeLayout({ data: {
    theme: "ambaz", version: "1.0.0", template: "home",
    settings: { settings: { accent: "#e11d48" }, data: {} },
    sections: [
      { id: "s1", type: "promo-banners", settings: { title: "Hai" }, data: {}, blocks: [{ id: "b1", type: "banner" }, { type: "banner" }, "rusak"] },
      { type: "tanpa-id" },
    ],
  } });

  assert.deepEqual(plain(layout), {
    theme: "ambaz", version: "1.0.0", template: "home",
    settings: { settings: { accent: "#e11d48" }, data: {} },
    sections: [{ id: "s1", type: "promo-banners", settings: { title: "Hai" }, data: {}, blocks: [{ id: "b1", type: "banner", settings: {}, data: {} }] }],
  });
});

test("sections get normalized settings and their resources loaded, unknown parts skipped", async () => {
  const { loaders, calls } = fakeLoaders();
  const sections = await resolveLayout([
    {
      id: "s1", type: "promo-banners",
      settings: { title: "Judul yang sangat panjang" },
      data: { products: { source: "top_sale", limit: 10 }, categories: [8, 7, 99] },
      blocks: [
        { id: "b1", type: "banner", settings: { image: { url: "javascript:x", width: 1, height: 1, alt: "" } }, data: { picks: [3, 1] } },
        { id: "b2", type: "unknown", settings: {}, data: {} },
      ],
    },
    { id: "s2", type: "from-a-newer-theme", settings: {}, data: {}, blocks: [] },
    {
      id: "s3", type: "main-article", settings: {},
      data: { related: ["seduh", "hilang"], menu: "main", featured: 7 },
      blocks: [],
    },
    { id: "s4", type: "promo-banners", settings: {}, data: { products: { source: "manual", product_ids: [5, 6], limit: 8 }, categories: [7] }, blocks: [] },
  ], schemas, loaders);

  assert.deepEqual(plain(sections), [
    {
      id: "s1", type: "promo-banners",
      settings: { title: "Judul yang" },
      // Sumber "terlaris": dipotong sesuai limit, paling banyak max skema (4).
      data: { products: [1, 2, 3, 4].map(product), categories: [{ id: 8, name: "Teh" }, { id: 7, name: "Kopi" }] },
      blocks: [{ id: "b1", type: "banner", settings: { image: null }, data: { picks: [3, 1].map(product) } }],
    },
    {
      id: "s3", type: "main-article", settings: {},
      data: { related: [{ slug: "seduh", title: "seduh" }], menu: [{ label: "Beranda", href: "/", new_tab: false, children: [] }], featured: { id: 7, name: "Kopi" } },
      blocks: [],
    },
    {
      id: "s4", type: "promo-banners", settings: { title: "Promo" },
      data: { products: [5, 6].map(product), categories: [{ id: 7, name: "Kopi" }] },
      blocks: [],
    },
  ]);

  // Kategori dimuat sekali untuk seluruh halaman walau dipakai tiga section.
  assert.equal(calls.categories, 1);
  assert.deepEqual(plain(calls.products).map((query) => Object.keys(query).sort().join(",")).sort(), ["productIds", "productIds", "sort"]);
});

test("a failing data source leaves that input empty instead of breaking the page", async () => {
  const { loaders } = fakeLoaders({ failProducts: true });
  const [section] = await resolveLayout([
    { id: "s1", type: "promo-banners", settings: {}, data: { products: { source: "latest" }, categories: [7] }, blocks: [] },
  ], schemas, loaders);

  assert.deepEqual(plain(section.data), { products: [], categories: [{ id: 7, name: "Kopi" }] });
});
