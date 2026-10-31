import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// lib/ dimuat sungguhan; impor relatif ikut dimuat, impor tipe (store-api) hilang saat transpile.
function loadModule(file) {
  const url = new URL(file, import.meta.url);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, URL, URLSearchParams,
    require: (name) => {
      if (name.startsWith("./")) return loadModule(new URL(`${name}.ts`, url).href);
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports;
}

const { blogPostingJsonLd, readBlogPage, readBlogPost } = loadModule("../lib/blog.ts");
const { readSitemap, sitemapEntries } = loadModule("../lib/sitemap.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

const summary = { slug: "cara-menyeduh", title: "Cara Menyeduh", excerpt: "Ringkas.", cover_image: "https://cdn.test/s.webp", published_at: "2026-10-30T02:00:00+00:00", updated_at: "2026-10-30T03:00:00+00:00" };

test("the blog list keeps valid rows and reads its pages", () => {
  const page = readBlogPage({
    data: [summary, { slug: "../x", title: "Rusak" }, { slug: "tanpa-judul", title: " " }, { ...summary, slug: "kedua", cover_image: "javascript:alert(1)" }],
    meta: { current_page: 2, last_page: 3 },
  });
  assert.deepEqual(page.posts.map((post) => post.slug), ["cara-menyeduh", "kedua"]);
  assert.equal(page.posts[1].cover_image, null);
  assert.equal(page.page, 2);
  assert.equal(page.lastPage, 3);
  assert.deepEqual(plain(readBlogPage(null)), { posts: [], page: 1, lastPage: 1 });
});

test("an article is read with its content, SEO, and other articles (never itself)", () => {
  const post = readBlogPost({ data: {
    ...summary,
    content: "<p>Isi.</p>",
    reading_minutes: 4,
    seo: { title: "Judul SEO", description: "Deskripsi", image: null },
    related: [{ ...summary, slug: "lain", title: "Lain" }, summary],
  } });
  assert.equal(post.content, "<p>Isi.</p>");
  assert.equal(post.reading_minutes, 4);
  assert.equal(post.seo.title, "Judul SEO");
  assert.deepEqual(post.related.map((other) => other.slug), ["lain"]);
  assert.equal(readBlogPost({ data: { slug: "x" } }), null);
  assert.equal(readBlogPost(null), null);
});

test("articles get BlogPosting structured data", () => {
  const post = readBlogPost({ data: { ...summary, content: "", seo: {} } });
  assert.deepEqual(plain(blogPostingJsonLd(post, "https://kopi.test/blog/cara-menyeduh", "Kopi")), {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Cara Menyeduh",
    description: "Ringkas.",
    image: ["https://cdn.test/s.webp"],
    datePublished: "2026-10-30T02:00:00+00:00",
    dateModified: "2026-10-30T03:00:00+00:00",
    mainEntityOfPage: "https://kopi.test/blog/cara-menyeduh",
    publisher: { "@type": "Organization", name: "Kopi" },
  });
});

test("the sitemap lists the blog and its articles only when there are articles", () => {
  const empty = readSitemap({ data: { products: [], categories: [], pages: [] } });
  assert.deepEqual(plain(empty.posts), []);
  assert.deepEqual(plain(sitemapEntries("https://kopi.test", empty)).map((entry) => entry.url), ["https://kopi.test/", "https://kopi.test/products"]);

  const data = readSitemap({ data: { products: [], categories: [], pages: [], posts: [{ slug: "cara-menyeduh", updated_at: "2026-10-30T03:00:00Z" }, { slug: "../x" }] } });
  assert.deepEqual(plain(sitemapEntries("https://kopi.test", data)).map((entry) => entry.url), [
    "https://kopi.test/", "https://kopi.test/products", "https://kopi.test/blog", "https://kopi.test/blog/cara-menyeduh",
  ]);
});
