"use client";

import { Button } from "@/components/ui/button";
import { useId, useState } from "react";

// Keep long product information easy to scan, with the full text one click away.
const COLLAPSE_AFTER = 420;

export function ProductDescription({ text }: { text: string }) {
  const long = text.length > COLLAPSE_AFTER;
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="product-description">
      <h3>Tentang produk</h3>
      <p id={id} className="detail-description" data-collapsed={long && !open}>{text}</p>
      {long && (
        <Button type="button" variant="text" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
          {open ? "Tampilkan lebih sedikit" : "Lihat selengkapnya"}
        </Button>
      )}
    </section>
  );
}
