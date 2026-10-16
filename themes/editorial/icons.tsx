import type { SVGProps } from "react";

const base = {
  width: "1em", height: "1em", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
} as const;

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const BagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M3 7h18M3 12h18M3 17h18" /></svg>
);
export const ArrowIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="m6 9 6 6 6-6" /></svg>
);
export const WhatsappIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M9 8.6c.2 3.4 3 6.2 6.4 6.4l1.1-1.7-2-1-1 .9a4.5 4.5 0 0 1-2.7-2.7l.9-1-1-2L9 8.6Z" />
  </svg>
);
