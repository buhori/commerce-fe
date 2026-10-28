export interface Region {
  code: string;
  name: string;
}

export interface AddressDetails {
  id?: number;
  label?: string;
  address_code: string;
  address: string;
  recipent: string;
  contact: string | null;
  email?: string | null;
  // Kelurahan to province with postal code, e.g. "Sukamanah, Tanara, Kabupaten Serang, Banten 42194".
  region?: string | null;
}

export interface ShippingAddress extends AddressDetails {
  id: number;
  label: string;
}

/** Satu kurir + layanan dari /shipping/options, mis. JNE REG Rp26.000 · 1 hari. */
export interface ShippingOption {
  shipping_method_id: number;
  courier: string;
  courier_name: string;
  /** Logo kurir; null bila backend belum punya logonya. */
  courier_logo: string | null;
  // Null for the store's flat rate (no courier service).
  service: string | null;
  description: string | null;
  cost: number;
  etd: string | null;
}

export interface ShippingQuote {
  // Grams of the cart being shipped.
  weight: number;
  // True when the store's flat rates are used because live rates are unavailable.
  estimated: boolean;
  options: ShippingOption[];
}

export const shippingOptionKey = (option: Pick<ShippingOption, "shipping_method_id" | "service">) =>
  `${option.shipping_method_id}:${option.service ?? ""}`;

export const shippingOptionLabel = (option: Pick<ShippingOption, "courier_name" | "service">) =>
  option.service ? `${option.courier_name} ${option.service}` : option.courier_name;

/** A service whose delivery estimate reaches this many days is flagged as slow. */
export const SLOW_SHIPPING_DAYS = 7;

/**
 * Days in an estimate as written by the server: "Hari ini" => [0, 0], "2 hari" => [2, 2],
 * "1-2 hari" => [1, 2]; null when there is no estimate or it cannot be read.
 */
export function etdRange(etd: string | null): [number, number] | null {
  if (!etd) return null;
  if (/hari ini/i.test(etd)) return [0, 0];
  const days = etd.match(/\d+/g)?.map(Number);
  if (!days?.length) return null;
  return [Math.min(...days), Math.max(...days)];
}

export interface ShippingHighlights {
  cheapest: boolean;
  fastest: boolean;
  slow: boolean;
}

/**
 * Labels that help the buyer choose: the cheapest and fastest services (only when the options
 * actually differ) and services that take a long time. Keyed by shippingOptionKey.
 */
export function shippingHighlights(options: ShippingOption[]): Map<string, ShippingHighlights> {
  const costs = options.map((option) => option.cost);
  const minCost = Math.min(...costs);
  const costsDiffer = new Set(costs).size > 1;
  const ranges = options.map((option) => etdRange(option.etd));
  const known = ranges.filter((range): range is [number, number] => range !== null);
  // Fastest by the worst case, then by the best case: "1 hari" beats "1-2 hari".
  const best = known.reduce<[number, number] | null>((current, range) =>
    !current || range[1] < current[1] || (range[1] === current[1] && range[0] < current[0]) ? range : current, null);
  const speedsDiffer = known.length > 1 && new Set(known.map((range) => range.join("-"))).size > 1;

  return new Map(options.map((option, index) => {
    const range = ranges[index];
    return [shippingOptionKey(option), {
      cheapest: costsDiffer && option.cost === minCost,
      fastest: speedsDiffer && range !== null && best !== null && range[0] === best[0] && range[1] === best[1],
      slow: range !== null && range[1] >= SLOW_SHIPPING_DAYS,
    }];
  }));
}

export interface PaymentMethod {
  code: string;
  name: string;
  icon: string | null;
  /** Metode dari plugin payment gateway, mis. "payment-xendit:va_bca"; dibayar & dikonfirmasi otomatis. */
  online: boolean;
  /** Pengelompokan dari plugin: "bank_transfer" (virtual account), "qr", "ewallet", ...; null untuk metode toko. */
  group: string | null;
  /** Nama penyedia, mis. "Xendit Payment"; null untuk metode toko. */
  provider: string | null;
}

/** Satu bagian di daftar metode pembayaran; label null bila hanya ada metode toko. */
export interface PaymentMethodSection {
  key: string;
  label: string | null;
  methods: PaymentMethod[];
}

/**
 * Rekening tujuan yang dipilih sebelum pesanan dibuat: hanya bank dan logonya. Nomor rekening baru
 * tampil di halaman pembayaran bersama nominal berkode unik, supaya pembeli tidak mentransfer tanpa
 * kode unik (pesanannya tidak bisa dicocokkan otomatis).
 */
export interface BankChoice {
  id: number;
  bank: string;
  /** Logo bank/e-wallet; null bila backend belum punya logonya. */
  logo_url: string | null;
}

export interface BankAccount {
  id: number;
  bank: string;
  name: string;
  number: string;
  /** Logo bank/e-wallet; null bila backend belum punya logonya. */
  logo_url: string | null;
}

export interface OrderLine {
  /** ID barang pesanan (untuk ulasan); null di backend lama. */
  id: number | null;
  name: string;
  variant: string | null;
  amount: number;
  price: number;
  preorder_duration: number;
  image: string | null;
  /** Ulasan pembeli untuk barang ini; null bila belum diulas. */
  review: { rating: number; comment: string | null } | null;
}

/** Kupon yang sudah diperiksa backend (POST /checkout/coupon) terhadap isi keranjang saat itu. */
export interface AppliedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  /** Potongan rupiah untuk isi keranjang saat diperiksa. */
  discount: number;
  /** Kupon khusus satu produk; null bila berlaku untuk seluruh keranjang. */
  product_id: number | null;
  /** Sudah diformat backend, mis. "-10%"; kosong bila tidak dikirim. */
  label: string;
}

export interface OrderSummary {
  id: number;
  status: string;
  total: number;
  shipping_cost: number;
  /** Kode kupon yang dipakai; null bila tanpa kupon atau backend lama. */
  coupon_code: string | null;
  /** Potongan kupon dalam rupiah; sudah termasuk di grand_total. */
  discount_amount: number;
  // Added to the transfer amount so a manual payment can be matched to one order.
  unique_payment_code: number | null;
  grand_total: number;
  payment_method: string | null;
  // Display name managed by the store backend, so new methods need no frontend change.
  payment_method_name: string | null;
  bank_account: BankAccount | null;
  // Gambar QRIS statis milik toko; hanya terisi untuk pesanan QRIS.
  qris_image: string | null;
  shipping_method: string | null;
  /** Logo kurir pesanan; null bila backend belum punya logonya. */
  shipping_logo: string | null;
  // The file itself stays with the store; the buyer only learns that it arrived.
  proof_uploaded: boolean;
  sender_name: string | null;
  items: OrderLine[];
  // YYYY-MM-DD, set when the order contains pre-order items.
  preorder_ready_at: string | null;
  /**
   * Tagihan plugin payment gateway terbaru; null untuk pesanan yang dibayar manual. Bisa tetap
   * terisi (gagal/diganti) setelah pembeli pindah ke transfer/QRIS, lihat usesOnlinePayment.
   */
  online_payment: OnlinePayment | null;
  /** Untuk event store:purchase_completed: ID pesanan versi plugin dan barangnya; null di backend lama. */
  tracking: OrderTracking | null;
  /** Barang sudah sampai: pembeli bisa mengulasnya (lihat items[].review). */
  reviewable: boolean;
}

export interface OrderTracking {
  order_id: string;
  items: { product_id: number | null; variant_id: number | null; name: string | null; qty: number; price: number }[];
}

export type OnlinePaymentStatus = "pending" | "paid" | "failed" | "expired" | "needs_review";

/** Kode bayar atau nomor virtual account yang ditampilkan ke pembeli. */
export interface OnlinePaymentDisplay {
  kind: string | null;
  bank: string | null;
  account_number: string | null;
  account_name: string | null;
  payment_code: string | null;
  amount: number;
  instructions: string[];
}

/**
 * Langkah berikut untuk pembeli dari gateway. Hanya dipakai sebagai teks dan href, tidak pernah
 * sebagai HTML; URL yang tidak aman dibuang saat dibaca (lihat readOnlinePayment).
 */
export type OnlinePaymentAction =
  | { type: "redirect"; url: string }
  | { type: "display"; display: OnlinePaymentDisplay }
  | { type: "qr"; qr_string: string; amount: number }
  | { type: "deeplink"; mobile_url: string | null; desktop_url: string | null }
  | { type: "none" };

export interface OnlinePayment {
  public_id: string;
  method: string;
  method_label: string;
  provider: string | null;
  amount: number;
  currency: string;
  status: OnlinePaymentStatus;
  action: OnlinePaymentAction | null;
  /** Pesan untuk pembeli saat tagihan gagal atau kedaluwarsa. */
  error_message: string | null;
  paid_at: string | null;
  expires_at: string | null;
}


export const regionLevels = [
  { label: "Provinsi", length: 2 },
  { label: "Kabupaten / Kota", length: 5 },
  { label: "Kecamatan", length: 8 },
  { label: "Kelurahan / Desa", length: 13 },
] as const;

// Backend list endpoints answer either with a bare array or a { data } wrapper.
function readRows(data: unknown): unknown[] | null {
  const rows = Array.isArray(data) ? data : data && typeof data === "object" && "data" in data ? data.data : null;
  return Array.isArray(rows) ? rows : null;
}

export function readRegions(data: unknown, level: number, parent?: string): Region[] {
  const rows = readRows(data);
  if (!rows) throw new Error("Data wilayah belum dapat dibaca.");
  return rows.filter((row): row is Region => {
    const region = row as Partial<Region>;
    return Boolean(row) && typeof region.code === "string" && typeof region.name === "string" &&
      /^\d{2}(?:\.\d{2}(?:\.\d{2}(?:\.\d{4})?)?)?$/.test(region.code) &&
      region.code.length === regionLevels[level]?.length &&
      (!parent || region.code.startsWith(`${parent}.`));
  });
}

export function resetRegionChildren(regions: (Region | null)[], level: number, selected: Region | null) {
  return regions.map((region, index) => index < level ? region : index === level ? selected : null);
}

export function isShippingAddress(value: unknown): value is ShippingAddress {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ShippingAddress>;
  return Number.isSafeInteger(row.id) && Number(row.id) > 0 &&
    typeof row.label === "string" && typeof row.address === "string" &&
    typeof row.address_code === "string" && typeof row.recipent === "string" &&
    (row.contact == null || typeof row.contact === "string");
}

export function readAddresses(data: unknown): ShippingAddress[] {
  const rows = readRows(data);
  if (!rows || !rows.every(isShippingAddress)) throw new Error("Data alamat belum dapat dibaca.");
  return rows;
}

function isNamedMethod(value: unknown): value is { name: string; icon?: unknown } {
  return Boolean(value) && typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string" && (value as { name: string }).name.trim().length > 0;
}

export function readShippingQuote(data: unknown): ShippingQuote {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as Partial<ShippingQuote> | null;
  const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  const optional = (value: unknown) => value === null || value === undefined || typeof value === "string";
  if (!row || typeof row !== "object" || !money(row.weight) || !Array.isArray(row.options) || !row.options.every((option) => {
    const o = option as Partial<ShippingOption> | null;
    return Boolean(o) && typeof o === "object" &&
      Number.isSafeInteger(o!.shipping_method_id) && o!.shipping_method_id! > 0 &&
      text(o!.courier) && text(o!.courier_name) && money(o!.cost) &&
      optional(o!.service) && optional(o!.description) && optional(o!.etd);
  })) throw new Error("Pilihan pengiriman belum dapat dibaca.");
  return {
    weight: row.weight!,
    estimated: row.estimated === true,
    options: row.options.map((option) => ({
      shipping_method_id: option.shipping_method_id,
      courier: option.courier,
      courier_name: option.courier_name,
      courier_logo: readHttpUrl(option.courier_logo),
      service: option.service || null,
      description: option.description || null,
      cost: option.cost,
      etd: option.etd || null,
    })),
  };
}

export function readPaymentMethods(data: unknown): PaymentMethod[] {
  const rows = readRows(data);
  if (!rows || !rows.every((row): row is PaymentMethod =>
    isNamedMethod(row) && typeof (row as PaymentMethod).code === "string" && (row as PaymentMethod).code.trim().length > 0,
  )) throw new Error("Metode pembayaran belum dapat dibaca.");
  return rows.map((row) => {
    const online = (row as { online?: unknown }).online === true;
    return {
      code: row.code,
      name: row.name,
      // Logo penyedia dipakai sebagai src gambar, jadi hanya URL http(s) absolut.
      icon: online ? readHttpUrl(row.icon) : typeof row.icon === "string" ? row.icon : null,
      online,
      group: online ? readText(row.group) : null,
      provider: online ? readText(row.provider) : null,
    };
  });
}

// Urutan dan label kelompok metode online; kelompok lain digabung di "lainnya".
const onlineGroups: [string, string][] = [
  ["bank_transfer", "Virtual account"],
  ["qr", "QRIS"],
  ["ewallet", "E-wallet"],
  ["retail", "Gerai retail"],
  ["card", "Kartu kredit/debit"],
];

/**
 * Metode toko (transfer, QRIS statis, ...) lebih dulu, lalu metode online per kelompok. Urutan di
 * dalam kelompok mengikuti backend.
 */
export function paymentMethodSections(methods: PaymentMethod[]): PaymentMethodSection[] {
  const manual = methods.filter((method) => !method.online);
  const online = methods.filter((method) => method.online);
  if (!online.length) return manual.length ? [{ key: "store", label: null, methods: manual }] : [];
  const sections: PaymentMethodSection[] = manual.length ? [{ key: "store", label: "Bayar langsung ke toko", methods: manual }] : [];
  const known = new Set(onlineGroups.map(([group]) => group));
  for (const [group, label] of onlineGroups) {
    const rows = online.filter((method) => method.group === group);
    if (rows.length) sections.push({ key: `online-${group}`, label: `Pembayaran online · ${label}`, methods: rows });
  }
  const others = online.filter((method) => !method.group || !known.has(method.group));
  if (others.length) sections.push({ key: "online-other", label: "Pembayaran online lainnya", methods: others });
  return sections;
}

export function readBankAccounts(data: unknown): BankAccount[] {
  const rows = readRows(data);
  if (!rows || !rows.every((row): row is BankAccount => {
    const account = row as Partial<BankAccount>;
    const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
    return Boolean(row) && typeof row === "object" &&
      Number.isSafeInteger(account.id) && Number(account.id) > 0 &&
      filled(account.bank) && filled(account.name) && filled(account.number);
  })) throw new Error("Rekening tujuan transfer belum dapat dibaca.");
  return rows.map(({ id, bank, name, number, logo_url }) => ({ id, bank, name, number, logo_url: readHttpUrl(logo_url) }));
}

/** GET /payment/accounts: pilihan rekening di checkout. Nomor dan nama pemilik sengaja tidak dibaca. */
export function readBankChoices(data: unknown): BankChoice[] {
  const rows = readRows(data);
  if (!rows || !rows.every((row): row is BankChoice => {
    const choice = row as Partial<BankChoice>;
    return Boolean(row) && typeof row === "object" &&
      Number.isSafeInteger(choice.id) && Number(choice.id) > 0 &&
      typeof choice.bank === "string" && choice.bank.trim().length > 0;
  })) throw new Error("Rekening tujuan transfer belum dapat dibaca.");
  return rows.map(({ id, bank, logo_url }) => ({ id, bank, logo_url: readHttpUrl(logo_url) }));
}

// Pembayaran manual: pembeli membayar nominal berkode unik lalu mengunggah bukti.
export const isManualPayment = (code: string | null | undefined) => code === "bank_transfer" || code === "qris";

// Hanya URL http(s) absolut, karena dipakai sebagai src gambar dan tautan unduh.
// Cukup regex: modul ini juga dijalankan di vm tes yang tidak menyediakan URL.
function readHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  return /^https?:\/\/[^\s/?#]+[^\s]*$/i.test(url) ? url : null;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Tautan ke halaman gateway: hanya https, karena pembeli diarahkan ke sana untuk membayar.
export function readHttpsUrl(value: unknown): string | null {
  const url = readHttpUrl(value);
  return url && /^https:/i.test(url) ? url : null;
}

/**
 * Tautan ke aplikasi e-wallet (mis. gojek://, shopeeid://, atau https). Skema apa pun boleh kecuali
 * yang bisa menjalankan kode atau membuka berkas; spasi dan karakter kontrol ditolak.
 */
export function readAppUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!/^[a-z][a-z0-9+.-]*:[^\s\p{Cc}]+$/iu.test(url)) return null;
  return /^(?:javascript|data|vbscript|file|blob|about):/i.test(url) ? null : url;
}

const onlineStatuses: OnlinePaymentStatus[] = ["pending", "paid", "failed", "expired", "needs_review"];

function readMoney(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readDate(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

// Satu string QR (QRIS dinamis ~ 200-400 karakter); batas atas menjaga kanvas QR tetap terbaca.
const MAX_QR_LENGTH = 1500;

function readOnlineAction(value: unknown, amount: number): OnlinePaymentAction | null {
  if (!value || typeof value !== "object") return null;
  const action = value as Record<string, unknown>;
  switch (action.type) {
    case "redirect": {
      const url = readHttpsUrl(action.url);
      return url ? { type: "redirect", url } : null;
    }
    case "display": {
      const display = action.display && typeof action.display === "object" ? action.display as Record<string, unknown> : {};
      const result: OnlinePaymentDisplay = {
        kind: readText(display.kind),
        bank: readText(display.bank),
        account_number: readText(display.account_number),
        account_name: readText(display.account_name),
        payment_code: readText(display.payment_code),
        amount: readMoney(display.amount, amount),
        instructions: Array.isArray(display.instructions)
          ? display.instructions.flatMap((step) => readText(step) ?? [])
          : [],
      };
      // Tanpa nomor atau kode bayar tidak ada yang bisa dibayar pembeli.
      return result.account_number || result.payment_code ? { type: "display", display: result } : null;
    }
    case "qr": {
      const qr = typeof action.qr_string === "string" ? action.qr_string.trim() : "";
      return qr && qr.length <= MAX_QR_LENGTH ? { type: "qr", qr_string: qr, amount: readMoney(action.amount, amount) } : null;
    }
    case "deeplink": {
      const mobile = readAppUrl(action.mobile_url);
      const desktop = readHttpsUrl(action.desktop_url);
      return mobile || desktop ? { type: "deeplink", mobile_url: mobile, desktop_url: desktop } : null;
    }
    case "none":
      return { type: "none" };
    default:
      return null;
  }
}

/**
 * online_payment pada pesanan. Bentuk yang rusak dibaca sebagai null (atau aksi null) supaya
 * halaman pembayaran tetap tampil; status yang tidak dikenal dianggap sedang diperiksa toko.
 */
export function readOnlinePayment(value: unknown, fallbackAmount = 0): OnlinePayment | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const method = readText(row.method);
  if (!method) return null;
  const amount = readMoney(row.amount, fallbackAmount);
  const status = onlineStatuses.find((status) => status === row.status) ?? "needs_review";
  return {
    public_id: readText(row.public_id) ?? "",
    method,
    method_label: readText(row.method_label) ?? method,
    provider: readText(row.provider),
    amount,
    currency: readText(row.currency) ?? "IDR",
    status,
    action: readOnlineAction(row.action, amount),
    error_message: readText(row.error_message),
    paid_at: readDate(row.paid_at),
    expires_at: readDate(row.expires_at),
  };
}

/** Halaman pembayaran memakai tampilan tagihan online, bukan transfer/QRIS manual. */
export function usesOnlinePayment(order: Pick<OrderSummary, "online_payment" | "payment_method">): boolean {
  return order.online_payment !== null && !isManualPayment(order.payment_method);
}

/** Status diperiksa berkala selama gateway belum mengonfirmasi tagihan pesanan yang masih menunggu. */
export function shouldPollPayment(order: Pick<OrderSummary, "status" | "online_payment" | "payment_method">): boolean {
  return order.status === "pending" && usesOnlinePayment(order) && order.online_payment?.status === "pending";
}

/** Pesan untuk pembeli dari POST /orders/{id}/payment yang gagal. */
export function paymentChangeErrorMessage(status: number, data: unknown): string {
  const fallback = "Metode pembayaran belum dapat diganti. Silakan coba lagi.";
  if (status >= 500) return fallback;
  const message = data && typeof data === "object" ? (data as { message?: unknown }).message : null;
  return fieldError(data, "payment_method") ?? fieldError(data, "bank_account_id")
    ?? (typeof message === "string" && message.trim() ? message.trim() : fallback);
}

function readBankAccount(value: unknown): BankAccount | null {
  try {
    return readBankAccounts([value])[0];
  } catch {
    return null;
  }
}

export function readOrder(data: unknown): OrderSummary {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as Record<string, unknown>;
  const money = ["total", "shipping_cost", "grand_total"] as const;
  if (!row || typeof row !== "object" ||
    !Number.isSafeInteger(row.id) || Number(row.id) <= 0 ||
    !money.every((key) => typeof row[key] === "number" && Number.isFinite(row[key]) && (row[key] as number) >= 0)) {
    throw new Error("Pesanan belum dapat dibaca.");
  }
  const payment = row.payment as { method?: { code?: unknown; name?: unknown } | null; bank_account?: unknown; qris_image?: unknown; has_proof?: unknown; sender_name?: unknown } | null | undefined;
  const shipping = row.shipping as { method?: { name?: unknown; logo_url?: unknown } | null; service?: unknown } | null | undefined;
  return {
    id: row.id as number,
    status: typeof row.status === "string" ? row.status : "pending",
    total: row.total as number,
    shipping_cost: row.shipping_cost as number,
    ...readOrderDiscount(row),
    unique_payment_code: typeof row.unique_payment_code === "number" ? row.unique_payment_code : null,
    grand_total: row.grand_total as number,
    payment_method: typeof payment?.method?.code === "string" ? payment.method.code : null,
    payment_method_name: typeof payment?.method?.name === "string" ? payment.method.name : null,
    bank_account: readBankAccount(payment?.bank_account),
    qris_image: readHttpUrl(payment?.qris_image),
    shipping_method: typeof shipping?.method?.name === "string"
      ? shippingOptionLabel({ courier_name: shipping.method.name, service: typeof shipping.service === "string" && shipping.service ? shipping.service : null })
      : null,
    shipping_logo: readHttpUrl(shipping?.method?.logo_url),
    proof_uploaded: payment?.has_proof === true,
    sender_name: typeof payment?.sender_name === "string" ? payment.sender_name : null,
    items: readOrderLines(row.items),
    preorder_ready_at: typeof row.preorder_ready_at === "string" ? row.preorder_ready_at : null,
    online_payment: readOnlinePayment(row.online_payment, row.grand_total as number),
    tracking: readOrderTracking(row.tracking),
    reviewable: row.reviewable === true,
  };
}

/** Blok `tracking` dari detail pesanan; baris barang yang rusak dibuang. */
export function readOrderTracking(value: unknown): OrderTracking | null {
  if (!value || typeof value !== "object") return null;
  const { order_id: orderId, items } = value as { order_id?: unknown; items?: unknown };
  if (typeof orderId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(orderId)) return null;
  const id = (raw: unknown) => (Number.isSafeInteger(raw) && (raw as number) > 0 ? raw as number : null);
  return {
    order_id: orderId,
    items: (Array.isArray(items) ? items : []).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw as Record<string, unknown>;
      if (!Number.isSafeInteger(item.qty) || typeof item.price !== "number") return [];
      return [{ product_id: id(item.product_id), variant_id: id(item.variant_id), name: typeof item.name === "string" ? item.name : null, qty: item.qty as number, price: item.price }];
    }),
  };
}

/**
 * Kupon pada pesanan (detail, invoice, respons checkout). Backend lama tidak mengirimnya, dan
 * nilai yang rusak dibaca sebagai tanpa potongan supaya halaman pesanan tetap tampil.
 */
export function readOrderDiscount(value: unknown): { coupon_code: string | null; discount_amount: number } {
  const row = value && typeof value === "object" ? (value as { coupon_code?: unknown; discount_amount?: unknown }) : {};
  const amount = row.discount_amount;
  return {
    coupon_code: typeof row.coupon_code === "string" && row.coupon_code.trim() ? row.coupon_code.trim() : null,
    discount_amount: typeof amount === "number" && Number.isFinite(amount) && amount > 0 ? amount : 0,
  };
}

/** Respons sukses POST /checkout/coupon; melempar error bila bentuknya tidak bisa dipakai. */
export function readCoupon(data: unknown): AppliedCoupon {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as Record<string, unknown> | null;
  const discount = row?.discount;
  if (!row || typeof row !== "object" || typeof row.code !== "string" || !row.code.trim() ||
    typeof discount !== "number" || !Number.isFinite(discount) || discount < 0) {
    throw new Error("Kupon belum dapat diperiksa. Silakan coba lagi.");
  }
  const value = row.value;
  return {
    code: row.code.trim(),
    type: row.type === "percent" ? "percent" : "fixed",
    value: typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0,
    discount,
    product_id: Number.isSafeInteger(row.product_id) && (row.product_id as number) > 0 ? row.product_id as number : null,
    label: typeof row.label === "string" ? row.label.trim() : "",
  };
}

/** Pesan pertama Laravel untuk satu field 422, mis. errors.code atau errors.coupon_code. */
export function fieldError(data: unknown, field: string): string | null {
  const errors = data && typeof data === "object" ? (data as { errors?: unknown }).errors : null;
  const messages = errors && typeof errors === "object" ? (errors as Record<string, unknown>)[field] : null;
  const first = Array.isArray(messages) ? messages[0] : messages;
  return typeof first === "string" && first.trim() ? first.trim() : null;
}

/** Pesan untuk pembeli saat kupon ditolak: errors.code dari validasi, lalu `message` selain 5xx. */
export function couponErrorMessage(status: number, data: unknown): string {
  const fallback = "Kupon belum dapat diperiksa. Silakan coba lagi.";
  if (status >= 500) return fallback;
  const message = data && typeof data === "object" ? (data as { message?: unknown }).message : null;
  return fieldError(data, "code") ?? (typeof message === "string" && message.trim() ? message : fallback);
}

// Lines are only for display, so a malformed row is skipped rather than failing the page.
function readOrderLines(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as {
      id?: unknown; review?: unknown;
      amount?: unknown; price?: unknown; preorder_duration?: unknown;
      product?: { name?: unknown; images?: { public_url?: unknown; url?: unknown }[] } | null;
      variant?: { label?: unknown } | null;
    };
    if (typeof item.product?.name !== "string" || !Number.isSafeInteger(item.amount) || typeof item.price !== "number") return [];
    const photo = Array.isArray(item.product.images) ? item.product.images[0] : null;
    const image = typeof photo?.public_url === "string" ? photo.public_url : typeof photo?.url === "string" ? photo.url : null;
    return [{
      id: Number.isSafeInteger(item.id) && (item.id as number) > 0 ? item.id as number : null,
      name: item.product.name,
      variant: typeof item.variant?.label === "string" ? item.variant.label : null,
      amount: item.amount as number,
      price: item.price,
      preorder_duration: typeof item.preorder_duration === "number" ? item.preorder_duration : 0,
      image,
      review: readItemReview(item.review),
    }];
  });
}

// Laravel expects the XSRF cookie echoed back as a header; browser-only.
export function jsonHeaders(): Headers {
  const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (csrf) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrf.slice("XSRF-TOKEN=".length)));
  return headers;
}

/**
 * Pesan untuk pembeli dari respons POST /checkout yang gagal. errors.store (mis. toko baru saja
 * masuk mode perawatan) didahulukan, karena `message` Laravel bisa berupa ringkasan beberapa error.
 */
export function checkoutErrorMessage(status: number, data: unknown): string {
  const fallback = "Pesanan belum dapat dibuat. Silakan coba lagi.";
  // Pesan 5xx bisa berisi detail teknis, jadi tidak ditampilkan.
  if (status >= 500 || !data || typeof data !== "object") return fallback;
  const body = data as { message?: unknown; errors?: { store?: unknown } | null };
  const storeErrors = body.errors?.store;
  const store = Array.isArray(storeErrors) ? storeErrors[0] : undefined;
  if (typeof store === "string" && store.trim()) return store;
  return typeof body.message === "string" && body.message.trim() ? body.message : fallback;
}

// Read only the new order's id: the order already exists by then, so a strict
// parse of the whole payload must not be what strands the buyer.
export function readOrderId(data: unknown): number {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as { id?: unknown };
  if (!row || typeof row !== "object" || !Number.isSafeInteger(row.id) || Number(row.id) <= 0) {
    throw new Error("Pesanan dibuat, tetapi nomornya belum terbaca. Cek riwayat pesanan Anda.");
  }
  return row.id as number;
}

/** Ulasan pembeli untuk satu barang pesanan (items[].review di detail pesanan). */
export function readItemReview(value: unknown): { rating: number; comment: string | null } | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { rating?: unknown; feedback?: unknown };
  const rating = Math.round(Number(row.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return { rating, comment: typeof row.feedback === "string" && row.feedback.trim() ? row.feedback : null };
}
