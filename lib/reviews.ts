/** Foto atau video di ulasan (paket Business). */
export interface ReviewMedia {
  type: "image" | "video";
  url: string;
}

/** Ulasan produk dari pembeli (GET /products/{id}/reviews), dibaca dengan aman dari jawaban backend. */
export interface ProductReview {
  id: number;
  /** 1–5. */
  rating: number;
  comment: string | null;
  /** Nama pengulas yang sudah disingkat backend, mis. "Rina W.". */
  name: string;
  variant: string | null;
  created_at: string | null;
  /** Foto dulu, lalu video; kosong di toko tanpa ReviewMediaFeature. */
  media: ReviewMedia[];
}

export interface ReviewSummary {
  /** Rata-rata 1 desimal; null bila belum ada ulasan. */
  rating: number | null;
  count: number;
  /** Jumlah ulasan per bintang, 5 sampai 1. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewPage {
  reviews: ProductReview[];
  summary: ReviewSummary;
  page: number;
  lastPage: number;
}

export const EMPTY_REVIEWS: ReviewPage = {
  reviews: [],
  summary: { rating: null, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  page: 1,
  lastPage: 1,
};

/** Foto dan video ulasan; baris rusak atau bukan URL http(s) dibuang. */
export function readReviewMedia(value: unknown): ReviewMedia[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const { type, url, public_url: publicUrl } = row as Record<string, unknown>;
    const link = typeof url === "string" ? url : typeof publicUrl === "string" ? publicUrl : "";
    return (type === "image" || type === "video") && /^https?:\/\//.test(link) ? [{ type, url: link }] : [];
  });
}

const count = (value: unknown) => (Number.isSafeInteger(value) && (value as number) > 0 ? (value as number) : 0);

function readReview(value: unknown): ProductReview[] {
  if (!value || typeof value !== "object") return [];
  const row = value as Record<string, unknown>;
  const rating = row.rating;
  if (!Number.isSafeInteger(row.id) || !Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) return [];
  return [{
    id: row.id as number,
    rating: rating as number,
    comment: typeof row.comment === "string" && row.comment.trim() ? row.comment : null,
    name: typeof row.name === "string" && row.name.trim() ? row.name : "Pembeli",
    variant: typeof row.variant === "string" && row.variant ? row.variant : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    media: readReviewMedia(row.media),
  }];
}

/** Baris rusak dibuang; jawaban yang tidak bisa dibaca dianggap belum ada ulasan. */
export function readReviewPage(data: unknown): ReviewPage {
  if (!data || typeof data !== "object") return EMPTY_REVIEWS;
  const body = data as { data?: unknown; meta?: Record<string, unknown>; summary?: Record<string, unknown> };
  const summary = body.summary ?? {};
  const distribution = (summary.distribution && typeof summary.distribution === "object" ? summary.distribution : {}) as Record<string, unknown>;
  const rating = typeof summary.rating === "number" && summary.rating >= 1 && summary.rating <= 5 ? Math.round(summary.rating * 10) / 10 : null;
  const page = count(body.meta?.current_page) || 1;
  return {
    reviews: Array.isArray(body.data) ? body.data.flatMap(readReview) : [],
    summary: {
      rating,
      count: rating === null ? 0 : count(summary.count),
      distribution: { 5: count(distribution[5]), 4: count(distribution[4]), 3: count(distribution[3]), 2: count(distribution[2]), 1: count(distribution[1]) },
    },
    page,
    lastPage: Math.max(page, count(body.meta?.last_page) || 1),
  };
}

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);

/** Nama pengulas yang disamarkan, sama dengan Feedback::publicName di backend: huruf pertama tiap kata, sisanya bintang. */
export function maskName(name: string): string {
  const parts = words(name);
  return parts.length ? parts.map((word) => [...word][0] + "*".repeat(Math.max(0, [...word].length - 1))).join(" ") : "Pembeli";
}

/** Nama depan dan inisial nama belakang, mis. "Rina W.". */
export function shortName(name: string): string {
  const parts = words(name);
  if (parts.length < 2) return parts[0] ?? "Pembeli";
  return `${parts[0]} ${[...parts[parts.length - 1]][0].toUpperCase()}.`;
}
