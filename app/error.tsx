"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="unavailable">
      <h1>Terjadi kendala</h1>
      <p>Halaman belum dapat ditampilkan. Silakan coba lagi.</p>
      <Button onClick={reset}>
        Coba lagi
      </Button>
    </main>
  );
}
