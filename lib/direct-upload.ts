import { jsonHeaders } from "./checkout";
import { readUploadTicket } from "./upload-ticket";

export type UploadPurpose = "review_photo" | "review_video" | "payment_proof";

/**
 * PUT ke S3 gagal di jaringan (mis. CORS bucket belum dipasang): pemanggil kembali mengunggah lewat
 * server. Penolakan dari backend (jenis/ukuran file) tetap Error biasa dan ditampilkan ke pembeli.
 */
export class DirectUploadUnavailable extends Error {}

/**
 * Unggah satu file pembeli langsung ke S3, tanpa lewat server toko: minta URL presigned ke backend, lalu
 * PUT filenya ke S3. Mengembalikan key untuk dikirim bersama ulasan atau bukti transfer; null bila toko
 * memakai unggah lewat server (pemanggil lalu mengirim filenya seperti biasa). Browser saja.
 */
export async function directUpload(file: File, options: {
  orderId: number;
  purpose: UploadPurpose;
  itemId?: number;
  access?: { expires: string; signature: string };
  onProgress?: (loaded: number) => void;
}): Promise<string | null> {
  const query = options.access ? `?${new URLSearchParams(options.access)}` : "";
  const response = await fetch(`/api/orders/${options.orderId}/uploads${query}`, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(),
    body: JSON.stringify({ purpose: options.purpose, content_type: file.type, size: file.size, item_id: options.itemId ?? null }),
  });
  const data = await response.json().catch(() => null) as { message?: unknown } | null;
  if (!response.ok) {
    throw new Error(response.status < 500 && typeof data?.message === "string" ? data.message : "File belum dapat diunggah. Coba lagi.");
  }
  const ticket = readUploadTicket(data);
  if (!ticket) throw new Error("File belum dapat diunggah. Coba lagi.");
  if (ticket.mode === "multipart") return null;
  await put(ticket.url, ticket.headers, file, options.onProgress);
  return ticket.key;
}

/** PUT ke S3 lewat XHR, bukan fetch: fetch belum melaporkan progres unggahan. */
function put(url: string, headers: Record<string, string>, file: File, onProgress?: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => onProgress?.(event.loaded);
    request.onload = () => (request.status >= 200 && request.status < 300
      ? resolve()
      : reject(new DirectUploadUnavailable(`S3 menjawab ${request.status}`)));
    request.onerror = () => reject(new DirectUploadUnavailable("PUT ke S3 gagal"));
    request.send(file);
  });
}
