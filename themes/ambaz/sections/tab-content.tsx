"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { tabContent } from "../manifest";
import { IconArrowRightLong } from "./icons";

function IconArrowUpRight({ size = 18 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true"><path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z" /></svg>;
}

/** TabContentSection Ambaz: media besar di kiri berganti sesuai tab yang disorot di kanan. */
export function TabContent({ settings: s, blocks, editor }: SectionRenderProps<typeof tabContent>) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = blocks.filter((block) => block.settings.title);
  if (tabs.length === 0) return null;

  return (
    <section {...editor}>
      <div className="container-main">
        <div className="tab-grid">
          <div className="tab-media" style={{ position: "relative", overflow: "hidden", backgroundColor: "#f5f5f5", borderRadius: "12px" }}>
            {tabs.map(({ id, settings: tab }, i) => (
              <div key={id} style={{ position: "absolute", inset: 0, transition: "opacity 600ms ease, transform 600ms ease", opacity: activeTab === i ? 1 : 0, transform: activeTab === i ? "scale(1)" : "scale(1.03)", pointerEvents: activeTab === i ? "auto" : "none", zIndex: activeTab === i ? 2 : 1 }}>
                {tab.video ? (
                  // YouTube tanpa cookie; dimuat hanya saat tabnya aktif.
                  activeTab === i && <iframe src={`https://www.youtube-nocookie.com/embed/${tab.video.id}`} title={tab.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none" }} />
                ) : tab.image ? (
                  <Image unoptimized src={tab.image.url} alt={tab.image.alt || tab.title} fill style={{ objectFit: "cover", objectPosition: "center" }} sizes="50vw" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="tab-content" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", marginBottom: "32px" }}>
              {tabs.map(({ id, settings: tab }, i) => (
                <button key={id} type="button" onMouseEnter={() => setActiveTab(i)} onFocus={() => setActiveTab(i)} onClick={() => setActiveTab(i)} aria-pressed={activeTab === i}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid #e5e5e5", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <h3 style={{ fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 600, color: activeTab === i ? "#222" : "#888", transition: "color 250ms ease" }}>{tab.title}</h3>
                  <span style={{ width: "40px", height: "40px", borderRadius: "50%", border: activeTab === i ? "none" : "1.5px solid #e0e0e0", backgroundColor: activeTab === i ? "#000" : "transparent", color: activeTab === i ? "#fff" : "#222", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 300ms ease", flexShrink: 0 }}>
                    <IconArrowUpRight size={18} />
                  </span>
                </button>
              ))}
            </div>
            <div style={{ position: "relative", minHeight: "80px", marginBottom: "32px" }}>
              {tabs.map(({ id, settings: tab }, i) => (
                <p key={id} style={{ position: i === 0 ? "relative" : "absolute", top: 0, left: 0, right: 0, fontSize: "15px", color: "#777", lineHeight: 1.7, transition: "opacity 500ms ease, transform 500ms ease", opacity: activeTab === i ? 1 : 0, transform: activeTab === i ? "translateY(0)" : "translateY(8px)", pointerEvents: activeTab === i ? "auto" : "none" }}>
                  {tab.text}
                </p>
              ))}
            </div>
            {s.button && s.link && (
              <div>
                <SectionLink href={s.link.href} className="tab-cta">{s.button}<IconArrowRightLong size={14} /></SectionLink>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .tab-grid { display: grid; grid-template-columns: 1fr; gap: 0; }
        .tab-media { height: clamp(300px, 80vw, 500px); }
        .tab-content { padding: 32px 0 0; }
        .tab-cta { display: inline-flex; align-items: center; gap: 8px; background-color: #000; color: #fff; font-size: 15px; font-weight: 500; padding: 14px 28px; border-radius: 40px; text-decoration: none; transition: background-color 250ms ease; }
        .tab-cta:hover { background-color: #fc5732; }
        @media (min-width: 750px) { .tab-media { height: 600px; } .tab-content { padding: 24px 0 0 40px; } }
        @media (min-width: 992px) { .tab-grid { grid-template-columns: 1fr 1fr; } .tab-media { height: 750px; } .tab-content { height: 750px; padding: 0 40px 0 60px; } }
      `}</style>
    </section>
  );
}
