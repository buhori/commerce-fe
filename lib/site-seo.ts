import { headers } from "next/headers";
import { cache } from "react";
import { getPreviewState } from "./preview";
import { originFromHeaders, siteSeo, type SiteSeo } from "./seo";
import { getStore, StoreApiError, type Store } from "./store-api";

export type SiteContext = SiteSeo & { store: Store | null };

/**
 * Data SEO toko untuk request ini, sekali per render (root layout dan halaman memakainya bersama).
 * Pratinjau pemilik (header iframe atau cookie) dan toko yang tidak terdaftar selalu noindex;
 * gangguan backend sementara tidak, supaya halaman yang sudah terindeks tidak ikut dicabut.
 */
export const getSiteSeo = cache(async (): Promise<SiteContext> => {
  const [headerList, storeResult, preview] = await Promise.all([
    headers(),
    getStore().then((store) => ({ store, missing: false }), (error: unknown) => ({
      store: null,
      missing: error instanceof StoreApiError && error.status === 404,
    })),
    getPreviewState().catch(() => null),
  ]);
  return {
    ...siteSeo(storeResult.store, originFromHeaders(headerList), { preview: Boolean(preview), missing: storeResult.missing }),
    store: storeResult.store,
  };
});
