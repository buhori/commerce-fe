"use client";

import { useEffect, useRef } from "react";
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
 * Poster anti penipuan toko (Pengaturan Belanja) sebagai modal, saat halaman pembayaran pesanan pertama kali dibuka
 * di browser ini. Hanya bisa ditutup lewat tombol "Saya Mengerti Dan Waspada": Escape dan klik di luar poster
 * tidak menutupnya, dan bila browser tetap menutupnya (Escape berulang), modal dibuka lagi.
 */
export function FraudPosterDialog({ orderId, poster, storeName }: { orderId: number; poster: string; storeName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open && !seen(orderId)) element.showModal();
  }, [orderId, poster]);

  function confirm() {
    confirmed.current = true;
    try {
      localStorage.setItem(seenKey(orderId), "1");
    } catch {
      // Tanpa penyimpanan (mode privat): modal bisa muncul lagi saat halaman dibuka ulang.
    }
    dialog.current?.close();
  }

  return (
    <dialog ref={dialog} className="help-dialog fraud-poster-dialog" aria-labelledby="fraud-poster-title"
      onCancel={(event) => event.preventDefault()}
      onClose={() => { if (!confirmed.current) dialog.current?.showModal(); }}>
      <div className="help-dialog-header">
        <h2 id="fraud-poster-title">Waspada penipuan</h2>
      </div>
      <div className="fraud-poster-body">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster milik toko dari domain backend, ditampilkan apa adanya. */}
        <img src={poster} alt={`Peringatan penipuan dari ${storeName}`} />
        <Button className="fraud-poster-confirm" onClick={confirm}>Saya Mengerti Dan Waspada</Button>
      </div>
    </dialog>
  );
}
