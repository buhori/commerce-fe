# Kontrak Tema Sellosy v1 (draf)

Status: **draf untuk ditinjau**, belum diimplementasikan. Dokumen ini mengatur bagaimana tema Next.js (mis. Ambaz)
masuk ke Sellosy **utuh**: susunan layout sama dengan demonya, isi awal tidak kosong, dan setiap komponen tetap ada,
sementara pemilik toko mengubah isinya lewat customizer di panel.

## 1. Masalah yang diselesaikan

Sekarang platform memiliki 13 widget tetap (banner, product-list, hero, …). Tema hanya boleh mengganti *tampilan*
widget itu. Tema dengan section khas sendiri (Ambaz: `CoffeeMenuBoard`, `CoffeeMarquee`, …) terpaksa dipetakan ke
13 widget tersebut, sehingga layout berubah, sebagian komponen hilang, dan toko mulai dari susunan polos.

Selain itu, skema satu widget ditulis manual di tiga tempat (validasi Laravel, form builder React, tipe storefront).

## 2. Prinsip

1. **Tema yang mendefinisikan section-nya**, dengan skema deklaratif. Platform tidak perlu tahu section apa saja yang ada.
2. **Satu sumber kebenaran.** Dari satu definisi section, platform menurunkan form customizer (*translator*),
   validasi dan sanitasi server, nilai default, dan tipe props komponen.
3. **Toko tidak pernah mulai polos.** Setiap template punya susunan default (preset) yang sama dengan demo tema.
4. **Tema tidak mengambil data sendiri.** Produk, kategori, artikel, dan menu dipilih lewat input, lalu
   *platform* yang memuat datanya dan mengirimnya ke komponen. Harga, diskon, stok, keranjang, dan checkout tetap
   lewat komponen SDK.
5. **LTS.** Kontrak berversi. Dalam satu versi mayor hanya ada penambahan; data toko lama tidak pernah membuat
   halaman rusak.

## 3. Isi paket tema

```
themes/ambaz/
  index.tsx          defineTheme(): komponen + skema (TypeScript)
  sections/*.tsx     defineSection() per section
  presets/*.ts       susunan default per varian (Coffee, Fashion, …)
  assets/            gambar default (demo), disajikan platform
  theme.json         DIHASILKAN dari index.tsx (pnpm theme:manifest); dibaca backend
```

`theme.json` adalah manifest tanpa kode, yang dibaca Laravel (validasi) dan builder (form). Ia dihasilkan dari
definisi TypeScript, jadi tidak pernah ditulis tangan dan tidak bisa berbeda dari komponennya.

```jsonc
{
  "contract": 1,
  "id": "ambaz",
  "name": "Ambaz",
  "version": "1.0.0",            // versi tema (semver); berbeda dari versi kontrak
  "settings": [ /* pengaturan global tema: warna, font, logo, … (bagian 6) */ ],
  "sections": { "promo-banners": { /* bagian 4 */ } },
  "templates": { "home": { /* bagian 5 */ }, "product": { } },
  "groups": { "header": { }, "footer": { } },
  "presets": { "coffee": { "name": "Coffee", "thumbnail": "assets/presets/coffee.webp", "templates": { } } }
}
```

## 4. Section dan block

Section adalah satu bagian selebar halaman. Block adalah isi berulang di dalam section (slide, kartu, item FAQ).

```tsx
export const promoBanners = defineSection({
  type: "promo-banners",
  name: "Banner promo",
  templates: ["home", "collection"],        // di template mana section ini boleh ditambahkan
  settings: [
    { id: "title", type: "text", label: "Judul", default: "", maxLength: 80 },
  ],
  blocks: {
    banner: {
      name: "Banner",
      min: 1, max: 4,
      settings: [
        { id: "image", type: "image", label: "Gambar", required: true, accept: ["jpg", "png", "webp"], maxSizeKb: 4096, recommended: "930 × 930" },
        { id: "eyebrow", type: "text", label: "Teks kecil", default: "Diskon sampai 30%", maxLength: 40 },
        { id: "title", type: "textarea", label: "Judul", default: "Kopi pilihan\nhari ini", maxLength: 80, rows: 2 },
        { id: "button", type: "text", label: "Tombol", default: "Belanja sekarang", maxLength: 30 },
        { id: "link", type: "link", label: "Tautan", default: "/products" },
      ],
    },
  },
  // Isi saat section ditambahkan dari customizer.
  default: {
    blocks: [
      { type: "banner", settings: { image: "theme://coffee/banner-1.webp", title: "Gloria Jean's\nCoffees" } },
      { type: "banner", settings: { image: "theme://coffee/banner-2.webp", title: "Untuk\nseluruh keluarga" } },
    ],
  },
  component: PromoBanners,
});
```

Props komponen **diturunkan otomatis** dari skema (`SectionProps<typeof promoBanners>`). Yang diterima komponen:

| Prop | Isi |
| --- | --- |
| `settings` | Semua setting, **lengkap**: default sudah diisi, nilai sudah divalidasi dan disanitasi. |
| `blocks` | `{ id, type, settings }[]` sesuai urutan, masing-masing lengkap. |
| `data` | Data dari input sumber daya yang sudah dimuat platform (bagian 7). |
| `store`, `page` | Toko dan konteks halaman (bagian 5). |
| `editor` | Atribut untuk customizer (klik di pratinjau untuk membuka setting-nya); dipasang di elemen terluar. |

Aturan untuk komponen: satu section merender satu elemen terluar, warna lewat token tema, tidak melakukan `fetch`,
dan tidak membaca `window.location` untuk data.

## 5. Template per halaman

Setiap jenis halaman punya **kontrak tetap**: URL, data konteks yang dijamin platform, dan section utama yang wajib.
Section utama (`main-*`) disediakan tema tetapi tidak bisa dihapus pemilik toko, karena tanpanya halaman tidak berfungsi.

| Template | URL | Konteks (`page`) | Section utama |
| --- | --- | --- | --- |
| `home` | `/` | — | — |
| `collection` | `/products`, `/c/{slug}`, pencarian `?q=` | `listing`, `filter`, `category`, `categories`, `sort`, `q`, `title` | `main-collection` |
| `product` | `/products/{slug}` | `product`, `view`, `url` | `main-product` |
| `blog` | `/blog` | `posts`, `pagination` | `main-blog` |
| `article` | `/blog/{slug}` | `post` | `main-article` |
| `page` | `/{slug}` (halaman teks) | `page` | `main-page` |
| `not-found` | 404 | — | `main-not-found` |

Halaman yang tetap milik platform dan hanya mengikuti token tema: keranjang, checkout, pembayaran, invoice, ulasan,
login, profil, dan pesanan.

`main-product` memakai **block bawaan kontrak** supaya pemilik toko bisa mengatur urutan isinya tanpa kehilangan
fungsi: `title`, `price`, `rating`, `variant-picker`, `quantity`, `buy-buttons`, `whatsapp`, `description`,
`specs`, `share`, `custom-text`. Tema boleh menambah block sendiri. Block bawaan dirender lewat komponen SDK,
supaya harga, stok, varian, dan keranjang selalu benar.

Section lain di template bebas ditambah, dihapus, disembunyikan, dan diurutkan.

### Grup layout

`header` dan `footer` adalah **grup section** yang tampil di semua template (termasuk halaman platform). Isinya
bisa diatur di customizer seperti template, misalnya bar pengumuman, header, dan mega menu. Platform memasang
`<BuiltWith />` sendiri setelah section footer (tersembunyi di toko whitelabel), jadi section tema tidak perlu
memuatnya.

## 6. Tipe input (translator)

Ini daftar tertutup: builder punya satu kontrol untuk setiap tipe, Laravel punya satu aturan validasi untuk
setiap tipe, dan TypeScript punya satu tipe nilai untuk setiap tipe. Tema tidak bisa menambah tipe; tipe baru
ditambahkan platform dalam versi minor kontrak.

Atribut umum semua input: `id`, `type`, `label`, `default`, `info` (teks bantuan), `required`, `visibleIf`
(tampil bila setting lain bernilai tertentu).

| `type` | Nilai yang diterima komponen | Atribut khusus |
| --- | --- | --- |
| `text` | `string` | `maxLength`, `placeholder` |
| `textarea` | `string` (baris baru dipertahankan) | `maxLength`, `rows` |
| `richtext` | `string` HTML yang sudah disanitasi (render lewat `<RichText>`) | `maxLength`, `formats` |
| `number` | `number` | `min`, `max`, `step`, `unit` |
| `range` | `number` (slider) | `min`, `max`, `step`, `unit` |
| `checkbox` | `boolean` | |
| `select` | salah satu `options[].value` | `options: [{ value, label }]` |
| `radio` | salah satu `options[].value` (tombol) | `options` |
| `color` | `string` `#rrggbb` atau `null` | `allowEmpty` |
| `image` | `{ url, width, height, alt } \| null` | `accept`, `maxSizeKb`, `recommended`, `aspect` |
| `images` | daftar `image` | `accept`, `maxSizeKb`, `min`, `max` |
| `video` | `{ provider: "youtube", id } \| null` | |
| `link` | `{ href, external } \| null`: path toko, `#anchor`, atau http(s) | `allowExternal` |
| `icon` | nama ikon dari set ikon platform | `icons` (pembatas) |
| `date`, `datetime` | string ISO | `min`, `max` |
| `product` | `ProductSummary \| null` di `data` | |
| `products` | `ProductSummary[]` di `data` | `max` |
| `product-source` | `ProductSummary[]` di `data` (terbaru, terlaris, rating, kategori, atau pilihan manual) | `max`, `sources` |
| `category` / `categories` | `Category` / `Category[]` di `data` | `max` |
| `post` / `posts` | ringkasan artikel blog di `data` | `max` |
| `menu` | `NavigationLink[]` (menu dari panel) di `data` | |
| `font` | kunci font dari daftar font platform | `role`: `heading`/`body` |
| `heading`, `paragraph` | — (hanya pemisah dan keterangan di form) | `content` |

Contoh dari permintaan awal (`input: "file", accept: image, max: 2`) menjadi:

```jsonc
{ "id": "photos", "type": "images", "label": "Foto", "accept": ["jpg", "png", "webp"], "max": 2 }
```

Gambar default dari tema ditulis `theme://path` dan disajikan platform dari aset tema. Begitu pemilik toko
mengunggah gambar, nilai itu diganti dengan gambar miliknya.

## 7. Data dari platform

Input sumber daya (`product`, `products`, `product-source`, `category`, `post`, `menu`) hanya **menyimpan ID**.
Saat merender, platform memuat datanya sekaligus untuk satu halaman (tanpa query per section), menerapkan paket
toko (batas jumlah, fitur), membuang data yang sudah dihapus, lalu mengirimnya di `data.<id setting>`.

Akibatnya tema tidak memegang data produk palsu dari demo. Demo "Popular Products" menjadi `product-source`
dengan default `top_sale`, jadi langsung berisi produk toko yang sebenarnya.

## 8. Penyimpanan

Disimpan per toko, per tema, per template di tabel `store_layouts` yang sudah ada (draf dan terbit):

```jsonc
{
  "contract": 1,
  "theme_version": "1.0.0",
  "order": ["s-hero", "s-banners"],
  "sections": {
    "s-banners": {
      "type": "promo-banners",
      "hidden": false,
      "settings": { "title": "" },
      "block_order": ["b1", "b2"],
      "blocks": { "b1": { "type": "banner", "settings": { "image": "stores/405/theme/…webp" } } }
    }
  }
}
```

ID section dan block stabil, sehingga pratinjau bisa menyorot section yang sedang diedit, dan perubahan bisa
digabung tanpa saling menimpa.

Pengaturan global tema (`settings` di manifest, misalnya warna, font, logo, dan tombol) disimpan terpisah di
`store_layouts` dengan halaman `theme`. Token CSS turunannya dipasang platform.

## 9. Validasi dan keamanan (server)

Semua penyimpanan melewati satu validator generik di Laravel yang membaca manifest:

- tipe dan ID tidak dikenal dibuang; `required`, `min`/`max`, `maxLength`, dan `options` diperiksa;
- `richtext` disanitasi dengan allowlist; `link` hanya path toko, `#anchor`, atau http(s) (aturan yang sama dengan builder sekarang);
- gambar hanya dari unggahan toko itu atau aset tema, dengan format dan ukuran sesuai `accept`/`maxSizeKb`;
- ID sumber daya hanya milik toko itu;
- batas global: jumlah section per template, block per section, dan ukuran total data.

Validasi yang sama menyaring data saat **dibaca**, sehingga data lama atau hasil impor pun tidak bisa merusak halaman.

## 10. Versi dan LTS

- `contract` (bilangan bulat) di manifest. Platform mendukung versi mayor yang berjalan dan satu sebelumnya.
- Dalam satu versi mayor **hanya penambahan**: tipe input baru, atribut opsional baru, konteks halaman baru,
  template baru. Tidak ada yang diganti nama atau dihapus.
- Pembaruan tema (versi tema) tidak merusak toko:
  - setting baru diisi `default`;
  - setting yang dihapus diabaikan (datanya tetap disimpan, siapa tahu dikembalikan);
  - setting yang diganti nama atau tipenya wajib dideklarasikan di `migrations` manifest
    (`{ "1.1.0": { "rename": { "promo-banners.title": "promo-banners.heading" } } }`);
  - section yang dihapus dari tema disembunyikan dari toko, bukan dihapus dari data.

## 11. Bagaimana customizer memakainya

- Panel kiri: daftar section per template (dan grup header/footer), dengan tambah, hapus, sembunyikan, geser.
  Section utama dikunci di tempatnya.
- Panel setting: form yang dirender otomatis dari skema. Satu komponen React per tipe input (bagian 6).
- Pratinjau: storefront sungguhan di iframe (mekanisme pratinjau yang sudah ada), dengan `editor` untuk klik-ke-edit.
- **Pilih varian/preset** (Ambaz: Coffee, Fashion, …): mengisi semua template dengan susunan demo varian itu.
  Ini cara toko langsung terlihat seperti demo.

## 12. Rencana penerapan

**Fase 1: infrastruktur kontrak** (tanpa Ambaz)
- Selesai: `defineSection` dengan inferensi tipe, `normalizeSettings`, pemeriksa manifest, dan generator
  `pnpm theme:manifest <id>` (sdk/schema.ts, scripts/theme-manifest.mjs).
- Selesai: Laravel `themes:sync`, validator dan penyaring setting (ThemeContract, ThemeSettings), susunan per
  template dengan ID stabil (ThemeLayout), dan `GET /api/theme/{template}`.
- Selesai: penyaji storefront (lib/theme-layout.ts, themes/contract.tsx) dan tema contoh `themes/contoh`, diuji
  dari kode tema sampai halaman di browser.
- Berikutnya: customizer generik (form dari skema per tipe input, template selain beranda).
- Ditunda sampai customizer siap: 13 widget bawaan sebagai section berkontrak dan migrasi beranda toko lama. Widget
  bawaan punya panel gaya, custom CSS, dan kolom bertingkat yang belum ada di kontrak; tema lama tetap memakai
  builder lama sampai saat itu.

**Fase 2: Ambaz, satu varian lengkap** (mis. Coffee)
- Header, footer, beranda, `collection`, `product`, `blog`/`article`, dan `page` untuk satu varian.
- Setiap konstanta di komponen demo menjadi setting dan block dengan nilai demo sebagai default; data produk
  demo menjadi `product-source`.
- Uji di toko sungguhan, lalu sesuaikan kontrak sebelum dinyatakan stabil.

**Fase 3: varian Ambaz lain**, bertahap. Komponen bersama dipakai ulang, jadi tiap varian makin cepat.

Ambaz punya sekitar 36 beranda demo dan 432 komponen. Setiap section dimuat terpisah (dynamic import per tipe),
jadi toko hanya mengunduh kode section yang benar-benar dipakai.

## 13. Keputusan yang masih terbuka

1. ~~Lisensi Ambaz.~~ Diputuskan pemilik produk: aman, karena tema ditawarkan gratis tanpa dikomersialkan.
2. Varian Ambaz mana yang dikerjakan pertama (dibutuhkan di Fase 2).
3. Sementara diputuskan: 13 widget bawaan tetap bisa dipakai di tema mana pun sebagai section tambahan.
