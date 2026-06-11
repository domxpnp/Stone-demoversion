import { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base: P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 };

export const basket = (p: P = {}) => (
  <svg width={20} height={20} {...base} {...p}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const search = (p: P = {}) => (
  <svg width={18} height={18} {...base} {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const arrow = (p: P = {}) => (
  <svg width={16} height={16} {...base} strokeWidth={1.5} {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const arrowL = (p: P = {}) => (
  <svg width={16} height={16} {...base} strokeWidth={1.5} {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const chevD = (p: P = {}) => (
  <svg width={16} height={16} {...base} strokeWidth={1.5} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const trash = (p: P = {}) => (
  <svg width={18} height={18} {...base} strokeWidth={1.3} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
  </svg>
);

export const pin = (p: P = {}) => (
  <svg width={18} height={18} {...base} {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const mail = (p: P = {}) => (
  <svg width={18} height={18} {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const phone = (p: P = {}) => (
  <svg width={18} height={18} {...base} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l-1 4a2 2 0 0 1-2 2A14 14 0 0 1 3 5a2 2 0 0 1 2-1z" />
  </svg>
);

export const check = (p: P = {}) => (
  <svg width={16} height={16} {...base} strokeWidth={1.8} {...p}>
    <path d="m4 12 5 5 11-11" />
  </svg>
);

export const zoom = (p: P = {}) => (
  <svg width={18} height={18} {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4-4M10.5 7.5v6M7.5 10.5h6" />
  </svg>
);

export const doc = (p: P = {}) => (
  <svg width={16} height={16} {...base} {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </svg>
);

export const line = (p: P = {}) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 3C6.5 3 2 6.6 2 11.1c0 4 3.6 7.4 8.4 8 .3.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1 .9.55s5.9-3.47 8.05-5.95C21.5 14.4 22 12.8 22 11.1 22 6.6 17.5 3 12 3z" />
  </svg>
);

const Icon = { basket, search, arrow, arrowL, chevD, trash, pin, mail, phone, check, zoom, doc, line };
export default Icon;
