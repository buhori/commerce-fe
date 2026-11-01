"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/format";
import { Icon } from "./icons";

// Satu jam bersama untuk semua sisa waktu di halaman: satu interval, berdetak tiap detik.
let now: number | null = null;
let clock: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  const tick = () => { now = Date.now(); clockListeners.forEach((notify) => notify()); };
  if (!clock) clock = setInterval(tick, 1000);
  tick();
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && clock) { clearInterval(clock); clock = undefined; }
  };
}

const useNow = () => useSyncExternalStore(subscribeClock, () => now, () => null);

/** Sisa waktu di bawah ini ditandai mendesak (merah). */
const URGENT_SECONDS = 60 * 60;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Status "menunggu pembayaran" di atas kartu pembayaran, dengan hitung mundur ke batas bayar
 * (`deadline`, ISO 8601). Lewat dari batas itu pesanan dibatalkan otomatis oleh toko.
 */
export function PendingPaymentStatus({ id, title, deadline }: { id: string; title: string; deadline: string | null }) {
  const current = useNow();
  const end = deadline ? Date.parse(deadline) : NaN;
  const remaining = Number.isNaN(end) || current === null ? null : Math.max(0, Math.floor((end - current) / 1000));
  const expired = remaining === 0;
  const urgent = remaining !== null && !expired && remaining < URGENT_SECONDS;

  const days = remaining === null ? 0 : Math.floor(remaining / 86400);
  const units: [string, string][] = remaining === null
    ? [["--", "jam"], ["--", "menit"], ["--", "detik"]]
    : days > 0
      ? [[String(days), "hari"], [pad(Math.floor(remaining / 3600) % 24), "jam"], [pad(Math.floor(remaining / 60) % 60), "menit"]]
      : [[pad(Math.floor(remaining / 3600)), "jam"], [pad(Math.floor(remaining / 60) % 60), "menit"], [pad(remaining % 60), "detik"]];
  const spoken = remaining === null ? "" : `${days > 0 ? `${days} hari ` : ""}${Math.floor(remaining / 3600) % 24} jam ${Math.floor(remaining / 60) % 60} menit`;

  return (
    <div className="payment-status" data-tone={expired ? "stopped" : "pending"} data-urgent={urgent || undefined}>
      <span className="payment-status-icon"><Icon name="clock" width={24} height={24} /></span>
      <div className="payment-status-text">
        <h2 id={id}>{title}</h2>
        {Number.isNaN(end) ? (
          <p>Pesanan diproses setelah pembayaran diterima.</p>
        ) : expired ? (
          <p>Batas waktu pembayaran sudah lewat. Pesanan dibatalkan otomatis, status diperbarui sebentar lagi.</p>
        ) : (
          <p>Bayar sebelum <strong>{formatDateTime(new Date(end))}</strong>. Lewat dari itu, pesanan dibatalkan otomatis.</p>
        )}
      </div>
      {!Number.isNaN(end) && !expired && (
        <div className="payment-countdown" role="timer" aria-label={spoken ? `Sisa waktu pembayaran ${spoken}` : "Sisa waktu pembayaran"}>
          <span className="payment-countdown-caption">Sisa waktu bayar</span>
          <span className="payment-countdown-clock" aria-hidden="true">
            {units.map(([value, label]) => <span key={label}><strong>{value}</strong><small>{label}</small></span>)}
          </span>
        </div>
      )}
    </div>
  );
}
