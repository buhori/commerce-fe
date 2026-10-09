import { queryOptions } from "@tanstack/react-query";
import type { Customer } from "./auth";

export const customerKey = ["customer"] as const;

/** The signed-in buyer, or null for guests. Shared by the header and checkout. */
export const customerQuery = queryOptions({
  queryKey: customerKey,
  queryFn: async (): Promise<Customer | null> => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()).data ?? null;
  },
  staleTime: 5 * 60_000,
  retry: false,
});
