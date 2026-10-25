# Sellosy Theme SDK (`@sellosy/theme`)

Panduan membuat tema toko Sellosy. Tema mengatur **tampilan** toko; semua yang menyangkut uang,
data pembeli, dan pesanan tetap diurus platform.

| Bagian toko | Siapa yang mengatur |
| --- | --- |
| Header dan footer (tampil di semua halaman, termasuk keranjang dan checkout) | Tema (opsional) |
| Beranda `/` | Pemilik toko di builder (`/builder`); tema hanya mengatur tampilan widget |
| Katalog: semua produk `/products` (filter `id`/`category`/`sort`, pencarian `q`) dan kategori `/c/{slug}` | Tema (opsional) |
| Halaman produk `/products/{slug}` | Tema (opsional) |
| Halaman informasi `/{slug}` dari editor teks panel | Tema (opsional) |
| Landing page HTML penuh dari panel | Platform (iframe sandbox) |
| Keranjang, checkout, pembayaran, login, profil, pesanan | Platform; warna dan font mengikuti token tema |

Bagian yang tidak dibuat tema memakai tampilan bawaan, jadi tema boleh dimulai dari satu halaman saja.

## Mulai cepat

1. Buat folder `themes/<id>/`, misalnya `themes/aurora/`. `id` huruf kecil, tanpa spasi.
2. Tulis `themes/aurora/index.tsx`:

   ```tsx
   import { defineTheme } from "@sellosy/theme";
   import { ProductPage } from "./product";

   export default defineTheme({
     id: "aurora",
     name: "Aurora",
     description: "Satu kalimat untuk pemilik toko.",
     components: { ProductPage },
   });
   ```

3. Daftarkan di tiga tempat:
   - `themes/registry.ts`: tambahkan `aurora: { name: "Aurora", description: "…" }`.
   - `themes/active.ts`: tambahkan `aurora` ke `definitions`.
   - `app/globals.css`: `@import "../themes/aurora/styles.css";` bila tema punya token global.
4. Backend: buat baris tema bernama **Aurora** (nama dicocokkan dengan `id`, tanpa membedakan huruf besar).

Contoh lengkap yang mengganti semua bagian ada di [`themes/editorial`](../themes/editorial).

## Pratinjau saat mengembangkan

Isi `THEME_PREVIEW=true` di `.env.local`, jalankan `pnpm dev`, lalu buka:

- `http://localhost:3000/?theme=aurora`: memakai tema Aurora (tersimpan di cookie selama 7 hari).
- `http://localhost:3000/?theme=store`: kembali ke tema yang dipilih toko di panel.

Di produksi `THEME_PREVIEW` tidak diisi, jadi pengunjung tidak bisa mengganti tema toko.

## Komponen halaman

Setiap komponen menerima data yang sudah dimuat dan diperiksa platform lewat props. Halaman
merender `<main>` sendiri; header dan footer dipasang platform di sekitarnya.

| Komponen | Props | Catatan |
| --- | --- | --- |
| `Header` | `store`, `navigation`, `query`, `accounts` | Tampilkan tombol akun hanya bila `accounts` true. |
| `Footer` | `store`, `pages` | **Wajib** memuat `<BuiltWith />`, tanpa syarat: di toko whitelabel (`store.hide_branding`) komponen itu sendiri tidak merender apa pun. |
| `CatalogPage` | `store`, `categories`, `category`, `filter`, `q`, `sort`, `title`, `products` | `category` null kecuali tepat satu kategori. Teruskan `filter` ke `<SortSelect filter>` supaya produk pilihan dan kategori tidak hilang saat urutan diganti. |
| `ProductPage` | `store`, `product`, `view`, `url` | `view` berisi `gallery`, `availability`, `specs`, `preorder`, `stock` yang sudah dihitung. `url` adalah URL lengkap (kanonik) produk. |
| `InfoPage` | `store`, `page` | Isi halaman lewat `<PageContent page={page} />`. |

Tipe lengkap ada di [`sdk/types.ts`](./types.ts).

## Widget builder (beranda dan halaman builder)

Pemilik toko menyusun beranda di builder (`/builder`, menu **Toko → Sesuaikan tampilan**) dari
13 widget. Beranda **hanya** berisi susunan yang diterbitkan untuk tema yang aktif; tidak ada
beranda cadangan. Susunan kosong berarti beranda kosong. Halaman berformat **Builder** (`/{slug}`)
memakai widget dan tampilan yang sama, dengan atau tanpa header dan footer toko.

Tema boleh menyediakan tampilan sendiri lewat `components.sections`. Widget yang tidak disediakan
memakai tampilan bawaan, yang sudah mengikuti token warna dan font tema.

```tsx
export default defineTheme({
  // …
  components: { sections: { banner: MyBanner, "product-list": MyProductList } },
});
```

| Widget | Props selain `store` | Catatan |
| --- | --- | --- |
| `banner` | `settings.height` (`tall`/`short`), `settings.slides` (`image`, `mobile_image`, `title`, `subtitle`, `button_label`, `link`) | Slide diatur di widget; sudah bergambar dan dibatasi paket. Pakai `<BannerSlider slides>` untuk slider siap pakai. |
| `product-list` | `settings` (judul, keterangan, `source`, `layout`: `grid`/`row`), `products`, `moreHref` | `source`: `latest`, `top_sale`, `top_rating`, `category`, `manual`. Produk sudah dimuat dan dipotong sesuai `limit`; `moreHref` menuju `/products` dengan filter yang sama. |
| `category-grid` | `settings.title`, `settings.categories` (`name`, `slug`, `image`) | `image` boleh null. |
| `text` | `settings` (`eyebrow`, `title`, `body_html`, `align`, `button_label`, `link`) | Render `body_html` lewat `<RichText html>` (sudah disanitasi; teks lama sudah diubah menjadi paragraf). `body` usang. |
| `image` | `settings` (`image`, `alt`, `caption`, `link`, `width`) | |
| `testimonials` | `settings.title`, `settings.items` (`quote`, `name`, `detail`) | |
| `video` | `settings.video_id`, `title`, `caption` | Wajib lewat `<VideoEmbed>`: YouTube tanpa cookie, dimuat setelah diklik. |
| `hero` | `settings` (`eyebrow`, `title`, `subtitle`, `image`, `image_position`: `right`/`left`/`background`, `primary_label`/`primary_link`, `secondary_label`/`secondary_link`, `min_height`: `auto`/`medium`/`screen`) | `title` selalu ada; tombol hanya bila label dan tautannya lengkap. |
| `features` | `settings` (`title`, `subtitle`, `columns`: 2/3/4, `items`: `icon`, `title`, `text`) | `icon` salah satu `FEATURE_ICONS` atau null; pakai `<FeatureIcon name>`. |
| `faq` | `settings` (`title`, `subtitle`, `items`: `question`, `answer`) | Pakai `<details>`/`<summary>`. |
| `cta` | `settings` (`title`, `text`, `button_label`, `link`, `note`) | |
| `countdown` | `settings` (`title`, `text`, `ends_at` ISO UTC, `expired_text`, `button_label`, `link`) | Wajib lewat `<Countdown endsAt expired>` (dihitung di browser). Yang sudah lewat tanpa `expired_text` tidak dirender. |
| `gallery` | `settings` (`title`, `columns`: 2/3/4, `images`: `image`, `alt`, `link`) | |
| `columns` | `settings` (`layout`: `100`/`50-50`/`33-67`/`67-33`/`33-33-33`/`25-50-25`/`25-25-25-25`, `gap`: `sm`/`md`/`lg`, `vertical_align`: `top`/`center`/`bottom`, `mobile`: `stack`/`two`, `columns[].blocks`) | `columns` selalu sebanyak kolom `layout` (kolom kosong tetap ada). Blok: `heading` (`text`, `level` h2/h3/h4), `text` (`html`, lewat `<RichText>`), `image` (`image`, `alt`, `link`), `button` (`label`, `link`, `variant`: `primary`/`secondary`/`link`), `spacer` (`size`: `sm`/`md`/`lg`). |

Tautan widget (`link`, `*_link`) bisa berupa path toko, URL http(s), atau `#anchor` di halaman yang
sama; pakai `<SectionLink href>` supaya ketiganya dibuka dengan benar.

Tampilan per bagian (latar, gambar latar, warna teks, jarak atas/bawah, lebar, perataan, tampil di
desktop/ponsel saja, anchor) dipasang platform di pembungkus widget, bukan di komponen tema. Supaya
ikut berubah, pakai token `var(--text)`, `var(--muted)`, `var(--line)`, `var(--surface)`, `var(--page)`
dan `.container` untuk lebar isi; jangan menulis warna tetap.

Satu widget merender satu elemen selebar halaman (`<section>`). Platform yang mengatur urutannya.
Widget dengan data kosong tidak dirender, jadi komponen tema tidak perlu menangani keadaan kosong.

## Katalog `/products`

Semua produk, atau sebagian lewat satu filter. `filter_value` boleh satu nilai atau array.

| URL | Isi |
| --- | --- |
| `/products?filter=sort&filter_value=top_sale` | Terlaris (`latest`, `top_sale`, `top_rating`, `price_asc`, `price_desc`) |
| `/products?filter=category&filter_value[]=3&filter_value[]=5` | Produk di salah satu kategori |
| `/products?filter=id&filter_value[]=81623` | Produk pilihan (ID ter-encode), sesuai urutan |
| `/products?q=kopi&sort=price_asc` | Pencarian; `sort` bisa digabung dengan filter apa pun |

Buat URL ini dengan `catalogUrl({ sort, categoryIds, productIds, q })`, jangan dirangkai sendiri.
Kartu produk punya `sold_count`, `rating`, dan `rating_count`; `formatProductStats()` membuat
teks "★ 4,8 (12) · 30 terjual".

## Harga dan diskon

Produk dan varian bisa punya diskon otomatis: `final_price` (harga yang dibayar) dan `discount`
(`label` siap tampil seperti "-20%", `ends_at`). Backend lama tidak mengirim keduanya. Jangan
membandingkan `price` dan `final_price` sendiri; pakai aturan yang sama dengan tampilan bawaan:

- `<ProductPrice item={product} currency={…} />` merender harga akhir, harga normal dicoret, dan
  lencana diskon, lengkap dengan teks untuk pembaca layar. Untuk varian: `item={variant} parent={product}`.
- `priceView(product)` atau `priceView(variant, product)` untuk tampilan sendiri: `{ final, original, label, endsAt }`.
  `original` dan `label` null bila tidak ada potongan. Tampilkan `final` sebagai harga utama dan `original`
  di dalam `<s>`. `discountEndDate(endsAt)` memberi tanggal untuk teks "Berakhir …".
- `useAddToCart()` sudah memakai harga setelah diskon. Teruskan `finalPrice={product.final_price}` dan
  `discount={product.discount}`; hook mengembalikan `priceLabel`, `originalPriceLabel`, `discountLabel`,
  `discountEnds`, serta `variantPrice(variant)` untuk daftar pilihan varian.

Contohnya `ProductCard` di `themes/editorial/product-grid.tsx` dan `themes/editorial/buy-box.tsx`.

## Chat WhatsApp

`product.whatsapp` berisi `{ number, quantityAbove }` bila toko menyalakan chat WhatsApp untuk produk
itu dan paketnya mencakup fitur ini; selain itu `null`. `number` angka saja dengan kode negara;
`quantityAbove` (atau `null`) berarti tombolnya baru aktif bila jumlah yang dipilih lebih dari itu, mis.
untuk pembelian grosir. Tampilkan tombol "Tanya via WhatsApp" hanya bila terisi, di bawah tombol beli.

- Teruskan `whatsapp={{ ...product.whatsapp, storeName: store.name, productName: product.name, productUrl: url }}`
  ke `<AddToCart>` (tombolnya ikut dirender) atau `useAddToCart()`, yang mengembalikan `whatsappUrl`: tautan wa.me
  dengan varian dan jumlah terpilih di pesannya, `null` bila tanpa chat atau jumlahnya belum melebihi batas.
  Saat batas belum terlewati, `whatsappNote` berisi alasannya: tampilkan tombolnya nonaktif dengan catatan itu.
  `url` datang dari props `ProductPage`.
- Di luar hook: `whatsappChatUrl({ number, storeName, productName, variantLabel, quantity, productUrl })` dan
  `whatsappAvailable(quantityAbove, quantity)`.
- Buka dengan `target="_blank" rel="noopener noreferrer"`. Jangan dimatikan saat perawatan toko atau untuk
  pre-order: tombol ini hanya membuka chat, bukan membuat pesanan.

## Yang disediakan SDK

Semuanya diimpor dari `@sellosy/theme`.

**Bagian fungsional.** Pakai komponen siap pakai, atau hook bila ingin tampilan sendiri.

| Komponen | Hook untuk tampilan sendiri | Fungsi |
| --- | --- | --- |
| `<AddToCart>` | `useAddToCart()` | Pilih varian, jumlah, tambah ke keranjang, beli sekarang, pre-order |
| `<CartButton>` | `useCartCount()` | Tautan keranjang dengan jumlah barang |
| `<AccountButton>` | `useCustomer()` | Masuk atau buka profil |
| `<ProductGrid>` | `useProductFeed()` | Grid produk yang memuat halaman berikutnya saat digulir |
| `<SortSelect>`, `<CategoryTabs>` | `catalogUrl()` | Urutan dan filter kategori |
| `<SearchForm>` | | Pencarian (form GET, jalan tanpa JavaScript) |
| `<CompareButton product>` | `useCompare()` | Tambah/hapus produk dari daftar bandingkan (maks. 4, disimpan di browser). Bilah bandingkan dan halaman `/compare` disediakan platform |
| `<ShareButton url title>` | | Bagikan produk: lembar bagikan bawaan di ponsel, menu salin tautan/WhatsApp/Facebook/X/Telegram di desktop |

**Tampilan yang sudah menangani kasus sulit:** `<BannerSlider>`, `<ProductGallery>` (geser + zoom),
`<ProductImage>` (gambar gagal dimuat), `<StoreLogo>`, `<SmartLink>` (tautan menu internal atau eksternal),
`<PageContent>`, `<Price>`, `<ProductPrice>` (harga diskon), `<BuiltWith>`, `<VideoEmbed>`,
`<RichText>`, `<SectionLink>`, `<Countdown>`, `<FeatureIcon>`.

**Helper:** `formatPrice`, `formatDate`, `productUrl`, `categoryUrl`, `pageUrl`, `catalogUrl`,
`catalogSorts`, `preorderDays`, `paragraphs`, `FEATURE_ICONS`, `formatProductStats`, `priceView`, `discountEndDate`,
`whatsappChatUrl`.

Teruskan `maintenance={store.maintenance.active}` ke `<AddToCart>` atau `useAddToCart()`. Selama toko
dalam perawatan, `checkoutNote` dari hook terisi: matikan tombol beli sekarang/pre-order dan tampilkan
catatannya. Tambah ke keranjang tetap bisa.

Komponen yang memakai hook harus diberi `"use client"` di baris pertama filenya. Contohnya
`themes/editorial/buy-box.tsx` (hook `useAddToCart`) dan `product-grid.tsx` (hook `useProductFeed`).

## Aturan

Aturan ini diperiksa `pnpm lint` untuk setiap file di `themes/<id>/`. Pelanggaran membuat lint gagal.

- Impor hanya dari `@sellosy/theme`, `react`, `next/link`, `next/navigation`, `next/font/google`, dan file di folder tema sendiri.
- Jangan memanggil `fetch`, `XMLHttpRequest`, atau `WebSocket`. Semua data datang lewat props.
- Jangan membaca `document.cookie`, `localStorage`, atau `sessionStorage`.
- Jangan memakai `dangerouslySetInnerHTML`. HTML dari panel dirender lewat `<PageContent>`.

Pemeriksa tetap membaca kode tema sebelum dipasang. Yang diperiksa di luar lint:

- Footer memuat `<BuiltWith />` (jangan disembunyikan sendiri berdasarkan `store.hide_branding`).
- Tidak ada skrip atau layanan pihak ketiga (analytics, chat, font dari luar Google Fonts).
- Teks yang tampil ke pembeli memakai bahasa yang sama dengan bagian toko lainnya.
- Tampilan sudah dicek di lebar 390px (HP) dan 1440px (desktop), tanpa halaman melebar ke samping.
- Halaman tetap rapi dengan data kosong: beranda tanpa widget Banner, tanpa kategori, tanpa produk, dan produk tanpa foto.

## CSS

- Tulis gaya komponen dengan **CSS Modules** (`*.module.css`). Nama kelasnya otomatis unik, jadi tidak bocor ke halaman lain.
- `styles.css` hanya berisi token di bawah `:root[data-theme="<id>"]`. Token ini juga dipakai halaman keranjang, checkout, dan profil, supaya toko terasa menyatu:

  | Token | Fungsi |
  | --- | --- |
  | `--primary`, `--primary-hover` | Tombol utama dan aksen |
  | `--on-primary`, `--on-primary-hover` | Teks di atas tombol utama (dan saat hover); `--on-primary-hover` boleh kosong, pakai `var(--on-primary-hover, var(--on-primary))` |
  | `--accent`, `--accent-text` | Warna aksen sekunder (opsional); untuk teks pakai `var(--accent-text, var(--accent))`, versi yang dijamin terbaca di latar |
  | `--page`, `--canvas`, `--surface`, `--surface-hover` | Latar halaman dan kartu |
  | `--text`, `--muted`, `--text-soft`, `--text-softer` | Warna teks |
  | `--on-text` | Teks di atas latar `--text` (lencana, tab aktif) |
  | `--glass-rgb` | Kanal RGB latar tembus pandang: `rgb(var(--glass-rgb) / 0.9)` |
  | `--line`, `--line-strong` | Garis |
  | `--font-body`, `--font-heading` | Font isi dan judul |
  | `--radius-lg`, `--radius`, `--radius-sm` | Sudut kartu dan tombol (diisi di `[data-theme="<id>"] .storefront-shell`) |

- Font: deklarasikan dengan `next/font/google` di `index.tsx` dengan `preload: false`, lalu isi `className` tema dengan kelas `variable`-nya (lihat Editorial).
- **Gaya toko (gratis untuk setiap tema).** Pemilik toko bisa memilih warna utama, latar, teks, aksen, serta font judul dan isi di panel (`store.style`, tipe `StoreStyle`). Layout root menimpa token di atas pada `<html>` (selektor `html:root[data-theme]`, mengalahkan `:root[data-theme="<id>"]`) dan menurunkan sisanya: hover, permukaan, garis, teks redup, dan teks di atas tombol (putih atau hampir hitam sesuai kontras), termasuk untuk latar gelap. Jadi:
  - Pakai token, jangan warna tetap. `#fff`, `white`, atau `rgb(255 255 255 / …)` di komponen tidak ikut berubah dan bisa tidak terbaca di latar gelap.
  - Judul dan teks memakai `var(--font-heading)` / `var(--font-body)`. Font yang dideklarasikan tema sendiri (mis. `--ed-serif` di Editorial) hanya ikut berganti bila tema itu didaftarkan di `lib/store-style.ts`.
  - Bila nilai `null`, token tema dipakai apa adanya; tema tidak perlu menangani `store.style` sendiri.

## Sebelum mengirim tema

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Ketiganya harus lolos. Sertakan screenshot setiap halaman yang diganti, di HP dan desktop.
