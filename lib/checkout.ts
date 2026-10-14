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

export interface PaymentMethod {
  code: string;
  name: string;
  icon: string | null;
}

export interface BankAccount {
  id: number;
  bank: string;
  name: string;
  number: string;
}

export interface OrderLine {
  name: string;
  variant: string | null;
  amount: number;
  price: number;
  preorder_duration: number;
  image: string | null;
}

export interface OrderSummary {
  id: number;
  status: string;
  total: number;
  shipping_cost: number;
  // Added to the transfer amount so a manual payment can be matched to one order.
  unique_payment_code: number | null;
  grand_total: number;
  payment_method: string | null;
  // Display name managed by the store backend, so new methods need no frontend change.
  payment_method_name: string | null;
  bank_account: BankAccount | null;
  shipping_method: string | null;
  // The file itself stays with the store; the buyer only learns that it arrived.
  proof_uploaded: boolean;
  sender_name: string | null;
  items: OrderLine[];
  // YYYY-MM-DD, set when the order contains pre-order items.
  preorder_ready_at: string | null;
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
  return rows.map((row) => ({ code: row.code, name: row.name, icon: typeof row.icon === "string" ? row.icon : null }));
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
  return rows.map(({ id, bank, name, number }) => ({ id, bank, name, number }));
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
  const payment = row.payment as { method?: { code?: unknown; name?: unknown } | null; bank_account?: unknown; has_proof?: unknown; sender_name?: unknown } | null | undefined;
  const shipping = row.shipping as { method?: { name?: unknown } | null; service?: unknown } | null | undefined;
  return {
    id: row.id as number,
    status: typeof row.status === "string" ? row.status : "pending",
    total: row.total as number,
    shipping_cost: row.shipping_cost as number,
    unique_payment_code: typeof row.unique_payment_code === "number" ? row.unique_payment_code : null,
    grand_total: row.grand_total as number,
    payment_method: typeof payment?.method?.code === "string" ? payment.method.code : null,
    payment_method_name: typeof payment?.method?.name === "string" ? payment.method.name : null,
    bank_account: readBankAccount(payment?.bank_account),
    shipping_method: typeof shipping?.method?.name === "string"
      ? shippingOptionLabel({ courier_name: shipping.method.name, service: typeof shipping.service === "string" && shipping.service ? shipping.service : null })
      : null,
    proof_uploaded: payment?.has_proof === true,
    sender_name: typeof payment?.sender_name === "string" ? payment.sender_name : null,
    items: readOrderLines(row.items),
    preorder_ready_at: typeof row.preorder_ready_at === "string" ? row.preorder_ready_at : null,
  };
}

// Lines are only for display, so a malformed row is skipped rather than failing the page.
function readOrderLines(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as {
      amount?: unknown; price?: unknown; preorder_duration?: unknown;
      product?: { name?: unknown; images?: { public_url?: unknown; url?: unknown }[] } | null;
      variant?: { label?: unknown } | null;
    };
    if (typeof item.product?.name !== "string" || !Number.isSafeInteger(item.amount) || typeof item.price !== "number") return [];
    const photo = Array.isArray(item.product.images) ? item.product.images[0] : null;
    const image = typeof photo?.public_url === "string" ? photo.public_url : typeof photo?.url === "string" ? photo.url : null;
    return [{
      name: item.product.name,
      variant: typeof item.variant?.label === "string" ? item.variant.label : null,
      amount: item.amount as number,
      price: item.price,
      preorder_duration: typeof item.preorder_duration === "number" ? item.preorder_duration : 0,
      image,
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

// Read only the new order's id: the order already exists by then, so a strict
// parse of the whole payload must not be what strands the buyer.
export function readOrderId(data: unknown): number {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as { id?: unknown };
  if (!row || typeof row !== "object" || !Number.isSafeInteger(row.id) || Number(row.id) <= 0) {
    throw new Error("Pesanan dibuat, tetapi nomornya belum terbaca. Cek riwayat pesanan Anda.");
  }
  return row.id as number;
}
