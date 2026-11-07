import Link from 'next/link';
import { PageContent, type StorePage } from '@sellosy/theme';

/**
 * Halaman informasi Ambaz (app/pages/privacy-policy, terms-of-service, …): kepala abu-abu dengan breadcrumb dan isi
 * prosa di tengah. Isinya halaman yang ditulis toko di panel (HTML yang sudah disanitasi), bukan teks demo Ambaz.
 */
export function InfoPageContent({ page }: { page: StorePage }) {
  return (
    <>
      {/* Header */}
      <div className="fa-pp-page-header">
        <div className="container-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
            <Link href="/" style={{ color: '#777', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Home</Link>
            <span style={{ color: '#bbb' }}>/</span>
            <span style={{ color: '#222' }}>{page.title}</span>
          </div>
          <h1 className="fa-pp-h1">{page.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-main fa-pp-content-wrap">
        <PageContent page={page} className="fa-pp-prose" />
      </div>

      <style>{`
        .fa-pp-page-header { background-color: rgb(247, 248, 252); padding: 40px 0 50px; text-align: center; }
        .fa-pp-h1 { font-size: 40px; font-weight: 600; color: #222; }
        .fa-pp-content-wrap { padding-block: 60px 100px; }
        .fa-pp-prose { max-width: 680px; margin: 0 auto; font-size: 15px; color: #555; line-height: 1.8; }
        .fa-pp-prose :where(h2, h3) { font-size: 22px; font-weight: 700; color: #222; margin-bottom: 14px; margin-top: 40px; }
        .fa-pp-prose :where(h3) { font-size: 18px; }
        .fa-pp-prose :where(p) { margin-bottom: 20px; }
        .fa-pp-prose :where(ul, ol) { margin-bottom: 20px; padding-left: 24px; display: flex; flex-direction: column; gap: 8px; }
        .fa-pp-prose :where(ul) { list-style: disc; }
        .fa-pp-prose :where(ol) { list-style: decimal; }
        .fa-pp-prose :where(a) { color: #222; text-decoration: underline; text-underline-offset: 3px; }
        .fa-pp-prose :where(img) { border-radius: 6px; margin: 20px 0; }
        @media (max-width: 749px) {
          .fa-pp-page-header { padding: clamp(28px, 6vw, 40px) 0 clamp(30px, 7vw, 50px); }
          .fa-pp-h1 { font-size: clamp(26px, 6.5vw, 40px); }
          .fa-pp-content-wrap { padding-block: clamp(36px, 7vw, 60px) clamp(60px, 12vw, 100px); }
          .fa-pp-prose { font-size: clamp(13px, 3.8vw, 15px); }
          .fa-pp-prose :where(h2) { font-size: clamp(17px, 4.5vw, 22px); margin-top: clamp(28px, 6vw, 40px); }
        }
      `}</style>
    </>
  );
}
