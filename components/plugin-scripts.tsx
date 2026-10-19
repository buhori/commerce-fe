"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { emitStoreEvent, firstPurchaseView, scriptRunsOn, storePageType, type PluginScript, type StoreEventMap, type StoreEventName } from "@/lib/store-events";

/**
 * Script plugin storefront (mis. Meta Pixel) dan event store:page_viewed. Platform yang merender tagnya;
 * plugin hanya memberi URL file dan konfigurasi (window.__plugins, ditulis layout lewat pluginConfigScript).
 * Script dimuat saat pembeli pertama kali membuka halaman yang cocok dengan `pages`-nya, lalu tetap aktif
 * selama navigasi di dalam toko.
 */
export function PluginScripts({ scripts }: { scripts: PluginScript[] }) {
  const pathname = usePathname();
  const page = storePageType(pathname);
  const id = (script: PluginScript) => `${script.plugin}:${script.key}`;
  const matching = scripts.filter((script) => scriptRunsOn(script, page)).map(id);
  const [loaded, setLoaded] = useState<string[]>(matching);
  // Halaman baru yang cocok dengan script lain: tambahkan (yang sudah dimuat tidak dilepas).
  const missing = matching.filter((key) => !loaded.includes(key));
  if (missing.length) setLoaded([...loaded, ...missing]);

  useEffect(() => {
    emitStoreEvent("store:page_viewed", { page_type: storePageType(pathname), url: window.location.href });
  }, [pathname]);

  return scripts
    .filter((script) => loaded.includes(id(script)))
    .map((script) => (
      <Script
        key={id(script)}
        id={`plugin-${script.plugin}-${script.key}`}
        src={script.src}
        // head: sesegera mungkin setelah halaman interaktif; body_end: setelah semuanya selesai dimuat.
        strategy={script.location === "body_end" ? "lazyOnload" : "afterInteractive"}
      />
    ));
}

/** Pancarkan satu event saat komponen tampil (mis. store:product_viewed di halaman produk). */
export function StoreEventOnMount<Name extends StoreEventName>({ name, detail }: { name: Name; detail: StoreEventMap[Name] }) {
  // Dipancarkan ulang hanya bila isinya berubah (mis. pindah ke produk lain), bukan setiap render.
  const serialized = JSON.stringify(detail);
  useEffect(() => {
    emitStoreEvent(name, JSON.parse(serialized) as StoreEventMap[Name]);
  }, [name, serialized]);
  return null;
}

/**
 * store:purchase_completed saat pesanan sudah lunas, sekali per pesanan per browser (halaman pembayaran
 * bisa dibuka ulang). order_id sama dengan ID di webhook plugin, jadi event server tidak terhitung dua kali.
 */
export function PurchaseCompletedEvent({ detail }: { detail: StoreEventMap["store:purchase_completed"] }) {
  const serialized = JSON.stringify(detail);
  useEffect(() => {
    const purchase = JSON.parse(serialized) as StoreEventMap["store:purchase_completed"];
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      // Diblokir browser: tetap dipancarkan tanpa penjaga.
    }
    if (firstPurchaseView(purchase.order_id, storage)) emitStoreEvent("store:purchase_completed", purchase);
  }, [serialized]);
  return null;
}
