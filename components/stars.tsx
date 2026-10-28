/** Bintang rating 1–5 (bintang penuh, setengah dibulatkan), dengan teks untuk pembaca layar. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={["stars", className].filter(Boolean).join(" ")} role="img" aria-label={`${rating.toLocaleString("id-ID")} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} filled={star <= full} />)}
    </span>
  );
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-filled={filled || undefined}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  );
}
