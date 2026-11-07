import { Suspense } from "react";
import { productView, type ArticlePageProps, type BlogPageProps, type CartPageProps, type CatalogPageProps, type ComparePageProps, type InfoPageProps, type LoginPageProps, type ProductPageProps } from "@sellosy/theme";
import { LoginPageContent } from "./src/features/auth/components/LoginPageContent";
import { InfoPageContent } from "./src/features/pages/InfoPageContent";
import { NotFoundContent } from "./src/features/pages/NotFoundContent";
import { WishlistPageContent } from "./src/features/wishlist/components/WishlistPageContent";
import { ComparePageContent } from "./src/features/compare/components/ComparePageContent";
import { BlogDetailContent } from "./src/features/blog/components/BlogDetailContent";
import { BlogPageContent } from "./src/features/blog/components/BlogPageContent";
import { CartPageContent } from "./src/features/cart/components/CartPageContent";
import { ProductDetailContent } from "./src/features/products/components/ProductDetailContent";
import { ShopPageContent } from "./src/features/shop/components/ShopPageContent";
import { toAmbazProduct } from "./src/lib/adapt";

/** Teks biasa dari HTML deskripsi (sudah disanitasi backend), dipotong untuk ringkasan di bawah harga. */
function excerptOf(html: string, max = 220): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

/**
 * Halaman Ambaz (src/, salinan file asli Ambaz yang datanya diganti platform lewat adapter di src/store dan src/lib).
 * `ambaz-scope` memasang reset dasar Ambaz seperti di dalam section tema.
 */
export function CartPage({ store }: CartPageProps) {
  return (
    <main className="ambaz-scope ambaz-page">
      <CartPageContent maintenance={store.maintenance.active} maintenanceNote="Checkout is temporarily closed while the store is under maintenance." />
    </main>
  );
}

export function ProductPage({ store, product, view, url }: ProductPageProps) {
  const currency = store.currency || "IDR";
  return (
    <main className="ambaz-scope ambaz-page">
      <ProductDetailContent
        key={product.id}
        product={{ ...toAmbazProduct(product, currency), images: view.gallery.map((src, i) => ({ id: `${product.id}-${i}`, src, alt: product.name })) }}
        excerpt={excerptOf(product.description ?? "")}
        specs={view.specs}
        categoryId={product.categories?.[0]?.id ?? null}
        purchase={{
          productId: product.id,
          variants: product.variants || [],
          preorder: view.preorder > 0,
          stock: product.stock,
          price: product.price,
          finalPrice: product.final_price,
          discount: product.discount,
          currency,
          maintenance: store.maintenance.active,
          whatsapp: product.whatsapp ? { ...product.whatsapp, storeName: store.name, productName: product.name, productUrl: url } : null,
          productName: product.name,
          image: view.gallery[0] ?? null,
        }}
      />
    </main>
  );
}

/** "/products" (semua, pencarian, filter) dan "/c/{slug}". */
export function CatalogPage({ filter, categories, category, q, sort, title, products }: CatalogPageProps) {
  return (
    <main className="ambaz-scope ambaz-page">
      {/* useSearchParams (tampilan kolom) di dalam Suspense. */}
      <Suspense>
        <ShopPageContent
          listing={products}
          categories={categories}
          category={category}
          categoryIds={filter.categoryIds}
          q={q}
          sort={sort}
          title={title}
          breadcrumbLabel={category?.name ?? (q ? "Search" : "Products")}
        />
      </Suspense>
    </main>
  );
}

export function BlogPage({ blog }: BlogPageProps) {
  return <main className="ambaz-scope ambaz-page"><BlogPageContent blog={blog} /></main>;
}

export function ArticlePage({ post, url }: ArticlePageProps) {
  return <main className="ambaz-scope ambaz-page"><BlogDetailContent post={post} url={url} /></main>;
}

export function ComparePage({ store, products, ids }: ComparePageProps) {
  const views = products.map(productView);
  return (
    <main className="ambaz-scope ambaz-page">
      <ComparePageContent
        products={products.map((product, i) => ({ ...toAmbazProduct(product, store.currency || "IDR"), images: views[i].gallery.map((src, j) => ({ id: `${product.id}-${j}`, src, alt: product.name })) }))}
        specs={views.map((view) => view.specs)}
        restore={ids.length === 0}
      />
    </main>
  );
}

export function WishlistPage() {
  return <main className="ambaz-scope ambaz-page"><WishlistPageContent /></main>;
}

export function LoginPage({ next, providers, accounts, error }: LoginPageProps) {
  return <main className="ambaz-scope ambaz-page"><LoginPageContent next={next} providers={providers} accounts={accounts} error={error} /></main>;
}

export function InfoPage({ page }: InfoPageProps) {
  return <main className="ambaz-scope ambaz-page"><InfoPageContent page={page} /></main>;
}

export function NotFoundPage() {
  return <main className="ambaz-scope ambaz-page"><NotFoundContent /></main>;
}
