"use client";

import { useState } from "react";

/**
 * Video YouTube yang ringan: hanya gambar sampul sampai diklik, lalu pemutar dari
 * youtube-nocookie.com dimuat. Tanpa skrip YouTube dan tanpa cookie pelacak sebelum pembeli memilih memutar.
 */
export function VideoEmbed({ videoId, title, className }: { videoId: string; title: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  // Hanya ID YouTube yang valid; komponen ini juga dipakai tema, jadi diperiksa di sini.
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;

  return (
    <div className={`video-embed ${className ?? ""}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Putar video: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Sampul dari i.ytimg.com, bukan gambar toko. */}
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="video-embed-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
