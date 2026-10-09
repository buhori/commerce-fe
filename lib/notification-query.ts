import { queryOptions } from "@tanstack/react-query";

export const unreadNotificationsKey = ["notifications", "unread"] as const;

/** Unread count for the signed-in buyer; the backend answers 0 for guests. */
export const unreadNotificationsQuery = queryOptions({
  queryKey: unreadNotificationsKey,
  queryFn: async (): Promise<number> => {
    const response = await fetch("/api/notifications/unread", { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return 0;
    const count = (await response.json())?.count;
    return Number.isSafeInteger(count) && count > 0 ? count : 0;
  },
  staleTime: 60_000,
  refetchOnWindowFocus: true,
  retry: false,
});
