"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerQuery } from "@/lib/customer-query";
import { isShippingAddress, jsonHeaders, type AddressDetails, type RegionMatch } from "@/lib/checkout";
import { RegionSearch } from "./region-search";

type FieldErrors = Record<string, string[]>;

export function AddressForm({ onSaved, submitLabel = "Simpan alamat" }: {
  onSaved: (address: AddressDetails) => void;
  submitLabel?: string;
}) {
  const [region, setRegion] = useState<RegionMatch | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const lock = useRef(false);
  // Signed-in buyers start with their account email; it stays editable.
  const { data: customer } = useQuery(customerQuery);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (!region) {
      setMessage({ text: "Pilih kelurahan/desa tujuan pengiriman.", error: true });
      return;
    }
    const fields = new FormData(event.currentTarget);
    const body = {
      recipent: String(fields.get("recipent") || "").trim(),
      contact: String(fields.get("contact") || "").trim(),
      email: String(fields.get("email") || "").trim(),
      address: String(fields.get("address") || "").trim(),
      address_code: region.code,
    };
    if (!body.recipent || !body.contact || !body.email || !body.address) {
      setMessage({ text: "Lengkapi semua kolom alamat.", error: true });
      return;
    }
    lock.current = true; setPending(true); setErrors({}); setMessage(null);
    try {
      const response = await fetch("/api/address", { method: "POST", credentials: "same-origin", headers: jsonHeaders(), body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 422 && data?.errors && typeof data.errors === "object") {
          const validErrors: FieldErrors = {};
          for (const [key, value] of Object.entries(data.errors)) {
            if (Array.isArray(value)) validErrors[key] = value.filter((entry): entry is string => typeof entry === "string");
          }
          setErrors(validErrors);
        }
        throw new Error(response.status < 500 && typeof data?.message === "string" ? data.message : "Alamat belum dapat disimpan. Silakan coba lagi.");
      }
      const address = data?.data ?? data;
      // The add endpoint can return an empty success response, with no address id.
      const saved: AddressDetails = isShippingAddress(address) ? address : body;
      // The chosen match already names the area if the response does not.
      onSaved({ ...saved, region: saved.region || region.label });
      setMessage({ text: "Alamat berhasil disimpan.", error: false });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Alamat belum dapat disimpan.", error: true });
    } finally { lock.current = false; setPending(false); }
  }

  return (
    <form className="address-form" onSubmit={submit} aria-busy={pending}>
      <p className="checkout-description">{customer ? "Tambahkan alamat pengiriman." : "Tambahkan alamat pengiriman. Bisa tanpa login."} Kolom bertanda * wajib diisi.</p>
      <fieldset disabled={pending}>
        <legend className="sr-only">Alamat baru</legend>
        <div className="checkout-fields">
          <div className="checkout-field checkout-field-wide"><label htmlFor="address-recipient">Nama penerima <span className="required-indicator" aria-hidden="true">*</span></label><input id="address-recipient" name="recipent" autoComplete="shipping name" required maxLength={255} /></div>
          <RegionSearch value={region} disabled={pending}
            onChange={(selected) => { setRegion(selected); setMessage(null); setErrors({}); }} />
          <div className="checkout-field checkout-field-wide"><label htmlFor="address-detail">Alamat lengkap <span className="required-indicator" aria-hidden="true">*</span></label><textarea id="address-detail" name="address" autoComplete="shipping street-address" required maxLength={255} rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, dan patokan" /></div>
          <div className="checkout-field"><label htmlFor="address-contact">Nomor telepon <span className="required-indicator" aria-hidden="true">*</span></label><input id="address-contact" name="contact" type="tel" autoComplete="shipping tel" inputMode="tel" required maxLength={16} pattern="[+0-9 ()-]{6,16}" placeholder="Contoh: 081234567890" /></div>
          <div className="checkout-field"><label htmlFor="address-email">Alamat email <span className="required-indicator" aria-hidden="true">*</span></label><input key={customer?.email ?? "guest"} defaultValue={customer?.email ?? ""} id="address-email" name="email" type="email" autoComplete="shipping email" inputMode="email" required maxLength={255} placeholder="Contoh: contoh@gmail.com" /></div>
        </div>
        <Button type="submit" disabled={pending || !region}>{pending ? "Menyimpan…" : submitLabel}</Button>
      </fieldset>
      {message && <p className={`cart-feedback ${message.error ? "cart-feedback-error" : ""}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
      {Object.values(errors).flat().length > 0 && <ul className="address-errors" aria-label="Kesalahan alamat">{Object.values(errors).flat().map((error, index) => <li key={index}>{error}</li>)}</ul>}
    </form>
  );
}
