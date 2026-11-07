import Link from 'next/link';

/** 404 Ambaz (app/pages/404). */
export function NotFoundContent() {
  return (
    <>
      {/* Grey header bar */}
      <div style={{ backgroundColor: 'rgb(247, 248, 252)', padding: '40px 0 50px', textAlign: 'center' }}>
        <div className="container-main">
          <h1 style={{ fontSize: '40px', fontWeight: 600, color: '#222' }}>404</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ textAlign: 'center', padding: '120px 15px 200px' }}>
        <h2 style={{ fontSize: '40px', fontWeight: 700, color: '#222', marginBottom: '16px' }}>Oops! Page not found</h2>
        <p style={{ fontSize: '16px', color: '#777', marginBottom: '36px' }}>The page you requested does not exist.</p>
        <Link href="/products" className="nf-return">Return to shop</Link>
      </div>
      <style>{`
        .nf-return { display: inline-block; padding: 16px 36px; background-color: #222; color: #fff !important; font-size: 16px; font-weight: 600; border-radius: 40px; text-decoration: none; transition: background-color 250ms ease; }
        .nf-return:hover { background-color: #F15B41; }
      `}</style>
    </>
  );
}
