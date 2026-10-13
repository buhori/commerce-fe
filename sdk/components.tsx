import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { NavigationLink, StorePage } from "@/lib/store-api";

/** Tautan "Built with Sellosy" ke situs platform, dengan UTM supaya kunjungan dari toko terukur. */
const PLATFORM_LINK = `${(process.env.PLATFORM_URL || "https://sellosy.com").replace(/\/$/, "")}/?utm_source=storefront&utm_medium=footer&utm_campaign=built-with`;

/** Wajib ada di footer setiap tema. */
export function BuiltWith({ className = "built-with" }: { className?: string }) {
  return (
    <a className={className} href={PLATFORM_LINK} target="_blank" rel="noopener">
      Built with
      <Image src="/sellosy-logo.png" alt="Sellosy" width={80} height={24} />
    </a>
  );
}

/**
 * Pencarian produk: form GET biasa ke "/", jadi tetap jalan sebelum JavaScript dimuat.
 * `children` tampil sebelum kolom isian (mis. ikon); tombol kirim opsional.
 */
export function SearchForm({ defaultValue = "", placeholder = "Cari produk", className, buttonLabel, children }: {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  buttonLabel?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <form className={className} action="/" method="get" role="search">
      {children}
      <input type="search" name="q" defaultValue={defaultValue} placeholder={placeholder}
        aria-label="Cari produk" maxLength={100} enterKeyHint="search" />
      {buttonLabel && <button type="submit">{buttonLabel}</button>}
    </form>
  );
}

/**
 * Satu tautan menu dari navigation builder: halaman toko lewat next/link, situs lain atau
 * "buka di tab baru" lewat <a> biasa. Induk dropdown tanpa tujuan (href null) menjadi <span>.
 */
export function SmartLink({ link, className, children }: { link: NavigationLink; className?: string; children?: ReactNode }) {
  const label = children ?? link.label;
  if (!link.href) return <span className={className}>{label}</span>;
  if (link.new_tab || !link.href.startsWith("/")) {
    return (
      <a className={className} href={link.href} {...(link.new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {label}
      </a>
    );
  }
  return <Link className={className} href={link.href}>{label}</Link>;
}

/** Isi halaman dari editor teks panel. HTML-nya sudah disanitasi backend; tema tidak boleh merender HTML sendiri. */
export function PageContent({ page, className }: { page: StorePage; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: page.content }} />;
}

export function Price({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  return <span className={className}>{formatPrice(amount, currency)}</span>;
}
