/**
 * Jawaban POST /orders/{id}/uploads (DirectUploads di backend): URL presigned untuk mengunggah satu file
 * langsung ke S3, atau `multipart` bila disk toko tidak bisa memberinya (unggah lewat server seperti dulu).
 */
export type UploadTicket =
  | { mode: "multipart" }
  | { mode: "direct"; key: string; url: string; headers: Record<string, string> };

/** null bila jawabannya rusak; URL selain https ditolak, file pembeli tidak dikirim ke tempat lain. */
export function readUploadTicket(data: unknown): UploadTicket | null {
  const row = (data && typeof data === "object" && "data" in data ? data.data : data) as Record<string, unknown> | null;
  if (!row || typeof row !== "object") return null;
  if (row.mode === "multipart") return { mode: "multipart" };
  if (row.mode !== "direct" || typeof row.key !== "string" || !row.key || typeof row.url !== "string" || !/^https:\/\//.test(row.url)) return null;
  const headers = row.headers && typeof row.headers === "object" ? row.headers as Record<string, unknown> : {};
  return {
    mode: "direct",
    key: row.key,
    url: row.url,
    headers: Object.fromEntries(Object.entries(headers).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
  };
}
