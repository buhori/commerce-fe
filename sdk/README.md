# Sellosy Theme SDK (`@sellosy/theme`)

Panduan membuat tema toko Sellosy. Tema mengatur **tampilan** toko; semua yang menyangkut uang,
data pembeli, dan pesanan tetap diurus platform.

| Bagian toko | Siapa yang mengatur |
| --- | --- |
| Header dan footer (tampil di semua halaman, termasuk keranjang dan checkout) | Tema (opsional) |
| Beranda `/` | Tema (opsional) |
| Katalog: kategori `/c/{slug}`, pencarian `/?q=`, urutan `/?sort=` | Tema (opsional) |
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
   import { HomePage } from "./home";

   export default defineTheme({
     id: "aurora",
     name: "Aurora",
     description: "Satu kalimat untuk pemilik toko.",
     components: { HomePage },
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
| `Footer` | `store`, `pages` | **Wajib** memuat `<BuiltWith />`. |
| `HomePage` | `store`, `banners`, `categories`, `products` | `products` null bila produk gagal dimuat. |
| `CatalogPage` | `store`, `categories`, `category`, `q`, `sort`, `title`, `products` | `category` null untuk pencarian atau urutan di semua produk. |
| `ProductPage` | `store`, `product`, `view` | `view` berisi `gallery`, `availability`, `specs`, `preorder`, `stock` yang sudah dihitung. |
| `InfoPage` | `store`, `page` | Isi halaman lewat `<PageContent page={page} />`. |

Tipe lengkap ada di [`sdk/types.ts`](./types.ts).

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

**Tampilan yang sudah menangani kasus sulit:** `<BannerSlider>`, `<ProductGallery>` (geser + zoom),
`<ProductImage>` (gambar gagal dimuat), `<StoreLogo>`, `<SmartLink>` (tautan menu internal atau eksternal),
`<PageContent>`, `<Price>`, `<BuiltWith>`.

**Helper:** `formatPrice`, `formatDate`, `productUrl`, `categoryUrl`, `pageUrl`, `catalogUrl`,
`catalogSorts`, `preorderDays`.

Komponen yang memakai hook harus diberi `"use client"` di baris pertama filenya. Contohnya
`themes/editorial/buy-box.tsx` (hook `useAddToCart`) dan `product-grid.tsx` (hook `useProductFeed`).

## Aturan

Aturan ini diperiksa `pnpm lint` untuk setiap file di `themes/<id>/`. Pelanggaran membuat lint gagal.

- Impor hanya dari `@sellosy/theme`, `react`, `next/link`, `next/navigation`, `next/font/google`, dan file di folder tema sendiri.
- Jangan memanggil `fetch`, `XMLHttpRequest`, atau `WebSocket`. Semua data datang lewat props.
- Jangan membaca `document.cookie`, `localStorage`, atau `sessionStorage`.
- Jangan memakai `dangerouslySetInnerHTML`. HTML dari panel dirender lewat `<PageContent>`.

Pemeriksa tetap membaca kode tema sebelum dipasang. Yang diperiksa di luar lint:

- Footer memuat `<BuiltWith />`.
- Tidak ada skrip atau layanan pihak ketiga (analytics, chat, font dari luar Google Fonts).
- Teks yang tampil ke pembeli memakai bahasa yang sama dengan bagian toko lainnya.
- Tampilan sudah dicek di lebar 390px (HP) dan 1440px (desktop), tanpa halaman melebar ke samping.
- Halaman tetap rapi dengan data kosong: toko tanpa banner, tanpa kategori, tanpa produk, dan produk tanpa foto.

## CSS

- Tulis gaya komponen dengan **CSS Modules** (`*.module.css`). Nama kelasnya otomatis unik, jadi tidak bocor ke halaman lain.
- `styles.css` hanya berisi token di bawah `:root[data-theme="<id>"]`. Token ini juga dipakai halaman keranjang, checkout, dan profil, supaya toko terasa menyatu:

  | Token | Fungsi |
  | --- | --- |
  | `--primary`, `--primary-hover` | Tombol utama dan aksen |
  | `--page`, `--canvas`, `--surface`, `--surface-hover` | Latar halaman dan kartu |
  | `--text`, `--muted` | Warna teks |
  | `--line`, `--line-strong` | Garis |
  | `--font-body`, `--font-heading` | Font isi dan judul |
  | `--radius-lg`, `--radius`, `--radius-sm` | Sudut kartu dan tombol (diisi di `[data-theme="<id>"] .storefront-shell`) |

- Font: deklarasikan dengan `next/font/google` di `index.tsx` dengan `preload: false`, lalu isi `className` tema dengan kelas `variable`-nya (lihat Editorial).

## Sebelum mengirim tema

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Ketiganya harus lolos. Sertakan screenshot setiap halaman yang diganti, di HP dan desktop.
