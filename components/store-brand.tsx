"use client";

import Image from "next/image";
import { useState } from "react";

export function StoreBrand({ name, logo }: { name: string; logo?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) return <>{name}</>;

  return (
    <span className="store-brand-logo">
      <Image src={logo} alt={name} fill unoptimized sizes="(max-width: 700px) 28vw, 160px"
        style={{ objectFit: "contain", objectPosition: "left center" }} onError={() => setFailed(true)} />
    </span>
  );
}
