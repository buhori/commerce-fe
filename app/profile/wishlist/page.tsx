import { Catalog } from "@/components/catalog";
import { getProducts, getStore } from "@/lib/store-api";

// Dummy: menampilkan beberapa produk katalog sampai fitur wishlist tersedia di backend.
export default async function WishlistPage() {
  const [store, products] = await Promise.all([getStore(), getProducts().catch(() => null)]);
  const items = products?.data.slice(0, 6) ?? [];

  return (
    <>
      <header className="profile-heading">
        <h1>Wishlist</h1>
      </header>
      {items.length > 0
        ? <div className="storefront-catalog profile-wishlist"><Catalog products={items} currency={store.currency || "IDR"} /></div>
        : <div className="profile-empty"><p>Wishlist Anda masih kosong.</p></div>}
    </>
  );
}
