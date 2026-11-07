import type { SectionRenderProps } from "@sellosy/theme";
import type { marquee } from "../manifest";

/** Marquee Ambaz (components/shared/Marquee.tsx): teks berjalan dengan titik pemisah. */
export function Marquee({ settings: s, editor }: SectionRenderProps<typeof marquee>) {
  if (!s.text) return null;
  const repeat = 12;
  return (
    <section {...editor} style={{ overflow: "hidden", backgroundColor: s.background ?? "#f8fafb", height: "100px", display: "flex", alignItems: "center" }}>
      <div className="marquee-track" aria-label={s.text}>
        {Array.from({ length: repeat * 2 }).map((_, i) => <span key={i} className="marquee-item" aria-hidden="true">{s.text}</span>)}
      </div>
      <style>{`
        .marquee-track { display: flex; white-space: nowrap; animation: marqueeScroll 30s linear infinite; width: max-content; }
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-item { position: relative; font-size: 20px; font-weight: 500; color: #222; margin-right: 56px; display: inline-block; }
        .marquee-item::after { position: absolute; content: ""; width: 8px; height: 8px; background: #222; border-radius: 100%; right: -28px; top: 50%; transform: translateY(-50%); }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
    </section>
  );
}
