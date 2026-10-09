"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./icons";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const photos = [...new Set(images)].filter((src) => !failed.has(src));
  const hasPhotos = photos.length > 0;
  const current = Math.min(active, Math.max(0, photos.length - 1));

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => setActive(Math.max(0, Math.round(element.scrollLeft / Math.max(1, element.clientWidth))));
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [photos.length]);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !zoomed) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed, hasPhotos]);

  function show(index: number) {
    if (!photos.length) return;
    const next = (index + photos.length) % photos.length;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: zoomed || reducedMotion ? "instant" : "smooth" });
    setActive(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
  }

  if (!photos.length) {
    return <div className="gallery"><div className="gallery-main gallery-empty"><Icon name="box" /><strong>Foto produk belum tersedia</strong><span>Informasi produk dapat dilihat di bagian detail.</span></div></div>;
  }

  const multiple = photos.length > 1;
  return (
    <div className="gallery" aria-roledescription="galeri" aria-label={`Foto ${name}`}>
      <div className="gallery-main">
        <div className="gallery-track" ref={track} tabIndex={multiple ? 0 : -1} onKeyDown={onKeyDown}
          aria-label={multiple ? "Geser atau gunakan panah untuk melihat foto lain" : undefined}>
          {photos.map((src, index) => (
            <div className="gallery-slide" key={src} aria-hidden={index !== current}>
              <Image src={src} alt={`${name}${multiple ? ` — foto ${index + 1}` : ""}`} fill unoptimized
                priority={index === 0} sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: "contain" }}
                onError={() => setFailed((value) => new Set(value).add(src))} />
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="icon" className="gallery-expand" onClick={() => setZoomed(true)} aria-label="Perbesar foto produk"><Icon name="expand" /></Button>
        {multiple && <>
          <Button type="button" variant="secondary" size="icon" className="gallery-nav gallery-prev" onClick={() => show(current - 1)} aria-label="Foto sebelumnya"><Icon name="arrow" /></Button>
          <Button type="button" variant="secondary" size="icon" className="gallery-nav gallery-next" onClick={() => show(current + 1)} aria-label="Foto berikutnya"><Icon name="arrow" /></Button>
        </>}
        <span className="gallery-counter" aria-live="polite">{String(current + 1).padStart(2, "0")} <span>/ {String(photos.length).padStart(2, "0")}</span></span>
      </div>
      <div className="gallery-caption"><span>Setiap detail, lebih dekat.</span><span><Icon name="expand" /> Perbesar untuk melihat detail</span></div>
      {multiple && (
        <div className="gallery-thumbs" role="group" aria-label="Pilih foto">
          {photos.map((src, index) => (
            <button type="button" key={src} className="gallery-thumb" aria-current={index === current}
              aria-label={`Lihat foto ${index + 1}`} onClick={() => show(index)}>
              <Image src={src} alt="" fill unoptimized sizes="88px" style={{ objectFit: "contain" }} />
            </button>
          ))}
        </div>
      )}
      <dialog ref={dialog} className="gallery-lightbox" aria-label={`Foto diperbesar: ${name}`}
        onClose={() => setZoomed(false)} onClick={(event) => { if (event.target === event.currentTarget) setZoomed(false); }} onKeyDown={onKeyDown}>
        <div className="gallery-lightbox-header"><span>{name}</span><Button type="button" variant="secondary" size="icon" className="gallery-expand" aria-label="Tutup foto" onClick={() => setZoomed(false)}><Icon name="close" /></Button></div>
        {zoomed && <div className="gallery-lightbox-image"><Image src={photos[current]} alt={`${name} — foto ${current + 1}`} fill unoptimized sizes="95vw" style={{ objectFit: "contain" }} /></div>}
        <div className="gallery-lightbox-controls">
          <Button type="button" variant="secondary" size="icon" className="gallery-nav" disabled={!multiple} aria-label="Foto sebelumnya" onClick={() => show(current - 1)}><Icon name="arrow" style={{ transform: "rotate(180deg)" }} /></Button>
          <span aria-live="polite">{current + 1} / {photos.length}</span>
          <Button type="button" variant="secondary" size="icon" className="gallery-nav" disabled={!multiple} aria-label="Foto berikutnya" onClick={() => show(current + 1)}><Icon name="arrow" /></Button>
        </div>
      </dialog>
    </div>
  );
}
