import type { AddressDetails } from "@/lib/checkout";

/** Every part of a shipping address, in the order a courier reads it. */
export function AddressSummary({ address }: { address: AddressDetails }) {
  const contact = [address.contact, address.email].filter(Boolean).join(" · ");
  return (
    <span className="address-summary">
      <strong>{address.recipent}</strong>
      {contact && <span>{contact}</span>}
      <span className="address-summary-street">{address.address}</span>
      {address.region && <span>{address.region}</span>}
    </span>
  );
}
