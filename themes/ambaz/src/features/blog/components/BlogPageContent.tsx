'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BlogPage } from '@sellosy/theme';
import { PLACEHOLDER_IMAGE } from '../../../lib/adapt';

const pageHref = (page: number) => (page > 1 ? `/blog?page=${page}` : '/blog');

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={14} height={14}>
      <path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

/** Blog Ambaz dengan artikel toko (blog platform, berhalaman). */
export function BlogPageContent({ blog }: { blog: BlogPage }) {
  const data = blog.posts;
  return (
    <>
      <div className="container-main" style={{ paddingTop: '50px', paddingBottom: '80px' }}>
        <h1 className="bp-page-heading">Blog</h1>

        <div className="bp-grid">
          {data.length === 0 && <p className="bp-excerpt">No articles yet.</p>}
          {data.map((post) => (
            <article key={post.slug} className="bp-card">

              {/* Image */}
              <Link href={`/blog/${post.slug}`} className="bp-img-link">
                <Image
                  unoptimized
                  src={post.cover_image || PLACEHOLDER_IMAGE}
                  alt={post.title}
                  fill
                  className="bp-img"
                  style={{ objectFit: 'cover', transition: 'transform 500ms ease' }}
                  sizes="(max-width: 749px) 100vw, (max-width: 991px) 50vw, 33vw"
                />
              </Link>

              {/* Content */}
              <div className="bp-body">
                {post.published_at && <div className="bp-date">
                  <CalendarIcon />
                  <span>{formatDate(post.published_at)}</span>
                </div>}

                <Link href={`/blog/${post.slug}`} className="bp-title">
                  {post.title}
                </Link>

                {post.excerpt && <p className="bp-excerpt">{post.excerpt}</p>}

                <Link href={`/blog/${post.slug}`} className="bp-readmore">
                  Read more <ArrowIcon />
                </Link>
              </div>

            </article>
          ))}
        </div>
        {blog.lastPage > 1 && (
          <nav aria-label="Blog pages" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
            {blog.page > 1 && <Link href={pageHref(blog.page - 1)} className="bp-readmore">← Newer posts</Link>}
            <span className="bp-excerpt" style={{ margin: 0 }}>Page {blog.page} of {blog.lastPage}</span>
            {blog.page < blog.lastPage && <Link href={pageHref(blog.page + 1)} className="bp-readmore">Older posts <ArrowIcon /></Link>}
          </nav>
        )}
      </div>

      <style>{bpStyles}</style>
    </>
  );
}

const bpStyles = `
  /* ── Page heading ── */
  .bp-page-heading {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 32px;
  }

  /* ── Grid ── */
  .bp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  /* ── Card ── */
  .bp-card {
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  /* ── Image ── */
  .bp-img-link {
    display: block;
    position: relative;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    background: #f5f5f5;
    flex-shrink: 0;
  }
  .bp-card:hover .bp-img {
    transform: scale(1.05);
  }

  /* ── Body ── */
  .bp-body {
    padding: 20px 20px 24px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  /* ── Date ── */
  .bp-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 500;
    color: #999;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }

  /* ── Title — NO underline effect ── */
  .bp-title {
    display: block;
    font-size: 24px;
    font-weight: 600;
    color: #222;
    text-decoration: none;
    line-height: 1.4;
    margin-bottom: 12px;
    transition: color 0.2s ease;
  }
  .bp-title:hover { color: #555; }

  /* ── Excerpt ── */
  .bp-excerpt {
    font-size: 17px;
    color: #666;
    line-height: 1.65;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
    margin-bottom: 16px;
  }

  /* ── Read more ── */
  .bp-readmore {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 17px;
    font-weight: 500;
    color: #222;
    text-decoration: none;
  }
  .bp-readmore:hover { color: #555; }

  /* ── Responsive ── */
  @media (max-width: 991px) {
    .bp-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 599px) {
    .bp-grid { grid-template-columns: 1fr; }
    .bp-page-heading { font-size: 26px; }
  }
`;
