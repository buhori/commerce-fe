import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const exports = {};
const source = ts.transpileModule(
  readFileSync(new URL("../components/ui/button.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } },
).outputText;
vm.runInNewContext(source, {
  exports,
  require: (name) => name === "next/link"
    ? { default: ({ children, ...props }) => createElement("a", { ...props, "data-client-navigation": true }, children) }
    : require(name),
});
const { Button, ButtonLink } = exports;
const render = (component, props, label) => renderToStaticMarkup(createElement(component, props, label));

test("action buttons do not submit forms unless explicitly configured to submit", () => {
  assert.match(render(Button, {}, "Tambah"), /type="button"/);
  assert.match(render(Button, { type: "submit", name: "action", value: "save" }, "Simpan"), /type="submit"/);
  const action = render(Button, { name: "action", value: "save" }, "Simpan");
  assert.match(action, /name="action"/);
  assert.match(action, /value="save"/);
});

test("button variants retain native disabled and accessibility attributes", () => {
  const html = render(Button, { variant: "secondary", size: "icon", disabled: true, "aria-label": "Foto berikutnya", "aria-controls": "gallery", className: "gallery-next" }, "+");
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-label="Foto berikutnya"/);
  assert.match(html, /aria-controls="gallery"/);
  assert.match(html, /class="button button-secondary button-icon gallery-next"/);
});

test("button links preserve client navigation and retry links perform document navigation", () => {
  const navigation = render(ButtonLink, { href: "/checkout", variant: "primary" }, "Checkout");
  assert.match(navigation, /href="\/checkout"/);
  assert.match(navigation, /data-client-navigation="true"/);
  assert.doesNotMatch(navigation, /<button/);

  const retry = render(ButtonLink, { href: "/?q=buku", reloadDocument: true, variant: "secondary" }, "Coba lagi");
  assert.match(retry, /href="\/\?q=buku"/);
  assert.doesNotMatch(retry, /data-client-navigation|reloadDocument|<button/);
});
