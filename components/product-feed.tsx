"use client";

import { Spinner } from "./spinner";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/lib/store-api";
import { productQueryString, readProductPage, type ProductQuery } from "@/lib/store-shared";
import { Catalog } from "./catalog";

type Status = "idle" | "loading" | "error";

const noSubscription = () => () => {};
// Assumed on the server so the first client render matches; checked for real in the browser.
const useObserverSupport = () => useSyncExternalStore(noSubscription, () => typeof IntersectionObserver !== "undefined", () => true);

export interface ProductFeedOptions {
  initial: ProductSummary[];
  initialLastId: number | null;
  initialHasMore: boolean;
  query: Omit<ProductQuery, "lastProductId">;
}

/**
 * Infinite scroll without markup: the first page comes from the server, the rest load as the
 * sentinel nears the viewport, continuing after the last product already shown.
 */
export function useProductFeed({ initial, initialLastId, initialHasMore, query }: ProductFeedOptions) {
  const [products, setProducts] = useState(initial);
  const [lastId, setLastId] = useState(initialLastId);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [status, setStatus] = useState<Status>("idle");
  const [failedOnce, setFailedOnce] = useState(false);
  const autoLoad = useObserverSupport() && !failedOnce;
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore || !lastId) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`/api/products?${productQueryString({ ...query, lastProductId: lastId })}`, {
        headers: { Accept: "application/json" }, signal: controller.signal,
      });
      if (!response.ok) throw new Error("Products request failed");
      const page = readProductPage(await response.json());
      setProducts((current) => {
        // A product edited between requests must not appear twice.
        const seen = new Set(current.map((product) => product.id));
        return [...current, ...page.data.filter((product) => !seen.has(product.id))];
      });
      setLastId(page.lastProductId);
      setHasMore(page.hasMore);
      setStatus("idle");
    } catch {
      if (controller.signal.aborted) return;
      // After a failure the buyer decides when to retry, instead of the observer looping.
      setFailedOnce(true);
      setStatus("error");
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, [hasMore, lastId, query]);

  useEffect(() => () => inFlight.current?.abort(), []);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || !autoLoad) return;
    // Start well before the end so the next page is usually ready before it is needed.
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "800px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, autoLoad, loadMore]);

  // `sentinel` goes on an element after the grid; without IntersectionObserver or after a
  // failure, show a button that calls loadMore instead.
  return { products, hasMore, status, autoLoad, loadMore, sentinel };
}

/** The default catalog grid with its "load more" area. */
export function ProductFeed({ currency, ...options }: ProductFeedOptions & { currency: string }) {
  const { products, hasMore, status, autoLoad, loadMore, sentinel } = useProductFeed(options);

  return (
    <>
      <Catalog products={products} currency={currency} />
      {hasMore && (
        <div className="product-feed-more" ref={sentinel} aria-live="polite">
          {status === "error" && <p role="alert">Produk berikutnya belum dapat dimuat.</p>}
          {(status === "error" || !autoLoad) ? (
            <Button type="button" variant="secondary" onClick={() => void loadMore()}>Muat lebih banyak</Button>
          ) : (
            status === "loading" ? <Spinner size={28} label="Memuat produk…" /> : null
          )}
        </div>
      )}
    </>
  );
}
