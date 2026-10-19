import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CompareDiffToggle, CompareRemoveButton, CompareRestore } from "@/components/compare-tray";
import { Icon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { ProductPrice } from "@/components/product-price";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { compareSpecRows, differs, readCompareIds } from "@/lib/compare";
import { formatProductStats } from "@/lib/format";
import { productView } from "@/lib/product-view";
import { pageMetadata } from "@/lib/seo";
import { getSiteSeo } from "@/lib/site-seo";
import { getProduct, getStore, type Product } from "@/lib/store-api";

export async function generateMetadata(): Promise<Metadata> {
  // Kombinasi produk tak terbatas dan isinya ada di halaman produk: tidak diindeks.
  return pageMetadata(await getSiteSeo(), { title: "Bandingkan produk", path: "/compare", noindex: true });
}

const productPath = (product: Product) => `/products/${encodeURIComponent(product.slug)}`;

/** Bandingkan produk pilihan pembeli: /compare?p=<id>,<id> (lihat lib/compare.ts). */
export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const ids = readCompareIds((await searchParams).p);
  const [store, found] = await Promise.all([
    getStore(),
    // Produk yang sudah dihapus atau tidak dipublikasikan dilewati saja.
    Promise.all(ids.map((id) => getProduct(String(id)).catch(() => null))),
  ]);
  const products = found.filter((product): product is Product => product !== null);
  const currency = store.currency || "IDR";

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page compare-page">
        <div className="container">
          <header className="compare-heading">
            <span className="detail-kicker">PILIH YANG PALING PAS</span>
            <h1>Bandingkan produk</h1>
          </header>
          {products.length === 0
            ? <CompareEmpty restore={ids.length === 0} />
            : <CompareTable products={products} currency={currency} />}
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}

function CompareEmpty({ restore }: { restore: boolean }) {
  return (
    <div className="compare-empty">
      {/* Dibuka dari menu atau ketikan langsung: pakai daftar yang tersimpan di browser ini. */}
      {restore && <CompareRestore />}
      <Icon name="compare" />
      <p>Belum ada produk untuk dibandingkan. Buka halaman produk lalu pilih <strong>Bandingkan</strong>, paling banyak 4 produk.</p>
      <Link className="compare-empty-link" href="/products">Lihat produk <Icon name="arrow" /></Link>
    </div>
  );
}

function CompareTable({ products, currency }: { products: Product[]; currency: string }) {
  const views = products.map(productView);
  const ids = products.map((product) => product.id);

  // Baris tetap dulu, lalu gabungan spesifikasi semua produk (termasuk berat dan ukuran).
  const rows: { label: string; cells: ReactNode[]; same: boolean }[] = [
    {
      label: "Harga",
      cells: products.map((product) => <ProductPrice key={product.id} className="compare-price" item={product} currency={currency} />),
      same: !differs(products.map((product) => String(product.final_price ?? product.price))),
    },
    ...[
      { label: "Ulasan", values: products.map((product) => formatProductStats({ rating: product.rating, rating_count: product.rating_count }) || null) },
      { label: "Ketersediaan", values: views.map((view) => view.availability.text) },
      { label: "Varian", values: products.map((product) => product.variants?.map((variant) => variant.label).filter(Boolean).join(", ") || null) },
      { label: "Kategori", values: products.map((product) => product.categories?.map((category) => category.name).join(", ") || null) },
      ...compareSpecRows(views.map((view) => view.specs)),
    ]
      // Baris yang kosong di semua produk tidak ada gunanya.
      .filter((row) => row.values.some((value) => value))
      .map((row) => ({ label: row.label, cells: row.values.map((value) => value ?? "—"), same: !differs(row.values) })),
  ];

  return (
    <div className="compare-shell" data-diff-only="false">
      {products.length > 1 && <CompareDiffToggle />}
      <div className="compare-scroll" tabIndex={0} role="region" aria-label="Tabel perbandingan produk">
        <table className="compare-table" style={{ ["--compare-columns" as string]: products.length }}>
          <thead>
            <tr>
              <td />
              {products.map((product) => (
                <th key={product.id} scope="col">
                  <CompareRemoveButton id={product.id} name={product.name} remaining={ids.filter((id) => id !== product.id)} />
                  <Link className="compare-product" href={productPath(product)}>
                    <span className="compare-product-art"><ProductImage src={productView(product).gallery[0] ?? null} name={product.name} /></span>
                    <span className="compare-product-name">{product.name}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} data-same={row.same}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, index) => <td key={ids[index]}>{cell}</td>)}
              </tr>
            ))}
            <tr>
              <td />
              {products.map((product) => (
                <td key={product.id}>
                  <Link className="compare-view-link" href={productPath(product)}>Lihat produk <Icon name="arrow" /></Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
