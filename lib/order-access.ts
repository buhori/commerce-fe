/**
 * Link "Bayar Sekarang" dari WhatsApp (chat.sellosy.com/payment/{id}?token=…) dibuka di browser WhatsApp, yang
 * tidak membawa guest token checkout. proxy.ts menyimpan tokennya di cookie ini, dan lib/api-proxy.ts
 * mengirimnya ke backend di ORDER_ACCESS_HEADER; backend hanya membuka pesanan yang tokennya cocok
 * (App\Support\ChatLink).
 */
export const ORDER_ACCESS_COOKIE = "order_access";

export const ORDER_ACCESS_HEADER = "X-Order-Access";

/** Pesanan yang diingat per browser; yang paling lama dibuang. */
const MAX_ENTRIES = 10;

/** Satu entri: nomor pesanan dan token HMAC dari backend. */
const ENTRY = /^(\d{1,10})\.([a-f0-9]{32})$/;

function entries(cookie: string | undefined): string[] {
  return (cookie ?? "").split("-").filter((entry) => ENTRY.test(entry));
}

/** Isi cookie baru setelah membuka link bayar pesanan ini (null bila nomor atau tokennya tidak berbentuk benar). */
export function rememberOrderAccess(cookie: string | undefined, orderId: string, token: string): string | null {
  const entry = `${orderId}.${token}`;
  if (!ENTRY.test(entry)) return null;
  const others = entries(cookie).filter((existing) => !existing.startsWith(`${orderId}.`));
  return [...others, entry].slice(-MAX_ENTRIES).join("-");
}

/** Nilai header untuk backend: entri dipisah spasi, atau null bila tidak ada. */
export function orderAccessHeader(cookie: string | undefined): string | null {
  const list = entries(cookie);
  return list.length ? list.join(" ") : null;
}
