"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { readOrder, type OrderSummary } from "@/lib/checkout";
import { Icon } from "./icons";
import { Spinner } from "./spinner";

// Mirrors UploadPaymentProofRequest on the backend.
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Browser-only: the XSRF echo Laravel expects. Content-Type is left to the browser for multipart. */
function uploadHeaders(): Headers {
  const headers = new Headers({ Accept: "application/json" });
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (csrf) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrf.slice("XSRF-TOKEN=".length)));
  return headers;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function checkFile(file: File, proof: string): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `${capitalize(proof)} harus berupa gambar JPG, PNG, WebP, atau PDF.`;
  if (file.size > MAX_BYTES) return `Ukuran ${proof} maksimal 5 MB.`;
  return null;
}

export function PaymentProofForm({ order, onUploaded }: {
  order: OrderSummary;
  onUploaded: (order: OrderSummary) => void;
}) {
  const [replacing, setReplacing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  // QRIS dibayar lewat e-wallet atau m-banking, jadi istilah "transfer" dan "rekening" tidak cocok.
  const qris = order.payment_method === "qris";
  const proof = qris ? "bukti pembayaran" : "bukti transfer";
  const proofLabel = capitalize(proof);

  // Release each preview URL once it is replaced or the form goes away.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(chosen: File | null) {
    setFile(chosen);
    setPreview(chosen?.type.startsWith("image/") ? URL.createObjectURL(chosen) : null);
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    setMessage(null);
    const problem = chosen && checkFile(chosen, proof);
    if (problem) {
      event.target.value = "";
      setMessage({ text: problem, error: true });
    }
    pick(problem ? null : chosen);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!file) { setMessage({ text: `Pilih file ${proof}.`, error: true }); return; }
    const fields = new FormData(event.currentTarget);
    const body = new FormData();
    body.set("proof", file);
    body.set("sender_name", String(fields.get("sender_name") || "").trim());
    body.set("sender_account", String(fields.get("sender_account") || "").trim());

    setPending(true); setMessage(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/payment-proof`, {
        method: "POST", credentials: "same-origin", headers: uploadHeaders(), body,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(response.status < 500 && typeof data?.message === "string" ? data.message : `${proofLabel} belum dapat dikirim. Silakan coba lagi.`);
      }
      onUploaded(readOrder(data));
      setReplacing(false);
      pick(null);
      setMessage({ text: `${proofLabel} terkirim. Toko akan memverifikasi pembayaran Anda.`, error: false });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : `${proofLabel} belum dapat dikirim.`, error: true });
    } finally { setPending(false); }
  }

  const feedback = message && (
    <p className={`cart-feedback ${message.error ? "cart-feedback-error" : ""}`} role={message.error ? "alert" : "status"}>{message.text}</p>
  );

  if (order.proof_uploaded && !replacing) {
    return (
      <section className="payment-proof" aria-labelledby="payment-proof-title">
        <div className="payment-section-heading">
          <span className="payment-small-icon" data-done="true"><Icon name="check" /></span>
          <div>
            <h3 id="payment-proof-title">{proofLabel} terkirim</h3>
            <p>{order.sender_name ? `Dari ${order.sender_name}. ` : ""}Toko sedang memverifikasi pembayaran Anda.</p>
          </div>
        </div>
        {feedback}
        <Button type="button" variant="text" size="sm" onClick={() => { setReplacing(true); setMessage(null); }}>Ganti {proof}</Button>
      </section>
    );
  }

  return (
    <section className="payment-proof" aria-labelledby="payment-proof-title">
      <div className="payment-section-heading">
        <span className="payment-small-icon"><Icon name="upload" /></span>
        <div>
          <h3 id="payment-proof-title">Unggah {proof}</h3>
          <p>{qris ? "Sudah membayar?" : "Sudah transfer?"} Kirim buktinya agar toko bisa memverifikasi lebih cepat.</p>
        </div>
      </div>
      <form className="payment-proof-form" onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending}>
          <legend className="sr-only">{proofLabel}</legend>
          <label className="payment-proof-drop" data-filled={Boolean(file)}>
            <input type="file" name="proof" className="sr-only" onChange={choose}
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" />
            {preview
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview.
              ? <img src={preview} alt={`Pratinjau ${proof}`} />
              : <Icon name={file ? "check" : "upload"} width={24} height={24} />}
            <span>
              <strong>{file ? file.name : `Pilih foto atau PDF ${proof}`}</strong>
              <small>{file ? "Ketuk untuk mengganti file" : "JPG, PNG, WebP, atau PDF · maks. 5 MB"}</small>
            </span>
          </label>
          <div className="checkout-fields">
            <div className="checkout-field">
              <label htmlFor="proof-sender-name">{qris ? "Nama pengirim" : "Nama pemilik rekening"} <span className="field-optional">(opsional)</span></label>
              <input id="proof-sender-name" name="sender_name" maxLength={255} autoComplete="name" defaultValue={order.sender_name ?? ""} />
            </div>
            <div className="checkout-field">
              <label htmlFor="proof-sender-account">{qris ? "Nama akun e-wallet / bank pengirim" : "Bank & nomor rekening pengirim"} <span className="field-optional">(opsional)</span></label>
              <input id="proof-sender-account" name="sender_account" maxLength={64} placeholder={qris ? "Contoh: GoPay 081234567890" : "Contoh: BRI 1234567890"} />
            </div>
          </div>
          <div className="payment-proof-actions">
            <Button type="submit" disabled={pending || !file}>
              {pending ? <Spinner size={18} label="Mengirim bukti…" /> : <Icon name="upload" />}
              {pending ? "Mengirim…" : `Kirim ${proof}`}
            </Button>
            {order.proof_uploaded && (
              <Button type="button" variant="text" onClick={() => { setReplacing(false); pick(null); setMessage(null); }}>Batal</Button>
            )}
          </div>
        </fieldset>
        {feedback}
      </form>
    </section>
  );
}
