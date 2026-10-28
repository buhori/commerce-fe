import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Host yang dibuka pembeli; storefront meneruskannya ke API sebagai X-Store-Host.
const REQUEST_HOST = "luneva-skincare.sellosy.test";

function loadModule(file, fetch = () => {}) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    fetch,
    URL,
    URLSearchParams,
    AbortSignal,
    Headers,
    process: {
      env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" },
    },
    require: (name) => {
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/headers") return { headers: async () => new Headers({ host: REQUEST_HOST }), cookies: async () => ({ get: () => undefined }) };
      // Modul relatif di lib/ dimuat sungguhan, dengan fetch palsu yang sama.
      if (name.startsWith("./")) return loadModule(new URL(`${name}.ts`, new URL(file, import.meta.url)).href, fetch);
      return {};
    },
  });
  return exports;
}

test("categories live at /c/{slug} and the rest of the catalog at /products; search and sort follow", () => {
  const { catalogUrl } = loadModule("../lib/catalog-url.ts");
  assert.equal(catalogUrl(), "/products");
  assert.equal(catalogUrl({ category: "baju-anak" }), "/c/baju-anak");
  assert.equal(catalogUrl({ category: "baju anak/2" }), "/c/baju%20anak%2F2");
  assert.equal(catalogUrl({ category: "tas", q: " kulit ", sort: "price_asc" }), "/c/tas?q=kulit&sort=price_asc");
  assert.equal(catalogUrl({ q: "kulit" }), "/products?q=kulit");
});

test("store logo resolves public uploads against the backend and preserves remote URLs", async () => {
  const { storeLogoUrl, getStore } = loadModule("../lib/store-api.ts", async () => ({
    ok: true,
    json: async () => ({ name: "Toko", logo: "stores/logos/logo.png" }),
  }));
  for (const path of ["stores/logos/logo.png", "storage/stores/logos/logo.png", "/storage/stores/logos/logo.png"]) {
    assert.equal(storeLogoUrl(path), "http://backend.test/storage/stores/logos/logo.png");
  }
  assert.equal(storeLogoUrl("https://cdn.example/logo.png?v=2"), "https://cdn.example/logo.png?v=2");
  for (const value of [null, undefined, " ", 123, "javascript:alert(1)", "data:image/png;base64,test"]) {
    assert.equal(storeLogoUrl(value), null);
  }
  const store = await getStore();
  assert.equal(store.name, "Toko");
  assert.equal(store.logo, "http://backend.test/storage/stores/logos/logo.png");
});

test("categories support raw/wrapped responses and exclude non-product categories", async () => {
  let wrapped = false;
  const categories = [
    { id: 2, name: "Pakaian", slug: "pakaian", type: "product" },
    { id: 3, name: "Artikel", slug: "artikel", type: "post" },
    // Without a slug there is no /c/{slug} page to link to.
    { id: 4, name: "Tanpa slug", slug: "", type: "product" },
  ];
  const { getCategories } = loadModule(
    "../lib/store-api.ts",
    async (url, init) => {
      assert.equal(
        url,
        "http://backend.test/api/categories?page=1&per_page=10",
      );
      assert.equal(init.headers["X-Store-Id"], "404");
      assert.equal(init.headers["X-Store-Host"], REQUEST_HOST);
      return Response.json(wrapped ? { data: categories } : categories);
    },
  );
  assert.equal((await getCategories()).length, 1);
  wrapped = true;
  assert.equal((await getCategories())[0].name, "Pakaian");
});

test("product API receives category and last_product_id while preserving published filtering", async () => {
  const { getProducts } = loadModule(
    "../lib/store-api.ts",
    async (url, init) => {
      const parsed = new URL(url);
      // Kategori lewat filter=category, sama dengan halaman /products.
      assert.equal(parsed.searchParams.get("filter"), "category");
      assert.deepEqual(parsed.searchParams.getAll("filter_value[]"), ["2"]);
      assert.equal(parsed.searchParams.get("last_product_id"), "375139977");
      assert.equal(parsed.searchParams.get("per_page"), "20");
      assert.equal(parsed.searchParams.has("cursor"), false);
      assert.equal(init.headers["X-Store-Id"], "404");
      return Response.json({
        data: [{ id: 1, status: "published" }, { id: 2, status: "draft" }],
        meta: { has_more: true, last_product_id: 1 },
      });
    },
  );
  const result = await getProducts({ categoryId: 2, lastProductId: 375139977 });
  assert.deepEqual(result.data.map((product) => product.id), [1]);
  assert.equal(result.hasMore, true);
  assert.equal(result.lastProductId, 1);
});

test("all-products request omits category and malformed categories reject", async () => {
  const { getProducts, getCategories } = loadModule(
    "../lib/store-api.ts",
    async (url) => {
      if (url.includes("/categories")) return Response.json({ data: null });
      assert.equal(new URL(url).searchParams.has("category_id"), false);
      return Response.json({ data: [] });
    },
  );
  assert.equal((await getProducts()).data.length, 0);
  await assert.rejects(getCategories());
});

test("product pages keep encoded IDs and only continue when there is a position to continue from", async () => {
  const product = { id: 375139977, name: "Voluptas Nihil Velit", slug: "voluptas-nihil-velit", images: "http://localhost:8001/products/images.webp", price: 437000, preorder_duration: 4 };
  const { readProductPage } = loadModule("../lib/store-api.ts");
  assert.deepEqual(JSON.parse(JSON.stringify(readProductPage({ data: [product], meta: { has_more: true, last_product_id: 375139977 } }))),
    { data: [product], hasMore: true, lastProductId: 375139977 });
  // has_more without an id to continue from must not start an endless loader.
  assert.equal(readProductPage({ data: [], meta: { has_more: true, last_product_id: null } }).hasMore, false);
  assert.equal(readProductPage({ data: [] }).hasMore, false);
  assert.throws(() => readProductPage({ data: null }));
});

test("empty product detail is treated as missing instead of a server error", async () => {
  const { getProduct } = loadModule("../lib/store-api.ts", async () => Response.json({ data: [] }));
  assert.equal(await getProduct("produk-tidak-ada"), null);
});

test("product detail uses the slug and retains the backend ID for cart operations", async () => {
  const product = { id: 1, slug: "voluptas-nihil-velit", status: "published", deleted_at: null };
  const { getProduct } = loadModule("../lib/store-api.ts", async (url, init) => {
    assert.equal(url, "http://backend.test/api/products/voluptas-nihil-velit");
    assert.equal(init.headers["X-Store-Id"], "404");
    return Response.json({ data: product });
  });
  const detail = await getProduct(product.slug);
  assert.equal(detail.id, 1);
  assert.equal(detail.slug, product.slug);
  // Backend lama tanpa field SEO: tetap terbaca dengan nilai kosong.
  assert.deepEqual(JSON.parse(JSON.stringify(detail.seo)), { title: null, description: null, image: null });
  assert.deepEqual(JSON.parse(JSON.stringify(detail.categories)), []);
  assert.equal(detail.rating_count, 0);
});

test("product SEO fields are validated: text or null, http(s) images, well-formed categories", async () => {
  const product = {
    id: 1, slug: "kopi", status: "published", deleted_at: null, rating: 4.6, rating_count: 12, updated_at: "2026-10-01T00:00:00Z",
    seo: { title: " Kopi Arabika ", description: 42, image: "javascript:alert(1)" },
    categories: [{ id: 3, name: "Kopi", slug: "kopi" }, { id: "x", name: "Rusak", slug: "rusak" }, null],
  };
  const { getProduct } = loadModule("../lib/store-api.ts", async () => Response.json({ data: product }));
  const detail = await getProduct("kopi");
  assert.deepEqual(JSON.parse(JSON.stringify(detail.seo)), { title: "Kopi Arabika", description: null, image: null });
  assert.deepEqual(JSON.parse(JSON.stringify(detail.categories)), [{ id: 3, name: "Kopi", slug: "kopi" }]);
  assert.equal(detail.rating, 4.6);
  assert.equal(detail.rating_count, 12);
});

test("slug detail returns the canonical slug for a redirect and hides drafts and deleted products", async () => {
  let product = { id: 1, slug: "different-product", status: "published", deleted_at: null };
  const { getProduct } = loadModule("../lib/store-api.ts", async () => Response.json({ data: product }));
  // Ditemukan lewat ID ter-encode atau slug beda huruf: halaman mengalihkan ke slug kanonik ini.
  assert.equal((await getProduct("requested-product")).slug, "different-product");
  product = { ...product, slug: "" };
  await assert.rejects(getProduct("requested-product"), /Invalid product detail response/);
  product = { ...product, slug: "requested-product", status: "draft" };
  assert.equal(await getProduct("requested-product"), null);
  product = { ...product, status: "published", deleted_at: "2026-09-25" };
  assert.equal(await getProduct("requested-product"), null);
});

