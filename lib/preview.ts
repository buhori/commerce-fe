import { cookies, headers } from "next/headers";
import { cache } from "react";
import { PREVIEW_COOKIE, PREVIEW_HEADER } from "@/themes/registry";
import { getPreview, type StorefrontPreview } from "./store-api";

export interface PreviewState extends StorefrontPreview {
  token: string;
  /** Di dalam iframe builder: tanpa bar pratinjau, token datang dari URL. */
  embedded: boolean;
}

/**
 * Pratinjau pemilik toko untuk request ini: dari ?preview= (iframe builder, diteruskan proxy.ts)
 * atau dari cookie yang dipasang /preview (tab baru). Null untuk pengunjung biasa.
 */
export const getPreviewState = cache(async (): Promise<PreviewState | null> => {
  const [headerList, jar] = await Promise.all([headers(), cookies()]);
  const embeddedToken = headerList.get(PREVIEW_HEADER);
  const token = embeddedToken ?? jar.get(PREVIEW_COOKIE)?.value;
  const preview = await getPreview(token);
  return preview && token ? { ...preview, token, embedded: Boolean(embeddedToken) } : null;
});
