import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { NotificationList } from "@/components/notification-list";
import { ButtonLink } from "@/components/ui/button";
import { getNotifications } from "@/lib/customer-api";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = /^[1-9]\d{0,4}$/.test(params.page ?? "") ? Number(params.page) : 1;
  // A failed request shows a message in the page instead of breaking the whole profile.
  const notifications = await getNotifications(page).catch(() => "error" as const);
  if (!notifications) redirect("/login?next=/profile/notifications");

  const href = (next: number) => `/profile/notifications${next > 1 ? `?page=${next}` : ""}`;

  if (notifications === "error") {
    return (
      <>
        <header className="profile-heading"><h1>Pemberitahuan</h1></header>
        <div className="profile-empty" role="alert">
          <p>Pemberitahuan belum dapat dimuat.</p>
          <ButtonLink href={href(page)} variant="secondary" size="sm" reloadDocument>Coba lagi</ButtonLink>
        </div>
      </>
    );
  }

  if (notifications.data.length === 0) {
    return (
      <>
        <header className="profile-heading"><h1>Pemberitahuan</h1></header>
        <div className="profile-empty">
          <Icon name="bell" />
          <p>Belum ada pemberitahuan. Kabar pesanan Anda akan muncul di sini.</p>
        </div>
      </>
    );
  }

  const { last_page: lastPage, unread } = notifications.meta;
  return (
    <>
      {/* Keyed by page so the read state starts fresh on every page. */}
      <NotificationList key={page} notifications={notifications.data} unread={unread} />
      {lastPage > 1 && (
        <nav className="profile-pager" aria-label="Halaman pemberitahuan">
          {page > 1 ? <ButtonLink href={href(page - 1)} variant="secondary" size="sm">Sebelumnya</ButtonLink> : <span />}
          <span>Halaman {page} dari {lastPage}</span>
          {page < lastPage ? <ButtonLink href={href(page + 1)} variant="secondary" size="sm">Berikutnya</ButtonLink> : <span />}
        </nav>
      )}
    </>
  );
}
