import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const exports = {};
vm.runInNewContext(
  ts.transpileModule(source("lib/store-style.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports },
);
const {
  STORE_FONT_KEYS, STORE_FONT_VARIABLES, THEME_COLORS, contrast, hexToRgb, isDark, luminance, mix, readStoreStyle, readableOn,
  rgbToHex, storeStyleCss, storeStyleTokens,
} = exports;

const plain = (value) => JSON.parse(JSON.stringify(value));
const style = (colors = {}, fonts = {}) => ({
  colors: { primary: null, background: null, text: null, accent: null, ...colors },
  fonts: { heading: null, body: null, ...fonts },
});

test("a missing, null, or empty style keeps the theme as it is", () => {
  for (const value of [undefined, null, "", "#fff", [], {}, { colors: null, fonts: null }, style()]) {
    assert.equal(readStoreStyle(value), null);
  }
  for (const theme of ["natural", "minimal", "boutique", "editorial", "unknown"]) {
    assert.equal(storeStyleCss(null, theme), "");
    assert.equal(storeStyleCss(style(), theme), "");
    assert.deepEqual(plain(storeStyleTokens(null, theme)), {});
  }
});

test("only #rrggbb colours are accepted, normalised to lower case", () => {
  const parsed = readStoreStyle({
    colors: { primary: "#1A2B3C", background: "#fff", text: "red", accent: "#12345g" },
    fonts: { heading: "inter", body: null },
  });
  assert.deepEqual(plain(parsed), style({ primary: "#1a2b3c" }, { heading: "inter" }));
  for (const bad of ["#ffffff;}", " #ffffff", "#ffffff ", "ffffff", "#fffffff", "#ffff", 0xffffff, "rgb(0 0 0)", "#ffffff</style>"]) {
    assert.equal(readStoreStyle({ colors: { primary: bad } }), null, String(bad));
  }
});

test("only the curated fonts are accepted", () => {
  assert.equal(STORE_FONT_KEYS.length, 10);
  for (const key of STORE_FONT_KEYS) {
    assert.equal(readStoreStyle({ fonts: { body: key } }).fonts.body, key);
    assert.ok(STORE_FONT_VARIABLES[key].startsWith("--font-"));
  }
  for (const bad of ["Inter", "comic-sans", "constructor", "__proto__", "inter;}", 1, {}]) {
    assert.equal(readStoreStyle({ fonts: { heading: bad } }), null, String(bad));
  }
});

test("colour helpers follow WCAG", () => {
  assert.deepEqual(plain(hexToRgb("#0a80ff")), [10, 128, 255]);
  assert.equal(rgbToHex([10, 128, 255]), "#0a80ff");
  assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
  assert.equal(luminance("#ffffff"), 1);
  assert.equal(luminance("#000000"), 0);
  assert.equal(contrast("#ffffff", "#000000"), 21);
  assert.equal(contrast("#000000", "#ffffff"), 21);
  assert.ok(isDark("#1d1b18"));
  assert.ok(!isDark("#fdfcfb"));
  assert.ok(!isDark("#f5c400"));
});

test("text on primary buttons is white or near-black, whichever is readable", () => {
  assert.equal(readableOn("#2e4038"), "#ffffff");
  assert.equal(readableOn("#1d4ed8"), "#ffffff");
  assert.equal(readableOn("#f5c400"), "#111111");
  assert.equal(readableOn("#ffffff"), "#111111");
  // Semua warna isi (sampel acak + warna tengah tersulit) tetap terbaca minimal 4.5:1.
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const samples = ["#777777", "#767676", "#808080", "#ff0000", "#00ff00", "#0000ff", "#e11d48", "#f97316", "#14b8a6"];
  for (let i = 0; i < 500; i++) samples.push(rgbToHex([random() * 255, random() * 255, random() * 255]));
  for (const color of samples) {
    assert.ok(contrast(readableOn(color), color) >= 4.5, color);
  }

  const tokens = storeStyleTokens(style({ primary: "#f5c400" }), "natural");
  assert.equal(tokens["--primary"], "#f5c400");
  assert.equal(tokens["--on-primary"], "#111111");
  assert.ok(contrast(tokens["--on-primary-hover"], tokens["--primary-hover"]) >= 4.5);
  // Hanya warna utama yang berubah: latar dan teks tetap milik tema.
  assert.equal(tokens["--page"], undefined);
  assert.equal(tokens["--text"], undefined);
});

test("primary hover is derived from primary, or is the accent when given", () => {
  const derived = storeStyleTokens(style({ primary: "#2563eb" }), "minimal");
  assert.notEqual(derived["--primary-hover"], "#2563eb");
  assert.ok(luminance(derived["--primary-hover"]) < luminance("#2563eb"));
  // Hampir hitam tidak bisa lebih gelap lagi: hover sedikit lebih terang.
  const black = storeStyleTokens(style({ primary: "#050505" }), "minimal");
  assert.ok(luminance(black["--primary-hover"]) > luminance("#050505"));

  const accented = storeStyleTokens(style({ primary: "#2563eb", accent: "#fde047" }), "natural");
  assert.equal(accented["--primary-hover"], "#fde047");
  assert.equal(accented["--accent"], "#fde047");
  assert.equal(accented["--on-primary"], "#ffffff");
  assert.equal(accented["--on-primary-hover"], "#111111");

  // Aksen terang tetap dipakai apa adanya untuk isi tombol, tetapi sebagai teks digeser sampai terbaca.
  const page = THEME_COLORS.natural.page;
  assert.notEqual(accented["--accent-text"], "#fde047");
  assert.ok(contrast(accented["--accent-text"], page) >= 4.5);
  assert.equal(storeStyleTokens(style({ accent: "#9a3412" }), "natural")["--accent-text"], "#9a3412");
  const darkEditorial = storeStyleTokens(style({ background: "#14161a" }), "editorial");
  assert.ok(contrast(darkEditorial["--accent-text"], "#14161a") >= 4.5);

  // Editorial: hover tombolnya memakai accent tema, jadi warna utama baru tidak mengubahnya.
  const editorial = storeStyleTokens(style({ primary: "#2563eb" }), "editorial");
  assert.equal(editorial["--primary-hover"], THEME_COLORS.editorial.accent);
  assert.equal(editorial["--ink"], "#2563eb");
  // --text Editorial adalah var(--ink): teks dipertahankan supaya tidak ikut biru.
  assert.equal(editorial["--text"], THEME_COLORS.editorial.text);
});

test("a light background gets slightly darker surfaces and readable muted text", () => {
  const tokens = storeStyleTokens(style({ background: "#fff7ed" }), "natural");
  const page = tokens["--page"];
  assert.equal(page, "#fff7ed");
  assert.equal(tokens["--text"], THEME_COLORS.natural.text, "theme text stays when it is readable");
  for (const name of ["--canvas", "--surface", "--surface-hover", "--line", "--line-strong"]) {
    assert.ok(luminance(tokens[name]) < luminance(page), name);
  }
  assert.ok(luminance(tokens["--surface"]) > luminance(tokens["--surface-hover"]));
  assert.ok(luminance(tokens["--line"]) > luminance(tokens["--line-strong"]));
  assert.ok(contrast(tokens["--muted"], page) >= 4.5);
  assert.ok(contrast(tokens["--text-soft"], page) >= 4.5);
  assert.equal(tokens["--glass-rgb"], "255 247 237");
  assert.equal(tokens["color-scheme"], undefined);
  assert.equal(tokens["--on-text"], "#ffffff");
});

test("a dark background flips surfaces lighter and picks light text automatically", () => {
  for (const theme of ["natural", "minimal", "boutique", "editorial"]) {
    const tokens = storeStyleTokens(style({ background: "#14161a" }), theme);
    const page = tokens["--page"];
    assert.ok(isDark(tokens["--text"]) === false, theme);
    assert.ok(contrast(tokens["--text"], page) >= 7, theme);
    for (const name of ["--canvas", "--surface", "--surface-hover", "--line", "--line-strong"]) {
      assert.ok(luminance(tokens[name]) > luminance(page), `${theme} ${name}`);
    }
    for (const name of ["--muted", "--text-soft", "--text-softer"]) {
      assert.ok(contrast(tokens[name], page) >= 4.5, `${theme} ${name}`);
    }
    assert.ok(contrast(tokens["--on-text"], tokens["--text"]) >= 4.5, theme);
    assert.equal(tokens["color-scheme"], "dark");
  }
  // Editorial: teks di atas --ink (topbar, tombol, footer) tetap terbaca di latar gelap.
  const editorial = storeStyleTokens(style({ background: "#14161a" }), "editorial");
  assert.ok(contrast(editorial["--on-ink"], THEME_COLORS.editorial.primary) >= 4.5);
  assert.ok(contrast(editorial["--ed-on-ink-muted"], THEME_COLORS.editorial.primary) >= 4.5);
  assert.ok(contrast(editorial["--ed-on-ink-soft"], THEME_COLORS.editorial.primary) >= 4.5);
});

test("explicit text colour wins and muted text follows text and background", () => {
  const tokens = storeStyleTokens(style({ background: "#0f172a", text: "#fef3c7" }), "boutique");
  assert.equal(tokens["--text"], "#fef3c7");
  assert.ok(contrast(tokens["--muted"], "#0f172a") >= 4.5);
  // Teks saja: latar tema dipakai untuk menurunkan teks redup.
  const textOnly = storeStyleTokens(style({ text: "#7c2d12" }), "boutique");
  assert.equal(textOnly["--page"], undefined);
  assert.ok(contrast(textOnly["--muted"], THEME_COLORS.boutique.page) >= 4.5);
});

test("editorial footer and buttons follow a light ink", () => {
  const tokens = storeStyleTokens(style({ primary: "#fde68a" }), "editorial");
  assert.equal(tokens["--on-ink"], "#111111");
  assert.equal(tokens["--ed-logo-filter"], "brightness(0)");
  assert.ok(contrast(tokens["--ed-on-ink-muted"], "#fde68a") >= 4.5);
  assert.equal(storeStyleTokens(style({ primary: "#1e3a8a" }), "editorial")["--ed-logo-filter"], undefined);
});

test("fonts override heading/body variables with a matching fallback", () => {
  const tokens = storeStyleTokens(style({}, { heading: "playfair-display", body: "dm-sans" }), "boutique");
  assert.equal(tokens["--font-heading"], 'var(--font-store-playfair-display), Georgia, "Times New Roman", serif');
  assert.equal(tokens["--font-body"], 'var(--font-store-dm-sans), system-ui, -apple-system, "Segoe UI", sans-serif');
  assert.equal(tokens["--ed-serif"], undefined);
  assert.equal(tokens["--primary"], undefined);

  const editorial = storeStyleTokens(style({}, { heading: "fraunces", body: "plus-jakarta-sans" }), "editorial");
  assert.equal(editorial["--ed-serif"], "var(--font-fraunces)");
  assert.equal(editorial["--ed-sans"], "var(--font-jakarta)");
});

test("CSS output is one rule on html with validated values only", () => {
  const css = storeStyleCss(style({ primary: "#2E4038", background: "#000000" }, { heading: "lora" }), "natural");
  assert.match(css, /^html:root\[data-theme\]\{[^{}]+\}$/);
  assert.match(css, /--primary:#2e4038;/);
  assert.match(css, /color-scheme:dark;/);
  assert.match(css, /--font-heading:var\(--font-store-lora\), Georgia, "Times New Roman", serif;/);
  assert.doesNotMatch(css, /[<>]/);

  // Objek palsu yang melewati readStoreStyle tetap tidak bisa menyisipkan CSS atau menutup </style>.
  const forged = {
    colors: { primary: "#000000;}</style><script>alert(1)</script>", background: "red", text: "#fff}", accent: "url(x)" },
    fonts: { heading: "x;}</style>", body: "__proto__" },
  };
  assert.equal(storeStyleCss(forged, "natural"), "");
});

test("theme defaults used for derivation match the theme stylesheets", () => {
  const value = (css, name) => css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1].toLowerCase();
  const globals = source("app/globals.css");
  const natural = source("themes/natural/styles.css");
  assert.deepEqual(plain(THEME_COLORS.natural), { primary: value(natural, "--primary"), page: value(globals, "--page"), text: value(globals, "--text"), accent: null });
  for (const theme of ["minimal", "boutique"]) {
    const css = source(`themes/${theme}/styles.css`);
    assert.deepEqual(plain(THEME_COLORS[theme]), { primary: value(css, "--primary"), page: value(css, "--page"), text: value(css, "--text"), accent: null }, theme);
  }
  const editorial = source("themes/editorial/styles.css");
  assert.deepEqual(plain(THEME_COLORS.editorial), {
    primary: value(editorial, "--ink"), page: value(editorial, "--page"), text: value(editorial, "--ink"), accent: value(editorial, "--accent"),
  });
});

test("next/font variables match the CSS variables the style refers to", () => {
  const fonts = source("lib/store-fonts.ts").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  for (const variable of Object.values(STORE_FONT_VARIABLES)) {
    assert.match(fonts, new RegExp(`variable: "${variable}"`), variable);
  }
  // Font yang hanya dipakai bila dipilih tidak di-preload.
  assert.equal((fonts.match(/preload: false/g) ?? []).length, 9);
});

// store-api dimuat sungguhan (seperti catalog.test.mjs) dengan header/cookie request dan fetch palsu.
function loadStoreApi(file, { fetch, header = {}, cookie }) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, fetch, URL, URLSearchParams, AbortSignal, Headers,
    process: { env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" } },
    require: (name) => {
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/headers") {
        return {
          headers: async () => new Headers({ host: "toko.sellosy.test", ...header }),
          cookies: async () => ({ get: (key) => (key === "preview_token" && cookie ? { value: cookie } : undefined) }),
        };
      }
      if (name === "@/themes/registry") return loadStoreApi("themes/registry.ts", { fetch });
      if (name.startsWith("./")) return loadStoreApi(`lib/${name.slice(2)}.ts`, { fetch, header, cookie });
      return {};
    },
  });
  return exports;
}

const TOKEN = `${"a".repeat(24)}.${"b".repeat(43)}`;
const STYLE = { colors: { primary: "#123456", background: null, text: null, accent: null }, fonts: { heading: "lora", body: null } };

async function storeRequests(options, previewValid = true) {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ path: new URL(url).pathname, token: init.headers["X-Preview-Token"] ?? null });
    if (url.endsWith("/preview")) return previewValid ? { ok: true, json: async () => ({ data: { theme: null, draft: true } }) } : { ok: false, status: 403 };
    return { ok: true, json: async () => ({ name: "Toko", style: STYLE }) };
  };
  const store = await loadStoreApi("lib/store-api.ts", { fetch, ...options }).getStore();
  return { store, requests };
}

test("getStore parses style and sends the preview token only for a verified preview", async () => {
  const visitor = await storeRequests({});
  assert.deepEqual(plain(visitor.store.style), STYLE);
  assert.deepEqual(visitor.requests, [{ path: "/api/store", token: null }]);

  // Iframe builder (header dari proxy.ts) dan tab pratinjau (cookie): /store memakai token yang sama.
  for (const options of [{ header: { "x-sellosy-preview": TOKEN } }, { cookie: TOKEN }]) {
    const { requests } = await storeRequests(options);
    assert.deepEqual(requests, [{ path: "/api/preview", token: TOKEN }, { path: "/api/store", token: TOKEN }]);
  }

  // Token kedaluwarsa atau palsu: gaya yang tayang, tanpa token.
  const expired = await storeRequests({ cookie: TOKEN }, false);
  assert.deepEqual(expired.requests.at(-1), { path: "/api/store", token: null });
  const malformed = await storeRequests({ cookie: "not-a-token" });
  assert.deepEqual(malformed.requests, [{ path: "/api/store", token: null }]);

  const old = await loadStoreApi("lib/store-api.ts", { fetch: async () => ({ ok: true, json: async () => ({ name: "Toko" }) }) }).getStore();
  assert.equal(old.style, null);
});
