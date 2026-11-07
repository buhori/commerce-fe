import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/order-access.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { rememberOrderAccess, orderAccessHeader } = exports;

const token = (digit) => digit.repeat(32);

test("opening a WhatsApp payment link remembers that order, replacing an older token for it", () => {
  const first = rememberOrderAccess(undefined, "1455775318", token("a"));
  assert.equal(first, `1455775318.${token("a")}`);

  const second = rememberOrderAccess(first, "1736457324", token("b"));
  assert.equal(orderAccessHeader(second), `1455775318.${token("a")} 1736457324.${token("b")}`);

  assert.equal(orderAccessHeader(rememberOrderAccess(second, "1455775318", token("c"))), `1736457324.${token("b")} 1455775318.${token("c")}`);
});

test("malformed numbers or tokens are not stored, and tampered cookies are ignored", () => {
  assert.equal(rememberOrderAccess(undefined, "abc", token("a")), null);
  assert.equal(rememberOrderAccess(undefined, "1455775318", "not-a-token"), null);
  assert.equal(orderAccessHeader("1455775318.zz-<script>-"), null);
  assert.equal(orderAccessHeader(undefined), null);
});

test("only the ten most recent orders are kept", () => {
  let cookie;
  for (let id = 1; id <= 12; id++) cookie = rememberOrderAccess(cookie, String(id), token("d"));
  const header = orderAccessHeader(cookie).split(" ");
  assert.equal(header.length, 10);
  assert.equal(header[0], `3.${token("d")}`);
});
