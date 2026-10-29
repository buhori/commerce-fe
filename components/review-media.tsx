import type { ReviewMedia } from "@/lib/reviews";

/** Foto dan video di ulasan (paket Business): foto dibuka penuh di tab baru, video diputar di tempat. */
export function ReviewMediaList({ media }: { media: ReviewMedia[] }) {
  if (media.length === 0) return null;

  return (
    <ul className="review-media" aria-label="Foto dan video ulasan">
      {media.map((item) => (
        <li key={item.url}>
          {item.type === "image" ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL CDN toko, ukuran sudah diperkecil backend */}
              <img src={item.url} alt="Foto dari pembeli" loading="lazy" />
            </a>
          ) : (
            <video src={item.url} controls preload="metadata" playsInline />
          )}
        </li>
      ))}
    </ul>
  );
}
