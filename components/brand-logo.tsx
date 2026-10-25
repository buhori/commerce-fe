/**
 * Logo bank, e-wallet, atau kurir dari backend (public/images/banks, public/images/couriers). Tidak
 * tampil apa-apa bila backend belum punya logo untuk merek itu, atau bila URL-nya bukan http(s).
 */
export function BrandLogo({ src, className = "payment-method-logo" }: { src?: string | null; className?: string }) {
  if (!src || !/^https?:\/\/[^\s/?#]+[^\s]*$/i.test(src)) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo kecil dari domain backend, tanpa optimasi.
    <img className={className} src={src} alt="" width={40} height={24} loading="lazy" referrerPolicy="no-referrer" />
  );
}
