"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function Error() {
  return (
    <main className="unavailable">
      <h1>Detail produk belum dapat dimuat</h1>
      <p>Koneksi ke toko sedang terganggu. Silakan coba lagi.</p>
      <Button onClick={() => window.location.reload()}>
        Coba lagi
      </Button>
      <ButtonLink variant="secondary" href="/">
        Lihat semua produk
      </ButtonLink>
    </main>
  );
}
