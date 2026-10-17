"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// Satu jam bersama untuk semua hitung mundur di halaman: satu interval, berdetak tiap detik.
let current: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function tick() {
  current = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(tick, 1000);
  // Langsung berdetak supaya angka muncul tanpa menunggu satu detik setelah hidrasi.
  tick();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = () => current;
// Server dan hidrasi tidak tahu jam pembeli: tampil "--" dulu, angka diisi setelah hidrasi.
const getServerSnapshot = () => null;

const LABELS = {
  id: ["Hari", "Jam", "Menit", "Detik"],
  en: ["Days", "Hours", "Minutes", "Seconds"],
} as const;

/**
 * Hitung mundur ke `endsAt` (ISO-8601), diperbarui tiap detik di browser. Setelah lewat menampilkan
 * `expired`, atau penanda tersembunyi bila kosong (CSS menyembunyikan seluruh bagiannya).
 * `children` (mis. tombol) hanya tampil selama hitung mundur berjalan.
 */
export function Countdown({ endsAt, expired, language = "id", className = "countdown", children }: {
  endsAt: string;
  expired?: ReactNode;
  language?: "id" | "en";
  className?: string;
  children?: ReactNode;
}) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const end = Date.parse(endsAt);
  const remaining = now === null || !Number.isFinite(end) ? null : Math.max(0, Math.floor((end - now) / 1000));

  if (remaining === 0) return expired ? <>{expired}</> : <span hidden data-countdown-ended="" />;

  const parts = remaining === null
    ? null
    : [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const labels = LABELS[language] ?? LABELS.id;

  return (
    <>
      <div className={className} role="timer">
        {labels.map((label, index) => (
          <div key={label} className="countdown-unit">
            <span className="countdown-value">{parts ? String(parts[index]).padStart(2, "0") : "--"}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
      {children}
    </>
  );
}
