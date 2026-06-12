'use client';

/* ===== STONECLUB ADMIN — shell: auth, sidebar, topbar, routing ===== */
import { useEffect, useState } from 'react';
import type { Stone } from '@/data/stones';
import { STONES, FACETS, TAGS } from '@/data/stones';
import { A, useToast, Facets, AdminCtx } from './ui';
import { INQUIRIES, ADMIN_USER, Inquiry } from './adminData';
import Dashboard from './Dashboard';
import StonesPage from './StonesPage';
import InquiriesPage from './InquiriesPage';
import { PagesPage, MediaPage, FacetsPage, TagsPage } from './ContentPages';
import ClearancePage from './ClearancePage';

interface NavItem { id: string; label: string; icon: string; th?: string; }
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'grid' }] },
  {
    group: 'Content', items: [
      { id: 'stones', label: 'Catalogue', icon: 'stone', th: 'สินค้าหิน' },
      { id: 'clearance', label: 'Clearance', icon: 'star', th: 'หน้าโปรโมชั่น' },
      { id: 'pages', label: 'Pages', icon: 'pages', th: 'เนื้อหาหน้าเว็บ' },
      { id: 'media', label: 'Media', icon: 'image', th: 'คลังรูปภาพ' },
      { id: 'facets', label: 'Filters', icon: 'sliders', th: 'ตัวกรอง' },
      { id: 'tags', label: 'Tags', icon: 'tag', th: 'คีย์เวิร์ด' },
    ],
  },
  { group: 'Sales', items: [{ id: 'inquiries', label: 'Inquiries', icon: 'inbox', th: 'คำขอจากลูกค้า' }] },
];

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [route, setRoute] = useState('dashboard');

  useEffect(() => { setAuthed(localStorage.getItem('sc_admin_authed') === '1'); }, []);

  // central editable state, seeded from data.ts
  const [stones, setStones] = useState<Stone[]>(() => STONES.map(s => ({ ...s, status: s.status || 'published' })));
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => INQUIRIES.map(i => ({ ...i })));
  const [facets, setFacets] = useState<Facets>(() => JSON.parse(JSON.stringify(FACETS)));
  const [tagOptions, setTagOptions] = useState<string[]>(() => [...TAGS]);
  const [toast, showToast] = useToast();

  const go = (r: string) => { setRoute(r); document.querySelector('.view')?.scrollTo({ top: 0 }); };

  const newInquiries = inquiries.filter(i => i.status === 'new').length;

  const login = () => { localStorage.setItem('sc_admin_authed', '1'); setAuthed(true); };
  const logout = () => { localStorage.removeItem('sc_admin_authed'); setAuthed(false); };

  if (!authed) return <Login onLogin={login} />;

  const ctx: AdminCtx = { route, go, stones, setStones, inquiries, setInquiries, facets, setFacets, tagOptions, setTagOptions, showToast };
  let Page;
  switch (route) {
    case 'stones': Page = <StonesPage {...ctx} />; break;
    case 'clearance': Page = <ClearancePage {...ctx} />; break;
    case 'inquiries': Page = <InquiriesPage {...ctx} />; break;
    case 'pages': Page = <PagesPage {...ctx} />; break;
    case 'media': Page = <MediaPage {...ctx} />; break;
    case 'facets': Page = <FacetsPage {...ctx} />; break;
    case 'tags': Page = <TagsPage {...ctx} />; break;
    default: Page = <Dashboard {...ctx} />;
  }

  const cur = NAV.flatMap(g => g.items).find(i => i.id === route) || { label: 'Dashboard' };

  return (
    <div className="shell">
      <Sidebar route={route} go={go} onLogout={logout} newInquiries={newInquiries} />
      <div className="main">
        <Topbar crumb={cur.label} />
        <div className="view">
          <div className="view-inner">{Page}</div>
        </div>
      </div>
      {toast}
    </div>
  );
}

/* ---------------- LOGIN ---------------- */
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('nattapong@stoneclubthailand.com');
  const [pw, setPw] = useState('••••••••••');
  const [remember, setRemember] = useState(true);
  const submit = (e: React.FormEvent) => { e.preventDefault(); onLogin(); };
  return (
    <div className="login">
      <div className="login-art">
        <div className="photo" />
        <div className="grain" />
        <div className="art-inner">
          <div className="brand"><span className="dia" />STONECLUB <span>thailand</span></div>
          <div className="pull">
            <div className="ey">Back office</div>
            <h2>Manage every slab,<br /><span className="it">every enquiry.</span></h2>
          </div>
          <div className="meta">Content management · v2.4 · Pak Chong</div>
        </div>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="label lf-label">Administrator</span>
          <h1>Sign in</h1>
          <p className="sub thai">เข้าสู่ระบบจัดการเนื้อหาเว็บไซต์ Stoneclub Thailand</p>
          <div className="fld">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          <div className="fld">
            <label>Password</label>
            <input value={pw} onChange={e => setPw(e.target.value)} type="password" />
          </div>
          <div className="row">
            <span className={'rm' + (remember ? ' on' : '')} onClick={() => setRemember(r => !r)}>
              <span className="box">{remember && A.check({ width: 11, height: 11 })}</span> จดจำฉันไว้
            </span>
            <a href="#" onClick={e => e.preventDefault()}>ลืมรหัสผ่าน?</a>
          </div>
          <button type="submit" className="btn btn-dark btn-lg btn-block">เข้าสู่ระบบ · Enter Dashboard {A.arrow({ width: 16, height: 16 })}</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR ---------------- */
function Sidebar({ route, go, onLogout, newInquiries }: { route: string; go: (r: string) => void; onLogout: () => void; newInquiries: number }) {
  const u = ADMIN_USER;
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <span className="dia" />
        <div>
          <div className="bt">STONECLUB <span>th</span></div>
          <div className="bsub">Back office</div>
        </div>
      </div>
      <div className="sb-scroll">
        {NAV.map(g => (
          <div className="sb-group" key={g.group}>
            <div className="gt">{g.group}</div>
            {g.items.map(it => (
              <button key={it.id} className={'sb-link' + (route === it.id ? ' on' : '')} onClick={() => go(it.id)}>
                {A[it.icon]()}
                <span className="ct">{it.label}</span>
                {it.id === 'inquiries' && newInquiries > 0 && <span className="pill">{newInquiries}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="sb-foot">
        <div className="sb-user">
          <div className="av">{u.initials}</div>
          <div>
            <div className="un">{u.name}</div>
            <div className="ur">{u.role}</div>
          </div>
          <button className="lo" onClick={onLogout} title="Sign out">{A.logout()}</button>
        </div>
      </div>
    </aside>
  );
}

/* ---------------- TOPBAR ---------------- */
function Topbar({ crumb }: { crumb: string }) {
  return (
    <header className="topbar">
      <div className="tb-crumb">
        <span>Stoneclub</span><span className="sep">{A.chevR({ width: 13, height: 13 })}</span>
        <span className="cur">{crumb}</span>
      </div>
      <div className="tb-search">
        {A.search()}
        <input placeholder="ค้นหาหิน คำขอ หรือหน้า…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="tb-icon" title="View live site" onClick={() => window.open('/', '_blank')}>{A.globe()}</button>
      <button className="tb-icon" title="Notifications"><span className="dot" />{A.bell()}</button>
    </header>
  );
}
