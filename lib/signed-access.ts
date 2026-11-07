/**
 * Link bertanda tangan dari email (InvoiceLink dan ReviewLink di backend): /invoice/{id} dan /review/{id} dengan
 * `?expires=…&signature=…`. Siapa pun yang memegang URL lengkapnya bisa membuka halamannya, jadi proxy.ts
 * memindahkan tanda tangannya ke cookie HttpOnly yang hanya berlaku untuk path halaman itu lalu mengalihkan ke URL
 * tanpa query. Tanda tangan tidak tertinggal di address bar, riwayat, atau URL yang dicatat script analytics plugin.
 * Modul ini tanpa impor server supaya bisa dipakai proxy.
 */
export const SIGNED_ACCESS_COOKIE = "signed_access";

export type SignedAccess = { expires: string; signature: string };

const SIGNED_PAGE = /^\/(invoice|review)\/\d{1,10}$/;

/** Cookie paling lama setahun lebih sedikit, sesuai masa berlaku link invoice. */
const MAX_AGE = 60 * 60 * 24 * 366;

/** Halaman yang dibuka lewat link bertanda tangan (path-nya juga path cookie), atau null. */
export function signedPage(pathname: string): string | null {
  return SIGNED_PAGE.test(pathname) ? pathname : null;
}

/** expires dan signature yang berbentuk wajar, atau null. */
export function readSignedAccess(expires: unknown, signature: unknown): SignedAccess | null {
  return typeof expires === "string" && typeof signature === "string" && /^\d{1,12}$/.test(expires) && /^[a-f0-9]{64}$/.test(signature)
    ? { expires, signature }
    : null;
}

export function signedAccessCookie(access: SignedAccess): string {
  return `${access.expires}.${access.signature}`;
}

export function readSignedAccessCookie(value: string | undefined): SignedAccess | null {
  const parts = (value ?? "").split(".");
  return parts.length === 2 ? readSignedAccess(parts[0], parts[1]) : null;
}

/** Detik sampai link kedaluwarsa (0 bila sudah lewat), paling lama MAX_AGE. */
export function signedAccessMaxAge(access: SignedAccess, now = Date.now()): number {
  return Math.max(0, Math.min(MAX_AGE, Number(access.expires) - Math.floor(now / 1000)));
}
