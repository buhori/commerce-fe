import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

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
    process: {
      env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" },
    },
    require: () => ({ cache: (callback) => callback }),
  });
  return exports;
}

test("categories live at /c/{slug}; search and sort follow, the cursor only when paginating", () => {
  const { catalogUrl } = loadModule("../lib/catalog-url.ts");
  assert.equal(catalogUrl(), "/");
  assert.equal(catalogUrl({ category: "baju-anak" }), "/c/baju-anak");
  assert.equal(catalogUrl({ category: "baju anak/2" }), "/c/baju%20anak%2F2");
  assert.equal(catalogUrl({ category: "tas", q: " kulit ", sort: "price_asc" }), "/c/tas?q=kulit&sort=price_asc");
  const url = new URL(catalogUrl({ category: "tas", cursor: "cursor/+=" }), "http://store.test");
  assert.equal(url.pathname, "/c/tas");
  assert.equal(url.searchParams.get("cursor"), "cursor/+=");
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
      assert.equal(parsed.searchParams.get("category_id"), "2");
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
  assert.deepEqual(await getProduct(product.slug), product);
});

test("slug detail rejects mismatched products and hides drafts and deleted products", async () => {
  let product = { id: 1, slug: "different-product", status: "published", deleted_at: null };
  const { getProduct } = loadModule("../lib/store-api.ts", async () => Response.json({ data: product }));
  await assert.rejects(getProduct("requested-product"), /Invalid product detail response/);
  product = { ...product, slug: "requested-product", status: "draft" };
  assert.equal(await getProduct("requested-product"), null);
  product = { ...product, status: "published", deleted_at: "2026-09-25" };
  assert.equal(await getProduct("requested-product"), null);
});

test("banners keep safe links only and drop rows without an image", async () => {
  const { getBanners } = loadModule("../lib/store-api.ts", async (url) => {
    assert.equal(url, "http://backend.test/api/banners");
    return Response.json({ data: [
      { id: 1, title: " Promo ", subtitle: "", button_label: "Belanja", link: "/products/tas", image: "http://img/a.jpg", mobile_image: "http://img/a-m.jpg" },
      { id: 2, title: null, button_label: "Klik", link: "javascript:alert(1)", image: "http://img/b.jpg" },
      { id: 3, link: "//evil.test", image: "http://img/c.jpg" },
      { id: 4, link: "https://partner.test/promo", image: "http://img/d.jpg" },
      { id: 5, title: "Tanpa gambar", image: "" },
    ] });
  });
  const banners = JSON.parse(JSON.stringify(await getBanners()));
  assert.deepEqual(banners, [
    { id: 1, title: "Promo", subtitle: null, button_label: "Belanja", link: "/products/tas", image: "http://img/a.jpg", mobile_image: "http://img/a-m.jpg" },
    { id: 2, title: null, subtitle: null, button_label: null, link: null, image: "http://img/b.jpg", mobile_image: null },
    { id: 3, title: null, subtitle: null, button_label: null, link: null, image: "http://img/c.jpg", mobile_image: null },
    { id: 4, title: null, subtitle: null, button_label: null, link: "https://partner.test/promo", image: "http://img/d.jpg", mobile_image: null },
  ]);
});
