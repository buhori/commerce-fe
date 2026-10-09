import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ProfileNav } from "@/components/profile-nav";
import { SiteFooter } from "@/components/site-footer";
import { StoreHeader } from "@/components/store-header";
import { getCustomer } from "@/lib/customer-api";
import { getStore } from "@/lib/store-api";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const [store, customer] = await Promise.all([getStore(), getCustomer()]);
  if (!customer) redirect("/login?next=/profile");

  return (
    <>
      <StoreHeader name={store.name} logo={store.logo} />
      <main className="page">
        <div className="container profile-page">
          <aside className="profile-aside">
            <div className="profile-identity">
              {customer.avatar
                // eslint-disable-next-line @next/next/no-img-element -- Google avatar, any host.
                ? <img src={customer.avatar} alt="" referrerPolicy="no-referrer" />
                : <span aria-hidden="true">{customer.name.charAt(0).toUpperCase()}</span>}
              <div>
                <strong>{customer.name}</strong>
                <small>{customer.email}</small>
              </div>
            </div>
            <ProfileNav />
          </aside>
          <section className="profile-content">{children}</section>
        </div>
      </main>
      <SiteFooter store={store} />
    </>
  );
}
