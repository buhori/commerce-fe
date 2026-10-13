import type { NextConfig } from "next";

// Storefront multi-toko: {toko}.STORE_ROOT_DOMAIN (lokal: sellosy.test lewat bin/local-domains di repo Laravel).
const rootDomain = process.env.STORE_ROOT_DOMAIN;

const nextConfig: NextConfig = {
  // Dev server menolak origin selain localhost kecuali didaftarkan di sini.
  allowedDevOrigins: rootDomain ? [rootDomain, `*.${rootDomain}`] : [],
};

export default nextConfig;
