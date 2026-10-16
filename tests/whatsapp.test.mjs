import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Modul lib/ dimuat sungguhan; react, next/headers, dan fetch diganti supaya getProduct bisa dites.
function loadModule(file, fetch = () => {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports, fetch, URL, URLSearchParams, AbortSignal, Headers,
    process: { env: { STORE_API_URL: "http://backend.test/api", STORE_ID: "404" } },
    require: (name) => {
      if (name === "react") return { cache: (callback) => callback };
      if (name === "next/headers") return { headers: async () => new Headers({ host: "kopi-senja.sellosy.test" }) };
      if (name.startsWith("./")) return loadModule(new URL(`${name}.ts`, new URL(file, import.meta.url)).href, fetch);
      return {};
    },
  });
  return exports;
}

const { readWhatsapp, whatsappChatUrl } = loadModule("../lib/whatsapp.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const input = { number: "6281234567890", storeName: "Kopi Senja", productName: "Kopi Arabika", productUrl: "https://kopisenja.id/products/kopi-arabika" };
const message = (url) => new URL(url).searchParams.get("text");

test("the chat link goes to wa.me with the number as given and an encoded Indonesian message", () => {
  const url = whatsappChatUrl(input);
  assert.ok(url.startsWith("https://wa.me/6281234567890?text="));
  assert.equal(message(url), "Halo Kopi Senja, saya ingin bertanya tentang Kopi Arabika.\nhttps://kopisenja.id/products/kopi-arabika");
  // Spasi, baris baru, dan URL di dalam pesan ter-encode, jadi tidak memecah query wa.me.
  assert.ok(url.includes("%0Ahttps%3A%2F%2Fkopisenja.id%2Fproducts%2Fkopi-arabika"));
  assert.ok(!/[ \n]/.test(url));
});

test("the selected variant is added in parentheses; none or blank leaves it out", () => {
  assert.equal(message(whatsappChatUrl({ ...input, variantLabel: "Biji, 250 g" })),
    "Halo Kopi Senja, saya ingin bertanya tentang Kopi Arabika (Biji, 250 g).\nhttps://kopisenja.id/products/kopi-arabika");
  for (const variantLabel of [undefined, null, "", "  "]) {
    assert.equal(message(whatsappChatUrl({ ...input, variantLabel })), message(whatsappChatUrl(input)));
  }
});

test("characters that mean something in a URL stay inside the message", () => {
  const url = whatsappChatUrl({ ...input, storeName: "Toko A&B", productName: "Kaos #1 100%?", variantLabel: "M/L" });
  assert.equal(new URL(url).searchParams.size, 1);
  assert.equal(message(url), "Halo Toko A&B, saya ingin bertanya tentang Kaos #1 100%? (M/L).\nhttps://kopisenja.id/products/kopi-arabika");
});

test("only a digits-only number of 8 to 15 characters is read", () => {
  assert.deepEqual(plain(readWhatsapp({ number: "6281234567890" })), { number: "6281234567890" });
  assert.deepEqual(plain(readWhatsapp({ number: "12345678" })), { number: "12345678" });
  assert.deepEqual(plain(readWhatsapp({ number: "123456789012345" })), { number: "123456789012345" });
  for (const number of ["+6281234567890", "0812-3456-7890", "1234567", "1234567890123456", "62812abc", "", 6281234567890, null]) {
    assert.equal(readWhatsapp({ number }), null, String(number));
  }
  for (const value of [undefined, null, false, "6281234567890", [], {}]) assert.equal(readWhatsapp(value), null);
});

test("product detail carries a valid whatsapp number and null when it is missing or broken", async () => {
  let whatsapp;
  const { getProduct } = loadModule("../lib/store-api.ts", async () => Response.json({
    data: { id: 1, slug: "kopi", name: "Kopi", status: "published", deleted_at: null, ...(whatsapp === undefined ? {} : { whatsapp }) },
  }));
  whatsapp = { number: "6281234567890" };
  assert.deepEqual(plain((await getProduct("kopi")).whatsapp), { number: "6281234567890" });
  whatsapp = { number: "08123<script>" };
  assert.equal((await getProduct("kopi")).whatsapp, null);
  whatsapp = null;
  assert.equal((await getProduct("kopi")).whatsapp, null);
  // Backend lama tanpa field ini: tanpa tombol.
  whatsapp = undefined;
  assert.equal((await getProduct("kopi")).whatsapp, null);
});
