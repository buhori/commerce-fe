'use client';

import type { LoginPageProps } from '@sellosy/theme';

const ACCENT = '#c96742';
const DARK = '#111111';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c1-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8s2.3-1.2 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4ZM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4Z" />
    </svg>
  );
}

function ArrowDiag() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

/**
 * Halaman masuk Ambaz. Toko memakai login Google/Apple dari platform (tanpa kata sandi), jadi formulir email/kata
 * sandi Ambaz menjadi tombol penyedia yang aktif; akun dibuat otomatis saat pertama kali masuk.
 */
export function LoginPageContent({ next, providers, accounts, error }: Omit<LoginPageProps, 'store'>) {
  const href = (provider: string) => `/auth/${provider}?next=${encodeURIComponent(next)}`;
  const first = providers[0];
  return (
    <>
      <div className="li-hero">
        <h1 className="li-hero-title">Log in</h1>
      </div>
      <div className="container-main" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <div className="li-layout">
          {/* ── Left: Login ── */}
          <section>
            <h2 className="li-heading">Log in</h2>
            <div className="li-form">
              {error && <p role="alert" className="li-new-text" style={{ color: '#b42318' }}>{error}</p>}
              {!accounts ? (
                <>
                  <p className="li-new-text">This store sells without customer accounts. You can check out as a guest.</p>
                  <div><a href={next} className="li-submit" style={{ display: 'inline-flex' }}>Continue shopping</a></div>
                </>
              ) : providers.length === 0 ? (
                <p role="alert" className="li-new-text">Login is not available in this store yet. Please contact the store.</p>
              ) : (
                <>
                  {next.startsWith('/checkout') && <p className="li-new-text">Log in to continue to checkout. Your cart stays saved.</p>}
                  {providers.includes('google') && (
                    <div><a href={href('google')} className="li-submit li-provider li-provider-light"><GoogleMark /> Continue with Google</a></div>
                  )}
                  {providers.includes('apple') && (
                    <div><a href={href('apple')} className="li-submit li-provider"><AppleMark /> Continue with Apple</a></div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ── Right: New user ── */}
          {accounts && first && (
            <section>
              <h2 className="li-heading">I&apos;m new here</h2>
              <p className="li-new-text">
                Your account is created the first time you log in. Your cart, addresses and orders are saved to it and
                available on any device.
              </p>
              <a href={href(first)} className="li-register-link">
                Register <ArrowDiag />
              </a>
            </section>
          )}
        </div>
      </div>
      <style>{liStyles}</style>
    </>
  );
}

const liStyles = `
  .li-provider { display: inline-flex; align-items: center; justify-content: center; gap: 10px; text-decoration: none; }
  .li-provider-light { background: #fff !important; color: #222 !important; border: 1.5px solid #222; }
  /* ── Hero ── */
  .li-hero {
    background: linear-gradient(135deg, #ffffff 0%, #fdf4f0 50%, #fde8df 100%);
    padding: 55px 0;
    text-align: center;
  }
  .li-hero-title {
    font-size: 40px;
    font-weight: 400;
    color: var(--color-heading);
    letter-spacing: 0.01em;
  }

  /* ── Two-column layout ── */
  .li-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
  }
  .li-heading {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 20px;
  }

  /* ── Form ── */
  .li-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 420px;
  }
  .au-input {
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
  .au-input:focus { border-color: #888; }
  .au-input::placeholder { color: #bbb; }
  .au-pw-wrap { position: relative; }
  .au-pw-input { padding-right: 48px; }
  .au-eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #aaa;
    display: flex;
    align-items: center;
    padding: 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .au-eye-btn:hover { color: #555; }

  /* ── Forgot / submit ── */
  .li-forgot {
    font-size: 13.5px;
    color: var(--color-heading);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .li-forgot:hover { color: ${ACCENT}; }
  .li-submit {
    height: 50px;
    min-width: 160px;
    background: ${DARK};
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    padding: 0 32px;
    letter-spacing: 0.02em;
    transition: background 0.2s;
  }
  .li-submit:hover { background: #333; }

  /* ── Right column ── */
  .li-new-text {
    font-size: 13.5px;
    color: #555;
    line-height: 1.65;
    margin-bottom: 16px;
  }
  .li-register-link {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-heading);
    text-decoration: underline;
    text-underline-offset: 3px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .li-register-link:hover { color: ${ACCENT}; }

  @media (max-width: 749px) {
    .li-layout { grid-template-columns: 1fr; gap: 40px; }
    .li-hero-title { font-size: 30px; }
  }
`;
