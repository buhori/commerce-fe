import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL("../themes/registry.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports },
);
const { resolveTheme, themes } = exports;

test("registered store theme takes precedence over deployment fallback", () => {
  for (const theme of Object.keys(themes)) {
    assert.equal(resolveTheme(theme, "minimal"), theme);
  }
});

test("absent or malformed store settings fall back safely", () => {
  for (const value of [undefined, null, "", "unknown", {}, ["boutique"], 404]) {
    assert.equal(resolveTheme(value, "boutique"), "boutique");
    assert.equal(resolveTheme(value, "invalid"), "natural");
  }
});

test("prototype keys and paths cannot select unregistered themes", () => {
  for (const value of ["__proto__", "constructor", "toString", "../minimal"]) {
    assert.equal(resolveTheme(value, value), "natural");
  }
});
