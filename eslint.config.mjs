import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Impor terlarang untuk tema; `escape` adalah pola relatif yang keluar dari folder tema dari kedalaman file itu.
const themeImports = (escape) => ["error", {
  patterns: [
    { group: ["@/*"], message: "Tema hanya boleh mengimpor dari @sellosy/theme." },
    { group: [escape], message: "Tema tidak boleh mengimpor file di luar foldernya." },
    { group: ["next/headers", "next/server", "next/cache", "@tanstack/*"], message: "Data dan cache diurus platform; pakai props dan hook dari @sellosy/theme." },
  ],
}];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Tema (themes/<nama>/…) hanya boleh memakai SDK @sellosy/theme: tidak membaca cookie, token,
  // atau API toko sendiri, dan tidak merender HTML mentah. Lihat sdk/README.md.
  {
    files: ["themes/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": themeImports("../*"),
      "no-restricted-globals": ["error",
        { name: "fetch", message: "Tema tidak memanggil API; data datang lewat props." },
        { name: "XMLHttpRequest", message: "Tema tidak memanggil API; data datang lewat props." },
        { name: "WebSocket", message: "Tema tidak membuka koneksi sendiri." },
        { name: "localStorage", message: "Tema tidak menyimpan data pembeli." },
        { name: "sessionStorage", message: "Tema tidak menyimpan data pembeli." },
        { name: "eval", message: "Tidak diizinkan." },
      ],
      "no-restricted-properties": ["error",
        { object: "document", property: "cookie", message: "Tema tidak membaca cookie." },
        { object: "window", property: "fetch", message: "Tema tidak memanggil API; data datang lewat props." },
      ],
      "react/no-danger": "error",
    },
  },
  // Subfolder tema (mis. themes/<nama>/src/features/…) boleh mengimpor apa pun di dalam temanya sendiri:
  // per kedalaman, yang dilarang hanya "../" sebanyak yang keluar dari themes/<nama>/.
  ...Array.from({ length: 8 }, (_, depth) => ({
    files: [`themes/*/${"*/".repeat(depth + 1)}*.{ts,tsx}`],
    rules: { "no-restricted-imports": themeImports(`${"../".repeat(depth + 2)}*`) },
  })),
  // Kode tema yang diport apa adanya dari template (themes/<nama>/src/): aturan saran React Compiler dimatikan supaya
  // pola aslinya (ref saat render, setState di effect) tidak harus ditulis ulang. Aturan keamanan tema di atas tetap berlaku.
  {
    files: ["themes/*/src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
