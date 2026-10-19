"use client";

import { useEffect, useId, useRef, useState } from "react";
import { shareLinks } from "@/lib/share";
import { Icon } from "./icons";

/**
 * Tombol "Bagikan". Di ponsel membuka lembar bagikan bawaan (navigator.share); di layar lain
 * menampilkan menu: salin tautan, WhatsApp, Facebook, X, dan Telegram.
 */
export function ShareButton({ url, title, className }: { url: string; title: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const share = async () => {
    // Lembar bawaan hanya di layar sentuh; di desktop menu sendiri lebih jelas pilihannya.
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Dibatalkan pembeli: selesai. Gagal karena hal lain: tampilkan menu sebagai gantinya.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setCopied(null);
    setOpen((value) => !value);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  };

  return (
    <div className="share-menu-wrapper" ref={wrapper}>
      <button
        type="button"
        className={["product-action-button", className].filter(Boolean).join(" ")}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => void share()}
      >
        <Icon name="share" />
        <span>Bagikan</span>
      </button>
      {open && (
        <div className="share-menu" id={menuId} role="group" aria-label="Bagikan produk">
          <button type="button" className="share-menu-item" onClick={() => void copy()}>
            <Icon name={copied === "done" ? "check" : "copy"} />
            {copied === "done" ? "Tautan disalin" : "Salin tautan"}
          </button>
          {shareLinks({ url, title }).map((link) => (
            <a key={link.target} className="share-menu-item" href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <Icon name={link.target === "whatsapp" ? "whatsapp" : "arrow"} />
              {link.label}
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
          ))}
          {copied === "failed" && <p className="share-menu-error" role="alert">Tautan tidak bisa disalin. Salin dari kolom alamat browser.</p>}
        </div>
      )}
    </div>
  );
}
