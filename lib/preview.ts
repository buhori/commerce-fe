import { cache } from "react";
import { getPreview, type StorefrontPreview } from "./store-api";
import { requestPreviewToken } from "./store-host";

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
  const { token, embedded } = await requestPreviewToken();
  const preview = await getPreview(token);
  return preview && token ? { ...preview, token, embedded } : null;
});
