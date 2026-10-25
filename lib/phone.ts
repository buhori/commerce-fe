/**
 * Nomor telepon dengan kode negara, sama dengan aturan backend (App\Support\Phone). Toko yang belum
 * mengisi kode negara dianggap Indonesia (62).
 *
 * - "+44 20 7946 0958" sudah lengkap;
 * - "081234567890" → 0 di depan diganti kode negara: +6281234567890;
 * - "6281234567890" sudah berawalan kode negara;
 * - "81234567890" → kode negara ditambahkan di depan.
 */
export const DEFAULT_COUNTRY_CODE = "62";

const digitsOf = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value).replace(/\D/g, "") : "");

/** Format E.164 untuk tautan tel: dan data terstruktur, mis. "+6288212580147"; null bila tidak masuk akal. */
export function e164(countryCode: unknown, phone: unknown): string | null {
  if (typeof phone !== "string" && typeof phone !== "number") return null;
  const raw = String(phone).trim();
  const digits = digitsOf(raw);
  const code = digitsOf(countryCode) || DEFAULT_COUNTRY_CODE;
  if (!digits) return null;

  const full = raw.startsWith("+") ? digits
    : digits.startsWith("0") ? `${code}${digits.replace(/^0+/, "")}`
    : digits.startsWith(code) ? digits
    : `${code}${digits}`;

  return /^[1-9]\d{7,14}$/.test(full) ? `+${full}` : null;
}

/**
 * Untuk ditampilkan, mis. "+62 882-1258-0147": kode negara, lalu nomor lokal (nomor Indonesia per
 * 3-4-4 digit). Nomor yang tidak masuk akal ditampilkan apa adanya supaya tidak hilang.
 */
export function displayPhone(countryCode: unknown, phone: unknown): string | null {
  const full = e164(countryCode, phone);
  if (!full) return typeof phone === "string" && phone.trim() ? phone.trim() : null;

  const code = digitsOf(countryCode) || DEFAULT_COUNTRY_CODE;
  const digits = full.slice(1);
  // Nomor dengan kode negara lain dari kode toko (mis. "+65…" di toko Indonesia): cukup E.164.
  if (!digits.startsWith(code)) return full;

  const local = digits.slice(code.length);
  if (code !== DEFAULT_COUNTRY_CODE) return `+${code} ${local}`;

  return `+${code} ${[local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(Boolean).join("-")}`;
}
