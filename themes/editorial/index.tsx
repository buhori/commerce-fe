import { Fraunces, Instrument_Sans } from "next/font/google";
import { defineTheme } from "@sellosy/theme";
import { CatalogPage } from "./catalog";
import { Footer } from "./footer";
import { Header } from "./header";
import { HomePage } from "./home";
import { InfoPage } from "./info";
import { ProductPage } from "./product";

/**
 * Editorial — gaya majalah untuk fashion dan gaya hidup: logo di tengah, judul serif,
 * foto besar, banyak ruang kosong. Contoh lengkap tema yang dibuat dengan SDK.
 */

// preload: false — font ini hanya dipakai toko yang memilih Editorial.
const serif = Fraunces({ subsets: ["latin"], variable: "--ed-serif", axes: ["opsz", "SOFT"], preload: false });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--ed-sans", preload: false });

export default defineTheme({
  id: "editorial",
  name: "Editorial",
  description: "Majalah mode: logo di tengah, judul serif, foto besar.",
  className: `${serif.variable} ${sans.variable}`,
  components: { Header, Footer, HomePage, CatalogPage, ProductPage, InfoPage },
});
