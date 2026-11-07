'use client';

import Image from 'next/image';
import Link from 'next/link';
import { RichText, type BlogPost } from '@sellosy/theme';

/* ── Icons ── */
function IcoFacebook() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.001 2C6.47813 2 2.00098 6.47715 2.00098 12C2.00098 16.9913 5.65783 21.1283 10.4385 21.8785V14.8906H7.89941V12H10.4385V9.79688C10.4385 7.29063 11.9314 5.90625 14.2156 5.90625C15.3097 5.90625 16.4541 6.10156 16.4541 6.10156V8.5625H15.1931C13.9509 8.5625 13.5635 9.33334 13.5635 10.1242V12H16.3369L15.8936 14.8906H13.5635V21.8785C18.3441 21.1283 22.001 16.9913 22.001 12C22.001 6.47715 17.5238 2 12.001 2Z" />
    </svg>
  );
}
function IcoTwitter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.4883 14.651L15.25 21H22.25L14.3917 10.5223L20.9308 3H18.2808L13.1643 8.88578L8.75 3H1.75L9.26086 13.0145L2.31915 21H4.96917L10.4883 14.651ZM16.25 19L5.75 5H7.75L18.25 19H16.25Z" />
    </svg>
  );
}
function IcoPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" />
    </svg>
  );
}
function IcoShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.0001 9.00015V2.00015L21.0001 10.0001L13.0001 18.0001V10.9501C8.00011 10.9501 4.50011 12.5001 2.00011 16.0001C3.00011 11.0001 6.00011 6.00015 13.0001 9.00015Z" />
    </svg>
  );
}
function IcoArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z" />
    </svg>
  );
}
function IcoArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
    </svg>
  );
}

function formatDate(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number);
  const [, , day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day || 1).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface Props {
  post: BlogPost;
  /** URL kanonik artikel, untuk tombol bagikan. */
  url: string;
}

const share = (target: string) => window.open(target, '_blank', 'width=600,height=400');

/**
 * Artikel blog Ambaz dengan artikel toko. Isinya HTML dari editor panel (disanitasi backend). Formulir komentar demo
 * Ambaz tidak ikut (blog toko tanpa komentar); Previous/Next menjadi artikel terkait dari platform.
 */
export function BlogDetailContent({ post, url }: Props) {
  const [prevPost, nextPost] = [post.related[0] ?? null, post.related[1] ?? null];
  const link = encodeURIComponent(url);
  const title = encodeURIComponent(post.title);

  return (
    <>
      {/* ── Hero image — full-bleed, 710px ── */}
      {post.cover_image && <div className="bd-hero">
        <Image
          unoptimized
          src={post.cover_image}
          alt={post.title}
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="100vw"
        />
      </div>}

      {/* ── Content ── */}
      <div className="container-main" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div className="bd-content">

          {/* Title + date */}
          <h1 className="bd-title">{post.title}</h1>
          <p className="bd-date">{post.published_at ? `${formatDate(post.published_at)} · ` : ''}{post.reading_minutes} min read</p>

          {/* Body */}
          <div className="bd-body">
            <RichText html={post.content} className="bd-body-text" />
          </div>

          {/* ── Social share ── */}
          <hr className="bd-divider" />
          <div className="bd-social">
            <button className="bd-social-btn" type="button" aria-label="Share on Facebook" onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${link}`)}>
              <IcoFacebook /> Facebook
            </button>
            <button className="bd-social-btn" type="button" aria-label="Share on Twitter" onClick={() => share(`https://twitter.com/intent/tweet?url=${link}&text=${title}`)}>
              <IcoTwitter /> Twitter
            </button>
            <button className="bd-social-btn" type="button" aria-label="Pin it on Pinterest" onClick={() => share(`https://pinterest.com/pin/create/button/?url=${link}&description=${title}${post.cover_image ? `&media=${encodeURIComponent(post.cover_image)}` : ''}`)}>
              <IcoPin /> Pin it
            </button>
            <button className="bd-social-btn" type="button" aria-label="Share" onClick={() => { if (navigator.share) void navigator.share({ title: post.title, url }); else void navigator.clipboard?.writeText(url); }}>
              <IcoShare /> Share
            </button>
          </div>

          {/* ── Prev / Next ── */}
          <hr className="bd-divider" />
          <div className="bd-nav">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="bd-nav-link">
                <IcoArrowLeft /> {prevPost.title}
              </Link>
            ) : (
              <span />
            )}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="bd-nav-link">
                {nextPost.title} <IcoArrowRight />
              </Link>
            ) : (
              <span />
            )}
          </div>

          {/* ── Back to blog ── */}
          <hr className="bd-divider" />
          <div className="bd-back">
            <Link href="/blog" className="bd-back-link">
              <IcoArrowLeft /> Back to blog
            </Link>
          </div>

        </div>
      </div>

      <style>{bdStyles}</style>
    </>
  );
}

/* ── Styles ── */
const bdStyles = `
  /* ── Hero ── */
  .bd-hero {
    position: relative;
    width: 100%;
    height: 710px;
    overflow: hidden;
    background: #f0f0f0;
  }

  /* ── Content wrapper ── */
  .bd-content {
    max-width: 780px;
    margin: 0 auto;
  }

  /* ── Title ── */
  .bd-title {
    font-size: 34px;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1.3;
    margin-bottom: 8px;
  }

  /* ── Date ── */
  .bd-date {
    font-size: 14px;
    color: #999;
    margin-bottom: 24px;
  }

  /* ── Body text ── */
  .bd-body { margin-bottom: 4px; }
  .bd-body-text {
    font-size: 15px;
    color: #555;
    line-height: 1.75;
    margin-bottom: 16px;
  }

  /* ── Bullet list ── */
  .bd-bullets {
    list-style: disc;
    padding-left: 20px;
    margin-bottom: 16px;
  }
  .bd-bullet {
    font-size: 15px;
    color: #555;
    line-height: 1.65;
    margin-bottom: 8px;
  }
  .bd-bullet:last-child { margin-bottom: 0; }
  .bd-bullet strong {
    color: var(--color-heading);
    font-weight: 600;
  }

  /* ── Divider ── */
  .bd-divider {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 28px 0;
  }

  /* ── Social share ── */
  .bd-social {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .bd-social-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #555;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: color 0.2s;
  }
  .bd-social-btn:hover { color: #111; }

  /* ── Prev / Next navigation ── */
  .bd-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }
  .bd-nav-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 14.5px;
    color: var(--color-heading);
    text-decoration: none;
    transition: color 0.2s;
  }
  .bd-nav-link:hover { color: #666; }

  /* ── Back to blog ── */
  .bd-back {
    text-align: center;
    margin-bottom: 8px;
  }
  .bd-back-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 14.5px;
    color: var(--color-heading);
    text-decoration: none;
    transition: color 0.2s;
  }
  .bd-back-link:hover { color: #666; }

  /* ── Comment section ── */
  .bd-comment-section { margin-top: 8px; }
  .bd-comment-heading {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 24px;
  }
  .bd-comment-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .bd-comment-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .bd-input {
    width: 100%;
    height: 48px;
    border: 1px solid #d5d5d5;
    border-radius: 3px;
    padding: 0 14px;
    font-size: 14px;
    color: var(--color-heading);
    background: #fff;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }
  .bd-input:focus { border-color: #888; }
  .bd-input::placeholder { color: #bbb; }
  .bd-textarea {
    width: 100%;
    min-height: 120px;
    border: 1px solid #d5d5d5;
    border-radius: 3px;
    padding: 12px 14px;
    font-size: 14px;
    color: var(--color-heading);
    background: #fff;
    outline: none;
    font-family: inherit;
    resize: vertical;
    line-height: 1.6;
    transition: border-color 0.2s;
  }
  .bd-textarea:focus { border-color: #888; }
  .bd-textarea::placeholder { color: #bbb; }
  .bd-notice {
    font-size: 13px;
    color: #999;
    line-height: 1.5;
    margin-top: -0.4rem;
  }
  .bd-submit {
    background: #111;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    height: 50px;
    padding: 0 32px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.01em;
    transition: background 0.2s;
  }
  .bd-submit:hover { background: #333; }

  /* ── Responsive ── */
  @media (max-width: 749px) {
    .bd-hero { height: 300px; }
    .bd-title { font-size: 24px; }
    .bd-comment-row { grid-template-columns: 1fr; }
  }
  @media (min-width: 750px) and (max-width: 991px) {
    .bd-hero { height: 480px; }
    .bd-title { font-size: 28px; }
  }
`;
