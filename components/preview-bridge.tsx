"use client";

import { useEffect } from "react";

const SCROLL_KEY = "sellosy-preview-scroll";

/**
 * Hanya di dalam iframe builder (/builder di panel): bagian beranda atau halaman builder bisa diklik untuk dipilih,
 * bagian terpilih disorot dan digulir ke tampilan, dan posisi gulir dipertahankan saat builder
 * memuat ulang pratinjau. Tautan dan formulir tidak membuka halaman lain di pratinjau.
 *
 * Pesan ke builder: { source: "sellosy-preview", type: "select", index }.
 * Pesan dari builder (hanya dari jendela induk): { source: "sellosy-builder", type: "focus", index, scroll }.
 */
export function PreviewBridge() {
  useEffect(() => {
    const storage = (() => {
      try {
        return window.sessionStorage;
      } catch {
        return null;
      }
    })();

    // Per path: builder beranda dan builder halaman memakai iframe yang sama di tab yang sama.
    const scrollKey = `${SCROLL_KEY}:${window.location.pathname}`;
    const saved = Number(storage?.getItem(scrollKey));
    if (saved > 0) window.scrollTo({ top: saved, behavior: "instant" });

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => storage?.setItem(scrollKey, String(Math.round(window.scrollY))));
    };

    const style = document.createElement("style");
    style.textContent = `
      [data-section-index] { position: relative; cursor: pointer; }
      [data-section-index]:hover { outline: 2px dashed rgb(69 37 201 / 0.55); outline-offset: -2px; }
      [data-section-index][data-selected] { outline: 2px solid #4525c9; outline-offset: -2px; }
    `;
    document.head.append(style);

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      // Pratinjau hanya untuk halaman yang sedang disunting: tautan tidak berpindah halaman.
      if (target?.closest("a")) event.preventDefault();
      const section = target?.closest<HTMLElement>("[data-section-index]");
      if (section) {
        window.parent.postMessage({ source: "sellosy-preview", type: "select", index: Number(section.dataset.sectionIndex) }, "*");
      }
    };
    const onSubmit = (event: SubmitEvent) => event.preventDefault();

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.source !== "sellosy-builder" || event.data.type !== "focus") return;
      document.querySelectorAll("[data-selected]").forEach((element) => element.removeAttribute("data-selected"));
      const index = Number.isInteger(event.data.index) ? event.data.index : null;
      const section = index === null ? null : document.querySelector<HTMLElement>(`[data-section-index="${index}"]`);
      if (!section) return;
      section.setAttribute("data-selected", "");
      if (event.data.scroll) section.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("message", onMessage);
      style.remove();
    };
  }, []);

  return null;
}
