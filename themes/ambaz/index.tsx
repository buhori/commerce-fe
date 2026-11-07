import { Albert_Sans } from "next/font/google";
import { defineSection, defineTheme } from "@sellosy/theme";
import {
  announcementBar, bannerList, featuredCollection, featuredSlider, heroSlider, instagramFeed, latestBlog, limitedTimeOffer, mainFooter, mainHeader,
  manifest, marquee, promotionalGrid, shopByCategories, shopTheLook, tabContent, testimonials, trustBadges,
} from "./manifest";
import { AnnouncementBar } from "./sections/announcement-bar";
import { FeaturedCollection } from "./sections/featured-collection";
import { LimitedTimeOffer } from "./sections/limited-time-offer";
import { ShopByCategories } from "./sections/shop-by-categories";
import { ShopTheLook } from "./sections/shop-the-look";
import { FeaturedSlider } from "./sections/featured-slider";
import { TabContent } from "./sections/tab-content";
import { Marquee } from "./sections/marquee";
import { BannerList } from "./sections/banner-list";
import { Testimonials } from "./sections/testimonials";
import { LatestBlog } from "./sections/latest-blog";
import { InstagramFeed } from "./sections/instagram-feed";
import { TrustBadges } from "./sections/trust-badges";
import { HeroSlider } from "./sections/hero-slider";
import { MainFooter } from "./sections/main-footer";
import { MainHeader } from "./sections/main-header";
import { ArticlePage, BlogPage, CartPage, CatalogPage, ComparePage, InfoPage, LoginPage, NotFoundPage, ProductPage, WishlistPage } from "./pages";
import { PromotionalGrid } from "./sections/promotional-grid";

// Font Ambaz; preload: false karena hanya dipakai toko yang memilih Ambaz.
const albert = Albert_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-albert-sans", preload: false });

/** Ambaz sebagai tema berkontrak: skema di manifest.ts, komponen asli Ambaz di sections/. */
export default defineTheme({
  id: manifest.id,
  name: manifest.name,
  description: manifest.description ?? "",
  className: albert.variable,
  // Halaman di luar kontrak section: komponen Ambaz asli dengan data platform.
  components: { ArticlePage, BlogPage, CartPage, CatalogPage, ComparePage, InfoPage, LoginPage, NotFoundPage, ProductPage, WishlistPage },
  contract: {
    ...manifest,
    sections: [
      defineSection(announcementBar, AnnouncementBar),
      defineSection(mainHeader, MainHeader),
      defineSection(mainFooter, MainFooter),
      defineSection(heroSlider, HeroSlider),
      defineSection(promotionalGrid, PromotionalGrid),
      defineSection(featuredCollection, FeaturedCollection),
      defineSection(limitedTimeOffer, LimitedTimeOffer),
      defineSection(shopByCategories, ShopByCategories),
      defineSection(shopTheLook, ShopTheLook),
      defineSection(featuredSlider, FeaturedSlider),
      defineSection(tabContent, TabContent),
      defineSection(marquee, Marquee),
      defineSection(bannerList, BannerList),
      defineSection(testimonials, Testimonials),
      defineSection(latestBlog, LatestBlog),
      defineSection(instagramFeed, InstagramFeed),
      defineSection(trustBadges, TrustBadges),
    ],
  },
});
