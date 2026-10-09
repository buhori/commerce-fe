import Link from "next/link";

export default function NotFound() {
  return (
    <main className="unavailable">
      <h1>Halaman tidak ditemukan</h1>
      <Link className="button button-dark" href="/">Kembali ke beranda</Link>
    </main>
  );
}
