import Link from "next/link";
import { Icon } from "./icons";

export function CommerceHeading({ stage, preorder = false }: { stage: "cart" | "checkout"; preorder?: boolean }) {
  const checkout = stage === "checkout";
  return (
    <>
      <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link><span aria-hidden="true">/</span>
        {checkout && !preorder && <><Link href="/cart">Keranjang</Link><span aria-hidden="true">/</span></>}
        <span aria-current="page">{checkout ? preorder ? "Checkout pre-order" : "Checkout" : "Keranjang"}</span>
      </nav>
      <header className="commerce-heading">
        <div>
          <p className="commerce-eyebrow">{checkout ? preorder ? "CHECKOUT PRE-ORDER" : "CHECKOUT PESANAN" : "KERANJANG BELANJA"}</p>
          <h1>{checkout ? "Selesaikan pesanan Anda." : "Keranjang belanja Anda."}</h1>
          <p>{checkout ? "Lengkapi alamat, lalu pilih pengiriman dan cara pembayaran." : "Periksa pilihan Anda sebelum melanjutkan ke checkout."}</p>
        </div>
        <Link className="commerce-back" href={checkout && !preorder ? "/cart" : "/"}><Icon name="arrow" />{checkout && !preorder ? "Kembali ke keranjang" : "Lanjut belanja"}</Link>
      </header>
      <ol className="commerce-progress" aria-label="Tahapan belanja">
        <li aria-current={!checkout ? "step" : undefined} data-complete={checkout}><span>{checkout ? <Icon name="check" /> : "1"}</span>{preorder ? "Produk dipilih" : "Keranjang"}</li>
        <li aria-current={checkout ? "step" : undefined}><span>2</span>Checkout</li>
        <li><span>3</span>Pembayaran</li>
      </ol>
    </>
  );
}
