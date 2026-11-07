import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/signed-access.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { signedPage, readSignedAccess, signedAccessCookie, readSignedAccessCookie, signedAccessMaxAge } = exports;

const signature = "a".repeat(64);

test("only invoice and review pages opened from email links are signed pages", () => {
  assert.equal(signedPage("/invoice/898662670"), "/invoice/898662670");
  assert.equal(signedPage("/review/12"), "/review/12");
  assert.equal(signedPage("/payment/12"), null);
  assert.equal(signedPage("/invoice/12/extra"), null);
  assert.equal(signedPage("/invoice/abc"), null);
});

test("the signature survives the round trip through the cookie, and malformed values are refused", () => {
  const access = readSignedAccess("1893456000", signature);
  assert.deepEqual({ ...access }, { expires: "1893456000", signature });
  assert.deepEqual({ ...readSignedAccessCookie(signedAccessCookie(access)) }, { ...access });

  assert.equal(readSignedAccess("1893456000", "A".repeat(64)), null);
  assert.equal(readSignedAccess("soon", signature), null);
  assert.equal(readSignedAccess(["1893456000"], signature), null);
  assert.equal(readSignedAccessCookie(undefined), null);
  assert.equal(readSignedAccessCookie("1893456000"), null);
  assert.equal(readSignedAccessCookie(`1893456000.${signature}.extra`), null);
});

test("the cookie lasts until the link expires, at most a little over a year", () => {
  const now = Date.UTC(2026, 10, 7);
  const inSeconds = (seconds) => ({ expires: String(Math.floor(now / 1000) + seconds), signature });

  assert.equal(signedAccessMaxAge(inSeconds(3600), now), 3600);
  assert.equal(signedAccessMaxAge(inSeconds(-10), now), 0);
  assert.equal(signedAccessMaxAge(inSeconds(60 * 60 * 24 * 900), now), 60 * 60 * 24 * 366);
});
