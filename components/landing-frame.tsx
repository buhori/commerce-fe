"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing page HTML penuh dari panel, di iframe sandbox tanpa allow-same-origin: skripnya
 * berjalan di origin terpisah, jadi tidak bisa membaca cookie, sesi pembeli, atau memanggil
 * API toko. Tautan biasa tetap membuka halaman toko di jendela utama (skrip dari backend).
 *
 * `fill`: memenuhi layar (tata letak "halaman kosong"). Tanpa `fill`, tinggi iframe mengikuti
 * isi dokumen lewat postMessage { sellosyPageHeight }.
 */
export function LandingFrame({ title, document, fill = false }: { title: string; document: string; fill?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (fill) return;
    const onMessage = (event: MessageEvent) => {
      // Hanya pesan dari iframe ini; dokumen sandbox ber-origin "null", jadi dicocokkan lewat source.
      if (event.source !== frame.current?.contentWindow) return;
      const value = (event.data as { sellosyPageHeight?: unknown } | null)?.sellosyPageHeight;
      if (typeof value === "number" && Number.isFinite(value) && value > 0) setHeight(Math.min(Math.ceil(value), 100_000));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [fill]);

  return (
    <iframe
      ref={frame}
      title={title}
      className={fill ? "landing-frame landing-frame-fill" : "landing-frame"}
      style={fill || height === null ? undefined : { height }}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      srcDoc={document}
    />
  );
}
