import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Tema (themes/<nama>/…) hanya boleh memakai SDK @sellosy/theme: tidak membaca cookie, token,
  // atau API toko sendiri, dan tidak merender HTML mentah. Lihat sdk/README.md.
  {
    files: ["themes/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/*"], message: "Tema hanya boleh mengimpor dari @sellosy/theme." },
          { group: ["../*"], message: "Tema tidak boleh mengimpor file di luar foldernya." },
          { group: ["next/headers", "next/server", "next/cache", "@tanstack/*"], message: "Data dan cache diurus platform; pakai props dan hook dari @sellosy/theme." },
        ],
      }],
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
