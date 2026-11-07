"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { displayPhone, e164, pageUrl, publicAddress, SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { mainFooter } from "../manifest";
import { IconMail, IconPhone, IconToggle, SocialLinks } from "./icons";
import { PaymentIcons } from "./payment-icons";

/** Kolom footer Ambaz: judul biasa di ≥750px, akordeon di layar kecil. */
function FooterColumn({ id, title, expanded, onToggle, children }: { id: string; title: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="ft-col">
      <button type="button" className="ft-col-head" onClick={onToggle} aria-expanded={expanded} aria-controls={`ft-col-body-${id}`}>
        <span>{title}</span>
        <span className="ft-col-toggle"><IconToggle open={expanded} /></span>
      </button>
      <div id={`ft-col-body-${id}`} className={`ft-col-body${expanded ? " is-open" : ""}`}>
        <div className="ft-col-body-inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * Footer Ambaz (layout/Footer/Footer.tsx). Kolom "Quick Links" berisi halaman toko, "Company" tautan dari block.
 * Kolom newsletter aslinya diganti kontak toko (platform belum punya langganan email), dan pilihan mata uang/bahasa
 * demo tidak ikut karena toko memakai satu mata uang. Platform menambahkan "Built with Sellosy" di bawahnya.
 */
export function MainFooter({ settings: s, blocks, store, page, editor }: SectionRenderProps<typeof mainFooter>) {
  const pages = page.template === "footer" ? page.pages : [];
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));
  const about = s.about_text.trim() || store.description?.trim() || "";
  const links = blocks.filter((block) => block.settings.label.trim() && block.settings.link);
  const phone = displayPhone(store.phone_country_code, store.phone);
  const tel = e164(store.phone_country_code, store.phone);
  const address = publicAddress(store);

  return (
    <footer {...editor} className="ambaz-footer" style={{ backgroundColor: s.background ?? "#f7f8fc" }}>
      <div className="container-main" style={{ paddingTop: "30px", paddingBottom: "30px" }}>
        <div className="footer-grid">
          <FooterColumn id="about" title={s.about_title} expanded={!!open.about} onToggle={() => toggle("about")}>
            {about && <p className="ft-text" style={{ marginBottom: "20px" }}>{about}</p>}
            <SocialLinks className="ft-social" links={s} />
          </FooterColumn>

          {pages.length > 0 && (
            <FooterColumn id="pages" title={s.pages_title} expanded={!!open.pages} onToggle={() => toggle("pages")}>
              <div className="ft-links">
                {pages.map((link) => <Link key={link.slug} href={pageUrl(link.slug)}>{link.title}</Link>)}
              </div>
            </FooterColumn>
          )}

          {links.length > 0 && (
            <FooterColumn id="links" title={s.links_title} expanded={!!open.links} onToggle={() => toggle("links")}>
              <div className="ft-links">
                {links.map(({ id, settings: link }) => <SectionLink key={id} href={link.link!.href}>{link.label}</SectionLink>)}
              </div>
            </FooterColumn>
          )}

          <FooterColumn id="contact" title={s.contact_title} expanded={!!open.contact} onToggle={() => toggle("contact")}>
            {s.contact_text && <p className="ft-text" style={{ marginBottom: "20px" }}>{s.contact_text}</p>}
            <div className="ft-contact">
              {phone && tel && <a href={`tel:${tel}`} className="ft-pill"><IconPhone size={18} /><span>{phone}</span></a>}
              {store.email && <a href={`mailto:${store.email}`} className="ft-pill"><IconMail /><span>{store.email}</span></a>}
              {address && <p className="ft-text">{address}</p>}
            </div>
          </FooterColumn>
        </div>
      </div>

      <div className="container-main"><div style={{ borderTop: "1px solid #e0e0e0" }} /></div>

      <div className="container-main" style={{ paddingTop: "24px", paddingBottom: "24px" }}>
        <div className="footer-bottom-grid">
          <div />
          <p className="ft-copy">{s.copyright.trim() || `© ${new Date().getFullYear()}, ${store.name}`}</p>
          <div style={{ justifySelf: "end" }}>{s.payment_icons && <PaymentIcons />}</div>
        </div>
      </div>

      <style>{`
        .ambaz-footer + .built-with { background: ${s.background ?? "#f7f8fc"}; }
        .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
        .ft-col-head { all: unset; display: block; font-size: 20px; font-weight: 700; color: #222; margin-bottom: 18px; cursor: default; }
        .ft-col-toggle { display: none; }
        .ft-col-body { display: block; overflow: visible; }
        .ft-text { font-size: 15px; color: #777; line-height: 1.7; }
        .ft-social { display: flex; align-items: center; gap: 14px; }
        .ft-social a { color: #222; display: flex; transition: color 200ms ease; }
        .ft-links { display: flex; flex-direction: column; gap: 12px; }
        .ft-links a, .ft-links span { font-size: 15px; color: #777; transition: color 200ms ease; }
        .ft-social a:hover, .ft-links a:hover, .ft-pill:hover { color: #F15B41; }
        .ft-contact { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
        .ft-pill { display: inline-flex; align-items: center; gap: 10px; max-width: 100%; border: 1px solid #ddd; border-radius: 40px; padding: 10px 20px; background: #fff; font-size: 15px; color: #777; transition: color 200ms ease; }
        .ft-pill span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ft-pill svg { color: #999; flex-shrink: 0; }
        .footer-bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; }
        .ft-copy { font-size: 14px; color: #777; text-align: center; }
        @media (max-width: 749px) {
          .footer-grid { grid-template-columns: 1fr; gap: 0; }
          .ft-col-head { width: 100%; display: flex; align-items: center; justify-content: space-between; margin: 0; padding: 4px; cursor: pointer; font-size: 18px; color: #222; }
          .ft-col-toggle { display: inline-flex; color: #222; }
          .ft-col-body { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94); }
          .ft-col-body.is-open { grid-template-rows: 1fr; opacity: 1; }
          .ft-col-body-inner { overflow: hidden; min-height: 0; padding: 0 4px; }
          .ft-col-body.is-open .ft-col-body-inner { padding: 8px 4px 4px; }
          .ft-links { gap: 20px; }
          .footer-bottom-grid { grid-template-columns: 1fr; gap: 20px; text-align: center; }
          .footer-bottom-grid > div { justify-self: center !important; }
          .footer-bottom-grid > div:empty { display: none; }
        }
      `}</style>
    </footer>
  );
}
