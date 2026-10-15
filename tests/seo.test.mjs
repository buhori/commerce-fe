import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Modul murni: hanya modul relatif di lib/ yang dimuat, tanpa React atau next/headers.
function loadModule(file) {
  const url = new URL(file, import.meta.url);
  const exports = {};
  const source = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    URL,
    URLSearchParams,
    require: (name) => {
      if (name.startsWith("./")) return loadModule(new URL(`${name}.ts`, url).href);
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports;
}

const seo = loadModule("../lib/seo.ts");
const { readSitemap, sitemapEntries } = loadModule("../lib/sitemap.ts");
const { readCatalogFilter } = loadModule("../lib/catalog-url.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

test("meta descriptions drop HTML, decode entities, collapse whitespace and cut at a word", () => {
  const { metaDescription } = seo;
  assert.equal(metaDescription("<p>Kopi&nbsp;<b>arabika</b> &amp; robusta</p>\n\n<script>alert(1)</script>"), "Kopi arabika & robusta");
  assert.equal(metaDescription("Harga &lt;murah&gt; &#39;asli&#x27;"), "Harga <murah> 'asli'");
  assert.equal(metaDescription(null), "");
  assert.equal(metaDescription("   "), "");
  const long = "kata ".repeat(60);
  const cut = metaDescription(long);
  assert.ok(cut.length <= 160);
  assert.ok(cut.endsWith("kata…"));
  assert.equal(metaDescription("Satu dua tiga empat", 12), "Satu dua…");
});

test("site URL prefers the store's canonical URL and falls back to the request origin", () => {
  const { siteUrl, absoluteUrl, originFromHeaders } = seo;
  assert.equal(siteUrl({ url: "https://tokokopi.com/" }, "https://kopi.sellosy.com"), "https://tokokopi.com");
  assert.equal(siteUrl({ url: "https://tokokopi.com/toko?x=1" }, "https://kopi.sellosy.com"), "https://tokokopi.com");
  for (const url of [null, undefined, "", "javascript:alert(1)", "tokokopi.com", "ftp://tokokopi.com"]) {
    assert.equal(siteUrl({ url }, "https://kopi.sellosy.com"), "https://kopi.sellosy.com");
  }
  assert.equal(siteUrl(null, "http://localhost:3000"), "http://localhost:3000");
  assert.equal(absoluteUrl("https://a.test", "/"), "https://a.test/");
  assert.equal(absoluteUrl("https://a.test/", "/products/kopi"), "https://a.test/products/kopi");
  assert.equal(originFromHeaders(new Headers({ host: "kopi.sellosy.com", "x-forwarded-proto": "https" })), "https://kopi.sellosy.com");
  assert.equal(originFromHeaders(new Headers({ host: "localhost:3000", "x-forwarded-host": "toko.test, proxy", "x-forwarded-proto": "http" })), "http://toko.test");
});

test("SEO fields from the API are strings or null and images must be http(s)", () => {
  assert.deepEqual(plain(seo.readSeo({ title: " Judul ", description: "", image: "data:image/png;base64,x" })), { title: "Judul", description: null, image: null });
  assert.deepEqual(plain(seo.readSeo(null)), { title: null, description: null, image: null });
  assert.deepEqual(plain(seo.readStoreSeo({ noindex: "true", google_verification: "abc_123-X", image: "https://cdn.test/og.png" })), {
    title: null, description: null, image: "https://cdn.test/og.png", noindex: false, google_verification: "abc_123-X",
  });
  assert.equal(seo.readStoreSeo({ noindex: true, google_verification: "\"><script>" }).google_verification, null);
  assert.equal(seo.readStoreSeo({ noindex: true }).noindex, true);
});

test("site SEO falls back to the store name and description, and preview or missing stores are noindex", () => {
  const store = { name: "Kopi Senja", description: "<p>Kopi pilihan</p>", language: "en", logo: "https://cdn.test/logo.png" };
  const site = seo.siteSeo(store, "https://kopi.sellosy.com");
  assert.equal(site.title, "Kopi Senja");
  assert.equal(site.description, "Kopi pilihan");
  assert.equal(site.image, "https://cdn.test/logo.png");
  assert.equal(site.locale, "en_US");
  assert.equal(site.noindex, false);
  assert.equal(seo.siteSeo({ ...store, seo: { title: "Kopi Senja Bandung", noindex: false } }, "https://x.test").title, "Kopi Senja Bandung");
  assert.equal(seo.siteSeo(store, "https://x.test", { preview: true }).noindex, true);
  assert.equal(seo.siteSeo(null, "https://x.test", { missing: true }).noindex, true);
  assert.equal(seo.ogLocale("id"), "id_ID");
  assert.equal(seo.htmlLang("fr"), "id");
});

test("page metadata keeps the shared Open Graph base and never reopens a noindex store", () => {
  const site = seo.siteSeo({ name: "Kopi", logo: "https://cdn.test/logo.png" }, "https://kopi.test");
  const root = seo.rootMetadata(site);
  assert.equal(root.metadataBase, "https://kopi.test");
  assert.deepEqual(plain(root.title), { default: "Kopi", template: "%s | Kopi" });
  assert.equal(root.robots, undefined);
  const page = seo.pageMetadata(site, { title: "Arabika", path: "/products/arabika", noindex: false });
  assert.equal(page.alternates.canonical, "/products/arabika");
  assert.equal(page.openGraph.siteName, "Kopi");
  assert.equal(page.openGraph.url, "/products/arabika");
  assert.deepEqual(plain(page.openGraph.images), [{ url: "https://cdn.test/logo.png", alt: "Kopi" }]);
  assert.equal(page.robots, undefined);
  assert.deepEqual(plain(seo.pageMetadata(site, { noindex: true }).robots), { index: false, follow: true });
  const closed = { ...site, noindex: true };
  assert.deepEqual(plain(seo.rootMetadata(closed).robots), { index: false, follow: false });
  assert.deepEqual(plain(seo.pageMetadata(closed, { title: "x" }).robots), { index: false, follow: false });
  assert.deepEqual(plain(seo.pageMetadata(site, { absoluteTitle: "Kopi" }).title), { absolute: "Kopi" });
});

test("catalog canonical: sorts share /products, one category moves to /c, search and picks are noindex", () => {
  const categories = [{ id: 3, slug: "kopi" }, { id: 5, slug: "teh" }];
  const canonical = (query) => plain(seo.canonicalCatalog(readCatalogFilter(new URLSearchParams(query)), categories));
  assert.deepEqual(canonical(""), { path: "/products", noindex: false });
  assert.deepEqual(canonical("sort=price_asc"), { path: "/products", noindex: false });
  assert.deepEqual(canonical("filter=sort&filter_value=top_sale&utm_source=x"), { path: "/products", noindex: false });
  assert.deepEqual(canonical("filter=category&filter_value[]=3&sort=latest"), { path: "/c/kopi", noindex: false });
  assert.deepEqual(canonical("filter=category&filter_value=99"), { path: "/products", noindex: false });
  assert.deepEqual(canonical("filter=category&filter_value[]=3&filter_value[]=5"), { path: "/products?filter=category&filter_value%5B%5D=3&filter_value%5B%5D=5", noindex: true });
  assert.deepEqual(canonical("q=kopi+susu&sort=latest"), { path: "/products?q=kopi+susu", noindex: true });
  assert.deepEqual(canonical("filter=id&filter_value[]=81623"), { path: "/products?filter=id&filter_value%5B%5D=81623", noindex: true });
});

const product = { name: "Kopi Arabika", sku: "KA-1", price: 50000, variants: [], rating: null, rating_count: 0 };
const ld = (overrides = {}, input = {}) => seo.productJsonLd({
  product: { ...product, ...overrides },
  url: "https://kopi.test/products/kopi-arabika",
  images: ["https://cdn.test/1.webp"],
  description: "Kopi enak",
  currency: "IDR",
  availability: "ok",
  seller: "Kopi Senja",
  ...input,
});

test("product JSON-LD has a single Offer, maps availability, and omits ratings without reviews", () => {
  const data = ld();
  assert.equal(data["@type"], "Product");
  assert.equal(data.sku, "KA-1");
  assert.deepEqual(data.image, ["https://cdn.test/1.webp"]);
  assert.equal(data.brand, undefined);
  assert.deepEqual(plain(data.offers), {
    "@type": "Offer", price: 50000, priceCurrency: "IDR", availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition", url: "https://kopi.test/products/kopi-arabika",
    seller: { "@type": "Organization", name: "Kopi Senja" },
  });
  assert.equal("aggregateRating" in data, false);
  assert.equal(ld({}, { availability: "low" }).offers.availability, "https://schema.org/InStock");
  assert.equal(ld({}, { availability: "out" }).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(ld({}, { availability: "preorder" }).offers.availability, "https://schema.org/PreOrder");
  assert.equal("aggregateRating" in ld({ rating: 4.5, rating_count: 0 }), false);
  assert.deepEqual(plain(ld({ rating: 4.56, rating_count: 7 }).aggregateRating), {
    "@type": "AggregateRating", ratingValue: 4.6, reviewCount: 7, bestRating: 5, worstRating: 1,
  });
});

test("variants with different prices become an AggregateOffer; equal prices stay a single Offer", () => {
  const aggregate = ld({ variants: [{ price: 45000 }, { price: 60000 }, { price: null }] }).offers;
  assert.equal(aggregate["@type"], "AggregateOffer");
  assert.equal(aggregate.lowPrice, 45000);
  assert.equal(aggregate.highPrice, 60000);
  assert.equal(aggregate.offerCount, 3);
  assert.equal(aggregate.priceCurrency, "IDR");
  const same = ld({ variants: [{ price: 50000 }, { price: null }] }).offers;
  assert.equal(same["@type"], "Offer");
  assert.equal(same.price, 50000);
  assert.equal("offers" in ld({ price: null }), false);
});

test("breadcrumb, website search and organization JSON-LD", () => {
  assert.deepEqual(plain(seo.breadcrumbJsonLd([{ name: "Beranda", url: "https://k.test/" }, { name: "Kopi", url: "https://k.test/c/kopi" }])).itemListElement, [
    { "@type": "ListItem", position: 1, name: "Beranda", item: "https://k.test/" },
    { "@type": "ListItem", position: 2, name: "Kopi", item: "https://k.test/c/kopi" },
  ]);
  const site = seo.websiteJsonLd({ name: "Kopi" }, "https://k.test");
  assert.equal(site.potentialAction.target.urlTemplate, "https://k.test/products?q={search_term_string}");
  assert.equal(site.potentialAction["query-input"], "required name=search_term_string");
  const org = seo.organizationJsonLd({
    name: "Kopi", logo: "https://cdn.test/logo.png", description: "<p>Kopi</p>", email: "halo@kopi.test",
    phone: "0812-3456-7890", phone_country_code: "62", address: "Jl. Senja 1, Bandung",
  }, "https://k.test");
  assert.equal(org["@type"], "OnlineStore");
  assert.equal(org.url, "https://k.test/");
  assert.equal(org.telephone, "+6281234567890");
  assert.equal(org.description, "Kopi");
  assert.equal(org.address, "Jl. Senja 1, Bandung");
  const bare = seo.organizationJsonLd({ name: "Kopi", logo: null, email: "bukan email", phone: "12" }, "https://k.test");
  assert.deepEqual(Object.keys(bare).sort(), ["@context", "@type", "name", "url"]);
  assert.equal(seo.e164("62", "+62 812 3456 7890"), "+6281234567890");
});

test("JSON-LD output escapes < so text cannot close the script tag", () => {
  const html = seo.jsonLdString({ name: "</script><script>alert(1)</script>" });
  assert.equal(html.includes("<"), false);
  assert.equal(JSON.parse(html).name, "</script><script>alert(1)</script>");
});

test("sitemap reads valid rows only and builds absolute, escaped URLs", () => {
  const data = readSitemap({ data: {
    products: [
      { slug: "kopi arabika", updated_at: "2026-10-01T10:00:00Z", image: "https://cdn.test/a.webp?w=1&h=2" },
      { slug: "../x", updated_at: "x", image: null },
      { slug: "teh", updated_at: "bukan tanggal", image: "javascript:alert(1)" },
    ],
    categories: [{ slug: "kopi", updated_at: null }, { slug: 5 }],
    pages: [{ slug: "about", updated_at: "2026-09-01" }, { slug: "../etc" }],
  } });
  assert.equal(data.products.length, 2);
  assert.equal(data.products[1].image, null);
  assert.equal(data.products[1].updated_at, null);
  assert.equal(data.categories.length, 1);
  assert.equal(data.pages.length, 1);
  const entries = plain(sitemapEntries("https://kopi.test", data));
  assert.deepEqual(entries.map((entry) => entry.url), [
    "https://kopi.test/", "https://kopi.test/products", "https://kopi.test/c/kopi",
    "https://kopi.test/products/kopi%20arabika", "https://kopi.test/products/teh", "https://kopi.test/about",
  ]);
  assert.equal(entries[0].priority, 1);
  assert.deepEqual(entries[3].images, ["https://cdn.test/a.webp?w=1&amp;h=2"]);
  assert.equal(entries[3].lastModified, "2026-10-01T10:00:00.000Z");
  assert.equal("images" in entries[4], false);
  assert.deepEqual(plain(sitemapEntries("https://kopi.test", null)).map((entry) => entry.url), ["https://kopi.test/", "https://kopi.test/products"]);
  assert.throws(() => readSitemap({ data: [] }));
});
