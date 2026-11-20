/**
 * Produk "segera hadir" (product.newsletter): belum bisa dibeli, pembeli meninggalkan email dan dikabari backend
 * begitu penjual membukanya. Modul tanpa impor supaya bisa dites dan dipakai tema lewat useProductNewsletter().
 */

// Pemeriksaan ringan sebelum dikirim; backend tetap memvalidasi.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email yang sudah dirapikan, atau pesan kesalahan untuk ditampilkan di bawah isian. */
export function readNewsletterEmail(value: string): { email: string; error: null } | { email: null; error: string } {
  const email = value.trim();
  if (!email) return { email: null, error: "Masukkan alamat email." };
  if (email.length > 255 || !EMAIL.test(email)) return { email: null, error: "Alamat email belum benar." };
  return { email, error: null };
}

/** Daftarkan email untuk produk ini; melempar Error berisi pesan dari backend bila ditolak. */
export async function subscribeToProduct(productId: number, email: string, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher(`/api/products/${productId}/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.ok) return;

  let message = response.status === 429
    ? "Terlalu banyak percobaan. Coba lagi sebentar lagi."
    : "Email belum dapat disimpan. Silakan coba lagi.";
  try {
    const data = await response.json();
    // Pesan validasi pertama (mis. email salah) lebih jelas daripada pesan umum Laravel.
    const first = data?.errors && typeof data.errors === "object" ? Object.values(data.errors).flat()[0] : null;
    if (typeof first === "string" && first) message = first;
    else if (typeof data?.message === "string" && data.message && response.status !== 429) message = data.message;
  } catch {
    // Bukan JSON (mis. halaman error): pesan umum di atas.
  }
  throw new Error(message);
}
