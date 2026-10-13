/** Penanda pratinjau tema dari panel: hanya tampil di browser pemilik toko yang membukanya. */
export function ThemePreviewBar({ name }: { name: string }) {
  return (
    <aside className="theme-preview-bar" role="status">
      <span>Pratinjau tema <strong>{name}</strong>. Pengunjung lain masih melihat tema toko yang aktif.</span>
      {/* Route handler, bukan halaman: perlu navigasi penuh supaya cookie dihapus dan toko dimuat ulang. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/theme-preview?exit=1">Keluar pratinjau</a>
    </aside>
  );
}
