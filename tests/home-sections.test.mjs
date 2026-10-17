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
const {
  readHomeSections, readSections, readSectionStyle, safeLink, paragraphs, plainTextHtml, scopedSectionCss, sectionAppearance, countdownEnded, FEATURE_ICONS,
  COLUMN_LAYOUTS, columnCount,
} = exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const one = (type, settings, extra = {}) => readSections([{ id: "section-0", type, settings, ...extra }])[0];

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

test("links stay on the store, on the web, or on an anchor of the same page", () => {
  assert.equal(safeLink("/c/kopi"), "/c/kopi");
  assert.equal(safeLink("https://instagram.com/kopi"), "https://instagram.com/kopi");
  assert.equal(safeLink("#promo-lebaran"), "#promo-lebaran");
  for (const value of [
    "javascript:alert(1)", "//evil.test", "data:text/html,x", "", null, 42, "mailto:a@b.test", "tel:+62812", "#", "#Promo",
    "#a b", "#x\"onmouseover=1", `#${"a".repeat(41)}`,
  ]) {
    assert.equal(safeLink(value), null, String(value));
  }
});

const DEFAULT_STYLE = {
  background: "none", background_color: null, background_image: null, overlay: "none", text_color: "auto", padding_top: "md",
  padding_bottom: "md", width: "contained", align: "default", visibility: "all", anchor: null,
};

test("every section gets a complete style; old sections without one keep the theme defaults", () => {
  assert.deepEqual(plain(one("video", { video_id: "dQw4w9WgXcQ" }).style), DEFAULT_STYLE);
  for (const value of [undefined, null, [], "dark", 42]) assert.deepEqual(plain(readSectionStyle(value)), DEFAULT_STYLE);

  assert.deepEqual(plain(readSectionStyle({
    background: "custom", background_color: "#1A2B3C", background_image: "https://cdn.test/bg.webp", overlay: "dark", text_color: "light",
    padding_top: "xl", padding_bottom: "none", width: "full", align: "center", visibility: "mobile", anchor: "promo-2", extra: "x",
  })), {
    background: "custom", background_color: "#1a2b3c", background_image: "https://cdn.test/bg.webp", overlay: "dark", text_color: "light",
    padding_top: "xl", padding_bottom: "none", width: "full", align: "center", visibility: "mobile", anchor: "promo-2",
  });

  // Nilai tidak dikenal kembali ke bawaan; warna sendiri tanpa warna sah menjadi latar tema.
  assert.deepEqual(plain(readSectionStyle({
    background: "custom", background_color: "red", background_image: "javascript:alert(1)", overlay: "x", text_color: "blue",
    padding_top: "huge", padding_bottom: 3, width: "100vw", align: "right", visibility: "never", anchor: "Promo Lebaran",
  })), DEFAULT_STYLE);
  assert.equal(readSectionStyle({ background: "primary", background_color: "#ffffff" }).background_color, null);
  assert.equal(readSectionStyle({ anchor: `${"a".repeat(41)}` }).anchor, null);
});

test("an anchor already used by an earlier section is dropped so ids stay unique", () => {
  const sections = readSections([
    { id: "section-0", type: "video", settings: { video_id: "dQw4w9WgXcQ" }, style: { anchor: "promo" } },
    { id: "section-1", type: "video", settings: { video_id: "dQw4w9WgXcQ" }, style: { anchor: "promo" } },
  ]);
  assert.deepEqual(sections.map((section) => section.style.anchor), ["promo", null]);
});

test("section style becomes wrapper classes, an id, and only validated CSS variables", () => {
  const look = (style) => plain(sectionAppearance(readSectionStyle(style)));
  const classes = (style) => look(style).className.split(" ");

  assert.deepEqual(look({}), {
    className: "builder-section section-pt-md section-pb-md section-width-contained",
  });
  assert.equal(look({ anchor: "faq" }).id, "faq");
  assert.deepEqual(classes({ padding_top: "none", padding_bottom: "xl", width: "wide", align: "center", visibility: "desktop" }), [
    "builder-section", "section-pt-none", "section-pb-xl", "section-width-wide", "section-align-center", "section-only-desktop",
  ]);

  // Teks otomatis menjadi terang di latar primary/accent/gelap, dan tombol utama dibalik.
  for (const [background, foreground] of [["primary", "on-primary"], ["accent", "on-accent"], ["dark", "on-dark"]]) {
    const list = classes({ background });
    assert.ok(list.includes(`section-bg-${background}`) && list.includes("section-has-bg"), background);
    assert.ok(list.includes("section-fg") && list.includes(`section-text-${foreground}`), background);
    assert.ok(list.includes("section-buttons-invert"), background);
  }
  // Latar permukaan memakai warna teks tema.
  assert.ok(!classes({ background: "surface" }).includes("section-fg"));
  // Warna sendiri: teks dipilih dari kecerahan latarnya.
  assert.ok(classes({ background: "custom", background_color: "#101828" }).includes("section-text-light"));
  assert.ok(classes({ background: "custom", background_color: "#fde68a" }).includes("section-text-dark"));
  assert.ok(!classes({ background: "custom", background_color: "#fde68a" }).includes("section-buttons-invert"));
  assert.deepEqual(look({ background: "custom", background_color: "#FDE68A" }).style, { "--section-bg": "#fde68a" });
  assert.equal(look({ background: "primary", background_color: "#000000" }).style, undefined);
  // Gambar latar: lapisan gelap berarti teks terang; tanpa gambar, lapisan diabaikan.
  assert.ok(classes({ background_image: "https://cdn.test/bg.webp", overlay: "dark" }).includes("section-overlay-dark"));
  assert.ok(classes({ background_image: "https://cdn.test/bg.webp", overlay: "dark" }).includes("section-text-light"));
  assert.ok(classes({ background_image: "https://cdn.test/bg.webp", overlay: "light" }).includes("section-text-dark"));
  assert.ok(!classes({ overlay: "dark" }).includes("section-overlay-dark"));
  // Pilihan pemilik menang dari otomatis.
  assert.ok(classes({ background: "primary", text_color: "dark" }).includes("section-text-dark"));
});

test("text sections render sanitized rich text, and legacy plain text becomes escaped paragraphs", () => {
  const rich = one("text", { title: "Tentang", body_html: "<p>Kopi <strong>segar</strong></p>", body: "lama", link: "#kontak", button_label: "Hubungi" });
  assert.equal(rich.settings.body_html, "<p>Kopi <strong>segar</strong></p>");
  assert.equal(rich.settings.body, null);
  assert.deepEqual([rich.settings.button_label, rich.settings.link], ["Hubungi", "#kontak"]);

  const legacy = one("text", { body: "Baris <satu>\nbaris dua\n\nParagraf & dua" });
  assert.equal(legacy.settings.body_html, "<p>Baris &lt;satu&gt;<br>baris dua</p><p>Paragraf &amp; dua</p>");
  assert.equal(plainTextHtml(null), null);

  // Tombol hanya dengan label dan tautan yang sah.
  assert.equal(one("text", { title: "A", button_label: "Buka", link: "javascript:alert(1)" }).settings.button_label, null);
  assert.equal(one("text", { title: "A", link: "/c/kopi" }).settings.link, null);
  assert.equal(one("text", { body_html: "  " }), undefined);
});

test("hero needs a title; buttons need a label and a link", () => {
  assert.equal(one("hero", { subtitle: "Tanpa judul" }), undefined);
  const hero = one("hero", {
    eyebrow: "Baru", title: "Kopi pilihan", subtitle: "Dua\nbaris", image: "https://cdn.test/hero.webp", image_alt: "Secangkir kopi", image_position: "left",
    primary_label: "Belanja", primary_link: "/products", secondary_label: "Tanpa tautan", min_height: "screen",
  });
  assert.deepEqual(plain(hero.settings), {
    eyebrow: "Baru", title: "Kopi pilihan", subtitle: "Dua\nbaris", image: "https://cdn.test/hero.webp", image_alt: "Secangkir kopi", image_position: "left",
    primary_label: "Belanja", primary_link: "/products", secondary_label: null, secondary_link: null, min_height: "screen",
  });
  const fallback = one("hero", { title: "X", image: "javascript:x", image_position: "top", min_height: "tall" }).settings;
  assert.deepEqual([fallback.image, fallback.image_position, fallback.min_height], [null, "right", "auto"]);
});

test("features keep titled items with known icons, up to 12", () => {
  assert.equal(FEATURE_ICONS.length, 16);
  assert.equal(one("features", { items: [{ text: "tanpa judul" }] }), undefined);
  const features = one("features", { title: "Kenapa kami", columns: 4, items: [
    { icon: "truck", title: "Gratis ongkir", text: "Seluruh Indonesia" },
    { icon: "rocket", title: "Ikon asing" },
    { title: "" },
    ...Array.from({ length: 20 }, (_, index) => ({ icon: "star", title: `Item ${index}` })),
  ] }).settings;
  assert.equal(features.columns, 4);
  assert.equal(features.items.length, 12);
  assert.deepEqual(plain(features.items.slice(0, 2)), [
    { icon: "truck", title: "Gratis ongkir", text: "Seluruh Indonesia" },
    { icon: null, title: "Ikon asing", text: null },
  ]);
  assert.equal(one("features", { columns: 5, items: [{ title: "A" }] }).settings.columns, 3);
});

test("faq keeps complete questions, up to 20", () => {
  assert.equal(one("faq", { items: [{ question: "Tanpa jawaban?" }] }), undefined);
  const faq = one("faq", { title: "FAQ", items: [
    { question: "Berapa lama?", answer: "2 hari" }, { question: "", answer: "x" },
    ...Array.from({ length: 30 }, (_, index) => ({ question: `Q${index}`, answer: "A" })),
  ] }).settings;
  assert.equal(faq.items.length, 20);
  assert.deepEqual(plain(faq.items[0]), { question: "Berapa lama?", answer: "2 hari" });
});

test("cta needs a title; the button needs a label and a link", () => {
  assert.equal(one("cta", { text: "Tanpa judul" }), undefined);
  assert.deepEqual(plain(one("cta", { title: "Gabung", text: "Diskon", button_label: "Daftar", link: "https://wa.me/62812", note: "Tanpa biaya" }).settings), {
    title: "Gabung", text: "Diskon", button_label: "Daftar", link: "https://wa.me/62812", note: "Tanpa biaya",
  });
  assert.equal(one("cta", { title: "Gabung", button_label: "Daftar" }).settings.button_label, null);
});

test("countdown needs a valid deadline and knows when it has ended", () => {
  assert.equal(one("countdown", { title: "Promo" }), undefined);
  assert.equal(one("countdown", { ends_at: "besok" }), undefined);
  const countdown = one("countdown", { title: "Promo", ends_at: "2026-12-31T17:00:00Z", expired_text: "Selesai", button_label: "Belanja", link: "/products" }).settings;
  assert.equal(countdown.ends_at, "2026-12-31T17:00:00.000Z");
  assert.equal(countdown.expired_text, "Selesai");
  assert.equal(countdownEnded(countdown, Date.parse("2026-12-31T16:59:59Z")), false);
  assert.equal(countdownEnded(countdown, Date.parse("2026-12-31T17:00:00Z")), true);
});

test("gallery keeps safe images with optional links, up to 12", () => {
  assert.equal(one("gallery", { images: [{ alt: "tanpa gambar" }] }), undefined);
  const gallery = one("gallery", { title: "Lookbook", columns: 2, images: [
    { image: "https://cdn.test/1.webp", alt: "Kemeja", link: "#produk" },
    { image: "javascript:alert(1)" },
    { image: "https://cdn.test/2.webp", link: "javascript:alert(1)" },
    ...Array.from({ length: 20 }, (_, index) => ({ image: `https://cdn.test/${index}.webp` })),
  ] }).settings;
  assert.equal(gallery.columns, 2);
  assert.equal(gallery.images.length, 12);
  assert.deepEqual(plain(gallery.images.slice(0, 2)), [
    { image: "https://cdn.test/1.webp", alt: "Kemeja", link: "#produk" },
    { image: "https://cdn.test/2.webp", alt: null, link: null },
  ]);
});

test("columns follow the layout's column count, keeping empty columns in place", () => {
  assert.deepEqual([...COLUMN_LAYOUTS].map(columnCount), [2, 1, 2, 2, 3, 3, 4]);
  const heading = (value) => ({ type: "heading", text: value });

  // Susunan tidak dikenal menjadi 50-50; kolom yang kurang ditambah kosong.
  const padded = one("columns", { layout: "40-60", gap: "xl", vertical_align: "middle", mobile: "three", columns: [{ blocks: [heading("A")] }] }).settings;
  assert.deepEqual(plain(padded), {
    layout: "50-50", gap: "md", vertical_align: "top", mobile: "stack",
    columns: [{ blocks: [{ type: "heading", text: "A", level: "h3" }] }, { blocks: [] }],
  });

  // Kolom berlebih dibuang; kolom kosong di tengah tetap ada.
  const trimmed = one("columns", { layout: "25-50-25", gap: "lg", vertical_align: "center", mobile: "two", columns: [
    { blocks: [heading("Satu")] }, "bukan kolom", { blocks: [heading("Tiga")] }, { blocks: [heading("Empat")] },
  ] }).settings;
  assert.deepEqual([trimmed.layout, trimmed.gap, trimmed.vertical_align, trimmed.mobile], ["25-50-25", "lg", "center", "two"]);
  assert.deepEqual(plain(trimmed.columns.map((column) => column.blocks.map((block) => block.text))), [["Satu"], [], ["Tiga"]]);

  assert.equal(one("columns", { layout: "100", columns: [{ blocks: [heading("Penuh")] }, { blocks: [heading("Hilang")] }] }).settings.columns.length, 1);
});

test("column blocks are validated and incomplete ones dropped, up to 8 per column", () => {
  const blocks = one("columns", { layout: "100", columns: [{ blocks: [
    { type: "heading", text: "Judul", level: "h2" },
    { type: "heading", text: "Level asing", level: "h1" },
    { type: "heading", text: "  " },
    { type: "text", html: "<p>Isi <strong>kaya</strong></p>" },
    { type: "text", html: "" },
    { type: "text", html: `<p>${"x".repeat(20000)}</p>` },
    { type: "image", image: "https://cdn.test/a.webp", alt: "Kopi", link: "#menu", image_url: "https://cdn.test/a.webp" },
    { type: "image", image: "javascript:alert(1)" },
    { type: "image", image: "https://cdn.test/b.webp", link: "javascript:alert(1)" },
    { type: "button", label: "Belanja", link: "/products", variant: "secondary" },
    { type: "button", label: "Tanpa tautan" },
    { type: "button", label: "Bahaya", link: "javascript:alert(1)" },
    { type: "button", label: "Situs", link: "https://wa.me/62812", variant: "ghost" },
    { type: "script", html: "<script>" },
    { type: "spacer", size: "xl" },
    { type: "heading", text: "Kesembilan" },
  ] }] }).settings.columns[0].blocks;

  assert.deepEqual(plain(blocks), [
    { type: "heading", text: "Judul", level: "h2" },
    { type: "heading", text: "Level asing", level: "h3" },
    { type: "text", html: "<p>Isi <strong>kaya</strong></p>" },
    { type: "image", image: "https://cdn.test/a.webp", alt: "Kopi", link: "#menu" },
    { type: "image", image: "https://cdn.test/b.webp", alt: null, link: null },
    { type: "button", label: "Belanja", link: "/products", variant: "secondary" },
    { type: "button", label: "Situs", link: "https://wa.me/62812", variant: "primary" },
    { type: "spacer", size: "md" },
  ]);
});

test("a columns section with every column empty is skipped", () => {
  assert.equal(one("columns", { layout: "33-33-33" }), undefined);
  assert.equal(one("columns", { layout: "50-50", columns: [{ blocks: [{ type: "button", label: "x" }] }, { blocks: "oops" }] }), undefined);
  // Hanya jarak tetap dirender: bisa dipakai sebagai pemisah antarbagian.
  assert.equal(one("columns", { columns: [{}, { blocks: [{ type: "spacer", size: "lg" }] }] }).settings.columns[1].blocks[0].size, "lg");
});

test("text widgets become paragraphs on blank lines", () => {
  assert.deepEqual([...paragraphs("Satu\nbaris\n\nDua\n\n\n")], ["Satu\nbaris", "Dua"]);
  assert.equal(paragraphs(null).length, 0);
});

test("custom CSS stays scoped to its section and cannot close the style tag or the wrapper", () => {
  const css = (value) => readHomeSections({ data: [{ id: "section-2", type: "video", settings: { video_id: "dQw4w9WgXcQ" }, css: value }] })[0].css;

  assert.equal(css("padding: 4rem 0;\n& h2 { color: #4525C9; }"), "padding: 4rem 0;\n& h2 { color: #4525C9; }");
  assert.equal(css('& h2 { content: "}"; } /* { */'), '& h2 { content: "}"; } /* { */');
  assert.equal(css("color: red;</style><script>alert(1)</script>"), "color: red;/style>script>alert(1)/script>");
  assert.equal(css("} body { display: none; } & {"), null);
  assert.equal(css("\\{ } body { display: none; }"), null);
  assert.equal(css("background: url({); } body { display: none; } & {"), null);
  assert.equal(css("& h2 { color: red;"), null);
  assert.equal(css(42), null);
  assert.equal(css(undefined), null);
  assert.equal(scopedSectionCss("section-2", "padding: 0;"), '.home-block[data-section="section-2"] {\npadding: 0;\n}');

  const [section] = readHomeSections({ data: [{ id: '"]{}*{color:red} x[a="', type: "video", settings: { video_id: "dQw4w9WgXcQ" } }] });
  assert.equal(section.id, "section-0");
});

// store-api dimuat sungguhan (seperti store-style.test.mjs) dengan header/cookie request dan fetch palsu.
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function loadModule(file, { fetch, cookie }) {
  const moduleExports = {};
  vm.runInNewContext(ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports: moduleExports, fetch, URL, URLSearchParams, AbortSignal, Headers,
    process: { env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" } },
    require: (name) => {
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/headers") {
        return {
          headers: async () => new Headers({ host: "toko.sellosy.test" }),
          cookies: async () => ({ get: (key) => (key === "preview_token" && cookie ? { value: cookie } : undefined) }),
        };
      }
      if (name === "@/themes/registry") return loadModule("themes/registry.ts", { fetch });
      if (name.startsWith("./")) return loadModule(`lib/${name.slice(2)}.ts`, { fetch, cookie });
      return {};
    },
  });
  return moduleExports;
}

const TOKEN = `${"a".repeat(24)}.${"b".repeat(43)}`;

test("builder pages read their sections and send the preview token for a verified draft preview", async () => {
  const load = async (cookie, page) => {
    const requests = [];
    const fetch = async (url, init) => {
      requests.push({ path: new URL(url).pathname, token: init.headers["X-Preview-Token"] ?? null });
      if (url.endsWith("/preview")) return { ok: true, json: async () => ({ data: { theme: null, draft: true } }) };
      return { ok: true, json: async () => ({ data: page }) };
    };
    return { page: await loadModule("lib/store-api.ts", { fetch, cookie }).getPage("promo"), requests };
  };
  const builder = {
    slug: "promo", title: "Promo", format: "builder", layout: "blank", content: "", document: null,
    sections: [
      { id: "section-0", type: "hero", settings: { title: "Diskon 50%" }, style: { background: "dark", anchor: "atas" } },
      { id: "section-1", type: "script", settings: {} },
    ],
  };

  const visitor = await load(undefined, builder);
  assert.deepEqual(visitor.requests, [{ path: "/api/pages/promo", token: null }]);
  assert.equal(visitor.page.format, "builder");
  assert.equal(visitor.page.layout, "blank");
  assert.deepEqual(visitor.page.sections.map((section) => [section.type, section.style.background, section.style.anchor]), [["hero", "dark", "atas"]]);

  const owner = await load(TOKEN, builder);
  assert.deepEqual(owner.requests, [{ path: "/api/preview", token: TOKEN }, { path: "/api/pages/promo", token: TOKEN }]);

  // Halaman teks: tanpa bagian.
  const rich = await load(undefined, { slug: "promo", title: "Promo", format: "rich", layout: "blank", content: "<p>x</p>", sections: null });
  assert.equal(rich.page.format, "rich");
  assert.equal(rich.page.layout, "store");
  assert.equal(rich.page.sections, null);
});
