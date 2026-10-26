"use client";

import { BrandLogo } from "./brand-logo";
import { Icon } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import {
  paymentMethodSections, readBankChoices, readPaymentMethods, readShippingQuote, shippingHighlights, shippingOptionKey, shippingOptionLabel,
  type BankChoice, type PaymentMethod, type ShippingOption, type ShippingQuote,
} from "@/lib/checkout";
import { formatPrice, formatWeight } from "@/lib/format";

type State<T> = { status: "loading" } | { status: "error" } | { status: "ready"; rows: T[] };

function useMethods<T>(path: string, read: (data: unknown) => T[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(path, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Method request failed");
      const rows = read(await response.json());
      if (!controller.signal.aborted) setState({ status: "ready", rows });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: "error" });
    });
    return () => controller.abort();
  }, [path, read, attempt]);
  const retry = () => { setState({ status: "loading" }); setAttempt((value) => value + 1); };
  return [state, retry] as const;
}

// With a single option there is nothing to choose, so pick it for the buyer.
function useOnlyOption<T>(state: State<T>, selected: unknown, select: (row: T) => void) {
  const only = state.status === "ready" && state.rows.length === 1 ? state.rows[0] : null;
  useEffect(() => {
    if (only && !selected) select(only);
  }, [only, selected, select]);
}

function MethodGroup<T>({ legend, name, state, retry, emptyText, errorText, keyOf, render, isSelected, onSelect, notice, sections, children }: {
  legend: string;
  name: string;
  state: State<T>;
  retry: () => void;
  emptyText: string;
  errorText: string;
  keyOf: (row: T) => string;
  render: (row: T) => ReactNode;
  isSelected: (row: T) => boolean;
  onSelect: (row: T) => void;
  // Shown above the choices, e.g. a warning that applies to all of them.
  notice?: ReactNode;
  // Splits the choices under subheadings; still one radio group.
  sections?: (rows: T[]) => { key: string; label: string | null; rows: T[] }[];
  children?: ReactNode;
}) {
  if (state.status === "loading") return <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3><Spinner label={`Memuat ${legend.toLowerCase()}…`} /></section>;
  if (state.status === "error") return (
    <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3>
      <div className="address-notice" role="alert"><p>{errorText}</p><Button type="button" variant="secondary" onClick={retry}>Coba lagi</Button></div>
    </section>
  );
  if (!state.rows.length) return <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3><div className="address-notice"><p>{emptyText}</p><Button type="button" variant="secondary" onClick={retry}>Muat ulang</Button></div></section>;
  const list = (rows: T[]) => (
    <div className="method-list">
      {rows.map((row) => (
        <label className="method-card" key={keyOf(row)} data-selected={isSelected(row)}>
          <input type="radio" required name={name} value={keyOf(row)} checked={isSelected(row)} onChange={() => onSelect(row)} />
          <span className="method-card-body">{render(row)}</span>
        </label>
      ))}
    </div>
  );
  return (
    <fieldset className="method-group">
      <legend>{legend} <span className="required-indicator" aria-hidden="true">*</span></legend>
      {notice}
      {sections
        ? sections(state.rows).map((section) => (
          <div className="method-section" key={section.key}>
            {section.label && <p className="method-section-title">{section.label}</p>}
            {list(section.rows)}
          </div>
        ))
        : list(state.rows)}
      {children}
    </fieldset>
  );
}

type QuoteState = { status: "loading" } | { status: "error" } | { status: "ready"; quote: ShippingQuote };

/**
 * Every courier service for this address (live rates, or the store's flat rates as an estimate),
 * cheapest first. Remounted by key whenever the address changes, so it always opens on "loading".
 */
function ShippingChoices({ addressCode, currency, preorder, selected, onSelect }: {
  addressCode: string;
  currency: string;
  preorder: boolean;
  selected: ShippingOption | null;
  onSelect: (option: ShippingOption | null) => void;
}) {
  const [state, setState] = useState<QuoteState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ address_code: addressCode });
    if (preorder) params.set("cart", "preorder");
    fetch(`/api/shipping/options?${params}`, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Shipping options failed");
      const quote = readShippingQuote(await response.json());
      if (!controller.signal.aborted) setState({ status: "ready", quote });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: "error" });
    });
    return () => controller.abort();
  }, [addressCode, preorder, attempt]);

  // A choice from an earlier list may no longer exist; a single option needs no choosing.
  const options = state.status === "ready" ? state.quote.options : null;
  useEffect(() => {
    if (!options) return;
    if (selected && !options.some((option) => shippingOptionKey(option) === shippingOptionKey(selected))) onSelect(null);
    else if (!selected && options.length === 1) onSelect(options[0]);
  }, [options, selected, onSelect]);

  const retry = () => { setState({ status: "loading" }); setAttempt((value) => value + 1); };
  const rows = state.status === "ready" ? { status: "ready" as const, rows: state.quote.options } : state;
  const highlights = options ? shippingHighlights(options) : new Map();

  return (
    <MethodGroup
      legend="Pengiriman" name="shipping-option"
      state={rows} retry={retry}
      emptyText="Belum ada kurir yang melayani alamat ini."
      errorText="Pilihan pengiriman belum dapat dimuat."
      keyOf={shippingOptionKey}
      isSelected={(option) => selected !== null && shippingOptionKey(option) === shippingOptionKey(selected)}
      onSelect={onSelect}
      notice={state.status === "ready" && state.quote.estimated && (
        <p className="shipping-notice" role="status">
          <Icon name="alert" />
          <span>
            <strong>Tarif perkiraan.</strong> Ongkir otomatis sedang tidak tersedia, jadi dipakai tarif pengiriman toko.
            Ongkir sebenarnya bisa berbeda dan estimasi waktu kirim belum ada.
          </span>
        </p>
      )}
      render={(option) => {
        const tags = highlights.get(shippingOptionKey(option));
        return (
          <>
            <strong className="shipping-option-head">
              <span className="shipping-option-courier"><BrandLogo src={option.courier_logo} />{shippingOptionLabel(option)}</span>
              <span className="shipping-option-price">{formatPrice(option.cost, currency)}</span>
            </strong>
            <span className="shipping-option-meta">
              {option.description && <span>{option.description}</span>}
              {option.etd
                ? <span className="shipping-option-etd"><Icon name="clock" />Estimasi {option.etd}</span>
                : !option.description && <span>Tarif pengiriman toko</span>}
            </span>
            {tags && (tags.cheapest || tags.fastest || tags.slow) && (
              <span className="shipping-tags">
                {tags.cheapest && <em className="shipping-tag shipping-tag-cheapest"><Icon name="tag" />Termurah</em>}
                {tags.fastest && <em className="shipping-tag shipping-tag-fastest"><Icon name="bolt" />Tercepat</em>}
                {tags.slow && <em className="shipping-tag shipping-tag-slow"><Icon name="alert" />Pengiriman lama</em>}
              </span>
            )}
          </>
        );
      }}>
      {state.status === "ready" && state.quote.weight > 0 && (
        <p className="shipping-cost">
          <span><Icon name="box" />Berat paket {formatWeight(state.quote.weight)}. Ongkir dihitung per kilogram.</span>
        </p>
      )}
    </MethodGroup>
  );
}

// Only mounted for bank transfer, so the account list is never fetched otherwise.
function BankAccounts({ selected, onSelect }: {
  selected: BankChoice | null;
  onSelect: (account: BankChoice) => void;
}) {
  const [state, retry] = useMethods("/api/payment/accounts", readBankChoices);
  useOnlyOption(state, selected, onSelect);
  return (
    <MethodGroup
      legend="Rekening tujuan transfer" name="bank-account"
      state={state} retry={retry}
      // Nomor rekening sengaja baru tampil setelah pesanan dibuat, bersama nominal berkode unik.
      notice={<>
        <p className="method-group-alert"><Icon name="alert" /><span><strong>Perhatian!</strong> Transfer tanpa kode unik lebih lama diverifikasi.</span></p>
        <p className="method-group-hint">Nomor rekening dan nominal transfer (dengan kode unik) tampil setelah pesanan dibuat.</p>
      </>}
      emptyText="Toko belum menyediakan rekening untuk transfer."
      errorText="Daftar rekening belum dapat dimuat."
      keyOf={(account) => String(account.id)}
      isSelected={(account) => selected?.id === account.id}
      onSelect={onSelect}
      render={(account) => <strong className="payment-method-head"><BrandLogo src={account.logo_url} />{account.bank}</strong>} />
  );
}

const paymentSections = (methods: PaymentMethod[]) =>
  paymentMethodSections(methods).map(({ key, label, methods: rows }) => ({ key, label, rows }));

function PaymentMethodLabel({ method }: { method: PaymentMethod }) {
  if (!method.online) return <><strong>{method.name}</strong><span>Instruksi pembayaran dikirim setelah pesanan dibuat.</span></>;
  return (
    <>
      <strong className="payment-method-head">
        {method.icon && (
          // eslint-disable-next-line @next/next/no-img-element -- logo penyedia dari backend, ukurannya kecil.
          <img className="payment-method-logo" src={method.icon} alt="" width={40} height={24} loading="lazy" referrerPolicy="no-referrer" />
        )}
        {method.name}
      </strong>
      <span>{method.provider ? `${method.provider} · ` : ""}Dikonfirmasi otomatis</span>
    </>
  );
}

/**
 * Metode pembayaran toko lalu metode online dari plugin, plus pilihan rekening untuk transfer bank.
 * Dipakai di checkout dan saat mengganti metode bayar di halaman pembayaran.
 */
export function PaymentChoices({ payment, bankAccount, onPaymentChange, onBankAccountChange, legend = "Metode pembayaran" }: {
  payment: PaymentMethod | null;
  bankAccount: BankChoice | null;
  onPaymentChange: (method: PaymentMethod) => void;
  onBankAccountChange: (account: BankChoice) => void;
  legend?: string;
}) {
  const [paymentState, retryPayment] = useMethods("/api/payment/methods", readPaymentMethods);
  useOnlyOption(paymentState, payment, onPaymentChange);
  return (
    <>
      <MethodGroup
        legend={legend} name="payment-method"
        state={paymentState} retry={retryPayment}
        emptyText="Belum ada metode pembayaran tersedia."
        errorText="Metode pembayaran belum dapat dimuat."
        keyOf={(method) => method.code}
        isSelected={(method) => payment?.code === method.code}
        onSelect={onPaymentChange}
        sections={paymentSections}
        render={(method) => <PaymentMethodLabel method={method} />} />
      {payment?.code === "bank_transfer" && (
        <BankAccounts selected={bankAccount} onSelect={onBankAccountChange} />
      )}
    </>
  );
}

export function DeliveryOptions({ shipping, payment, bankAccount, addressCode, currency, preorder = false, refreshKey = 0, onShippingChange, onPaymentChange, onBankAccountChange }: {
  preorder?: boolean;
  // Bumped to reload shipping options, e.g. after the server says a chosen rate changed.
  refreshKey?: number;
  shipping: ShippingOption | null;
  payment: PaymentMethod | null;
  bankAccount: BankChoice | null;
  addressCode: string;
  currency: string;
  onShippingChange: (option: ShippingOption | null) => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onBankAccountChange: (account: BankChoice) => void;
}) {
  return (
    <div className="delivery-options">
      <p className="checkout-description">Pilih layanan pengiriman dan cara pembayaran untuk pesanan ini. Pilihan bertanda * wajib diisi.</p>
      <ShippingChoices key={`${addressCode}-${preorder}-${refreshKey}`} addressCode={addressCode} currency={currency}
        preorder={preorder} selected={shipping} onSelect={onShippingChange} />
      <PaymentChoices payment={payment} bankAccount={bankAccount}
        onPaymentChange={onPaymentChange} onBankAccountChange={onBankAccountChange} />
    </div>
  );
}
