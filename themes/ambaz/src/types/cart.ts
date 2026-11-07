export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  vendor: string;
}
