/**
 * Event analytics standar storefront dan script plugin (documents/plugin-development.md bagian 12 di repo
 * backend). Modul murni tanpa impor, supaya bisa dites dan dipakai di server maupun browser.
 *
 * Event dipancarkan sebagai CustomEvent pada window ("store:product_viewed", …) dan juga dicatat di
 * window.__storeEvents, supaya script plugin yang dimuat belakangan masih bisa membaca event sebelumnya.
 */

export type StorePageType = "home" | "product" | "collection" | "cart" | "checkout" | "thank_you" | "other";

/** Script yang didaftarkan plugin aktif (GET /store → plugin_scripts). */
export interface PluginScript {
  /** ID plugin, mis. "analytics-meta-pixel"; konfigurasi tersedia di window.__plugins[plugin]. */
  plugin: string;
  key: string;
  src: string;
  location: "head" | "body_end";
  loading: "async" | "defer";
  pages: string[];
  consent_category: string;
  config: Record<string, unknown> | null;
}

export interface StoreEventItem {
  product_id: number | string | null;
  variant_id?: number | null;
  name?: string | null;
  qty: number;
  price: number;
}

export interface StoreEventMap {
  "store:page_viewed": { page_type: StorePageType; url: string };
  "store:product_viewed": { product_id: number; name: string; price: number; currency: string; category: string | null };
  "store:cart_item_added": { product_id: number; variant_id: number | null; qty: number; price: number; currency: string; name?: string | null };
  "store:cart_item_removed": { product_id: number; variant_id: number | null; qty: number };
  "store:checkout_started": { cart_id: number | null; total: number; currency: string; items: StoreEventItem[] };
  "store:purchase_completed": { order_id: string; total: number; currency: string; items: StoreEventItem[] };
}

export type StoreEventName = keyof StoreEventMap;

const PAGES = ["all", "home", "product", "collection", "cart", "checkout", "thank_you"];
const PLUGIN_ID = /^[a-z0-9]+(-[a-z0-9]+)+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Daftar dari API, dengan baris rusak dibuang (bukan URL http(s), halaman tidak dikenal, …). */
export function readPluginScripts(value: unknown): PluginScript[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): PluginScript[] => {
    if (!isRecord(row)) return [];
    const { plugin, key, src, location, loading, pages, consent_category: consent, config } = row;
    if (typeof plugin !== "string" || !PLUGIN_ID.test(plugin) || typeof key !== "string" || !key) return [];
    if (typeof src !== "string" || !/^https?:\/\/[^\s]+$/i.test(src)) return [];
    const validPages = Array.isArray(pages) ? pages.filter((page): page is string => typeof page === "string" && PAGES.includes(page)) : [];
    if (!validPages.length) return [];
    return [{
      plugin,
      key,
      src,
      location: location === "body_end" ? "body_end" : "head",
      loading: loading === "defer" ? "defer" : "async",
      pages: validPages,
      consent_category: typeof consent === "string" ? consent : "marketing",
      config: isRecord(config) ? config : null,
    }];
  });
}

/** Jenis halaman dari path storefront, untuk `pages` script dan event page_viewed. */
export function storePageType(pathname: string): StorePageType {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (/^\/products\/[^/]+$/.test(path)) return "product";
  if (path === "/products" || path.startsWith("/c/")) return "collection";
  if (path === "/cart") return "cart";
  if (path === "/checkout") return "checkout";
  if (/^\/payment\/[^/]+$/.test(path)) return "thank_you";
  return "other";
}

/** `all` mencakup semua halaman kecuali checkout; checkout harus disebut sendiri. */
export function scriptRunsOn(script: Pick<PluginScript, "pages">, page: StorePageType): boolean {
  return script.pages.includes(page) || (script.pages.includes("all") && page !== "checkout");
}

/** window.__plugins: konfigurasi per plugin (gabungan bila satu plugin punya beberapa script). */
export function pluginConfigs(scripts: PluginScript[]): Record<string, Record<string, unknown>> {
  const configs: Record<string, Record<string, unknown>> = {};
  for (const script of scripts) {
    if (script.config) configs[script.plugin] = { ...configs[script.plugin], ...script.config };
  }
  return configs;
}

/**
 * Isi tag <script> yang menulis window.__plugins sebelum script plugin dimuat. JSON di-escape supaya
 * nilai konfigurasi tidak bisa menutup tag script ("</script>") atau memutus baris JavaScript.
 */
export function pluginConfigScript(scripts: PluginScript[]): string {
  const json = JSON.stringify(pluginConfigs(scripts))
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `window.__plugins=Object.assign(window.__plugins||{},${json});`;
}

type EventWindow = {
  __storeEvents?: { name: string; detail: unknown }[];
  dispatchEvent(event: Event): boolean;
};

/** Pancarkan satu event; aman dipanggil di server (tidak melakukan apa pun). */
export function emitStoreEvent<Name extends StoreEventName>(name: Name, detail: StoreEventMap[Name], target?: EventWindow): void {
  const win = target ?? (typeof window === "undefined" ? undefined : (window as unknown as EventWindow));
  if (!win) return;
  const history = (win.__storeEvents ??= []);
  history.push({ name, detail });
  // Riwayat dibatasi: halaman yang dibuka lama tidak menumpuk event tanpa akhir.
  if (history.length > 100) history.splice(0, history.length - 100);
  win.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * Purchase dipancarkan sekali per pesanan per browser, walau halaman pembayaran dibuka ulang.
 * Mengembalikan true bila belum pernah (dan menandainya).
 */
export function firstPurchaseView(orderId: string, storage: Pick<Storage, "getItem" | "setItem"> | null): boolean {
  const key = `sellosy:purchase:${orderId}`;
  // Tanpa penyimpanan (diblokir browser) tidak bisa dijaga: tetap dipancarkan.
  if (!storage) return true;
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
  } catch {
    // Penuh atau diblokir: anggap belum pernah.
  }
  return true;
}
