"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount, useCustomer } from "@sellosy/theme";
import { BagIcon, UserIcon } from "./icons";
import s from "./editorial.module.css";

/** Tombol akun dan keranjang buatan tema, memakai hook SDK alih-alih komponen bawaan. */
export function HeaderActions({ accounts }: { accounts: boolean }) {
  const pathname = usePathname();
  const { count, error } = useCartCount();
  const { customer } = useCustomer();

  return (
    <>
      {accounts && (
        <Link href={customer ? "/profile" : `/login?next=${encodeURIComponent(pathname)}`} className={s.iconLink}
          aria-label={customer ? `Profil ${customer.name}` : "Masuk"}>
          <UserIcon />
        </Link>
      )}
      <Link href="/cart" className={s.bag} aria-label={`Keranjang${count ? `: ${count} barang` : ""}`}>
        <BagIcon />
        <span>Tas ({error ? "!" : count ?? 0})</span>
      </Link>
    </>
  );
}
