"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { customerQuery } from "@/lib/customer-query";
import { unreadNotificationsQuery } from "@/lib/notification-query";
import { Icon } from "./icons";
import { Spinner } from "./spinner";

export function AccountMenu() {
  const pathname = usePathname();
  const { data: customer, isPending } = useQuery(customerQuery);
  // Only asked once someone is signed in; guests have no notifications.
  const { data: unread = 0 } = useQuery({ ...unreadNotificationsQuery, enabled: Boolean(customer) });

  if (isPending) return <span className="account-link account-placeholder" aria-hidden="true"><Spinner size={18} /></span>;

  if (!customer) {
    return (
      <Link className="account-link" href={`/login?next=${encodeURIComponent(pathname)}`}>
        <Icon name="user" />
        <span className="account-label">Masuk</span>
      </Link>
    );
  }

  return (
    <Link className="account-link" href="/profile" aria-label={`Profil ${customer.name}${unread > 0 ? `, ${unread} pemberitahuan belum dibaca` : ""}`} aria-current={pathname.startsWith("/profile") ? "page" : undefined}>
      {customer.avatar
        // eslint-disable-next-line @next/next/no-img-element -- Google avatar, any host.
        ? <img className="account-avatar" src={customer.avatar} alt="" referrerPolicy="no-referrer" />
        : <Icon name="user" />}
      <span className="account-label">{customer.name.split(" ")[0]}</span>
      {unread > 0 && <span className="account-unread" aria-hidden="true" />}
    </Link>
  );
}
