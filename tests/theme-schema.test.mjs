import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// sdk/schema.ts hanya mengimpor tipe, jadi bisa dijalankan tanpa Next.js.
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../sdk/schema.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { buildManifest, validateManifest, normalizeSettings, defineSection, CONTRACT_VERSION } = exports;

const Noop = () => null;

const promo = defineSection({
  type: "promo-banners",
  name: "Banner promo",
  templates: ["home", "collection"],
  settings: [{ id: "title", type: "text", label: "Judul", default: "", maxLength: 80 }],
  blocks: {
    banner: {
      name: "Banner",
      min: 1,
      max: 4,
      settings: [
        { id: "image", type: "image", label: "Gambar", accept: ["jpg", "webp"] },
        { id: "title", type: "textarea", label: "Judul", default: "Kopi pilihan", maxLength: 80 },
      ],
    },
  },
  maxBlocks: 4,
  default: { blocks: [{ type: "banner", settings: { image: "theme://coffee/banner-1.webp" } }] },
}, Noop);

const mainProduct = defineSection({ type: "main-product", name: "Produk", templates: ["product"] }, Noop);

const theme = (overrides = {}) => ({
  id: "ambaz",
  name: "Ambaz",
  version: "1.0.0",
  sections: [promo, mainProduct],
  presets: {
    coffee: {
      name: "Coffee",
      templates: {
        home: { sections: [{ type: "promo-banners" }] },
        product: { sections: [{ type: "main-product" }, { type: "promo-banners" }] },
      },
    },
  },
  ...overrides,
});

test("the manifest carries the schema without components and is valid for a well-formed theme", () => {
  const manifest = buildManifest(theme());

  assert.equal(manifest.contract, CONTRACT_VERSION);
  assert.deepEqual(Object.keys(manifest.sections), ["promo-banners", "main-product"]);
  assert.equal(manifest.sections["promo-banners"].blocks.banner.max, 4);
  // JSON murni: komponen React tidak ikut, jadi aman dibaca backend.
  assert.equal(JSON.stringify(manifest).includes("function"), false);
  assert.deepEqual([...validateManifest(manifest)], []);
});

test("theme author mistakes are reported before the manifest reaches any store", () => {
  const broken = buildManifest(theme({
    version: "1.0",
    sections: [
      defineSection({
        type: "Promo",
        name: "Promo",
        settings: [
          { id: "title", type: "text", label: "Judul", default: "terlalu panjang", maxLength: 3 },
          { id: "title", type: "text", label: "Ganda" },
          { id: "size", type: "select", label: "Ukuran", options: [{ value: "s", label: "S" }], default: "xl" },
          { id: "gap", type: "range", label: "Jarak" },
          { id: "tint", type: "color", label: "Warna", default: "red" },
          { id: "photo", type: "image", label: "Foto", accept: ["svg"] },
          { id: "shown", type: "checkbox", label: "Tampil", visibleIf: { setting: "missing", equals: true } },
          { id: "file", type: "file", label: "Berkas" },
        ],
      }, Noop),
    ],
    presets: { coffee: { name: "Coffee", templates: { home: { sections: [{ type: "unknown" }] }, product: { sections: [] } } } },
  }));

  const errors = validateManifest(broken);
  const expectSome = (fragment) => assert.ok(errors.some((error) => error.includes(fragment)), `diharapkan kesalahan "${fragment}", dapat:\n${errors.join("\n")}`);
  expectSome("version harus semver");
  expectSome("sections.Promo: type tidak valid");
  expectSome("default lebih panjang dari maxLength");
  expectSome("id ganda");
  expectSome("default bukan salah satu options");
  expectSome("range wajib punya min dan max");
  expectSome("default harus #rrggbb");
  expectSome("accept hanya");
  expectSome("visibleIf merujuk setting yang tidak ada");
  expectSome('tipe input "file" tidak dikenal');
  expectSome('section "unknown" tidak ada');
  expectSome("wajib tepat satu section main-product");
});

test("a theme without presets is refused: stores must never start from a blank layout", () => {
  assert.ok(validateManifest(buildManifest(theme({ presets: {} }))).some((error) => error.includes("minimal satu preset")));
});

test("settings read from storage are complete, and malformed values fall back to defaults", () => {
  const inputs = [
    { id: "title", type: "text", label: "Judul", default: "Halo", maxLength: 5 },
    { id: "columns", type: "select", label: "Kolom", options: [{ value: "2", label: "2" }, { value: "3", label: "3" }], default: "3" },
    { id: "gap", type: "range", label: "Jarak", min: 0, max: 64, default: 24 },
    { id: "rounded", type: "checkbox", label: "Bulat" },
    { id: "tint", type: "color", label: "Warna", default: "#AA0000" },
    { id: "photo", type: "image", label: "Foto", default: "theme://coffee/a.webp" },
    { id: "link", type: "link", label: "Tautan", allowExternal: false },
    { id: "products", type: "product-source", label: "Produk" },
    { type: "heading", content: "Pemisah" },
  ];

  // Tanpa data: semua dari default (path mentah image belum diubah platform, jadi null).
  assert.deepEqual({ ...normalizeSettings(inputs, undefined) }, {
    title: "Halo", columns: "3", gap: 24, rounded: false, tint: "#aa0000", photo: null, link: null,
  });

  const settings = normalizeSettings(inputs, {
    title: "Teks yang panjang",
    columns: "7",
    gap: 999,
    rounded: "yes",
    tint: "#00FF00",
    photo: { url: "javascript:alert(1)", width: 1, height: 1, alt: "" },
    link: { href: "https://evil.test", external: true },
    products: [1, 2, 3],
    extra: "dibuang",
  });
  assert.deepEqual({ ...settings }, {
    title: "Teks ",
    columns: "3",
    gap: 64,
    rounded: false,
    tint: "#00ff00",
    photo: null,
    link: null,
  });

  assert.deepEqual(
    { ...normalizeSettings(inputs, { photo: { url: "https://cdn.test/a.webp", width: 10, height: 10, alt: "A" }, link: { href: "/products", external: false } }) }.photo,
    { url: "https://cdn.test/a.webp", width: 10, height: 10, alt: "A" },
  );
});
