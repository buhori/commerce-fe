import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="unavailable">
      <h1>Kategori tidak ditemukan</h1>
      <ButtonLink href="/">Lihat semua produk</ButtonLink>
    </main>
  );
}
