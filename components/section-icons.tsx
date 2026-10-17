import type { ReactNode, SVGProps } from "react";
import type { FeatureIcon as FeatureIconName } from "@/lib/home-sections";

/** Ikon widget Keunggulan (lib/home-sections FEATURE_ICONS): garis 24×24, warna mengikuti teks. */
const paths: Record<FeatureIconName, ReactNode> = {
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 10" /></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  truck: <><path d="M14 17H9M3 17H2V5h12v12M14 8h4l4 5v4h-3M14 13h8" /><circle cx="6" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  heart: <path d="M12 20s-8-4.9-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.1 12 20 12 20Z" />,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3.5 8 3.5a2.25 2.25 0 0 0 0 4.5M12 8s1.5-4.5 4-4.5a2.25 2.25 0 0 1 0 4.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  leaf: <><path d="M5 19C5 10 10.5 4.5 20 4.5 20 14 14.5 19.5 6 19.5" /><path d="M4 20.5c3.5-5 7-8 11-10" /></>,
  sparkles: <><path d="m11 3 1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7L11 3Z" /><path d="m18 14 .8 2.2 2.2.8-2.2.8L18 20l-.8-2.2-2.2-.8 2.2-.8L18 14Z" /></>,
  tag: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  chat: <><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  award: <><circle cx="12" cy="9" r="6" /><path d="M8.6 13.9 7 21l5-3 5 3-1.6-7.1" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14.5v2" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></>,
  package: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Z" /><path d="m3 8 9 5 9-5M12 13v9M7.5 5.5l9 5V15" /></>,
};

/** Ikon dekoratif (aria-hidden); judul keunggulan di sebelahnya yang dibaca pembaca layar. */
export function FeatureIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: FeatureIconName }) {
  const path = paths[name];
  if (!path) return null;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {path}
    </svg>
  );
}
