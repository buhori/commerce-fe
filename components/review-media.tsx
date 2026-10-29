"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ReviewMedia } from "@/lib/reviews";
import { Icon } from "./icons";

/**
 * Foto dan video di ulasan (paket Business). Diklik: dibuka di modal yang sama dengan foto produk
 * (gallery-lightbox), dengan panah untuk berpindah antar media ulasan itu; tidak membuka file aslinya.
 */
export function ReviewMediaList({ media }: { media: ReviewMedia[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element || open === null) return;
    if (!element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open === null && dialog.current?.open) dialog.current.close();
  }, [open]);

  if (media.length === 0) return null;

  const multiple = media.length > 1;
  const current = open === null ? null : media[open];
  const show = (index: number) => setOpen((index + media.length) % media.length);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (open === null || !multiple) return;
    if (event.key === "ArrowRight") { event.preventDefault(); show(open + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(open - 1); }
  }

  return (
    <>
      <ul className="review-media" aria-label="Foto dan video ulasan">
        {media.map((item, index) => (
          <li key={item.url}>
            <button type="button" className="review-media-open" onClick={() => setOpen(index)}
              aria-label={item.type === "image" ? `Lihat foto ${index + 1}` : "Putar video ulasan"}>
              {item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL CDN toko, ukuran sudah diperkecil backend
                <img src={item.url} alt="" loading="lazy" />
              ) : (
                <>
                  <video src={item.url} muted playsInline preload="metadata" tabIndex={-1} />
                  <span className="review-media-play" aria-hidden="true">▶</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className="gallery-lightbox review-media-lightbox" aria-label="Foto dan video ulasan"
        onClose={() => setOpen(null)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }} onKeyDown={onKeyDown}>
        <div className="gallery-lightbox-header">
          <span>{current?.type === "video" ? "Video dari pembeli" : "Foto dari pembeli"}</span>
          <Button type="button" variant="secondary" size="icon" className="gallery-expand" aria-label="Tutup" onClick={() => setOpen(null)}><Icon name="close" /></Button>
        </div>
        {current && (
          <div className="gallery-lightbox-image review-media-stage">
            {current.type === "image"
              // eslint-disable-next-line @next/next/no-img-element -- URL CDN toko, ukuran sudah diperkecil backend
              ? <img key={current.url} src={current.url} alt={`Foto dari pembeli ${open! + 1}`} />
              : <video key={current.url} src={current.url} controls autoPlay playsInline />}
          </div>
        )}
        {multiple && open !== null && (
          <div className="gallery-lightbox-controls">
            <Button type="button" variant="secondary" size="icon" className="gallery-nav" aria-label="Sebelumnya" onClick={() => show(open - 1)}><Icon name="arrow" style={{ transform: "rotate(180deg)" }} /></Button>
            <span aria-live="polite">{open + 1} / {media.length}</span>
            <Button type="button" variant="secondary" size="icon" className="gallery-nav" aria-label="Berikutnya" onClick={() => show(open + 1)}><Icon name="arrow" /></Button>
          </div>
        )}
      </dialog>
    </>
  );
}
