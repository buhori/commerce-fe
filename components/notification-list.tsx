"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { CustomerNotification } from "@/lib/customer-api";
import { jsonHeaders } from "@/lib/checkout";
import { formatDate, formatRelative } from "@/lib/format";
import { unreadNotificationsKey } from "@/lib/notification-query";
import { Icon, type IconName } from "./icons";

// Keyed by the event after `order.`, e.g. `order.paid`.
const icons: Record<string, IconName> = {
  created: "bag",
  paid: "check",
  processed: "box",
  delivering: "truck",
  delivered: "check",
  done: "check",
};

function iconFor(type: string): IconName {
  return icons[type.replace(/^order\./, "")] ?? (type.startsWith("order.") ? "info" : "bell");
}

export function NotificationList({ notifications, unread: initialUnread }: {
  notifications: CustomerNotification[];
  unread: number;
}) {
  const client = useQueryClient();
  const [readIds, setReadIds] = useState<Set<number>>(() => new Set(notifications.filter((item) => item.is_read).map((item) => item.id)));
  const [unread, setUnread] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function syncCount(count: unknown) {
    if (!Number.isSafeInteger(count)) return;
    setUnread(count as number);
    client.setQueryData(unreadNotificationsKey, count as number);
  }

  function markRead(item: CustomerNotification) {
    if (readIds.has(item.id)) return;
    setReadIds((current) => new Set(current).add(item.id));
    // keepalive: the click usually navigates to the order right away.
    fetch(`/api/notifications/${item.id}/read`, { method: "POST", credentials: "same-origin", headers: jsonHeaders(), keepalive: true })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => syncCount(data?.count))
      .catch(() => null);
  }

  async function markAll() {
    setMarkingAll(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST", credentials: "same-origin", headers: jsonHeaders() });
      if (!response.ok) throw new Error("Mark all failed");
      setReadIds(new Set(notifications.map((item) => item.id)));
      syncCount(0);
    } catch {
      setError("Pemberitahuan belum dapat ditandai. Silakan coba lagi.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <header className="profile-heading profile-heading-actions">
        <h1>Pemberitahuan</h1>
        {unread > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={markAll} disabled={markingAll}>
            <Icon name="check" />{markingAll ? "Menandai…" : "Tandai semua dibaca"}
          </Button>
        )}
      </header>
      {error && <p className="cart-feedback cart-feedback-error" role="alert">{error}</p>}
      <ul className="notification-list">
        {notifications.map((item) => {
          const unreadItem = !readIds.has(item.id);
          const created = new Date(item.created_at);
          const body = (
            <>
              <span className="notification-icon"><Icon name={iconFor(item.type)} /></span>
              <div>
                <strong>{item.title}{unreadItem && <span className="sr-only"> (belum dibaca)</span>}</strong>
                <p>{item.subtitle}</p>
                <small title={formatDate(created)} suppressHydrationWarning>{formatRelative(created)}</small>
              </div>
            </>
          );
          return (
            <li key={item.id} data-unread={unreadItem || undefined}>
              {item.order_id
                ? <Link className="notification-link" href={`/payment/${item.order_id}`} onClick={() => markRead(item)}>{body}</Link>
                : <button type="button" className="notification-link" onClick={() => markRead(item)}>{body}</button>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
