import Link from "next/link";
import type { BlogSummary } from "@/lib/blog";
import { formatDate } from "@/lib/format";
import { Icon } from "./icons";

/** Kartu artikel di daftar blog; `featured` untuk artikel terbaru yang lebar di atas daftar. */
export function BlogCard({ post, featured = false }: { post: BlogSummary; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={featured ? "blog-card blog-card-featured" : "blog-card"}>
      <span className="blog-card-cover">
        {post.cover_image
          // eslint-disable-next-line @next/next/no-img-element -- gambar dari disk unggahan toko, tanpa optimasi Next.
          ? <img src={post.cover_image} alt="" loading={featured ? "eager" : "lazy"} width={1600} height={900} />
          : <Icon name="info" />}
      </span>
      <span className="blog-card-body">
        {post.published_at && <time className="blog-meta" dateTime={post.published_at}>{formatDate(new Date(post.published_at))}</time>}
        <strong className="blog-card-title">{post.title}</strong>
        {post.excerpt && <span className="blog-card-excerpt">{post.excerpt}</span>}
        <span className="blog-card-more">Baca artikel<Icon name="arrow" /></span>
      </span>
    </Link>
  );
}
