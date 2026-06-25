'use client';

/* ===== STONECLUB ADMIN — icons + shared UI ===== */
import { useEffect, useState, ReactNode, SVGProps, Dispatch, SetStateAction } from 'react';
import type { Stone } from '@/data/stones';
import type { Inquiry } from './adminData';

type IconProps = SVGProps<SVGSVGElement>;
type IconFn = (p?: IconProps) => JSX.Element;

const base: IconProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 };

export const A: Record<string, IconFn> = {
  grid: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  stone: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3 4 8v8l8 5 8-5V8l-8-5Z" /><path d="m4 8 8 5 8-5M12 13v8" /></svg>,
  inbox: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 13h5l1.5 3h5L21 13M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5L5 5Z" /></svg>,
  pages: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></svg>,
  image: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="m4 18 5-5 3 3 3-3 5 5" /></svg>,
  sliders: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>,
  tag: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h8.6l8 8.6a1.4 1.4 0 0 1 0 1.8Z" /><circle cx="7.5" cy="7.5" r="1.4" /></svg>,
  chart: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 19V5M4 19h16M8 15v-3M12 15V9M16 15v-6" /></svg>,
  search: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>,
  bell: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  plus: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  edit: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M13.5 6.5 17.5 10.5" /></svg>,
  trash: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.4} {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></svg>,
  eye: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  x: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.6} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  check: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}><path d="m4 12 5 5 11-11" /></svg>,
  arrow: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>,
  arrowL: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M20 12H5M11 6l-6 6 6 6" /></svg>,
  chevR: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>,
  mail: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.4} {...p}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 7 9 6 9-6" /></svg>,
  phone: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.4} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>,
  logout: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" /></svg>,
  upload: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>,
  copy: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.4} {...p}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>,
  star: (p = {}) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 3 2.6 5.6 6 .7-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.7L12 3Z" /></svg>,
  globe: (p = {}) => <svg viewBox="0 0 24 24" {...base} strokeWidth={1.4} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>,
  ext: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>,
  save: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7M8 21v-7h8v7" /></svg>,
  users: (p = {}) => <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.6A5.5 5.5 0 0 1 21 20" /></svg>,
};

/* status meta for inquiries */
export const STATUS: Record<string, { label: string; th: string; cls: string }> = {
  'new': { label: 'New', th: 'ใหม่', cls: 'badge-new' },
  'in-progress': { label: 'In progress', th: 'กำลังดำเนินการ', cls: 'badge-info' },
  'quoted': { label: 'Quoted', th: 'เสนอราคาแล้ว', cls: 'badge-warn' },
  'won': { label: 'Won', th: 'ปิดการขาย', cls: 'badge-ok' },
  'archived': { label: 'Archived', th: 'เก็บถาวร', cls: 'badge-mut' },
};

export function Badge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS['new'];
  return <span className={'badge ' + s.cls}><span className="d" />{s.label}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)}>
      <span className="tt" />
      {label && <span className="tl">{label}</span>}
    </button>
  );
}

export function Field({ label, thHint, children, span2 }: { label: string; thHint?: string; children: ReactNode; span2?: boolean }) {
  return (
    <div className={'fld' + (span2 ? ' col-2' : '')}>
      <label>{label}{thHint && <span className="th"> · {thHint}</span>}</label>
      {children}
    </div>
  );
}

/* slide-over drawer */
export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="drawer-back" onClick={onClose} />
      <aside className="drawer" role="dialog">{children}</aside>
    </>
  );
}

/* transient toast */
export function useToast(): [ReactNode, (text: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (text: string) => { setMsg(text); };
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? <div className="toast">{A.check()}<span>{msg}</span></div> : null;
  return [node, show];
}

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export type Facets = Record<string, string[]>;

/* shared context passed to every page */
export interface AdminCtx {
  route: string;
  go: (r: string) => void;
  stones: Stone[];
  setStones: Dispatch<SetStateAction<Stone[]>>;
  inquiries: Inquiry[];
  setInquiries: Dispatch<SetStateAction<Inquiry[]>>;
  facets: Facets;
  setFacets: Dispatch<SetStateAction<Facets>>;
  tagOptions: string[];
  setTagOptions: Dispatch<SetStateAction<string[]>>;
  showToast: (text: string) => void;
}

/* fallback image for any missing asset */
export const FALLBACK_IMG = '/photos/blankimg.jpg';
export function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (!el.src.endsWith(FALLBACK_IMG)) el.src = FALLBACK_IMG;
}
