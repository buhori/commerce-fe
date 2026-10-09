"use client";

import { Spinner } from "./spinner";
import { Icon } from "./icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cartItemsOptions, preorderItemsOptions } from "@/lib/cart-queries";
import { useRouter } from "next/navigation";
import { getCartUnitPrice } from "@/lib/cart";
import { jsonHeaders, readOrderId, type AddressDetails, type BankAccount, type PaymentMethod, type ShippingCost, type ShippingMethod } from "@/lib/checkout";
import { addDays, formatDate, formatPrice, formatWeight } from "@/lib/format";
import { preorderDays } from "@/lib/store-api";
import { ProductImage } from "./product-image";
import { AddressForm } from "./address-form";
import { DeliveryOptions } from "./delivery-options";
import { SavedAddresses } from "./saved-addresses";
import { AddressSummary } from "./address-summary";
import { useCart } from "./cart-provider";

const steps = [
  { title: "Alamat & kontak", hint: "Tujuan pengiriman" },
  { title: "Pengiriman & pembayaran", hint: "Kurir dan cara bayar" },
] as const;

export function Checkout({ currency, preorder = false }: { currency: string; preorder?: boolean }) {
  // A pre-order checkout reads its own one-product cart, never the shopping cart.
  const cart = useQuery(preorder ? preorderItemsOptions : cartItemsOptions);
  const items = cart.data ?? [];
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"new" | "saved">("new");
  const [selected, setSelected] = useState<AddressDetails | null>(null);
  const [shipping, setShipping] = useState<ShippingMethod | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [cost, setCost] = useState<ShippingCost | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const { refresh } = useCart();
  const router = useRouter();
  const placeLock = useRef(false);
  // A saved quote belongs to one courier/address pair; changing either drops it.
  const chooseAddress = (address: AddressDetails) => { setSelected(address); setCost(null); };
  const needsBankAccount = payment?.code === "bank_transfer";
  const ready = Boolean(selected?.id && shipping && payment && cost && (!needsBankAccount || bankAccount));

  async function placeOrder() {
    if (placeLock.current || !ready) return;
    placeLock.current = true;
    setPlacing(true);
    setPlaceError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", credentials: "same-origin", headers: jsonHeaders(),
        body: JSON.stringify({
          address_id: selected!.id,
          shipping_method_id: shipping!.id,
          payment_method: payment!.code,
          ...(needsBankAccount ? { bank_account_id: bankAccount!.id } : {}),
          ...(preorder ? { cart: "preorder" } : {}),
        }),
      });
      const data = await response.json().catch(() => null);
      // The store requires an account and the session ended mid-checkout.
      if (response.status === 401 && data?.login_required) {
        router.push(`/login?next=${encodeURIComponent(preorder ? "/checkout?type=preorder" : "/checkout")}`);
        return;
      }
      if (!response.ok) {
        throw new Error(response.status < 500 && typeof data?.message === "string"
          ? data.message
          : "Pesanan belum dapat dibuat. Silakan coba lagi.");
      }
      const id = readOrderId(data);
      // The backend closes the cart; invalidate count and shared cart items.
      void refresh();
      // replace(): the cart behind this page is gone, so going back is a dead end.
      router.replace(`/payment/${id}`);
    } catch (error) {
      setPlaceError(error instanceof Error ? error.message : "Pesanan belum dapat dibuat.");
    } finally {
      placeLock.current = false;
      setPlacing(false);
    }
  }

  if (cart.isPending) return <div className="empty-state" aria-busy="true"><Spinner size={28} label="Memuat ringkasan belanja…" /></div>;
  if (cart.isError) return <div className="empty-state" role="alert"><p>Keranjang belum dapat dimuat.</p><Button variant="secondary" disabled={cart.isFetching} onClick={() => void cart.refetch()}>{cart.isFetching ? "Memuat…" : "Coba lagi"}</Button></div>;
  if (!items.length) return <div className="empty-state"><h2>{preorder ? "Tidak ada pesanan pre-order" : "Keranjang kosong"}</h2><ButtonLink href="/">Lihat produk</ButtonLink></div>;
  const prices = items.map((item) => getCartUnitPrice(item));
  const totalKnown = prices.every((price) => price !== null);
  const total = items.reduce((sum, item, index) => sum + (prices[index] ?? 0) * item.amount, 0);
  const longestPreorder = Math.max(0, ...items.map((item) => preorderDays(item.product)));

  return (
    <div className="checkout-layout">
      <section className="checkout-addresses" aria-labelledby="checkout-step-title">
        <ol className="checkout-steps">
          {steps.map((entry, index) => (
            <li key={entry.title} aria-current={index === step ? "step" : undefined} data-complete={index < step}>
              {/* Step two stays locked until an address is ready to ship to. */}
              <button type="button" onClick={() => setStep(index)} disabled={index > 0 && !selected}>
                <span className="checkout-step-index" aria-hidden="true">{index < step ? <Icon name="check" /> : index + 1}</span>
                <span className="checkout-step-label"><strong>{entry.title}</strong><span>{entry.hint}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="commerce-form-heading">
          <span className="commerce-section-icon"><Icon name={step === 0 ? "pin" : "truck"} /></span>
          <div><p>LANGKAH {step + 1} DARI 2</p><h2 id="checkout-step-title">{step === 0 ? "Ke mana pesanan dikirim?" : "Pengiriman & pembayaran"}</h2></div>
        </div>

        {/* Keep the guest form mounted so switching modes or steps does not lose a draft. */}
        <div hidden={step !== 0}>
          <div className="checkout-modes" role="group" aria-label="Sumber alamat">
            <button type="button" aria-pressed={mode === "new"} onClick={() => setMode("new")}>Tambah alamat</button>
            <button type="button" aria-pressed={mode === "saved"} onClick={() => setMode("saved")}>Alamat tersimpan</button>
          </div>
          {/* Saving the address is the step-one action itself, so it doubles as the step forward. */}
          <div hidden={mode !== "new"}>
            <AddressForm submitLabel="Lanjut ke pengiriman" onSaved={(address) => { chooseAddress(address); setStep(1); }} />
          </div>
          {mode === "saved" && <SavedAddresses selectedId={selected?.id} onSelect={chooseAddress} onAdd={() => setMode("new")}
            onDeleted={(id) => { if (selected?.id === id) { setSelected(null); setCost(null); } }} />}
        </div>
        {step === 1 && selected && (
          <DeliveryOptions shipping={shipping} payment={payment} bankAccount={bankAccount}
            addressCode={selected.address_code} currency={currency} preorder={preorder}
            onShippingChange={(method) => { setShipping(method); setCost(null); }}
            onPaymentChange={(method) => { setPayment(method); if (method.code !== "bank_transfer") setBankAccount(null); }}
            onBankAccountChange={setBankAccount} onCostChange={setCost} />
        )}

        {step === 0 && mode === "saved" && (
          <div className="checkout-actions">
            <Button type="button" disabled={!selected} onClick={() => setStep(1)}>Lanjut ke pengiriman</Button>
            {!selected && <p className="field-hint" role="status">Pilih alamat dulu untuk melanjutkan.</p>}
          </div>
        )}
        {step === 1 && (
          <div className="checkout-actions checkout-actions-row">
            <Button type="button" disabled={!ready || placing} onClick={placeOrder}>
              {placing ? "Membuat pesanan…" : "Buat pesanan"}<Icon name="arrow" />
            </Button>
            <Button type="button" variant="secondary" disabled={placing} onClick={() => setStep(0)}>Kembali ke alamat</Button>
            {!ready && !placing && (
              <p className="field-hint" role="status">
                {!selected?.id ? "Alamat ini belum tersimpan di server, simpan ulang alamatnya dulu."
                  : !shipping ? "Pilih metode pengiriman dulu."
                  : !cost ? "Tunggu ongkos kirim selesai dihitung."
                  : !payment ? "Pilih metode pembayaran dulu."
                  : "Pilih rekening tujuan transfer dulu."}
              </p>
            )}
            {placeError && <p className="cart-feedback cart-feedback-error" role="alert">{placeError}</p>}
          </div>
        )}
      </section>
      <aside className="commerce-sidebar" aria-label="Ringkasan pesanan">
      <section className="cart-summary checkout-summary">
        <div className="commerce-summary-heading"><h2>Ringkasan pesanan</h2><span className="commerce-count">{items.reduce((sum, item) => sum + item.amount, 0)} barang</span></div>
        <ul className="checkout-products">
          {items.map((item, index) => (
            <li key={item.id}>
              <span className="checkout-product-art" aria-hidden="true">
                <ProductImage key={item.product?.image} src={item.product?.image} name="" />
              </span>
              <div>
                <strong>{item.product?.name || `Produk #${item.product_id}`}</strong>
                {item.variant?.label && <span>{item.variant.label}</span>}
                <span>{item.amount} barang{preorderDays(item.product) > 0 && <> · <span className="preorder-tag">Pre-order</span></>}</span>
              </div>
              <strong>{prices[index] !== null ? formatPrice(prices[index]! * item.amount, currency) : "—"}</strong>
            </li>
          ))}
        </ul>
        {longestPreorder > 0 && (
          <p className="preorder-summary">
            Pre-order ini siap dikirim paling cepat{" "}
            <strong>{formatDate(addDays(longestPreorder))}</strong>.
          </p>
        )}
        <div className="cart-subtotal"><span>Subtotal</span><strong>{totalKnown ? formatPrice(total, currency) : "Belum tersedia"}</strong></div>
        <div><span>Ongkos kirim{shipping ? ` (${shipping.name})` : ""}</span><strong>{cost ? formatPrice(cost.cost, currency) : "Belum dihitung"}</strong></div>
        {cost && totalKnown
          ? <div className="cart-total"><span>Total belanja</span><strong>{formatPrice(total + cost.cost, currency)}</strong></div>
          : <p>Belum termasuk ongkos kirim.</p>}
        {selected && (
          <section className="checkout-selected" aria-label="Alamat dipilih">
            <h3>Dikirim ke</h3>
            <AddressSummary address={selected} />
          </section>
        )}
        {(shipping || payment) && (
          <section className="checkout-selected" aria-label="Pengiriman dan pembayaran">
            <h3>Pengiriman & pembayaran</h3>
            <dl className="checkout-choices">
              <div><dt>Kurir</dt><dd>{shipping?.name || "Belum dipilih"}</dd></div>
              {cost && cost.weight > 0 && <div><dt>Berat ditagih</dt><dd>{formatWeight(cost.chargeable_weight)}</dd></div>}
              <div><dt>Pembayaran</dt><dd>{payment?.name || "Belum dipilih"}</dd></div>
            </dl>
          </section>
        )}
      </section>
      <p className="commerce-note"><Icon name="info" />{payment?.code === "bank_transfer" ? "Nominal akhir beserta kode unik akan ditampilkan setelah pesanan dibuat." : "Periksa kembali rincian pesanan sebelum melanjutkan ke pembayaran."}</p>
      <ButtonLink variant="secondary" href={preorder ? "/" : "/cart"} className="commerce-continue">{preorder ? "Lanjut belanja" : "Edit keranjang"}<Icon name="arrow" /></ButtonLink>
      </aside>
    </div>
  );
}
