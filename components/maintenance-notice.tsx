import type { StoreMaintenance } from "@/lib/store-shared";
import { Icon } from "./icons";

/**
 * Pemberitahuan perawatan untuk pembeli. Alasan manual atau toko belum siap sengaja tidak
 * dibedakan: detail pengaturan toko bukan urusan pembeli. Toko yang belum dibuka diberi tahu
 * "segera dibuka", karena memang belum pernah berjualan.
 */
export function MaintenanceNotice({ reason = null }: { reason?: StoreMaintenance["reason"] }) {
  if (reason === "unpublished") {
    return (
      <div className="maintenance-notice" role="status">
        <Icon name="tool" />
        <div>
          <strong>Toko segera dibuka</strong>
          <p>Anda sudah bisa melihat produk, tetapi pesanan baru bisa dibuat setelah toko dibuka. Silakan kembali lagi nanti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-notice" role="status">
      <Icon name="tool" />
      <div>
        <strong>Toko sedang dalam perawatan</strong>
        <p>Anda tetap bisa melihat produk, tetapi pesanan belum bisa dibuat untuk sementara. Silakan kembali lagi nanti.</p>
      </div>
    </div>
  );
}
