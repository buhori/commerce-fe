import { formatPrice } from "@/lib/format";
import { priceView, type Priced } from "@/lib/price";

/**
 * Harga produk atau varian: harga akhir menonjol, harga normal dicoret, dan lencana diskon.
 * Teks tersembunyi memberi tahu pembaca layar mana harga diskon dan mana harga normal.
 */
export function ProductPrice({ item, parent, currency, className }: {
  /** Produk, atau varian bersama `parent` produknya. */
  item: Priced;
  parent?: Priced | null;
  currency: string;
  className?: string;
}) {
  const view = priceView(item, parent);
  const discounted = view.original !== null;
  return (
    <span className={`price-tag${className ? ` ${className}` : ""}`} data-discounted={discounted}>
      <span className="price-final">{discounted && <span className="sr-only">Harga diskon </span>}{formatPrice(view.final, currency)}</span>
      {discounted && <s className="price-original"><span className="sr-only">Harga normal </span>{formatPrice(view.original!, currency)}</s>}
      {view.label && <span className="price-badge"><span className="sr-only">Diskon </span>{view.label}</span>}
    </span>
  );
}
