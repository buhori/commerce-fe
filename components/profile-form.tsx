"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Customer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Button } from "./ui/button";
import { customerKey } from "@/lib/customer-query";

type Message = { text: string; error: boolean } | null;

export function ProfileForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim() || null;

    setPending(true);
    setMessage(null);
    setErrors({});
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: value("name"),
          phone: value("phone")?.replace(/[\s()-]/g, "") ?? null,
          gender: value("gender"),
          birth_date: value("birth_date"),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(body.errors ?? {});
        setMessage({ text: body.message ?? "Profil belum dapat disimpan.", error: true });
        return;
      }
      client.setQueryData(customerKey, body.data);
      setMessage({ text: "Profil tersimpan.", error: false });
      router.refresh();
    } catch {
      setMessage({ text: "Profil belum dapat disimpan. Periksa koneksi Anda.", error: true });
    } finally {
      setPending(false);
    }
  }

  const fieldError = (name: string) => errors[name]?.[0];

  return (
    <form className="profile-card" onSubmit={submit} aria-busy={pending} noValidate>
      <div className="checkout-fields">
        <div className="checkout-field checkout-field-wide">
          <label htmlFor="profile-name">Nama lengkap</label>
          <input id="profile-name" name="name" defaultValue={customer.name} autoComplete="name" required maxLength={255} aria-invalid={!!fieldError("name")} />
          {fieldError("name") && <p className="field-error">{fieldError("name")}</p>}
        </div>
        <div className="checkout-field checkout-field-wide">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" value={customer.email} readOnly disabled aria-describedby="profile-email-hint" />
          <p className="field-hint" id="profile-email-hint">Mengikuti akun Google yang dipakai untuk masuk.</p>
        </div>
        <div className="checkout-field">
          <label htmlFor="profile-phone">Nomor HP</label>
          <input id="profile-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={customer.phone ?? ""} maxLength={20} placeholder="081234567890" aria-invalid={!!fieldError("phone")} />
          {fieldError("phone") && <p className="field-error">{fieldError("phone")}</p>}
        </div>
        <div className="checkout-field">
          <label htmlFor="profile-birth">Tanggal lahir</label>
          <input id="profile-birth" name="birth_date" type="date" defaultValue={customer.birth_date ?? ""} max={new Date().toISOString().slice(0, 10)} aria-invalid={!!fieldError("birth_date")} />
          {fieldError("birth_date") && <p className="field-error">{fieldError("birth_date")}</p>}
        </div>
        <fieldset className="checkout-field-wide profile-gender">
          <legend>Jenis kelamin</legend>
          <label><input type="radio" name="gender" value="male" defaultChecked={customer.gender === "male"} /> Laki-laki</label>
          <label><input type="radio" name="gender" value="female" defaultChecked={customer.gender === "female"} /> Perempuan</label>
        </fieldset>
      </div>
      <div className="profile-form-footer">
        {customer.joined_at && <small>Bergabung sejak {formatDate(new Date(customer.joined_at))}</small>}
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</Button>
      </div>
      {message && <p className={`cart-feedback ${message.error ? "cart-feedback-error" : ""}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    </form>
  );
}
