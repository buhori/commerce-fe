# Toko Online

Storefront Next.js (App Router), TypeScript, dan React. Identitas toko dan katalog berasal dari API backend.

## Menjalankan

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Buka http://localhost:3000. Backend secara default berjalan di http://localhost:8001.

| Environment (server) | Default                     | Keterangan                          |
| -------------------- | --------------------------- | ----------------------------------- |
| `STORE_API_URL`      | `http://localhost:8001/api` | Base URL API, termasuk `/api`       |
| `STORE_ID`           | `404`                       | Dikirim sebagai header `X-Store-Id` |

Restart server Next.js setelah mengubah environment. Pada deployment, isi `STORE_API_URL` dengan URL backend yang dapat dijangkau server Next.js.

## Integrasi API

Request dilakukan dari server, menggunakan `Accept: application/json` dan `X-Store-Id: 404`. Tidak ada parameter query `store_id`.

- `GET /store`: identitas, deskripsi, mata uang, dan kontak toko.
- `GET /products?page=1&per_page=10`: katalog dari properti `data`.
- `GET /categories?page=1&per_page=10`: kategori dari array langsung atau properti `data`. Ditampilkan sebagai tab yang dapat digeser horizontal, dengan tab Semua.
- Pilihan kategori memakai query `category_id` pada URL storefront dan request produk. Pilihan tetap tersimpan saat reload/back; mengganti kategori menghapus page/cursor, sedangkan navigasi halaman mempertahankan kategori.
- Backend produk terbaru menggunakan cursor pagination; `meta.next_cursor` dan `meta.prev_cursor` diteruskan sebagai query `cursor`. Pagination bernomor tetap didukung bila metadata `last_page` tersedia.
- Link dari katalog dan cart membuka halaman `/products/{slug}`. Halaman dapat dibuka langsung atau di-refresh; server mengambil detail terbaru dari backend `GET /products/{slug}` dengan header `X-Store-Id`. Respons backend berbentuk `{ data: { ...produk } }`. Controller backend menerima string agar repository dapat mencari slug. ID numerik dari respons detail tetap dipakai untuk aksi cart.
- Halaman detail memiliki loading, tampilan produk tidak ditemukan, tombol kembali ke koleksi, dan tombol coba lagi untuk gangguan koneksi. Produk draft/dihapus juga tidak ditampilkan pada detail (404).
- Nomor halaman mengikuti query `?page=...` di storefront.
- Hanya produk `published` yang belum dihapus ditampilkan. Data API saat setup memuat dua produk published dan delapan draft.
- Navigasi halaman muncul jika backend menyediakan `meta.current_page`, `meta.last_page`, dan `meta.total`. Backend terbaru mengembalikan metadata cursor; parameter `page` saja tidak mengubah halaman pada mode cursor. Backend perlu menerapkan pagination dan sebaiknya menyaring status published sebelum pagination agar jumlah item per halaman konsisten.
- Pencarian nama/SKU, filter stok, dan pengurutan berlaku pada produk di halaman yang sedang dimuat.
- API saat ini belum menyediakan gambar produk; kartu menampilkan placeholder.
- Detail menampilkan harga, deskripsi, stok/pre-order, dan varian. Pemesanan diarahkan ke kontak toko; checkout dan pembayaran belum diintegrasikan.
- Fetch tidak di-cache, memiliki timeout 10 detik, serta tampilan loading, kosong, dan kegagalan koneksi.

## Pemeriksaan

```bash
pnpm lint
pnpm test
pnpm build
```

`lib/store-api.ts` menangani koneksi API, `components/catalog.tsx` menangani interaksi katalog, dan `app/page.tsx` menyusun storefront.

## Keranjang

- Header menampilkan jumlah dari `GET /cart/count` (`{ cart_id, count }`). Klik indikator untuk membuka halaman `/cart`. TanStack Query mengambil jumlah sekali saat aplikasi dibuka, lalu setelah perubahan cart berhasil, checkout berhasil, atau percobaan ulang manual. Pindah halaman, fokus tab, dan koneksi kembali tidak memanggil count. Reload penuh memulai cache baru.
- `QueryProvider` di root layout menyediakan satu `QueryClient` untuk browser dan client terpisah setiap render server. Count dan items memakai query key `['cart', 'count']` / `['cart', 'items']`, `staleTime: Infinity`, serta invalidasi eksplisit. Cart dan ringkasan checkout berbagi cache items. Cache hanya di memori, tanpa menyimpan guest token di JavaScript.
- Aksi add/reduce/remove memakai `useMutation` tanpa retry otomatis. Setelah berhasil, hasil request lama dibatalkan sebelum cache cart diinvalidasi. Query yang sedang ditampilkan diambil ulang; items yang tidak sedang ditampilkan ditandai stale untuk kunjungan berikutnya. Kegagalan count tidak mengulang POST yang sudah berhasil; tombol coba lagi tersedia pada halaman cart.
- Halaman produk menyediakan tombol tambah. Setelah berhasil, tombol berubah menjadi **Batalkan** dan **Lihat cart** (`/cart`). Batalkan mengirim `reduce` untuk mengurungkan satu penambahan terakhir pada varian tersebut, sehingga jumlah yang sudah ada sebelumnya tetap tersimpan. Setelah pembatalan berhasil, tombol tambah muncul kembali. Status ini berlaku selama komponen halaman aktif dan dicatat per pilihan varian. Pengelolaan tambah/kurangi/hapus selengkapnya tersedia di halaman cart. Aksi cart mengirim `POST /cart/{productId}/modify` dengan JSON `{ "action": "add" }`, `reduce`, atau `remove`. Untuk produk bervarian, body menyertakan ID varian pada field `variant`, misalnya `{ "action": "add", "variant": 1 }`. Objek varian, harga, warna, dan stok tidak dikirim dalam mutasi cart. Produk tanpa varian tidak mengirim field `variant`. Jumlah tetap ditentukan oleh action.
- Pilihan varian menampilkan warna, label, dan stok. Pembeli harus memilih satu varian; stok nol tidak dapat ditambahkan kecuali produk pre-order. Jika field stok varian tidak tersedia, ketersediaan mengikuti produk. Halaman cart membaca `product_variant_id`, lalu mencari label/harga pada relasi varian atau `product.variants` berdasarkan ID tersebut. Aksi tambah/kurangi/hapus dan Batalkan mengirim ID varian yang sama. Backend perlu membedakan baris cart berdasarkan produk dan `product_variant_id`, termasuk ketika menghapus.
- Identitas pengunjung menggunakan cookie `guest_token` yang diterbitkan backend saat penambahan pertama. Cookie `HttpOnly` disimpan otomatis oleh browser; JavaScript tidak membaca nilainya.
- Semua request cart dikirim dengan `credentials: "same-origin"`. Proxy Next.js membaca cookie `guest_token` dari request dan meneruskannya sebagai header `X-Guest-Token`, bersama `X-Store-Id`. Query token dan `sessionStorage` tidak lagi digunakan.
- Respons `Set-Cookie` backend diteruskan ke host storefront dengan `Path=/`; atribut `HttpOnly`, `Secure`, `SameSite`, dan masa berlaku dipertahankan. Request pertama tanpa cookie tidak mengirim `X-Guest-Token`; setelah cookie diterima, count/items/modify berikutnya otomatis menggunakan identitas yang sama, termasuk setelah reload atau pada tab lain.
- Penambahan pertama tidak menunggu count berhasil. Request count yang bersamaan tetap dideduplikasi; hasil count sebelum mutasi tidak digunakan untuk refresh sesudah mutasi.
- Respons backend diteruskan dengan status HTTP, body, Content-Type, pesan validasi, dan field tambahan asli. Respons modify 201 beserta JSON-nya tidak diubah menjadi 204; array items tidak dibungkus ulang; error 4xx/5xx tidak ditimpa. Header transport disesuaikan, cache dinonaktifkan, dan cookie tetap memakai host storefront/Path=/ agar tersimpan. Hanya kegagalan koneksi tanpa respons backend yang menghasilkan 502 dengan `source: "proxy"`. Pemeriksaan origin dan ID route tetap dilakukan sebelum meneruskan request. Validasi body/action ditangani backend.
- Respons modify kosong (200/204) didukung. Tombol dinonaktifkan selama request dan kesalahan ditampilkan tanpa mengubah angka cart secara lokal. Request POST tidak dicoba ulang otomatis untuk menghindari penambahan ganda.
- Halaman `/cart` mengambil daftar dari `GET /cart/items` melalui proxy `/api/cart/items`. Respons backend berupa array item (`id`, `product_id`, `amount`); format `{ data: [...] }` juga didukung. UI melengkapi nama/harga/stok yang belum disertakan melalui `/api/products/{id}`, dengan deduplikasi ID. Respons `/api/cart/items` tetap berupa data asli backend; pengolahan hanya dilakukan untuk tampilan.
- Halaman menampilkan jumlah per produk, subtotal, tambah/kurangi/hapus, tautan detail produk, serta loading, empty state, dan retry. Kurangi pada jumlah satu mengirim `remove`; item nol atau dihapus tidak ditampilkan. Harga satuan memakai harga varian yang cocok dengan ID jika tersedia, termasuk harga nol; jika tidak ada, memakai harga produk. Total per baris = harga satuan × jumlah, dan subtotal adalah jumlah seluruh total baris. Misalnya harga varian Rp200.000 dengan jumlah 3 menghasilkan Rp600.000, meskipun harga produk Rp891.000. Harga varian tetap dapat dihitung saat detail produk belum tersedia jika respons items menyertakan relasi varian. Jika ID varian ada tetapi detail variannya tidak ditemukan, harga ditampilkan belum tersedia agar tidak keliru memakai harga dasar produk. Item dengan harga yang belum diketahui tetap dapat dihapus; subtotal tidak ditampilkan sampai semua harga tersedia.
- Tombol tambah/kurangi/hapus pada cart hanya dikunci selama mutasi berlangsung. Kegagalan detail produk, stok snapshot pada item, dan refresh count tidak menghalangi request cart. Keberhasilan/penolakan mengikuti respons backend; backend bertanggung jawab memvalidasi stok terbaru.
- Setelah perubahan, daftar diambil ulang dari backend. Tidak ada isi cart lokal yang dianggap sebagai sumber data.
- Route Laravel memakai `Route::get('/items', ...)` di dalam `Route::prefix('/cart')`, menghasilkan `/api/cart/items`. Prefix ganda pada route lokal sudah diperbaiki.

### Kontrak guest token backend

`CartService` membaca `X-Guest-Token`; endpoint modify mengirim cookie `guest_token` saat penambahan pertama. Perbaikan backend lokal di `../../laravel/toko` menginisialisasi properti cart/token, memuat cart sebelum digunakan, dan membuat cart hanya saat penambahan. Endpoint count/items tanpa token mengembalikan hasil kosong, sementara count dengan token membaca cart yang tersimpan. Respons cookie dibuat dengan `response()->json(...)->cookie(...)`. Cookie tetap `HttpOnly`, `SameSite=Lax`, dan berlaku 30 hari; `Secure` dinonaktifkan hanya untuk HTTP pada environment `local`, sedangkan HTTPS dan environment lain tetap memakai `Secure`.

Verifikasi browser terhadap API lokal memastikan cookie tersimpan setelah penambahan pertama, cart tetap sama setelah reload/tab baru, dan add/reduce/remove serta count/items berfungsi. Karena `HttpOnly`, cookie diperiksa melalui penyimpanan cookie browser, bukan `document.cookie`.

`pnpm test` memeriksa cookie menjadi header, penerusan cookie, request pertama tanpa bootstrap token, semua aksi cart, kegagalan count, serta race antara count dan mutasi.

### Integrasi filter kategori

Saat implementasi tab, endpoint kategori mengembalikan seluruh kategori walaupun diberi `per_page=10`. Semua kategori produk dalam respons ditampilkan. Endpoint produk yang diperiksa masih mengabaikan `category_id`, dan respons produk belum menyertakan relasi kategori. Frontend sudah meneruskan `category_id`, tetapi penyaringan hasil nyata membutuhkan dukungan filter dan relasi kategori pada backend. Kegagalan kategori tidak menghalangi katalog; tersedia tombol coba lagi.

### Multi theme

Tema berlaku di seluruh halaman: beranda, detail produk, cart, loading, dan error. Pilihan dihitung di server dan dipasang sebagai `data-theme` pada `<html>` agar tampilan pertama sudah memakai tema yang benar. Katalog, kategori, API, dan guest cart tetap memakai implementasi bersama.

| ID | Tampilan |
| --- | --- |
| `natural` | Hijau lembut, hero dengan ilustrasi, tampilan awal toko. |
| `minimal` | Monokrom, hero ringkas, tab kategori berbentuk pil, sudut membulat. |
| `boutique` | Warna hangat, judul serif, hero terpusat, gambar produk lebih tinggi. |

Untuk memilih tema per toko, tambahkan field opsional `theme` pada respons `/api/store`:

```json
{ "id": 404, "name": "Toko Saya", "theme": "boutique" }
```

Frontend sudah mendukung field ini; penyimpanan pilihan tema di database/panel admin backend belum ditambahkan. Jika API belum menyediakan `theme`, atur `.env.local`:

```dotenv
STORE_THEME=minimal
```

Urutan pemilihan: `store.theme` yang terdaftar → `STORE_THEME` yang terdaftar → `natural`. Nilai yang tidak dikenal diabaikan. Restart server setelah mengganti environment dan reload halaman setelah mengubah konfigurasi tema toko. Tidak ada pemilih tema di layar pembeli.

Untuk membuat tema baru:

1. Tambahkan ID dan deskripsi di `themes/registry.ts`.
2. Buat `themes/<id>/styles.css`, gunakan selector `[data-theme="<id>"]`, dan override token dari `themes/natural/styles.css` untuk warna, font, dan radius. Impor CSS tersebut di bagian awal `app/globals.css`.
3. Buat `themes/<id>/hero.tsx` untuk susunan pembuka yang berbeda, lalu daftarkan di `themes/hero.tsx`. TypeScript mewajibkan setiap ID memiliki komponen hero. Tema yang hanya mengubah warna dapat memakai ulang `NaturalHero`.
4. Gunakan pola registry komponen yang sama jika nantinya header atau bagian lain perlu susunan khusus. Pertahankan logika data dan cart di komponen bersama.
5. Jalankan `pnpm test`, `pnpm lint`, dan `pnpm build`, lalu periksa beranda/detail/cart pada layar mobile.

Tema baru boleh mewarisi token dasar. Jangan memakai selector global tanpa `[data-theme]` untuk override tampilan bersama; class komponen khusus harus unik agar tidak memengaruhi tema lain. Ukuran font utama tetap 16px dan tata letak mobile tetap dipertahankan.

### Checkout dan alamat pengiriman

Cart memiliki tautan **Lanjut ke checkout** menuju `/checkout`. Halaman checkout menampilkan ringkasan item/subtotal serta pilihan **Tambah alamat** (tamu diperbolehkan) dan **Alamat tersimpan** (memerlukan autentikasi backend). Cart kosong tidak menampilkan form checkout.

- Wilayah diambil melalui proxy `GET /api/regions` untuk provinsi, kemudian `/api/regions/{kodeInduk}` untuk kabupaten/kota, kecamatan, dan kelurahan/desa. Respons dapat berupa array langsung atau `{ data: [...] }`, dengan field `code` dan `name`.
- Setiap tingkat wilayah memakai satu combobox: klik/ketuk untuk membuka daftar, lalu ketik pada kolom yang sama untuk mencari nama/kode. Panah atas/bawah dan Enter memilih opsi; Escape atau klik di luar menutup daftar dan mempertahankan pilihan sebelumnya. Tidak ada input pencarian terpisah di atas select. Pencarian nama/kode dilakukan pada daftar subwilayah yang sudah dimuat. Kode wilayah tetap string, termasuk titik dan nol di depan. Mengganti induk menghapus semua pilihan anak dan membatalkan request wilayah sebelumnya. Tersedia loading, hasil kosong, dan retry.
- Form mengirim `POST /api/address` dengan **empat field**: `address_code` (kode desa/kelurahan), `address` (maksimum 255 karakter), `contact`, dan `recipent` (ejaan mengikuti backend). Label dibuat backend. Tidak ada kewajiban login untuk POST ini.
- Respons sukses kosong, objek alamat langsung, maupun `{ data: alamat }` didukung. Respons kosong menampilkan konfirmasi tanpa mengarang ID alamat; ID hanya digunakan jika benar-benar dikirim backend. Alamat hanya dipilih setelah penyimpanan berhasil, dan error validasi 422 ditampilkan sambil mempertahankan isi form.
- Tab alamat tersimpan memanggil `GET /api/address`. Backend wajib memverifikasi autentikasi dan hanya mengembalikan alamat milik pengguna aktif. Respons 401/419 menampilkan instruksi login; **Saya sudah login** mengulangi request, bukan mengubah status autentikasi lokal. Proxy meneruskan cookie serta header Authorization/X-XSRF-TOKEN jika tersedia; tidak membuat token login sendiri.
- Format daftar alamat: array atau `{ data: [...] }` dengan `id`, `label`, `address_code`, `address`, `recipent`, dan `contact`. Draft form tetap terjaga saat berpindah tab. Tidak ada data alamat yang disimpan di localStorage/sessionStorage.
- Tahap ini menyiapkan alamat checkout; pembuatan order, ongkos kirim, dan pembayaran belum dihubungkan.

Perbaikan backend lokal yang menyertai integrasi: query provinsi tidak lagi menyaring dengan kode induk null, dan `AddressController::add` menggunakan array hasil `$request->validate(...)` serta menambahkan label `Guest address` sebelum `Address::create(...)`. Pengujian API lokal berhasil melewati empat tingkat wilayah dan menyimpan alamat tamu; data uji dihapus kembali.

**Integrasi autentikasi yang masih diperlukan:** pada pemeriksaan terakhir, route GET `/address` memakai `auth:api`, tetapi guard `api` belum dikonfigurasi dan method `AddressController::list` belum tersedia. Karena endpoint login/kontrak token belum diberikan, frontend tidak menambahkan alur login baru. Daftar alamat telah diuji dengan backend simulasi (401 dan respons terautentikasi), sementara penggunaan nyata menunggu implementasi backend tersebut.
# commerce-fe
