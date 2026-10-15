import { Icon } from "./icons";

/**
 * Pemberitahuan perawatan untuk pembeli. Alasan (manual atau toko belum siap) sengaja tidak
 * ditampilkan: detail pengaturan toko bukan urusan pembeli.
 */
export function MaintenanceNotice() {
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
