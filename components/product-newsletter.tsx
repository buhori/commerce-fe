"use client";

import { useId, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { customerQuery } from "@/lib/customer-query";
import { readNewsletterEmail, subscribeToProduct } from "@/lib/product-newsletter";
import { Icon } from "./icons";

/**
 * Logika form "Kabari saya" untuk produk segera hadir (product.newsletter), tanpa markup: tema memakai ini untuk
 * tampilannya sendiri. Email pembeli yang masuk terisi otomatis selama belum diketik ulang.
 */
export function useProductNewsletter(productId: number) {
  const { data: customer } = useQuery(customerQuery);
  const [typed, setTyped] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const email = typed ?? customer?.email ?? "";

  function changeEmail(value: string) {
    setTyped(value);
    setError(null);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (status === "sending") return;
    const checked = readNewsletterEmail(email);
    if (checked.error !== null) {
      setError(checked.error);
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await subscribeToProduct(productId, checked.email);
      setSavedEmail(checked.email);
      setStatus("done");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Email belum dapat disimpan. Silakan coba lagi.");
      setStatus("idle");
    }
  }

  return {
    email, changeEmail, submit, error,
    sending: status === "sending",
    /** Sudah terdaftar: tampilkan pesan terima kasih (savedEmail) sebagai ganti form. */
    done: status === "done",
    savedEmail,
    /** Daftarkan email lain setelah berhasil. */
    reset: () => { setStatus("idle"); setTyped(""); setSavedEmail(null); },
  };
}

/** Pengganti tombol beli untuk produk segera hadir: pembeli meninggalkan email dan dikabari saat tersedia. */
export function ProductNewsletter({ productId, className }: { productId: number; className?: string }) {
  const id = useId();
  const { email, changeEmail, submit, error, sending, done, savedEmail, reset } = useProductNewsletter(productId);

  return (
    <section className={["product-newsletter", className].filter(Boolean).join(" ")} aria-labelledby={`${id}-title`}>
      <div className="product-newsletter-heading">
        <span className="product-newsletter-icon" aria-hidden="true"><Icon name="mail" /></span>
        <div>
          <h2 id={`${id}-title`}>Segera hadir</h2>
          <p>Produk ini belum bisa dibeli. Tinggalkan email, kami kabari begitu tersedia.</p>
        </div>
      </div>
      {done ? (
        <div className="product-newsletter-done" role="status">
          <p><Icon name="check" /> Terima kasih! Kami akan mengabari <strong>{savedEmail}</strong> saat produk ini tersedia.</p>
          <button type="button" className="product-newsletter-again" onClick={reset}>Pakai email lain</button>
        </div>
      ) : (
        <form className="product-newsletter-form" onSubmit={(event) => void submit(event)} noValidate>
          <label htmlFor={`${id}-email`}>Alamat email</label>
          <div className="product-newsletter-row">
            <input
              id={`${id}-email`} type="email" name="email" autoComplete="email" inputMode="email" maxLength={255} required
              placeholder="contoh@gmail.com" value={email} disabled={sending}
              aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => changeEmail(event.target.value)}
            />
            <Button type="submit" disabled={sending}>{sending ? "Menyimpan…" : "Kabari saya"}</Button>
          </div>
          {error && <p className="product-newsletter-error" id={`${id}-error`} role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
