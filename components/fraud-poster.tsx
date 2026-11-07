"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";
import { Button } from "./ui/button";

const seenKey = (orderId: number) => `fraud-poster-seen:${orderId}`;

function seen(orderId: number): boolean {
  try {
    return localStorage.getItem(seenKey(orderId)) === "1";
  } catch {
    return false;
  }
}

/**
 * Poster anti penipuan toko (Pengaturan Belanja) sebagai modal, sekali per pesanan di browser ini setelah
 * pembayaran berhasil. Ditutup lewat tombol, Escape, atau klik di luar poster.
 */
export function FraudPosterDialog({ orderId, poster, storeName }: { orderId: number; poster: string; storeName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open && !seen(orderId)) element.showModal();
  }, [orderId, poster]);

  function remember() {
    try {
      localStorage.setItem(seenKey(orderId), "1");
    } catch {
      // Tanpa penyimpanan (mode privat): modal bisa muncul lagi saat halaman dibuka ulang.
    }
  }

  return (
    <dialog ref={dialog} className="help-dialog fraud-poster-dialog" aria-labelledby="fraud-poster-title" onClose={remember}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="help-dialog-header">
        <h2 id="fraud-poster-title">Waspada penipuan</h2>
        <Button variant="secondary" size="icon" aria-label="Tutup" onClick={() => dialog.current?.close()}><Icon name="close" /></Button>
      </div>
      <div className="fraud-poster-body">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster milik toko dari domain backend, ditampilkan apa adanya. */}
        <img src={poster} alt={`Peringatan penipuan dari ${storeName}`} />
        <Button className="fraud-poster-confirm" onClick={() => dialog.current?.close()}>Saya mengerti</Button>
      </div>
    </dialog>
  );
}
