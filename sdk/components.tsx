import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandingGate } from "@/components/branding";
import { formatPrice } from "@/lib/format";
import type { NavigationLink, StorePage } from "@/lib/store-api";

/** Tautan "Built with Sellosy" ke situs platform, dengan UTM supaya kunjungan dari toko terukur. */
const PLATFORM_LINK = `${(process.env.PLATFORM_URL || "https://sellosy.com").replace(/\/$/, "")}/?utm_source=storefront&utm_medium=footer&utm_campaign=built-with`;

/**
 * Wajib ada di footer setiap tema. Toko whitelabel (store.hide_branding) tidak menampilkannya:
 * komponen ini yang memutuskan, jadi tema tetap selalu merender <BuiltWith />.
 */
export function BuiltWith({ className = "built-with" }: { className?: string }) {
  return (
    <BrandingGate>
      <a className={className} href={PLATFORM_LINK} target="_blank" rel="noopener">
        Built with
        <Image src="/sellosy-logo.png" alt="Sellosy" width={80} height={24} />
      </a>
    </BrandingGate>
  );
}

/**
 * Pencarian produk: form GET biasa ke /products, jadi tetap jalan sebelum JavaScript dimuat.
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
    <form className={className} action="/products" method="get" role="search">
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

/**
 * Tautan dari pengaturan widget builder (sudah diperiksa safeLink): path toko lewat next/link,
 * `#anchor` di halaman yang sama, situs lain di tab baru.
 */
export function SectionLink({ href, className, children }: { href: string; className?: string; children?: ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  if (href.startsWith("#")) return <a href={href} className={className}>{children}</a>;
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}

/**
 * Teks kaya widget Teks dari builder (`settings.body_html`). Sudah disanitasi backend; tema tidak boleh
 * merender HTML sendiri. Kelas `rich-text` memberi gaya dasar (paragraf, daftar, tautan, kutipan).
 */
export function RichText({ html, className }: { html: string | null; className?: string }) {
  if (!html) return null;
  return <div className={["rich-text", className].filter(Boolean).join(" ")} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Price({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  return <span className={className}>{formatPrice(amount, currency)}</span>;
}
