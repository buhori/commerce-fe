import { cookies } from "next/headers";
import { cache } from "react";
import { CUSTOMER_COOKIE, type Customer } from "./auth";

/** Server-side call to the store API as the signed-in buyer; null without a session. */
async function customerFetch(path: string) {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const baseUrl = process.env.STORE_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Store-Id": process.env.STORE_ID || "404",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  // An expired or revoked token reads as signed out.
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Store API returned ${response.status}`);
  return response.json();
}

export const getCustomer = cache(async (): Promise<Customer | null> => {
  const body = await customerFetch("/auth/me");
  return body?.data ?? null;
});

export interface OrderListItem {
  id: number;
  status: string;
  grand_total: number;
  created_at: string;
  preorder_ready_at: string | null;
  items_count: number;
  items: { name: string | null; image: string | null; amount: number }[];
}

export interface OrderList {
  data: OrderListItem[];
  meta: { current_page: number; last_page: number; total: number };
}

export async function getOrders(page: number, status?: string): Promise<OrderList | null> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  return customerFetch(`/orders?${params}`);
}

export interface CustomerNotification {
  id: number;
  // e.g. `order.paid`; picks the icon.
  type: string;
  title: string;
  subtitle: string;
  is_read: boolean;
  order_id: number | null;
  created_at: string;
}

export interface NotificationList {
  data: CustomerNotification[];
  meta: { current_page: number; last_page: number; total: number; unread: number };
}

export async function getNotifications(page: number): Promise<NotificationList | null> {
  return customerFetch(`/notifications?page=${page}`);
}
