'use client';

/* ── SVG Icons ── */

function IconFreeShipping() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38.3334 29.85C38.3667 31.1 38.0333 32.2834 37.4333 33.3C37.1 33.9 36.65 34.4501 36.15 34.9001C35 35.9667 33.4833 36.6167 31.8 36.6667C29.3667 36.7167 27.2167 35.4667 26.0333 33.5501C25.4 32.5667 25.0167 31.3834 25 30.1334C24.95 28.0334 25.8833 26.1334 27.3833 24.8834C28.5167 23.9501 29.95 23.3667 31.5167 23.3334C35.2 23.2501 38.25 26.1667 38.3334 29.85Z" strokeMiterlimit="10" />
      <path d="M29.0667 30.0501L30.7501 31.65L34.2334 28.2833" />
      <path d="M5.28333 12.4001L20 20.9168L34.6166 12.4501" />
      <path d="M20.0001 36.0167V20.9" />
      <path d="M36.0166 15.2833V24.7166C36.0166 24.8 36.0167 24.8666 36 24.9499C34.8333 23.9332 33.3333 23.3333 31.6666 23.3333C30.1 23.3333 28.65 23.8833 27.5 24.8C25.9666 26.0166 25 27.8999 25 29.9999C25 31.2499 25.35 32.4333 25.9666 33.4333C26.1166 33.6999 26.3 33.95 26.5 34.1833L23.45 35.8666C21.55 36.9333 18.45 36.9333 16.55 35.8666L7.64997 30.9333C5.63331 29.8166 3.98334 27.0166 3.98334 24.7166V15.2833C3.98334 12.9833 5.63331 10.1833 7.64997 9.06662L16.55 4.13325C18.45 3.06659 21.55 3.06659 23.45 4.13325L32.35 9.06662C34.3667 10.1833 36.0166 12.9833 36.0166 15.2833Z" />
    </svg>
  );
}

function IconOnlineSupport() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.13332 30.8166V25.95C9.13332 24.3333 10.4 22.8833 12.2 22.8833C13.8166 22.8833 15.2666 24.15 15.2666 25.95V30.6333C15.2666 33.8833 12.5666 36.5833 9.31663 36.5833C6.06663 36.5833 3.36662 33.8667 3.36662 30.6333V20.3666C3.18328 10.9999 10.5833 3.41663 19.95 3.41663C29.3166 3.41663 36.7 11 36.7 20.1833V30.45C36.7 33.7 34 36.4 30.75 36.4C27.5 36.4 24.8 33.7 24.8 30.45V25.7667C24.8 24.15 26.0666 22.7 27.8666 22.7C29.4833 22.7 30.9333 23.9667 30.9333 25.7667V30.8166" />
      <path d="M25.8834 15.2H24.5334C24.1668 15.2 23.8168 15.4167 23.6501 15.7333L22.4001 18.2333C22.2168 18.6 21.7001 18.6 21.5168 18.2333L18.4501 12.1167C18.2668 11.7667 17.7668 11.75 17.5834 12.1L16.1834 14.6833C16.0168 15 15.6834 15.2 15.3168 15.2H14.1001" />
    </svg>
  );
}

function IconSecurePayment() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10">
      <path d="M3.3335 14.175H36.6668" />
      <path d="M10 27.5083H13.3333" />
      <path d="M17.5 27.5083H24.1667" />
      <path d="M10.7335 5.84155H29.2502C35.1835 5.84155 36.6668 7.30822 36.6668 13.1582V26.8416C36.6668 32.6916 35.1835 34.1582 29.2668 34.1582H10.7335C4.81683 34.1749 3.3335 32.7082 3.3335 26.8582V13.1582C3.3335 7.30822 4.81683 5.84155 10.7335 5.84155Z" />
    </svg>
  );
}

function IconMoneyGuarantee() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.4833 3.71672L9.16668 6.85006C7.25002 7.56672 5.68335 9.83339 5.68335 11.8667V24.2501C5.68335 26.2167 6.98335 28.8001 8.56668 29.9834L15.7333 35.3334C18.0833 37.1001 21.95 37.1001 24.3 35.3334L31.4667 29.9834C33.05 28.8001 34.35 26.2167 34.35 24.2501V11.8667C34.35 9.81672 32.7833 7.55006 30.8667 6.83339L22.55 3.71672C21.1333 3.20006 18.8667 3.20006 17.4833 3.71672Z" />
      <path d="M15.0834 19.7834L17.7667 22.4667L24.9334 15.3" />
    </svg>
  );
}

/* ── Data ── */

export const TRUST_ICONS = {
  shipping: <IconFreeShipping />,
  support: <IconOnlineSupport />,
  payment: <IconSecurePayment />,
  guarantee: <IconMoneyGuarantee />,
};

export interface TrustBadge { icon: keyof typeof TRUST_ICONS; title: string; description: string }

// Teks demo Ambaz menjanjikan gratis ongkir dan garansi 30 hari; di toko isinya diatur lewat section Keunggulan toko.
const DEFAULT_BADGES: TrustBadge[] = [
  { icon: 'shipping', title: 'Fast Delivery', description: 'Shipped with tracking to your door' },
  { icon: 'support', title: 'Online Support', description: 'Chat with us about your order' },
  { icon: 'payment', title: 'Secure Payment', description: 'Protected checkout' },
  { icon: 'guarantee', title: 'Trusted Store', description: 'Shop with confidence' },
];

/* ── Component ── */

export function TrustBadges({ badges = DEFAULT_BADGES, editor }: { badges?: TrustBadge[]; editor?: Record<`data-${string}`, string> } = {}) {
  return (
    <section className="tb-section" {...editor}>
      <div className="container-main">
        <div className="tb-grid">
          {badges.map((badge) => (
            <div key={badge.title} className="tb-item">
              <div className="tb-icon">{TRUST_ICONS[badge.icon]}</div>
              <div className="tb-text">
                <p className="tb-title">{badge.title}</p>
                <p className="tb-desc">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .tb-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 28px 0;
        }
        .tb-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .tb-icon {
          flex-shrink: 0;
          color: #222;
          display: flex;
          align-items: center;
        }
        .tb-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tb-title {
          font-size: 20px;
          font-weight: 700;
          color: #222;
          margin: 0;
          line-height: 1.3;
        }
        .tb-desc {
          font-size: 15px;
          color: #888;
          margin: 0;
          line-height: 1.4;
        }

        @media (max-width: 991px) {
          .tb-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 24px 0; }
        }
        @media (max-width: 599px) {
          .tb-grid { grid-template-columns: 1fr; gap: 16px; padding: 20px 0; }
        }
      `}</style>
    </section>
  );
}
