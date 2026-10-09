"use client";

import { Spinner } from "./spinner";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import {
  readBankAccounts, readPaymentMethods, readShippingCost, readShippingMethods,
  type BankAccount, type PaymentMethod, type ShippingCost, type ShippingMethod,
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

function MethodGroup<T>({ legend, name, state, retry, emptyText, errorText, keyOf, render, isSelected, onSelect, children }: {
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
  children?: ReactNode;
}) {
  if (state.status === "loading") return <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3><Spinner label={`Memuat ${legend.toLowerCase()}…`} /></section>;
  if (state.status === "error") return (
    <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3>
      <div className="address-notice" role="alert"><p>{errorText}</p><Button type="button" variant="secondary" onClick={retry}>Coba lagi</Button></div>
    </section>
  );
  if (!state.rows.length) return <section className="method-group"><h3>{legend} <span className="required-indicator" aria-hidden="true">*</span></h3><div className="address-notice"><p>{emptyText}</p><Button type="button" variant="secondary" onClick={retry}>Muat ulang</Button></div></section>;
  return (
    <fieldset className="method-group">
      <legend>{legend} <span className="required-indicator" aria-hidden="true">*</span></legend>
      <div className="method-list">
        {state.rows.map((row) => (
          <label className="method-card" key={keyOf(row)} data-selected={isSelected(row)}>
            <input type="radio" required name={name} value={keyOf(row)} checked={isSelected(row)} onChange={() => onSelect(row)} />
            <span className="method-card-body">{render(row)}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

type CostState = { status: "loading" } | { status: "error" } | { status: "ready"; cost: ShippingCost };

// Remounted by key whenever the courier or the address changes, so it always opens on "loading".
function ShippingCostNote({ methodId, addressCode, currency, preorder, onCostChange }: {
  methodId: number;
  addressCode: string;
  currency: string;
  preorder: boolean;
  onCostChange: (cost: ShippingCost | null) => void;
}) {
  const [state, setState] = useState<CostState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ address_code: addressCode, shipping_method_id: String(methodId) });
    if (preorder) params.set("cart", "preorder");
    fetch(`/api/shipping/cost?${params}`, {
      credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Shipping cost failed");
      const cost = readShippingCost(await response.json());
      if (controller.signal.aborted) return;
      setState({ status: "ready", cost });
      onCostChange(cost);
    }).catch(() => {
      if (controller.signal.aborted) return;
      setState({ status: "error" });
      onCostChange(null);
    });
    return () => controller.abort();
  }, [methodId, addressCode, preorder, attempt, onCostChange]);

  if (state.status === "loading") return <p className="shipping-cost" role="status">Menghitung ongkos kirim…</p>;
  if (state.status === "error") return (
    <p className="shipping-cost shipping-cost-error" role="alert">
      Ongkos kirim belum dapat dihitung.{" "}
      <Button type="button" variant="text"
        onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>Coba lagi</Button>
    </p>
  );
  return (
    <p className="shipping-cost" role="status">
      <strong>Ongkos kirim {formatPrice(state.cost.cost, currency)}</strong>
      {state.cost.weight > 0 && <span>Berat {formatWeight(state.cost.weight)}, ditagih {formatWeight(state.cost.chargeable_weight)}.</span>}
    </p>
  );
}

// Only mounted for bank transfer, so the account list is never fetched otherwise.
function BankAccounts({ selected, onSelect }: {
  selected: BankAccount | null;
  onSelect: (account: BankAccount) => void;
}) {
  const [state, retry] = useMethods("/api/payment/accounts", readBankAccounts);
  useOnlyOption(state, selected, onSelect);
  return (
    <MethodGroup
      legend="Rekening tujuan transfer" name="bank-account"
      state={state} retry={retry}
      emptyText="Toko belum menyediakan rekening untuk transfer."
      errorText="Daftar rekening belum dapat dimuat."
      keyOf={(account) => String(account.id)}
      isSelected={(account) => selected?.id === account.id}
      onSelect={onSelect}
      render={(account) => <><strong>{account.bank} {account.number}</strong><span>a.n. {account.name}</span></>} />
  );
}

export function DeliveryOptions({ shipping, payment, bankAccount, addressCode, currency, preorder = false, onShippingChange, onPaymentChange, onBankAccountChange, onCostChange }: {
  preorder?: boolean;
  shipping: ShippingMethod | null;
  payment: PaymentMethod | null;
  bankAccount: BankAccount | null;
  addressCode: string;
  currency: string;
  onShippingChange: (method: ShippingMethod) => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onBankAccountChange: (account: BankAccount) => void;
  onCostChange: (cost: ShippingCost | null) => void;
}) {
  const [shippingState, retryShipping] = useMethods("/api/shipping/methods", readShippingMethods);
  const [paymentState, retryPayment] = useMethods("/api/payment/methods", readPaymentMethods);
  useOnlyOption(shippingState, shipping, onShippingChange);
  useOnlyOption(paymentState, payment, onPaymentChange);

  return (
    <div className="delivery-options">
      <p className="checkout-description">Pilih kurir pengiriman dan cara pembayaran untuk pesanan ini. Pilihan bertanda * wajib diisi.</p>
      <MethodGroup
        legend="Metode pengiriman" name="shipping-method"
        state={shippingState} retry={retryShipping}
        emptyText="Belum ada metode pengiriman tersedia."
        errorText="Metode pengiriman belum dapat dimuat."
        keyOf={(method) => String(method.id)}
        isSelected={(method) => shipping?.id === method.id}
        onSelect={onShippingChange}
        render={(method) => <><strong>{method.name}</strong><span>Ongkos kirim dihitung dari berat keranjang.</span></>}>
        {shipping && addressCode && (
          <ShippingCostNote key={`${shipping.id}-${addressCode}`} methodId={shipping.id}
            addressCode={addressCode} currency={currency} preorder={preorder} onCostChange={onCostChange} />
        )}
      </MethodGroup>
      <MethodGroup
        legend="Metode pembayaran" name="payment-method"
        state={paymentState} retry={retryPayment}
        emptyText="Belum ada metode pembayaran tersedia."
        errorText="Metode pembayaran belum dapat dimuat."
        keyOf={(method) => method.code}
        isSelected={(method) => payment?.code === method.code}
        onSelect={onPaymentChange}
        render={(method) => <><strong>{method.name}</strong><span>Instruksi pembayaran dikirim setelah pesanan dibuat.</span></>} />
      {payment?.code === "bank_transfer" && (
        <BankAccounts selected={bankAccount} onSelect={onBankAccountChange} />
      )}
    </div>
  );
}
