import Link from "next/link";
import { catalogUrl, SortSelect, type CatalogPageProps } from "@sellosy/theme";
import { ProductGrid } from "./product-grid";
import s from "./editorial.module.css";

export function CatalogPage({ store, categories, category, filter, q, sort, title, products }: CatalogPageProps) {
  const here = category ? catalogUrl({ category: category.slug, q, sort }) : catalogUrl(filter);
  return (
    <main className={`${s.main} ${s.block}`}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>{q ? "Hasil pencarian" : "Koleksi"}</p>
        <h1 className={s.pageTitle}>{q ? `“${q}”` : title}</h1>
        <nav className={s.filters} aria-label="Kategori">
          {/* catalogUrl mempertahankan pencarian dan urutan saat kategori berganti. */}
          <Link href={catalogUrl({ q, sort })} aria-current={!category ? "page" : undefined}>Semua</Link>
          {categories.map((item) => (
            <Link key={item.id} href={catalogUrl({ category: item.slug, q, sort })} aria-current={item.id === category?.id ? "page" : undefined}>
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      <div className={s.toolbar}>
        <span>{products ? `${products.items.length}${products.hasMore ? "+" : ""} produk` : ""}</span>
        <SortSelect filter={filter} category={category?.slug} />
      </div>

      {!products ? (
        <p className={s.empty}>Produk belum dapat dimuat. <a href={here}>Coba lagi</a></p>
      ) : products.items.length === 0 ? (
        <p className={s.empty}>{q ? "Produk tidak ditemukan." : "Belum ada produk di sini."} <Link href="/products">Lihat semua produk</Link></p>
      ) : (
        <ProductGrid key={JSON.stringify(products.query)} listing={products} currency={store.currency || "IDR"} />
      )}
    </main>
  );
}
