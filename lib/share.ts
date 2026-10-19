/**
 * Tombol "Bagikan" di halaman produk. Modul murni tanpa impor, supaya tautan tiap aplikasi bisa dites.
 */

export interface ShareInput {
  /** URL lengkap (dengan domain) yang dibagikan. */
  url: string;
  /** Judul singkat, mis. nama produk. */
  title: string;
}

export type ShareTarget = "whatsapp" | "facebook" | "x" | "telegram";

export interface ShareLink {
  target: ShareTarget;
  label: string;
  href: string;
}

/** Tautan bagikan per aplikasi; semuanya dibuka di tab baru tanpa SDK pihak ketiga. */
export function shareLinks({ url, title }: ShareInput): ShareLink[] {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return [
    // WhatsApp hanya punya satu kolom pesan: judul lalu URL di baris berikutnya.
    { target: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}` },
    { target: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { target: "x", label: "X", href: `https://x.com/intent/post?url=${u}&text=${text}` },
    { target: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${text}` },
  ];
}
