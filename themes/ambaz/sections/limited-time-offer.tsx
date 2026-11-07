"use client";

import { useEffect, useState } from "react";
import { SectionLink, type SectionRenderProps } from "@sellosy/theme";
import type { limitedTimeOffer } from "../manifest";
import { IconArrowRightS } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");

/** Hitung mundur Ambaz ke tanggal yang diatur toko; null sebelum dimuat di browser (tanpa beda server/browser). */
function CountdownTimer({ target }: { target: number }) {
  const [time, setTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({ days: Math.floor(diff / 86_400_000), hours: Math.floor((diff % 86_400_000) / 3_600_000), minutes: Math.floor((diff % 3_600_000) / 60_000), seconds: Math.floor((diff % 60_000) / 1_000) });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);
  const t = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return (
    <div className="lto-countdown">
      {[{ val: String(t.days), label: "Days" }, { val: pad(t.hours), label: "Hrs" }, { val: pad(t.minutes), label: "Min" }, { val: pad(t.seconds), label: "Sec" }].map(({ val, label }) => (
        <div key={label} className="lto-cd-cell"><span className="lto-cd-val">{val}</span><span className="lto-cd-lbl">{label}</span></div>
      ))}
    </div>
  );
}

/** LimitedTimeOffer Ambaz. Hitung mundur hanya tampil bila toko mengisi tanggal berakhir yang belum lewat. */
export function LimitedTimeOffer({ settings: s, editor }: SectionRenderProps<typeof limitedTimeOffer>) {
  const target = s.ends_at ? new Date(s.ends_at).getTime() : NaN;
  const counting = Number.isFinite(target);
  return (
    <section {...editor} className="lto-section" style={{ backgroundColor: s.background ?? "#f8fafb" }}>
      <div className="container-main">
        <div className={`lto-grid${counting ? "" : " lto-grid-2"}`}>
          <h2 className="lto-heading">{s.title}</h2>
          {counting && <CountdownTimer target={target} />}
          {s.button && s.link && (
            <div className="lto-cta-wrap">
              <SectionLink href={s.link.href} className="lto-cta">{s.button}<IconArrowRightS size={17} /></SectionLink>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .lto-section { padding: 48px 0; }
        .lto-grid { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px; }
        .lto-heading { font-size: clamp(20px, 5vw, 32px); font-weight: 600; color: #222; line-height: 1.4; white-space: pre-line; }
        .lto-countdown { display: flex; gap: 8px; align-items: center; }
        .lto-cd-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #d4d4d4; border-radius: 4px; width: 60px; height: 58px; box-sizing: border-box; flex-shrink: 0; }
        .lto-cd-val { font-size: 19px; font-weight: 600; color: #222; line-height: 1; font-variant-numeric: tabular-nums; }
        .lto-cd-lbl { font-size: 11px; font-weight: 400; color: #888; margin-top: 4px; line-height: 1; }
        .lto-cta-wrap { display: flex; justify-content: center; }
        .lto-cta { display: inline-flex; align-items: center; gap: 10px; background-color: #000; color: #fff; font-size: 15px; font-weight: 500; padding: 14px 28px; border-radius: 40px; text-decoration: none; transition: background-color 250ms ease; white-space: nowrap; }
        .lto-cta:hover { background-color: #fc5732; }
        @media (min-width: 992px) {
          .lto-section { padding: 0; height: 250px; display: flex; align-items: center; }
          .lto-section > .container-main { width: 100%; }
          .lto-grid { display: grid; grid-template-columns: 2fr auto 1fr; align-items: center; text-align: left; gap: 36px; }
          .lto-grid-2 { grid-template-columns: 2fr 1fr; }
          .lto-heading { font-size: 32px; }
          .lto-cta-wrap { justify-content: flex-end; }
          .lto-cta { font-size: 17px; padding: 16px 32px; }
          .lto-cd-cell { width: 66px; height: 64px; }
          .lto-cd-val { font-size: 21px; }
          .lto-cd-lbl { font-size: 12px; }
        }
        @media (max-width: 480px) {
          .lto-countdown { gap: 6px; }
          .lto-cd-cell { width: 52px; height: 52px; }
          .lto-cd-val { font-size: 16px; }
          .lto-cd-lbl { font-size: 10px; }
        }
      `}</style>
    </section>
  );
}
