import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/phone.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { e164, displayPhone } = exports;

// Kasus yang sama dengan tests/Feature/PhoneFormatTest.php di backend.
const cases = [
  ["kode negara kosong (toko lama)", null, "88212580147", "+6288212580147", "+62 882-1258-0147"],
  ["0 di depan", "62", "081234567890", "+6281234567890", "+62 812-3456-7890"],
  ["sudah berawalan kode negara", "62", "6281234567890", "+6281234567890", "+62 812-3456-7890"],
  ["kode negara dengan tanda +", "+62", "0812 3456 7890", "+6281234567890", "+62 812-3456-7890"],
  ["nomor luar negeri lengkap", "62", "+65 6123 4567", "+6561234567", "+6561234567"],
  ["kode negara lain", "65", "61234567", "+6561234567", "+65 61234567"],
  ["tidak masuk akal: tampil apa adanya", "62", "123", null, "123"],
];

for (const [name, code, phone, expected164, expectedDisplay] of cases) {
  test(`phone: ${name}`, () => {
    assert.equal(e164(code, phone), expected164);
    assert.equal(displayPhone(code, phone), expectedDisplay);
  });
}

test("no phone shows nothing", () => {
  assert.equal(e164("62", null), null);
  assert.equal(displayPhone("62", ""), null);
});
