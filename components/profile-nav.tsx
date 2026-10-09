"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { unreadNotificationsQuery } from "@/lib/notification-query";
import { Icon, type IconName } from "./icons";

const sections: { href: string; label: string; icon: IconName }[] = [
  { href: "/profile", label: "Akun Saya", icon: "user" },
  { href: "/profile/orders", label: "Pesanan Saya", icon: "box" },
  { href: "/profile/addresses", label: "Alamat", icon: "pin" },
  { href: "/profile/notifications", label: "Pemberitahuan", icon: "bell" },
  { href: "/profile/wishlist", label: "Wishlist", icon: "heart" },
];

export function ProfileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const { data: unread = 0 } = useQuery(unreadNotificationsQuery);

  async function logout() {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    // Cart, addresses and orders all change owner; start from a clean slate.
    client.clear();
    router.replace("/");
    router.refresh();
  }

  return (
    <nav className="profile-nav" aria-label="Menu profil">
      {sections.map((section) => (
        <Link key={section.href} href={section.href} aria-current={pathname === section.href ? "page" : undefined}>
          <Icon name={section.icon} />
          <span>{section.label}</span>
          {section.href === "/profile/notifications" && unread > 0 && (
            <span className="profile-nav-badge" aria-label={`${unread} belum dibaca`}>{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>
      ))}
      <button type="button" className="profile-logout" onClick={logout} disabled={leaving}>
        <Icon name="logout" />
        <span>{leaving ? "Keluar…" : "Logout"}</span>
      </button>
    </nav>
  );
}
