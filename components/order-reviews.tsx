"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { jsonHeaders, type ItemReview, type OrderLine } from "@/lib/checkout";
import { readReviewMedia } from "@/lib/reviews";
import { Icon } from "./icons";
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

/** Lampiran yang diterima toko (paket Business, sesuai Pengaturan Belanja toko). */
type Attachments = { photos: boolean; video: boolean };

/**
 * Ulasan pembeli untuk tiap barang di pesanan yang sudah diterima (POST /orders/{id}/items/{itemId}/review).
 * `access` diisi di halaman ulasan dari email, supaya bisa mengulas dari perangkat lain. `photos`/`video`:
 * pembeli boleh melampirkan foto dan satu video.
 */
export function OrderReviews({ orderId, items, access, photos = false, video = false }: { orderId: number; items: OrderLine[]; access?: ReviewAccess; photos?: boolean; video?: boolean }) {
  const reviewable = items.filter((item): item is OrderLine & { id: number } => item.id !== null);
  if (reviewable.length === 0) return null;

  return (
    <section className="order-reviews payment-card" aria-labelledby="order-reviews-title">
      <h2 id="order-reviews-title">Beri ulasan</h2>
      <p className="order-reviews-lead">Pesanan sudah diterima. Ceritakan pengalamanmu agar pembeli lain terbantu.</p>
      <ul>
        {reviewable.map((item) => <ItemReview key={item.id} orderId={orderId} item={item} access={access} attachments={{ photos, video }} />)}
      </ul>
    </section>
  );
}

function ItemReview({ orderId, item, access, attachments }: { orderId: number; item: OrderLine & { id: number }; access?: ReviewAccess; attachments: Attachments }) {
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
      <ProductLink slug={item.slug}>
        <span className="payment-product-art" aria-hidden="true"><ProductImage key={item.image} src={item.image} name="" /></span>
        <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}</div>
      </ProductLink>

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
          {(attachments.photos || attachments.video) && (
            <ReviewAttachments
              allowed={attachments}
              photos={photos}
              video={video}
              replacing={(saved?.media.length ?? 0) > 0}
              onPhotos={setPhotos}
              onVideo={setVideo}
              onError={setError}
            />
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

/** Nama dan foto barang membuka halaman produknya; barang yang produknya sudah dihapus tidak berupa tautan. */
function ProductLink({ slug, children }: { slug: string | null; children: React.ReactNode }) {
  return slug
    ? <Link className="order-review-product" href={`/products/${encodeURIComponent(slug)}`}>{children}</Link>
    : <div className="order-review-product">{children}</div>;
}

const tooBig = (file: File, megabytes: number) => file.size > megabytes * 1024 * 1024;

/**
 * Foto (sampai MAX_PHOTOS) dan satu video untuk ulasan: pratinjau, hapus per file, dan tombol tambah.
 * File yang salah format atau terlalu besar ditolak saat dipilih, sebelum dikirim.
 */
function ReviewAttachments({ allowed, photos, video, replacing, onPhotos, onVideo, onError }: {
  allowed: Attachments;
  photos: File[];
  video: File | null;
  replacing: boolean;
  onPhotos: (photos: File[]) => void;
  onVideo: (video: File | null) => void;
  onError: (message: string | null) => void;
}) {
  function addPhotos(files: FileList | null) {
    const picked = Array.from(files ?? []);
    if (picked.some((file) => !PHOTO_TYPES.split(",").includes(file.type))) return onError("Foto harus berformat JPG, PNG, WebP, atau GIF.");
    if (picked.some((file) => tooBig(file, PHOTO_MAX_MB))) return onError(`Ukuran setiap foto paling besar ${PHOTO_MAX_MB} MB.`);
    if (photos.length + picked.length > MAX_PHOTOS) onError(`Paling banyak ${MAX_PHOTOS} foto; foto lainnya tidak ditambahkan.`);
    else onError(null);
    onPhotos([...photos, ...picked].slice(0, MAX_PHOTOS));
  }

  function pickVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!VIDEO_TYPES.split(",").includes(file.type)) return onError("Video harus berformat MP4, WebM, atau MOV.");
    if (tooBig(file, VIDEO_MAX_MB)) return onError(`Ukuran video paling besar ${VIDEO_MAX_MB} MB.`);
    onError(null);
    onVideo(file);
  }

  return (
    <div className="review-attachments">
      <ul className="review-attachments-grid">
        {photos.map((photo, index) => (
          <li key={`${photo.name}-${photo.lastModified}-${index}`}>
            <FilePreview file={photo} />
            <button type="button" className="review-attachment-remove" aria-label={`Hapus foto ${index + 1}`} onClick={() => onPhotos(photos.filter((_, other) => other !== index))}>
              <Icon name="close" />
            </button>
          </li>
        ))}
        {video && (
          <li className="review-attachment-video">
            <FilePreview file={video} />
            <button type="button" className="review-attachment-remove" aria-label="Hapus video" onClick={() => onVideo(null)}>
              <Icon name="close" />
            </button>
          </li>
        )}
        {allowed.photos && photos.length < MAX_PHOTOS && (
          <li>
            <label className="review-attachment-add">
              <Icon name="upload" />
              <span>Foto</span>
              <small>{photos.length}/{MAX_PHOTOS}</small>
              {/* Nilai dikosongkan setelah dipilih, supaya foto yang sama bisa dipilih lagi setelah dihapus. */}
              <input type="file" accept={PHOTO_TYPES} multiple className="sr-only" onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} />
            </label>
          </li>
        )}
        {allowed.video && !video && (
          <li>
            <label className="review-attachment-add">
              <Icon name="upload" />
              <span>Video</span>
              <small>0/1</small>
              <input type="file" accept={VIDEO_TYPES} className="sr-only" onChange={(event) => { pickVideo(event.target.files); event.target.value = ""; }} />
            </label>
          </li>
        )}
      </ul>
      <p className="review-attachments-hint">
        {[allowed.photos && `Foto maks. ${PHOTO_MAX_MB} MB`, allowed.video && `video maks. ${VIDEO_MAX_MB} MB (MP4, WebM, MOV)`].filter(Boolean).join(", ")}.
        {replacing && " Lampiran baru mengganti yang sebelumnya."}
      </p>
    </div>
  );
}

/** Pratinjau file yang dipilih, dari object URL yang dilepas lagi saat file diganti atau dihapus. */
function FilePreview({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return file.type.startsWith("video/")
    ? <video src={url} muted playsInline preload="metadata" />
    // eslint-disable-next-line @next/next/no-img-element -- object URL lokal, bukan gambar dari server
    : <img src={url} alt="" />;
}
