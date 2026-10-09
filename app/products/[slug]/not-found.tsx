import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="unavailable">
      <Icon name="box" />
      <h1>Produk tidak ditemukan</h1>
      <p>Produk tidak tersedia atau sudah tidak ditampilkan di toko.</p>
      <ButtonLink href="/">
        Lihat semua produk <Icon name="arrow" />
      </ButtonLink>
    </main>
  );
}
