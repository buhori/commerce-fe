"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./icons";

export function ProductImage({ src, name, fit = "cover", priority = false }: { src?: string | null; name: string; fit?: "cover" | "contain"; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return (
    <div className="product-placeholder">
      <Icon name="box" />
      <span>Belum ada foto</span>
    </div>
  );
  return <Image src={src} alt={name} fill unoptimized priority={priority} sizes={priority ? "(max-width: 700px) 90vw, 45vw" : "(max-width: 600px) 50vw, 33vw"} style={{ objectFit: fit }} onError={() => setFailed(true)} />;
}
