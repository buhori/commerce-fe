"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { compareUrl } from "@/lib/compare";
import { useCompare } from "./compare-button";
import { Icon } from "./icons";
import { ProductImage } from "./product-image";

/** Halaman tempat bilah bandingkan hanya mengganggu (sedang membayar) atau tidak berguna. */
const HIDDEN = ["/compare", "/checkout", "/payment", "/invoice", "/login", "/auth", "/preview"];

/** Elemen lain yang menempel di bawah layar; bilah bandingkan diletakkan di atasnya. */
const BOTTOM_BARS = [".purchase-dock", ".theme-preview-bar"];

/**
 * Jarak dari bawah layar ke tepi atas bar lain yang menempel di bawah (dock beli di ponsel, bar
 * pratinjau tema). Diukur, bukan ditulis di CSS, karena tinggi dock berubah sesuai isinya. Dipakai
 * juga tombol bantuan (HelpButton).
 */
export function useBottomOffset(active: boolean, pathname: string) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!active) return;
    let bars: HTMLElement[] = [];
    const update = () => setOffset(Math.max(0, ...bars
      .filter((bar) => getComputedStyle(bar).position === "fixed")
      .map((bar) => window.innerHeight - bar.getBoundingClientRect().top)));
    const observer = new ResizeObserver(update);
    const collect = () => {
      const next = BOTTOM_BARS.flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)]);
      if (next.length === bars.length && next.every((bar, index) => bar === bars[index])) return;
      observer.disconnect();
      bars = next;
      bars.forEach((bar) => observer.observe(bar));
      update();
    };
    // Halaman yang dialirkan (loading.tsx) memasang dok beli sesudah layout; kumpulkan ulang saat DOM berubah.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(collect);
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    collect();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [active, pathname]);
  return active ? offset : 0;
}

/** Bilah melayang berisi produk yang dipilih untuk dibandingkan; tampil bila ada minimal satu. */
export function CompareTray() {
  const pathname = usePathname();
  const compare = useCompare();
  const visible = compare.items.length > 0 && !HIDDEN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const offset = useBottomOffset(visible, pathname);
  if (!visible) return null;

  const count = compare.items.length;
  return (
    <aside className="compare-tray" aria-label="Produk yang dibandingkan" style={{ "--compare-tray-offset": `${offset}px` } as CSSProperties}>
      <ul className="compare-tray-items">
        {compare.items.map((item) => (
          <li key={item.id}>
            <Link className="compare-tray-thumb" href={`/products/${encodeURIComponent(item.slug)}`} title={item.name}>
              <ProductImage key={item.image} src={item.image} name={item.name} />
            </Link>
            <button type="button" className="compare-tray-remove" aria-label={`Hapus ${item.name} dari perbandingan`} onClick={() => compare.remove(item.id)}>
              <Icon name="close" />
            </button>
          </li>
        ))}
      </ul>
      <div className="compare-tray-actions">
        <button type="button" className="compare-tray-clear" onClick={compare.clear}>Hapus semua</button>
        {count >= 2
          ? <Link className="compare-tray-go" href={compareUrl(compare.items.map((item) => item.id))}><Icon name="compare" />Bandingkan ({count})</Link>
          : <span className="compare-tray-hint">Pilih 1 produk lagi untuk dibandingkan</span>}
      </div>
    </aside>
  );
}

/** /compare tanpa ?p: buka daftar milik pembeli bila ada. */
export function CompareRestore() {
  const router = useRouter();
  const { items } = useCompare();
  useEffect(() => {
    if (items.length) router.replace(compareUrl(items.map((item) => item.id)));
  }, [items, router]);
  return null;
}

/** Hapus satu produk dari tabel: dari daftar pembeli dan dari URL. */
export function CompareRemoveButton({ id, name, remaining }: { id: number; name: string; remaining: number[] }) {
  const router = useRouter();
  const compare = useCompare();
  return (
    <button
      type="button"
      className="compare-remove"
      aria-label={`Hapus ${name} dari perbandingan`}
      onClick={() => {
        compare.remove(id);
        router.replace(compareUrl(remaining));
      }}
    >
      <Icon name="close" />
    </button>
  );
}

/** Pilihan "hanya yang berbeda": menyembunyikan baris yang nilainya sama di semua produk. */
export function CompareDiffToggle() {
  return (
    <label className="compare-diff-toggle">
      <input
        type="checkbox"
        onChange={(event) => event.currentTarget.closest(".compare-shell")?.setAttribute("data-diff-only", String(event.currentTarget.checked))}
      />
      Tampilkan perbedaan saja
    </label>
  );
}
