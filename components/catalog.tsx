import Link from "next/link";
import type { ProductSummary } from "@/lib/store-api";
import { preorderDays } from "@/lib/store-shared";
import { formatProductStats } from "@/lib/format";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";
import { Icon } from "./icons";
import { WishlistButton } from "./wishlist-button";

export function Catalog({ products, currency }: { products: ProductSummary[]; currency: string }) {
  return (
    <ul className="product-grid">
      {products.map((product) => {
        const preorder = preorderDays(product);
        const soldOut = !preorder && product.stock === 0;
        const stats = formatProductStats(product);
        return (
          <li key={product.id} className="product-card-item">
            {/* Outside the link: a button inside <a> is invalid and would open the product. */}
            <WishlistButton productId={product.id} productName={product.name} />
            <Link className="product-card" href={`/products/${encodeURIComponent(product.slug)}`} data-sold-out={soldOut}>
              <div className="product-art">
                <ProductImage key={product.images} src={product.images} name={product.name} />
                {soldOut && <span className="product-badge product-badge-muted">Habis</span>}
              </div>
              <div className="product-info">
                <div className="product-card-heading">
                  <h3>{product.name}</h3>
                  <Icon name="arrow" aria-hidden="true" />
                </div>
                <ProductPrice className="product-price" item={product} currency={currency} />
                {stats && <span className="product-stats">{stats}</span>}
                {preorder > 0 && <span className="product-preorder">Pre-order · {preorder} hari</span>}
                {(product.variants_count ?? 0) > 0 && <span className="product-meta">{product.variants_count} varian</span>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
