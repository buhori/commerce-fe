import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { CUSTOMER_COOKIE, safeNext } from "@/lib/auth";
import { getCustomer } from "@/lib/customer-api";
import { getStore } from "@/lib/store-api";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

const errors: Record<string, string> = {
  cancelled: "Login dibatalkan.",
  state: "Sesi login kedaluwarsa. Silakan coba lagi.",
  blocked: "Akun Anda tidak dapat dipakai di toko ini.",
  google: "Login Google gagal. Silakan coba lagi.",
  apple: "Login Apple gagal. Silakan coba lagi.",
  apple_linked: "Email ini sudah terhubung dengan akun Apple lain.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: nextParam, error } = await searchParams;
  const next = safeNext(nextParam);
  // Checked against the API, not the cookie alone: an expired token must not loop back here.
  if ((await cookies()).has(CUSTOMER_COOKIE) && await getCustomer().catch(() => null)) redirect(next);

  const store = await getStore();
  const message = error ? errors[error] ?? errors.google : null;
  // Buttons follow the backend: Apple appears by itself once its keys are set.
  const providers = store.login_providers ?? ["google"];

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page">
        <section className="container login-page">
          <div className="login-card">
            <h1>Masuk ke {store.name}</h1>
            <p>
              {next.startsWith("/checkout")
                ? "Masuk dulu untuk melanjutkan checkout. Isi keranjang Anda tetap tersimpan."
                : "Keranjang, alamat, dan pesanan tersimpan di akun Anda dan bisa dibuka dari perangkat mana pun."}
            </p>
            {message && <p className="login-error" role="alert">{message}</p>}
            {/* Plain links: the route handlers redirect to Google or Apple. */}
            {providers.includes("google") && (
              <a className="button button-secondary login-google" href={`/auth/google?next=${encodeURIComponent(next)}`}>
                <GoogleMark />
                Masuk dengan Google
              </a>
            )}
            {providers.includes("apple") && (
              <a className="button login-apple" href={`/auth/apple?next=${encodeURIComponent(next)}`}>
                <AppleMark />
                Masuk dengan Apple
              </a>
            )}
            {!providers.includes("google") && !providers.includes("apple") && (
              <p className="login-error" role="alert">Login belum tersedia di toko ini. Silakan hubungi toko.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter store={store} />
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c1-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8s2.3-1.2 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4ZM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4Z" />
    </svg>
  );
}
