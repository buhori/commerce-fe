"use client";

import { useCallback, useEffect, useState } from "react";
import { displayPhone, e164, SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { announcementBar } from "../manifest";
import { IconArrowLeftS, IconArrowRightS, IconMail, IconPhone, SocialLinks } from "./icons";

/** Slider pengumuman Ambaz: geser kiri/kanan, otomatis bila dinyalakan. */
function useSlider(total: number, autoplay: boolean) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const goNext = useCallback(() => {
    setDirection("next");
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);
  const goPrev = useCallback(() => {
    setDirection("prev");
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (!autoplay || total <= 1) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [autoplay, total, goNext]);

  return { current: Math.min(current, Math.max(total - 1, 0)), direction, goNext, goPrev };
}

/**
 * AnnouncementBar Ambaz (layout/Header/AnnouncementBar.tsx). Kolom kanan aslinya pilihan mata uang dan bahasa
 * demo; toko memakai satu mata uang, jadi kolom itu menampilkan kontak toko.
 */
export function AnnouncementBar({ settings: s, blocks, store, editor }: SectionRenderProps<typeof announcementBar>) {
  const messages = blocks.filter((block) => block.settings.text.trim());
  const { current, direction, goNext, goPrev } = useSlider(messages.length, s.autoplay);
  const phone = s.show_contact ? displayPhone(store.phone_country_code, store.phone) : null;
  const tel = phone ? e164(store.phone_country_code, store.phone) : null;
  const email = s.show_contact ? store.email : null;

  if (messages.length === 0) return null;

  return (
    <div {...editor} className="ambaz-announce" style={{ backgroundColor: s.background ?? "#000", color: s.text_color ?? "#fff" }}>
      <div className="container-main announce-grid">
        <SocialLinks className="announce-social" links={s} />

        <div className="announce-slider">
          {messages.length > 1 && (
            <button type="button" onClick={goPrev} aria-label="Pengumuman sebelumnya" className="announce-nav">
              <IconArrowLeftS size={20} />
            </button>
          )}
          <div className="announce-track">
            {messages.map(({ id, settings: message }, i) => {
              const active = i === current;
              const text = message.link ? <SectionLink href={message.link.href}>{message.text}</SectionLink> : message.text;
              return (
                <span key={id} className="announce-item" aria-hidden={!active}
                  style={{ transform: active ? "translateX(0)" : `translateX(${direction === "next" ? "100%" : "-100%"})`, opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}>
                  {text}
                </span>
              );
            })}
          </div>
          {messages.length > 1 && (
            <button type="button" onClick={goNext} aria-label="Pengumuman berikutnya" className="announce-nav">
              <IconArrowRightS size={20} />
            </button>
          )}
        </div>

        <div className="announce-contact">
          {phone && tel && <a href={`tel:${tel}`}><IconPhone size={15} />{phone}</a>}
          {email && <a href={`mailto:${email}`}><IconMail />{email}</a>}
        </div>
      </div>

      <style>{`
        .ambaz-announce { height: 40px; position: relative; }
        .announce-grid { height: 100%; display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; }
        .announce-social { display: flex; align-items: center; gap: 12px; }
        .announce-social a, .announce-contact a, .announce-nav { color: inherit; display: flex; transition: color 150ms ease; }
        .announce-social a:hover, .announce-contact a:hover, .announce-nav:hover, .announce-item a:hover { color: #F15B41; }
        .announce-slider { display: flex; align-items: center; justify-content: space-between; width: 100%; grid-column: 2; }
        .announce-nav { background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
        .announce-track { position: relative; overflow: hidden; height: 20px; flex: 1 1 0%; margin: 0 12px; }
        .announce-item { position: absolute; inset: 0 0 auto; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; white-space: nowrap; transition: transform 600ms ease, opacity 600ms ease; }
        .announce-item a { color: inherit; text-decoration: none; }
        .announce-contact { display: flex; align-items: center; gap: 20px; justify-content: flex-end; font-size: 14px; white-space: nowrap; }
        .announce-contact a { align-items: center; gap: 6px; text-decoration: none; }
        @media (max-width: 749px) {
          .announce-grid { grid-template-columns: 1fr; }
          .announce-social, .announce-contact { display: none; }
          .announce-slider { grid-column: 1; }
        }
      `}</style>
    </div>
  );
}
