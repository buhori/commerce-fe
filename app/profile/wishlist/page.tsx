import { WishlistProducts } from "@/components/wishlist-products";
import { getStore } from "@/lib/store-api";

export default async function WishlistPage() {
  const store = await getStore();

  return (
    <>
      <header className="profile-heading">
        <h1>Wishlist</h1>
      </header>
      <WishlistProducts currency={store.currency || "IDR"} />
    </>
  );
}
