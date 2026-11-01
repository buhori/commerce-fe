/**
 * Gambar yang dipilih pembeli bisa dibuka browser. Screenshot Android yang dipilih sebelum selesai ditulis
 * hanya berisi header (mis. PNG 62 byte) dan tampil kosong di toko; backend juga menolaknya
 * (ImageOptimizer::readable). File selain gambar (PDF) dilewati. Browser saja.
 */
export async function imageReadable(file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return true;
  if (typeof createImageBitmap === "function") {
    try {
      (await createImageBitmap(file)).close();
      return true;
    } catch {
      return false;
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image.naturalWidth > 0;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const UNREADABLE_IMAGE = "Gambar tidak bisa dibuka. Jika ini screenshot yang baru diambil, tunggu sebentar lalu pilih lagi.";
