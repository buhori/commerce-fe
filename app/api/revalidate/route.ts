import { revalidateTag } from "next/cache";
import { revalidationAuthorized, revalidationTags } from "@/lib/storefront-cache";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Called by the backend (App\Jobs\RevalidateStorefront) after a merchant changes something the
 * storefront shows: `Authorization: Bearer <REVALIDATE_SECRET>` and
 * `{ "store_id": 12, "refs": ["12", "kopi"], "hosts": ["kopi.sellosy.com", "kopisaya.com"] }`.
 * Every cached store API read of that store is expired at once (see lib/storefront-cache.ts).
 */
export async function POST(request: Request) {
  if (!revalidationAuthorized(request.headers.get("authorization"), process.env.REVALIDATE_SECRET)) {
    return Response.json({ revalidated: false }, { status: 401, headers: NO_STORE });
  }

  const tags = revalidationTags(await request.json().catch(() => null));
  if (!tags) return Response.json({ revalidated: false, message: "Expected { store_id, refs?, hosts? }" }, { status: 422, headers: NO_STORE });

  // A webhook, not a Server Action, so no updateTag: expire now, the next visit fetches fresh data.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags }, { headers: NO_STORE });
}
