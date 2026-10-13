import Link from "next/link";
import { getNavigation, type NavigationLink } from "@/lib/store-api";
import { StoreNavMobile } from "./store-nav-mobile";

/**
 * Menu navigasi toko di bawah kepala toko. Tanpa JavaScript: sub-menu terbuka saat disorot
 * atau difokuskan (keyboard, sentuhan). Di layar kecil diganti bar "Menu" (StoreNavMobile).
 */
export async function StoreNav() {
  // Backend lama belum punya /navigations; menu cukup tidak tampil.
  const items = await getNavigation().catch(() => []);
  if (items.length === 0) return null;

  return (
    <nav className="store-nav" aria-label="Menu toko">
      <ul className="container store-nav-list">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className={item.children.length > 0 ? "store-nav-item has-children" : "store-nav-item"}>
            {item.href ? (
              <NavAnchor link={item} className="store-nav-link" />
            ) : (
              <button type="button" className="store-nav-link" aria-haspopup="true">
                {item.label}
              </button>
            )}
            {item.children.length > 0 && (
              <ul className="store-nav-sub" aria-label={item.label}>
                {item.children.map((child, childIndex) => (
                  <li key={`${childIndex}-${child.label}`}>
                    <NavAnchor link={child} className="store-nav-sub-link" />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <StoreNavMobile items={items} />
    </nav>
  );
}

function NavAnchor({ link, className }: { link: NavigationLink; className: string }) {
  if (!link.href) return null;
  // Tautan ke situs lain atau yang diminta dibuka di tab baru memakai <a> biasa.
  if (link.new_tab || !link.href.startsWith("/")) {
    return (
      <a className={className} href={link.href} {...(link.new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {link.label}
      </a>
    );
  }
  return (
    <Link className={className} href={link.href}>
      {link.label}
    </Link>
  );
}
