/** Penanda pratinjau dari panel (tema dan/atau draf beranda): hanya di browser pemilik toko. */
export function ThemePreviewBar({ themeName, draft }: { themeName: string | null; draft: boolean }) {
  const subject = [themeName && <>tema <strong key="theme">{themeName}</strong></>, draft && "draf beranda"].filter(Boolean);
  return (
    <aside className="theme-preview-bar" role="status">
      <span>
        Pratinjau {subject.length === 2 ? <>{subject[0]} dengan {subject[1]}</> : subject[0]}. Pengunjung lain masih melihat versi yang tayang.
      </span>
      {/* Route handler, bukan halaman: perlu navigasi penuh supaya cookie dihapus dan toko dimuat ulang. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/preview?exit=1">Keluar pratinjau</a>
    </aside>
  );
}
