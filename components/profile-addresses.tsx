"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./address-form";
import { SavedAddresses } from "./saved-addresses";

/** The buyer's address book: saved addresses, or the form to add one. */
export function ProfileAddresses() {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <header className="profile-heading profile-heading-actions">
        <h1>{adding ? "Tambah Alamat" : "Alamat"}</h1>
        {adding
          ? <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Batal</Button>
          : <Button type="button" onClick={() => setAdding(true)}>Tambah alamat</Button>}
      </header>
      {/* Returning to the list remounts it, so a newly saved address is fetched fresh. */}
      {adding
        ? <div className="profile-card"><AddressForm onSaved={() => setAdding(false)} /></div>
        : <SavedAddresses onAdd={() => setAdding(true)} />}
    </>
  );
}
