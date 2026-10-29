"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { readReviewPage, type ReviewPage } from "@/lib/reviews";
import { ReviewMediaList } from "./review-media";
import { Stars } from "./stars";

/**
 * Ulasan pembeli di halaman produk: ringkasan bintang dan daftar ulasan terbaru, dengan halaman
 * berikutnya dimuat di tempat. Pembeli mengulas dari halaman pesanannya setelah barang diterima.
 */
export function ProductReviews({ productId, initial }: { productId: number; initial: ReviewPage }) {
  const [reviews, setReviews] = useState(initial.reviews);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const { summary } = initial;

  async function loadMore() {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/products/${productId}/reviews?page=${page + 1}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("reviews");
      const next = readReviewPage(await response.json());
      setReviews((current) => [...current, ...next.reviews.filter((review) => !current.some((seen) => seen.id === review.id))]);
      setPage(next.page);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="product-reviews container" id="ulasan" aria-labelledby="product-reviews-title">
      <div className="product-reviews-heading">
        <span className="detail-kicker">KATA PEMBELI</span>
        <h2 id="product-reviews-title">Ulasan</h2>
      </div>

      {summary.rating === null ? (
        <p className="product-reviews-empty">Belum ada ulasan untuk produk ini. Ulasan muncul setelah pembeli menerima pesanannya.</p>
      ) : (
        <div className="product-reviews-body">
          <div className="product-reviews-summary">
            <strong className="product-reviews-score">{summary.rating.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</strong>
            <Stars rating={summary.rating} />
            <span>{summary.count} ulasan</span>
            <dl className="product-reviews-bars">
              {([5, 4, 3, 2, 1] as const).map((stars) => (
                <div key={stars}>
                  <dt>{stars}</dt>
                  <dd><span style={{ width: `${summary.count ? (summary.distribution[stars] / summary.count) * 100 : 0}%` }} /></dd>
                  <dd>{summary.distribution[stars]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <ul className="product-reviews-list">
              {reviews.map((review) => (
                <li key={review.id}>
                  <div className="product-review-meta">
                    <Stars rating={review.rating} />
                    <strong>{review.name}</strong>
                    {review.created_at && <time dateTime={review.created_at}>{formatDate(new Date(review.created_at))}</time>}
                  </div>
                  {review.variant && <span className="product-review-variant">Varian: {review.variant}</span>}
                  {review.comment && <p>{review.comment}</p>}
                  <ReviewMediaList media={review.media} />
                </li>
              ))}
            </ul>
            {page < initial.lastPage && (
              <Button variant="secondary" onClick={loadMore} disabled={loading}>{loading ? "Memuat…" : "Muat lebih banyak"}</Button>
            )}
            {failed && <p className="product-reviews-error" role="alert">Ulasan belum bisa dimuat. Coba lagi.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
