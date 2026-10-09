"use client";

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createQueryClient } from "@/lib/query-client";

let browserClient: QueryClient | undefined;

export function QueryProvider({ children }: { children: ReactNode }) {
  // Server renders stay isolated; navigation and Suspense reuse the browser cache.
  const client = typeof window === "undefined"
    ? createQueryClient()
    : (browserClient ??= createQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
