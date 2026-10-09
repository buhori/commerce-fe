import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { ButtonLink } from "@/components/ui/button";
import { getOrders } from "@/lib/customer-api";
import { formatDate, formatPrice } from "@/lib/format";
import { getStore } from "@/lib/store-api";

const tabs = [
  { key: "", label: "Semua" },
  { key: "pending", label: "Belum bayar" },
  { key: "paid,processed", label: "Diproses" },
  { key: "delivering", label: "Dikirim" },
  { key: "delivered,done", label: "Selesai" },
  { key: "cancelled,rejected,returned,refunded", label: "Dibatalkan" },
];

// Mirrors App\Enums\OrderStatus on the backend.
const statuses: Record<string, { label: string; tone: string }> = {
  pending: { label: "Menunggu pembayaran", tone: "warning" },
  paid: { label: "Dibayar", tone: "info" },
  processed: { label: "Diproses", tone: "info" },
  delivering: { label: "Dikirim", tone: "primary" },
  delivered: { label: "Diterima", tone: "success" },
  done: { label: "Selesai", tone: "success" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
  rejected: { label: "Ditolak", tone: "danger" },
  returned: { label: "Dikembalikan", tone: "danger" },
  refunded: { label: "Dana dikembalikan", tone: "danger" },
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.key === params.status) ? params.status! : "";
  const page = /^[1-9]\d{0,4}$/.test(params.page ?? "") ? Number(params.page) : 1;
  const [store, orders] = await Promise.all([
    getStore(),
    // A failed request shows a message in the page instead of breaking the whole profile.
    getOrders(page, status || undefined).catch(() => "error" as const),
  ]);
  if (!orders) redirect("/login?next=/profile/orders");

  const currency = store.currency || "IDR";
  const href = (next: { status?: string; page?: number }) => {
    const query = new URLSearchParams();
    const nextStatus = next.status ?? status;
    if (nextStatus) query.set("status", nextStatus);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const text = query.toString();
    return `/profile/orders${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <header className="profile-heading">
        <h1>Pesanan Saya</h1>
      </header>
      <nav className="profile-tabs" aria-label="Status pesanan">
        {tabs.map((tab) => (
          <Link key={tab.key} href={href({ status: tab.key })} aria-current={tab.key === status ? "page" : undefined}>{tab.label}</Link>
        ))}
      </nav>

      {orders === "error" ? (
        <div className="profile-empty" role="alert">
          <p>Pesanan belum dapat dimuat.</p>
          <ButtonLink href={href({})} variant="secondary" size="sm" reloadDocument>Coba lagi</ButtonLink>
        </div>
      ) : orders.data.length === 0 ? (
        <div className="profile-empty">
          <Icon name="box" />
          <p>Belum ada pesanan di sini.</p>
          <ButtonLink href="/" variant="secondary" size="sm">Mulai belanja</ButtonLink>
        </div>
      ) : (
        <ul className="order-list">
          {orders.data.map((order) => {
            const state = statuses[order.status] ?? { label: order.status, tone: "info" };
            const first = order.items[0];
            const more = order.items_count - 1;
            return (
              <li key={order.id}>
                <Link className="order-row" href={`/payment/${order.id}`}>
                  <div className="order-row-head">
                    <span>Pesanan #{order.id} · {formatDate(new Date(order.created_at))}</span>
                    <span className="order-status" data-tone={state.tone}>{state.label}</span>
                  </div>
                  <div className="order-row-body">
                    <div className="order-row-art">
                      <ProductImage src={first?.image ?? null} name={first?.name ?? "Produk"} />
                    </div>
                    <div className="order-row-info">
                      <strong>{first?.name ?? "Produk tidak tersedia"}</strong>
                      <small>{first ? `${first.amount} barang` : ""}{more > 0 ? ` · +${more} produk lain` : ""}</small>
                      {order.preorder_ready_at && <small>Pre-order, siap dikirim ±{formatDate(new Date(order.preorder_ready_at))}</small>}
                    </div>
                    <div className="order-row-total">
                      <small>Total</small>
                      <strong>{formatPrice(order.grand_total, currency)}</strong>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {orders !== "error" && orders.meta.last_page > 1 && (
        <nav className="profile-pager" aria-label="Halaman pesanan">
          {page > 1 ? <ButtonLink href={href({ page: page - 1 })} variant="secondary" size="sm">Sebelumnya</ButtonLink> : <span />}
          <span>Halaman {page} dari {orders.meta.last_page}</span>
          {page < orders.meta.last_page ? <ButtonLink href={href({ page: page + 1 })} variant="secondary" size="sm">Berikutnya</ButtonLink> : <span />}
        </nav>
      )}
    </>
  );
}
