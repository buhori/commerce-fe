import type { NextRequest } from "next/server";
import { apiProxy } from "@/lib/api-proxy";
import { REGION_SEARCH_MIN_LENGTH } from "@/lib/checkout";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  // Too short to narrow anything down; answer here instead of asking the backend.
  if (query.length < REGION_SEARCH_MIN_LENGTH) return Response.json({ data: [] });
  // The proxy builds the upstream URL from this path, so the query has to travel with it.
  return apiProxy(request, `/regions/search?q=${encodeURIComponent(query)}`);
}
