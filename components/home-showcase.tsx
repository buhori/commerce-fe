import { BannerSlider } from "./banner-slider";
import type { Banner } from "@/lib/store-api";

export function HomeShowcase({ banners }: {
  banners: Banner[];
}) {
  if (banners.length === 0) return null;

  return (
    <div className="home-showcase">
      <BannerSlider banners={banners} />
    </div>
  );
}
