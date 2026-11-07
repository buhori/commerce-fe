/**
 * Konstanta Ambaz yang dipakai halaman yang diport. Nilai demo yang tidak berlaku di platform dimatikan:
 * gratis ongkir dan bungkus kado diatur toko di checkout, bukan oleh tema.
 */
export const FREE_SHIPPING_THRESHOLD = 0;
export const GIFT_WRAP_PRICE = 0;
export const MAX_COMPARE_ITEMS = 4;
export const PRODUCTS_PER_PAGE = 12;

/** Urutan katalog Ambaz, dipetakan ke urutan yang didukung platform (`sort` di /products). */
export const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Best selling', value: 'best-selling' },
  { label: 'Price, low to high', value: 'price-asc' },
  { label: 'Price, high to low', value: 'price-desc' },
  { label: 'Date, new to old', value: 'newest' },
] as const;

export const TRUST_BADGES = [
  { icon: 'truck', title: 'Fast Shipping', description: 'Tracked delivery to your door' },
  { icon: 'refresh', title: 'Easy Returns', description: 'Contact us about your order' },
  { icon: 'shield', title: 'Secure Payment', description: 'Protected checkout' },
  { icon: 'headphones', title: 'Online Support', description: 'We are happy to help' },
] as const;
