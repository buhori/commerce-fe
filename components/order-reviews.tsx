"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { jsonHeaders, type ItemReview, type OrderLine } from "@/lib/checkout";
import { readReviewMedia } from "@/lib/reviews";
import { ProductImage } from "./product-image";
import { ReviewMediaList } from "./review-media";
import { StarIcon, Stars } from "./stars";

const MAX_LENGTH = 1000;
// Sama dengan Feedback::MAX_PHOTOS, PHOTO_MAX_KILOBYTES, dan VIDEO_MAX_KILOBYTES di backend.
const MAX_PHOTOS = 3;
const PHOTO_MAX_MB = 5;
const VIDEO_MAX_MB = 20;
const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_TYPES = "video/mp4,video/webm,video/quicktime";

/** Link bertanda tangan dari email permintaan ulasan, diteruskan saat mengirim ulasan. */
type ReviewAccess = { expires: string; signature: string };

/**
 * Ulasan pembeli untuk tiap barang di pesanan yang sudah diterima (POST /orders/{id}/items/{itemId}/review).
 * `access` diisi di halaman ulasan dari email, supaya bisa mengulas dari perangkat lain. `media`: toko
 * Business, pembeli boleh melampirkan foto dan satu video.
 */
export function OrderReviews({ orderId, items, access, media = false }: { orderId: number; items: OrderLine[]; access?: ReviewAccess; media?: boolean }) {
  const reviewable = items.filter((item): item is OrderLine & { id: number } => item.id !== null);
  if (reviewable.length === 0) return null;

  return (
    <section className="order-reviews payment-card" aria-labelledby="order-reviews-title">
      <h2 id="order-reviews-title">Beri ulasan</h2>
      <p className="order-reviews-lead">Pesanan sudah diterima. Ceritakan pengalamanmu agar pembeli lain terbantu.</p>
      <ul>
        {reviewable.map((item) => <ItemReview key={item.id} orderId={orderId} item={item} access={access} media={media} />)}
      </ul>
    </section>
  );
}

function ItemReview({ orderId, item, access, media }: { orderId: number; item: OrderLine & { id: number }; access?: ReviewAccess; media: boolean }) {
  const [saved, setSaved] = useState<ItemReview | null>(item.review);
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [editing, setEditing] = useState(item.review === null);
  const [rating, setRating] = useState(item.review?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(item.review?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("Pilih rating 1 sampai 5 bintang.");
      return;
    }
    if (photos.some((photo) => photo.size > PHOTO_MAX_MB * 1024 * 1024)) {
      setError(`Ukuran setiap foto paling besar ${PHOTO_MAX_MB} MB.`);
      return;
    }
    if (video && video.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(`Ukuran video paling besar ${VIDEO_MAX_MB} MB.`);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const query = access ? `?${new URLSearchParams(access)}` : "";
      const headers = jsonHeaders();
      let body: BodyInit = JSON.stringify({ rating, comment: comment.trim() || null });
      // Dengan lampiran: multipart, Content-Type (beserta boundary) diisi browser.
      if (photos.length > 0 || video) {
        const form = new FormData();
        form.set("rating", String(rating));
        if (comment.trim()) form.set("comment", comment.trim());
        photos.forEach((photo) => form.append("photos[]", photo));
        if (video) form.set("video", video);
        headers.delete("Content-Type");
        body = form;
      }
      const response = await fetch(`/api/orders/${orderId}/items/${item.id}/review${query}`, { method: "POST", credentials: "same-origin", headers, body });
      const data = await response.json().catch(() => null) as { message?: unknown; data?: { comment?: unknown; media?: unknown } } | null;
      if (!response.ok) {
        setError(response.status === 413 ? "File terlalu besar. Kurangi ukuran foto atau video." : typeof data?.message === "string" ? data.message : "Ulasan belum terkirim. Coba lagi.");
        return;
      }
      setSaved({ rating, comment: typeof data?.data?.comment === "string" ? data.data.comment : null, media: readReviewMedia(data?.data?.media) });
      setPhotos([]);
      setVideo(null);
      setEditing(false);
    } catch {
      setError("Ulasan belum terkirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <li className="order-review">
      <div className="order-review-product">
        <span className="payment-product-art" aria-hidden="true"><ProductImage key={item.image} src={item.image} name="" /></span>
        <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}</div>
      </div>

      {saved && !editing ? (
        <div className="order-review-saved">
          <Stars rating={saved.rating} />
          {saved.comment && <p>{saved.comment}</p>}
          <ReviewMediaList media={saved.media} />
          <p className="order-review-thanks">Terima kasih atas ulasannya. <Button variant="text" onClick={() => setEditing(true)}>Ubah ulasan</Button></p>
        </div>
      ) : (
        <form onSubmit={submit} className="order-review-form">
          <div className="star-picker" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} bintang`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
              >
                <StarIcon filled={star <= (hover || rating)} />
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={`review-${item.id}`}>Ulasan untuk {item.name}</label>
          <textarea
            id={`review-${item.id}`}
            value={comment}
            maxLength={MAX_LENGTH}
            rows={3}
            placeholder="Bagaimana kualitas barangnya? (opsional)"
            onChange={(event) => setComment(event.target.value)}
          />
          {media && (
            <div className="order-review-files">
              <label>
                <span>Foto <small>(maks. {MAX_PHOTOS}, {PHOTO_MAX_MB} MB per foto)</small></span>
                <input type="file" accept={PHOTO_TYPES} multiple onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS))} />
              </label>
              <label>
                <span>Video <small>(maks. {VIDEO_MAX_MB} MB)</small></span>
                <input type="file" accept={VIDEO_TYPES} onChange={(event) => setVideo(event.target.files?.[0] ?? null)} />
              </label>
              {saved && saved.media.length > 0 && <p>Foto atau video baru mengganti yang sebelumnya.</p>}
            </div>
          )}
          {error && <p className="order-review-error" role="alert">{error}</p>}
          <div className="order-review-actions">
            <Button type="submit" disabled={sending}>{sending ? "Mengirim…" : "Kirim ulasan"}</Button>
            {saved && <Button variant="text" onClick={() => { setEditing(false); setError(null); }}>Batal</Button>}
          </div>
        </form>
      )}
    </li>
  );
}
