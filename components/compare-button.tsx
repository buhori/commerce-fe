"use client";

import { useState, useSyncExternalStore } from "react";
import { COMPARE_LIMIT, COMPARE_STORAGE_KEY, readCompareItems, toggleCompareItem, type CompareItem } from "@/lib/compare";
import { Icon } from "./icons";

/*
 * Daftar bandingkan disimpan di localStorage (tanpa akun, tanpa API) dan dibagikan ke semua
 * komponen lewat useSyncExternalStore; tab lain ikut berubah lewat event `storage`.
 */
const EMPTY: CompareItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedItems: CompareItem[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(COMPARE_STORAGE_KEY);
  } catch {
    // Penyimpanan diblokir (mode privat tertentu): daftar selalu kosong.
    return null;
  }
}

function snapshot(): CompareItem[] {
  const raw = readRaw();
  // Referensi yang sama selama isinya sama, supaya React tidak merender ulang tanpa henti.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = readCompareItems(raw);
  }
  return cachedItems;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === COMPARE_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(items: CompareItem[]) {
  try {
    if (items.length) window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    else window.localStorage.removeItem(COMPARE_STORAGE_KEY);
  } catch {
    // Tidak bisa disimpan: abaikan, tombol tetap berfungsi tanpa efek.
  }
  listeners.forEach((listener) => listener());
}

/** Daftar bandingkan pembeli dan cara mengubahnya. Kosong saat render server. */
export function useCompare() {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return {
    items,
    limit: COMPARE_LIMIT,
    has: (id: number) => items.some((item) => item.id === id),
    /** Tambah atau hapus; mengembalikan false bila daftar sudah penuh. */
    toggle: (item: CompareItem) => {
      const next = toggleCompareItem(snapshot(), item);
      if (!next.full) write(next.items);
      return !next.full;
    },
    remove: (id: number) => write(snapshot().filter((item) => item.id !== id)),
    clear: () => write(EMPTY),
  };
}

/**
 * Tombol "Bandingkan" di halaman produk. Produk yang dipilih muncul di bilah bandingkan
 * (CompareTray) di bawah layar, paling banyak COMPARE_LIMIT produk.
 */
export function CompareButton({ product, className }: {
  product: { id: number; slug: string; name: string; images?: string | null };
  className?: string;
}) {
  const compare = useCompare();
  const [full, setFull] = useState(false);
  const selected = compare.has(product.id);

  return (
    <>
      <button
        type="button"
        className={["product-action-button", className].filter(Boolean).join(" ")}
        aria-pressed={selected}
        onClick={() => {
          const changed = compare.toggle({ id: product.id, slug: product.slug, name: product.name, image: product.images ?? null });
          setFull(!changed);
        }}
      >
        <Icon name={selected ? "check" : "compare"} />
        <span>{selected ? "Dibandingkan" : "Bandingkan"}</span>
      </button>
      {full && (
        <p className="product-action-note" role="status">
          Maksimal {compare.limit} produk. Hapus salah satu di bilah bandingkan dulu.
        </p>
      )}
    </>
  );
}
