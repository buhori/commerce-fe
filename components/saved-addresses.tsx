"use client";

import { Spinner } from "./spinner";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { jsonHeaders, readAddresses, type ShippingAddress } from "@/lib/checkout";
import { AddressSummary } from "./address-summary";

type State = { status: "loading" | "guest" | "error" } | { status: "ready"; addresses: ShippingAddress[] };

export function SavedAddresses({ selectedId, onSelect, onAdd, onDeleted }: {
  selectedId?: number;
  /** Without it the cards are read-only, as on the profile page. */
  onSelect?: (address: ShippingAddress) => void;
  onAdd: () => void;
  onDeleted?: (id: number) => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  // Deleting asks for confirmation on the card itself, one address at a time.
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function remove(id: number) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/address/${id}`, { method: "DELETE", credentials: "same-origin", headers: jsonHeaders() });
      // Already gone (404) is the outcome the buyer wanted, so treat it as done.
      if (!response.ok && response.status !== 404) throw new Error("Address delete failed");
      setState((current) => current.status === "ready"
        ? { status: "ready", addresses: current.addresses.filter((address) => address.id !== id) }
        : current);
      setConfirmingId(null);
      onDeleted?.(id);
    } catch {
      setDeleteError("Alamat belum dapat dihapus. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/address", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401 || response.status === 419) {
          if (!controller.signal.aborted) setState({ status: "guest" });
          return;
        }
        if (!response.ok) throw new Error("Address list failed");
        const addresses = readAddresses(await response.json());
        if (!controller.signal.aborted) setState({ status: "ready", addresses });
      }).catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [attempt]);
  const retry = () => { setState({ status: "loading" }); setAttempt((value) => value + 1); };

  if (state.status === "loading") return <Spinner label="Memuat alamat tersimpan…" />;
  if (state.status === "guest") return (
    <div className="address-notice">
      <h3>Login untuk melihat alamat tersimpan</h3>
      <p>Anda tetap bisa menambahkan alamat baru tanpa login.</p>
      <div className="address-notice-actions"><Button type="button" onClick={onAdd}>Tambah alamat</Button><Button variant="secondary" type="button" onClick={retry}>Saya sudah login</Button></div>
    </div>
  );
  if (state.status === "error") return <div className="address-notice" role="alert"><p>Daftar alamat belum dapat dimuat.</p><Button type="button" variant="secondary" onClick={retry}>Coba lagi</Button></div>;
  if (state.status !== "ready") return null;
  if (!state.addresses.length) return <div className="address-notice"><p>Belum ada alamat tersimpan.</p><Button type="button" onClick={onAdd}>Tambah alamat</Button></div>;
  return (
    <>
      {deleteError && <p className="cart-feedback cart-feedback-error" role="alert">{deleteError}</p>}
      <div className="saved-addresses" role="group" aria-label={onSelect ? "Pilih alamat pengiriman" : "Alamat tersimpan"}>
        {state.addresses.map((address) => {
          const confirming = confirmingId === address.id;
          const deleting = deletingId === address.id;
          return (
            <div className="address-item" key={address.id} data-selected={selectedId === address.id}>
              {onSelect ? (
                <button type="button" className="address-card" aria-pressed={selectedId === address.id} disabled={deleting} onClick={() => onSelect(address)}>
                  <AddressSummary address={address} />
                  <small>{selectedId === address.id ? "Alamat dipilih" : "Pilih alamat ini"}</small>
                </button>
              ) : (
                <div className="address-card"><AddressSummary address={address} /></div>
              )}
              <div className="address-actions">
                {confirming ? (
                  <>
                    <span>Hapus alamat ini?</span>
                    <button type="button" className="address-delete" disabled={deleting} onClick={() => void remove(address.id)}>
                      {deleting ? "Menghapus…" : "Ya, hapus"}
                    </button>
                    <button type="button" className="text-button" disabled={deleting} onClick={() => setConfirmingId(null)}>Batal</button>
                  </>
                ) : (
                  <button type="button" className="address-delete" aria-label={`Hapus alamat ${address.label}`}
                    onClick={() => { setConfirmingId(address.id); setDeleteError(null); }}>
                    Hapus
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
