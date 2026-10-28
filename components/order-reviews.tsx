"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { jsonHeaders, type OrderLine } from "@/lib/checkout";
import { ProductImage } from "./product-image";
import { StarIcon, Stars } from "./stars";

const MAX_LENGTH = 1000;

type Saved = { rating: number; comment: string | null };

/** Ulasan pembeli untuk tiap barang di pesanan yang sudah diterima (POST /orders/{id}/items/{itemId}/review). */
export function OrderReviews({ orderId, items }: { orderId: number; items: OrderLine[] }) {
  const reviewable = items.filter((item): item is OrderLine & { id: number } => item.id !== null);
  if (reviewable.length === 0) return null;

  return (
    <section className="order-reviews payment-card" aria-labelledby="order-reviews-title">
      <h2 id="order-reviews-title">Beri ulasan</h2>
      <p className="order-reviews-lead">Pesanan sudah diterima. Ceritakan pengalamanmu agar pembeli lain terbantu.</p>
      <ul>
        {reviewable.map((item) => <ItemReview key={item.id} orderId={orderId} item={item} />)}
      </ul>
    </section>
  );
}

function ItemReview({ orderId, item }: { orderId: number; item: OrderLine & { id: number } }) {
  const [saved, setSaved] = useState<Saved | null>(item.review);
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
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${item.id}/review`, {
        method: "POST", credentials: "same-origin", headers: jsonHeaders(), body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      const data = await response.json().catch(() => null) as { message?: unknown; data?: { rating?: unknown; comment?: unknown } } | null;
      if (!response.ok) {
        setError(typeof data?.message === "string" ? data.message : "Ulasan belum terkirim. Coba lagi.");
        return;
      }
      setSaved({ rating, comment: typeof data?.data?.comment === "string" ? data.data.comment : null });
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
