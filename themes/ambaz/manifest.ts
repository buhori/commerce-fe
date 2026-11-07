import type { SectionSchema, ThemeManifestSource } from "@sellosy/theme";

/**
 * Ambaz (template Next.js multiguna) sebagai tema berkontrak, sdk/THEME-CONTRACT.md. Setiap section adalah
 * komponen asli Ambaz yang isinya (teks, gambar, tautan) dipindah ke setting dan block, dengan isi demo Ambaz
 * sebagai default, supaya toko langsung tampil seperti demonya. Produk selalu produk toko sendiri.
 */

// ID literal (const I) supaya props komponen tetap bertipe per setting.
const link = <const I extends string>(id: I, label: string, fallback = "/products") => ({ id, type: "link", label, default: fallback }) as const;

export const heroSlider = {
  type: "hero-slider",
  name: "Slider pembuka",
  templates: ["home"],
  blocks: {
    slide: {
      name: "Slide",
      max: 8,
      settings: [
        { id: "image", type: "image", label: "Gambar", accept: ["jpg", "png", "webp"], recommended: "1920 × 730" },
        { id: "title", type: "textarea", label: "Judul", maxLength: 80, rows: 2 },
        { id: "subtitle", type: "textarea", label: "Keterangan", maxLength: 160, rows: 2 },
        { id: "button", type: "text", label: "Teks tombol", default: "Shop Collection", maxLength: 30 },
        link("link", "Tautan tombol"),
      ],
    },
  },
  default: {
    blocks: [
      { type: "slide", settings: { image: "theme://fashion/hero-slider/hero-slider1.png", title: "Women Summer\nTrend Style", subtitle: "Introducing the Ambuz women's autumn / summer Fashion" } },
      { type: "slide", settings: { image: "theme://fashion/hero-slider/hero-slider2.png", title: "New Arrivals\nCollection", subtitle: "Discover the latest fashion trends curated just for you" } },
      { type: "slide", settings: { image: "theme://fashion/hero-slider/hero-slider3.png", title: "Autumn Winter\nFashion", subtitle: "The best styles for the colder season ahead" } },
    ],
  },
} as const satisfies SectionSchema;

const image = <const I extends string>(id: I, label: string, fallback: string, recommended?: string) =>
  ({ id, type: "image", label, default: fallback || null, accept: ["jpg", "png", "webp"], ...(recommended ? { recommended } : {}) }) as const;

export const promotionalGrid = {
  type: "promotional-grid",
  name: "Grid promosi",
  templates: ["home", "collection"],
  settings: [
    { type: "heading", content: "Kartu besar (kiri)" },
    image("main_image", "Gambar", "theme://fashion/banners/banners4.webp", "765 × 600"),
    { id: "main_badge", type: "text", label: "Label", default: "POPULAR", maxLength: 24 },
    { id: "main_title", type: "textarea", label: "Judul", default: "Top Fashion\nDeals", maxLength: 60, rows: 2 },
    { id: "main_text", type: "text", label: "Keterangan", default: "DISCOVER THE NEW SEASON", maxLength: 80 },
    { id: "main_button", type: "text", label: "Teks tombol", default: "Shop Now", maxLength: 30 },
    link("main_link", "Tautan"),
    { type: "heading", content: "Kartu kanan atas (1)" },
    image("card1_image", "Gambar", "theme://fashion/banners/banners5.webp", "372 × 290"),
    { id: "card1_title", type: "text", label: "Judul", default: "Trendy Eyewear", maxLength: 60 },
    link("card1_link", "Tautan"),
    { type: "heading", content: "Kartu kanan atas (2)" },
    image("card2_image", "Gambar", "theme://fashion/banners/banners6.webp", "372 × 290"),
    { id: "card2_title", type: "text", label: "Judul", default: "Hottest Sneaker Trends", maxLength: 60 },
    link("card2_link", "Tautan"),
    { type: "heading", content: "Kartu kanan bawah" },
    image("card3_image", "Gambar", "theme://fashion/banners/banners7.webp", "765 × 290"),
    { id: "card3_title", type: "textarea", label: "Judul", default: "Fashionable Bags for\nEvery Day", maxLength: 60, rows: 2 },
    { id: "card3_text", type: "text", label: "Keterangan", default: "EVERYDAY ESSENTIALS", maxLength: 80 },
    link("card3_link", "Tautan"),
    { type: "heading", content: "Semua kartu kecil" },
    { id: "link_label", type: "text", label: "Teks tautan", default: "Shop now", maxLength: 30 },
  ],
} as const satisfies SectionSchema;

const heading = <const I extends string>(id: I, fallback: string, label = "Judul") => ({ id, type: "text", label, default: fallback, maxLength: 80 }) as const;
const products = <const I extends string>(id: I, source: "latest" | "top_sale" | "top_rating", limit: number, max = 24) =>
  ({ id, type: "product-source", label: "Produk", default: { source, limit }, max }) as const;

export const featuredCollection = {
  type: "featured-collection",
  name: "Koleksi pilihan",
  templates: ["home", "collection"],
  settings: [
    heading("title", "Featured Collection"),
    { id: "subtitle", type: "text", label: "Keterangan", default: "Discover our handpicked selection of trending styles and must-have pieces", maxLength: 160 },
    products("products", "latest", 15),
    { id: "initial", type: "range", label: "Produk sebelum tombol Load More", default: 8, min: 4, max: 16, step: 4 },
    { id: "button", type: "text", label: "Teks tombol", default: "Load More", maxLength: 30 },
  ],
} as const satisfies SectionSchema;

export const limitedTimeOffer = {
  type: "limited-time-offer",
  name: "Penawaran terbatas",
  templates: ["home", "collection", "product"],
  settings: [
    { id: "title", type: "textarea", label: "Judul", default: "Limited Time Offer On\nYour Favorite Products!", maxLength: 120, rows: 2 },
    { id: "ends_at", type: "datetime", label: "Berakhir pada", info: "Hitung mundur tampil hanya bila diisi.", default: null },
    { id: "button", type: "text", label: "Teks tombol", default: "Shop now", maxLength: 30 },
    link("link", "Tautan tombol"),
    { id: "background", type: "color", label: "Warna latar", default: "#f8fafb" },
  ],
} as const satisfies SectionSchema;

export const shopByCategories = {
  type: "shop-by-categories",
  name: "Belanja per kategori",
  templates: ["home", "collection"],
  settings: [
    heading("title", "Shop by categories"),
    { id: "subtitle", type: "text", label: "Keterangan", default: "Unmatched design—superior performance and customer satisfaction in one.", maxLength: 160 },
  ],
  blocks: {
    category: {
      name: "Kategori",
      max: 12,
      settings: [
        { id: "category", type: "category", label: "Kategori toko", info: "Nama dan tautan diambil dari kategori ini." },
        image("image", "Gambar", "", "372 × 370"),
        { id: "title", type: "text", label: "Judul", info: "Kosongkan untuk memakai nama kategori.", maxLength: 40 },
        { id: "caption", type: "text", label: "Keterangan kecil", maxLength: 40 },
      ],
    },
  },
  default: {
    blocks: [1, 2, 3, 4, 5].map((n, i) => ({ type: "category", settings: { image: `theme://fashion/categories-mega-menu/categories-mega-menu${n}.webp`, title: ["Knit Wears", "Glasses", "Sweaters", "Formal Wear", "Activewear"][i] } })),
  },
} as const satisfies SectionSchema;

export const shopTheLook = {
  type: "shop-the-look",
  name: "Shop the look",
  templates: ["home", "collection"],
  settings: [
    heading("title", "Shop the look"),
    products("products", "top_sale", 8, 12),
    image("image", "Foto lookbook", "theme://fashion/banners/banners8.png", "765 × 1000"),
  ],
  blocks: {
    pin: {
      name: "Titik produk",
      max: 6,
      settings: [
        { id: "product", type: "product", label: "Produk", info: "Kosongkan untuk memakai produk dari daftar di atas, berurutan." },
        { id: "top", type: "range", label: "Posisi dari atas", default: 30, min: 0, max: 95, unit: "%" },
        { id: "left", type: "range", label: "Posisi dari kiri", default: 40, min: 0, max: 95, unit: "%" },
      ],
    },
  },
  default: {
    blocks: [
      { type: "pin", settings: { top: 15, left: 40 } },
      { type: "pin", settings: { top: 35, left: 12 } },
      { type: "pin", settings: { top: 55, left: 65 } },
      { type: "pin", settings: { top: 75, left: 45 } },
    ],
  },
} as const satisfies SectionSchema;

export const featuredSlider = {
  type: "featured-slider",
  name: "Slider produk",
  templates: ["home", "collection", "product"],
  settings: [heading("title", "Featured Collection"), products("products", "top_sale", 12)],
} as const satisfies SectionSchema;

export const tabContent = {
  type: "tab-content",
  name: "Tab dengan media",
  templates: ["home", "collection"],
  settings: [
    { id: "button", type: "text", label: "Teks tombol", default: "Shop Collection", maxLength: 30 },
    link("link", "Tautan tombol"),
  ],
  blocks: {
    tab: {
      name: "Tab",
      max: 5,
      settings: [
        { id: "title", type: "text", label: "Judul", maxLength: 60 },
        { id: "text", type: "textarea", label: "Keterangan", maxLength: 300, rows: 3 },
        image("image", "Gambar", "", "765 × 750"),
        { id: "video", type: "video", label: "Video YouTube", info: "Bila diisi, video tampil menggantikan gambar." },
      ],
    },
  },
  default: {
    blocks: [
      { type: "tab", settings: { title: "The Bomber Jackets", text: "A bomber jacket is a short, waist-length jacket with a fitted or elastic waistband and cuffs. Typically featuring a front zipper, the jacket is often made from leather.", image: "theme://fashion/tab/tab1.webp" } },
      { type: "tab", settings: { title: "Sweaters & Cardigans", text: "Cozy and versatile sweaters and cardigans perfect for layering. Made from premium knit fabrics with modern silhouettes and classic comfort.", video: "https://www.youtube.com/watch?v=RgKAFK5djSk", image: "theme://fashion/tab/tab2.webp" } },
      { type: "tab", settings: { title: "Corduroy Shirts", text: "Classic corduroy shirts with a soft, ribbed texture. Perfect for casual and semi-formal occasions, offering both style and comfort in every season.", image: "theme://fashion/tab/tab2.webp" } },
    ],
  },
} as const satisfies SectionSchema;

export const marquee = {
  type: "marquee",
  name: "Teks berjalan",
  templates: ["home", "collection", "product", "page"],
  settings: [
    { id: "text", type: "text", label: "Teks", default: "Welcome to store", maxLength: 60 },
    { id: "background", type: "color", label: "Warna latar", default: "#f8fafb" },
  ],
} as const satisfies SectionSchema;

export const bannerList = {
  type: "banner-list",
  name: "Daftar banner",
  templates: ["home", "collection", "page"],
  blocks: {
    banner: {
      name: "Banner",
      max: 6,
      settings: [
        image("image", "Gambar", "", "500 × 600"),
        { id: "title", type: "text", label: "Judul", maxLength: 60 },
        { id: "text", type: "text", label: "Keterangan", maxLength: 160 },
        { id: "button", type: "text", label: "Teks tautan", default: "SHOP NOW", maxLength: 30 },
        link("link", "Tautan"),
      ],
    },
  },
  default: {
    blocks: [
      { type: "banner", settings: { image: "theme://fashion/banners/banners1.png", title: "Elevated Styles for Women", text: "Explore sophisticated pieces designed for the modern woman." } },
      { type: "banner", settings: { image: "theme://fashion/banners/banners2.png", title: "Shipt Cotton Crop Top", text: "Explore sophisticated pieces designed for the modern woman." } },
      { type: "banner", settings: { image: "theme://fashion/banners/banners3.png", title: "Explore Trendy Accessories", text: "Explore sophisticated pieces designed for the modern woman." } },
    ],
  },
} as const satisfies SectionSchema;

export const testimonials = {
  type: "testimonials",
  name: "Testimoni",
  templates: ["home", "page"],
  settings: [
    heading("title", "Testimonial"),
    { id: "background", type: "color", label: "Warna latar", default: "#f7f8fc" },
    { type: "paragraph", content: "Isi dengan testimoni pembeli yang asli. Section tidak tampil sebelum ada testimoni." },
  ],
  blocks: {
    testimonial: {
      name: "Testimoni",
      max: 12,
      settings: [
        image("avatar", "Foto", "", "180 × 180"),
        { id: "name", type: "text", label: "Nama", maxLength: 40 },
        { id: "role", type: "text", label: "Keterangan (mis. kota)", maxLength: 40 },
        { id: "text", type: "textarea", label: "Testimoni", maxLength: 300, rows: 3 },
        { id: "rating", type: "range", label: "Rating", default: 5, min: 1, max: 5 },
      ],
    },
  },
} as const satisfies SectionSchema;

export const latestBlog = {
  type: "latest-blog",
  name: "Artikel blog",
  templates: ["home", "article", "page"],
  settings: [
    heading("title", "Latest Blog"),
    { id: "posts", type: "posts", label: "Artikel", max: 9 },
    { id: "link_label", type: "text", label: "Teks tautan", default: "Read more", maxLength: 30 },
  ],
} as const satisfies SectionSchema;

export const instagramFeed = {
  type: "instagram-feed",
  name: "Galeri Instagram",
  templates: ["home", "page"],
  settings: [
    heading("title", "Instagram shop"),
    { id: "subtitle", type: "text", label: "Keterangan", default: "Become a member of our community", maxLength: 120 },
    { id: "account", type: "link", label: "Tautan akun Instagram", default: null },
    { id: "images", type: "images", label: "Foto", accept: ["jpg", "png", "webp"], max: 12, default: [1, 2, 3, 4, 5, 6, 7].map((n) => `theme://fashion/instagram/instagram${n}.webp`) },
  ],
} as const satisfies SectionSchema;

export const trustBadges = {
  type: "trust-badges",
  name: "Keunggulan toko",
  templates: ["home", "collection", "product", "page"],
  blocks: {
    badge: {
      name: "Keunggulan",
      max: 4,
      settings: [
        { id: "icon", type: "select", label: "Ikon", default: "shipping", options: [
          { value: "shipping", label: "Pengiriman" }, { value: "support", label: "Bantuan" }, { value: "payment", label: "Pembayaran" }, { value: "guarantee", label: "Jaminan" },
        ] },
        { id: "title", type: "text", label: "Judul", maxLength: 40 },
        { id: "text", type: "text", label: "Keterangan", maxLength: 80 },
      ],
    },
  },
  default: {
    blocks: [
      { type: "badge", settings: { icon: "shipping", title: "Fast Delivery", text: "Shipped with tracking to your door" } },
      { type: "badge", settings: { icon: "support", title: "Online Support", text: "Chat with us about your order" } },
      { type: "badge", settings: { icon: "payment", title: "Secure Payment", text: "Protected checkout" } },
      { type: "badge", settings: { icon: "guarantee", title: "Trusted Store", text: "Shop with confidence" } },
    ],
  },
} as const satisfies SectionSchema;

// Media sosial: ikon hanya tampil untuk akun yang diisi.
const socials = [
  { id: "twitter", type: "link", label: "X (Twitter)", default: null },
  { id: "facebook", type: "link", label: "Facebook", default: null },
  { id: "instagram", type: "link", label: "Instagram", default: null },
  { id: "tiktok", type: "link", label: "TikTok", default: null },
  { id: "linkedin", type: "link", label: "LinkedIn", default: null },
] as const;

export const announcementBar = {
  type: "announcement-bar",
  name: "Bilah pengumuman",
  templates: ["header"],
  settings: [
    { id: "background", type: "color", label: "Warna latar", default: "#000000" },
    { id: "text_color", type: "color", label: "Warna teks", default: "#ffffff" },
    { id: "autoplay", type: "checkbox", label: "Ganti pengumuman otomatis setiap 5 detik", default: false },
    { id: "show_contact", type: "checkbox", label: "Tampilkan telepon dan email toko di kanan", default: true },
    { type: "heading", content: "Media sosial (kiri)" },
    ...socials,
  ],
  blocks: {
    announcement: {
      name: "Pengumuman",
      max: 6,
      settings: [
        { id: "text", type: "text", label: "Teks", maxLength: 80 },
        { id: "link", type: "link", label: "Tautan", default: null },
      ],
    },
  },
  default: {
    blocks: [
      { type: "announcement", settings: { text: "Welcome to our store →" } },
      { type: "announcement", settings: { text: "Free shipping on orders over $150 →" } },
      { type: "announcement", settings: { text: "New arrivals just dropped →", link: "/products" } },
    ],
  },
} as const satisfies SectionSchema;

export const mainHeader = {
  type: "main-header",
  name: "Header",
  templates: ["header"],
  settings: [
    { id: "logo", type: "image", label: "Logo", info: "Kosongkan untuk memakai logo toko.", default: null, accept: ["png", "webp", "jpg"], recommended: "260 × 72" },
    { id: "logo_width", type: "range", label: "Lebar logo", default: 130, min: 80, max: 240, step: 5, unit: "px" },
    { id: "sticky", type: "checkbox", label: "Header tetap di atas saat digulir", default: true },
    { id: "show_wishlist", type: "checkbox", label: "Tampilkan wishlist", default: true },
    { type: "paragraph", content: "Menu diambil dari Navigasi toko; sub-menu tampil sebagai dropdown." },
    { type: "heading", content: "Panel pencarian" },
    { id: "search_placeholder", type: "text", label: "Teks kolom cari", default: "What are you looking for...", maxLength: 60 },
    { id: "popular_title", type: "text", label: "Judul pencarian populer", default: "Popular searches:", maxLength: 40 },
    { id: "popular_searches", type: "text", label: "Pencarian populer", info: "Pisahkan dengan koma.", default: "T-Shirt, Blue, Jacket, Dress, Shorts", maxLength: 200 },
    { id: "products_title", type: "text", label: "Judul produk", default: "Most searched products:", maxLength: 40 },
    { id: "products", type: "product-source", label: "Produk di panel pencarian", default: { source: "top_sale", limit: 4 }, max: 8 },
    { type: "heading", content: "Mega menu" },
    {
      type: "paragraph",
      content: "Otomatis: menu yang sub-menunya punya tautan tingkat ketiga tampil sebagai kolom; sub-menu kategori bergambar tampil sebagai kartu. Tambah block Mega menu untuk gambar promo atau memaksa tata letak.",
    },
  ],
  blocks: {
    mega: {
      name: "Mega menu",
      max: 8,
      settings: [
        { id: "menu", type: "text", label: "Item menu", info: "Nama item menu utama persis seperti di Navigasi, mis. Shop.", maxLength: 60 },
        { id: "layout", type: "select", label: "Tata letak", default: "auto", options: [
          { value: "auto", label: "Otomatis" }, { value: "columns", label: "Kolom tautan" }, { value: "cards", label: "Kartu kategori" }, { value: "dropdown", label: "Dropdown biasa" },
        ] },
        { id: "cards", type: "range", label: "Jumlah kartu kategori", default: 5, min: 3, max: 6, visibleIf: { setting: "layout", equals: "cards" } },
        { type: "heading", content: "Gambar promo (tata letak kolom)" },
        image("image", "Gambar", "", "540 × 540"),
        { id: "title", type: "text", label: "Judul", maxLength: 40 },
        { id: "subtitle", type: "text", label: "Keterangan", default: "SHOP NOW", maxLength: 40 },
        { id: "link", type: "link", label: "Tautan", default: null },
      ],
    },
  },
} as const satisfies SectionSchema;

export const mainFooter = {
  type: "main-footer",
  name: "Footer",
  templates: ["footer"],
  settings: [
    { id: "background", type: "color", label: "Warna latar", default: "#f7f8fc" },
    { type: "heading", content: "Kolom 1" },
    { id: "about_title", type: "text", label: "Judul", default: "About us", maxLength: 40 },
    { id: "about_text", type: "textarea", label: "Teks", info: "Kosongkan untuk memakai deskripsi toko.", maxLength: 300, rows: 3 },
    ...socials,
    { type: "heading", content: "Kolom 2: halaman toko" },
    { id: "pages_title", type: "text", label: "Judul", default: "Quick Links", maxLength: 40 },
    { type: "heading", content: "Kolom 3: tautan (block)" },
    { id: "links_title", type: "text", label: "Judul", default: "Company", maxLength: 40 },
    { type: "heading", content: "Kolom 4: kontak toko" },
    { id: "contact_title", type: "text", label: "Judul", default: "Contact us", maxLength: 40 },
    { id: "contact_text", type: "textarea", label: "Teks", default: "Have a question? We are happy to help.", maxLength: 200, rows: 2 },
    { type: "heading", content: "Baris bawah" },
    { id: "copyright", type: "text", label: "Hak cipta", info: "Kosongkan untuk \"© tahun, nama toko\".", maxLength: 100 },
    { id: "payment_icons", type: "checkbox", label: "Tampilkan logo kartu (Visa, Mastercard, …)", info: "Nyalakan hanya bila toko menerima kartu tersebut.", default: false },
  ],
  blocks: {
    link: {
      name: "Tautan",
      max: 8,
      settings: [
        { id: "label", type: "text", label: "Teks", maxLength: 40 },
        { id: "link", type: "link", label: "Tujuan", default: "/" },
      ],
    },
  },
  default: {
    blocks: [
      { type: "link", settings: { label: "Wishlist", link: "/wishlist" } },
      { type: "link", settings: { label: "My account", link: "/profile" } },
      { type: "link", settings: { label: "Product compare", link: "/compare" } },
      { type: "link", settings: { label: "Cart", link: "/cart" } },
    ],
  },
} as const satisfies SectionSchema;

export const manifest: ThemeManifestSource = {
  id: "ambaz",
  name: "Ambaz",
  version: "1.0.0",
  description: "Toko modern multiguna: slider besar, kartu produk dengan aksi cepat, banner promosi, dan koleksi pilihan.",
  sections: [
    announcementBar, mainHeader, mainFooter, heroSlider, promotionalGrid, featuredCollection, limitedTimeOffer, shopByCategories,
    shopTheLook, featuredSlider, tabContent, marquee, bannerList, testimonials, latestBlog, instagramFeed, trustBadges,
  ],
  presets: {
    utama: {
      name: "Utama",
      templates: {
        header: { sections: [{ type: "announcement-bar" }, { type: "main-header" }] },
        home: {
          sections: [
            { type: "hero-slider" }, { type: "promotional-grid" }, { type: "featured-collection" }, { type: "limited-time-offer" },
            { type: "shop-by-categories" }, { type: "shop-the-look" }, { type: "featured-slider" }, { type: "tab-content" },
            { type: "marquee" }, { type: "banner-list" }, { type: "testimonials" }, { type: "latest-blog" },
            { type: "instagram-feed" }, { type: "trust-badges" },
          ],
        },
        footer: { sections: [{ type: "main-footer" }] },
      },
    },
  },
};
