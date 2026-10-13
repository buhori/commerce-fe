"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import type { NavigationLink } from "@/lib/store-api";
import { Icon } from "./icons";

/**
 * Menu toko di layar kecil: bar "Menu" yang membuka daftar vertikal, sub-menu sebagai akordeon.
 * Memakai <details>, jadi tetap bisa dibuka sebelum JavaScript dimuat; menu tertutup lagi
 * setelah pembeli memilih tautan.
 */
export function StoreNavMobile({ items }: { items: NavigationLink[] }) {
  const menu = useRef<HTMLDetailsElement>(null);

  function closeOnNavigate(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a") && menu.current) menu.current.open = false;
  }

  return (
    <details className="store-nav-mobile" ref={menu}>
      <summary className="store-nav-bar">
        <Icon name="menu" />
        <span>Menu</span>
      </summary>
      <ul className="store-nav-mobile-list" onClick={closeOnNavigate}>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {item.children.length > 0 ? (
              <details className="store-nav-group">
                <summary className="store-nav-mobile-link">{item.label}</summary>
                <ul>
                  {/* Induk yang punya tujuan sendiri tetap bisa dibuka dari dalam grupnya. */}
                  {item.href && <li><MobileAnchor link={{ ...item, label: `Semua ${item.label}` }} /></li>}
                  {item.children.map((child, childIndex) => (
                    <li key={`${childIndex}-${child.label}`}><MobileAnchor link={child} /></li>
                  ))}
                </ul>
              </details>
            ) : (
              <MobileAnchor link={item} className="store-nav-mobile-link" />
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function MobileAnchor({ link, className = "store-nav-mobile-sub" }: { link: NavigationLink; className?: string }) {
  if (!link.href) return null;
  if (link.new_tab || !link.href.startsWith("/")) {
    return (
      <a className={className} href={link.href} {...(link.new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {link.label}
      </a>
    );
  }
  return <Link className={className} href={link.href}>{link.label}</Link>;
}
