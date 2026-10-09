import Link from "next/link";
import { preorderDays, type ProductSummary } from "@/lib/store-api";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { Icon } from "./icons";

export function Catalog({ products, currency }: { products: ProductSummary[]; currency: string }) {
  return (
    <ul className="product-grid">
      {products.map((product) => {
        const preorder = preorderDays(product);
        const soldOut = !preorder && product.stock === 0;
        return (
          <li key={product.id}>
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
                <strong className="product-price">{formatPrice(product.price, currency)}</strong>
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
