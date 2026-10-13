"use client";

import { Button } from "@/components/ui/button";

/** Dialog cetak browser; "Simpan sebagai PDF" ada di dialog yang sama. */
export function PrintButton({ children = "Cetak / Simpan PDF" }: { children?: string }) {
  return <Button onClick={() => window.print()}>{children}</Button>;
}
