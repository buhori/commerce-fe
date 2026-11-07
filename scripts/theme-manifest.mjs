#!/usr/bin/env node
/**
 * theme.json dari themes/<id>/manifest.ts (sdk/THEME-CONTRACT.md bagian 3): skema section dan preset tanpa
 * komponen, diperiksa dengan validateManifest() yang sama dengan backend.
 *
 *   node scripts/theme-manifest.mjs <id> [--out <path>]
 *
 * Ditulis ke themes/<id>/theme.json, dan juga ke --out (mis. documents/themes/<id>.json di repo Laravel, lalu
 * `php artisan themes:sync`). Modul manifest harus murni: hanya skema SDK dan modul .ts lokal, tanpa React atau
 * paket npm, supaya bisa dijalankan tanpa Next.js.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, ...rest] = process.argv.slice(2);
const outIndex = rest.indexOf("--out");
const out = outIndex >= 0 ? rest[outIndex + 1] : null;

if (!id || !/^[a-z][a-z0-9-]{0,39}$/.test(id)) {
  console.error("Pemakaian: node scripts/theme-manifest.mjs <id-tema> [--out <path>]");
  process.exit(1);
}

const modules = new Map();

function resolveFile(base) {
  for (const candidate of [base, `${base}.ts`, join(base, "index.ts")]) {
    if (existsSync(candidate) && candidate.endsWith(".ts")) return candidate;
  }
  return null;
}

/** CommonJS kecil untuk modul .ts murni; alias "@/…" dan "@sellosy/theme" (hanya skema). */
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const loaded = { exports: {} };
  modules.set(file, loaded);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const require = (name) => {
    const target = name === "@sellosy/theme" || name === "@sellosy/theme/schema"
      ? join(root, "sdk/schema.ts")
      : name.startsWith("@/") ? resolveFile(join(root, name.slice(2)))
        : name.startsWith(".") ? resolveFile(resolve(dirname(file), name))
          : null;
    if (!target) {
      throw new Error(`${file}: "${name}" tidak bisa dimuat. Manifest tema hanya boleh mengimpor skema SDK dan modul .ts lokal (tanpa React atau paket npm).`);
    }
    return load(target);
  };
  vm.runInThisContext(`(function (exports, require, module) {${source}\n})`, { filename: file })(loaded.exports, require, loaded);
  return loaded.exports;
}

const manifestFile = join(root, "themes", id, "manifest.ts");
if (!existsSync(manifestFile)) {
  console.error(`Tidak ada ${manifestFile}.`);
  process.exit(1);
}

try {
  const { buildManifest, validateManifest } = load(join(root, "sdk/schema.ts"));
  const source = load(manifestFile).manifest;
  if (!source) throw new Error(`${manifestFile} harus mengekspor \`manifest\`.`);

  const manifest = buildManifest(source);
  if (manifest.id !== id) throw new Error(`id manifest "${manifest.id}" berbeda dari folder tema "${id}".`);

  const errors = validateManifest(manifest);
  if (errors.length) {
    console.error(`Manifest ${id} tidak valid:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
    process.exit(1);
  }

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  const targets = [join(root, "themes", id, "theme.json"), ...(out ? [resolve(out)] : [])];
  for (const target of targets) writeFileSync(target, json);
  console.log(`${manifest.name} ${manifest.version}: ${Object.keys(manifest.sections).length} section, ${Object.keys(manifest.presets).length} preset → ${targets.join(", ")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
