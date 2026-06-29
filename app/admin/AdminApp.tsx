'use client';

/* ===== STONECLUB ADMIN — shell: auth, sidebar, topbar, routing ===== */
import { useEffect, useState } from 'react';
import type { Stone } from '@/data/stones';
import { STONES, FACETS, TAGS } from '@/data/stones';
import { A, useToast, Field, Facets, AdminCtx } from './ui';
import { INQUIRIES, Inquiry, AdminRole } from './adminData';
import Dashboard from './Dashboard';
import StonesPage from './StonesPage';
import InquiriesPage from './InquiriesPage';
import { PagesPage, MediaPage, FacetsPage, TagsPage } from './ContentPages';
import ClearancePage from './ClearancePage';
import UsersPage from './UsersPage';

interface SessionUser { id: string; name: string; email: string; role: AdminRole; initials: string; }

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
  { group: 'Settings', items: [{ id: 'users', label: 'Users', icon: 'users', th: 'ผู้ใช้ระบบ' }] },
];

export default function AdminApp() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [route, setRoute] = useState('dashboard');

  // Restore the session from the httpOnly cookie via /api/me on first load.
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then((u: SessionUser | null) => setMe(u))
      .catch(() => setMe(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // central editable state, seeded from data.ts (replaced by the DB once signed in)
  const [stones, setStones] = useState<Stone[]>(() => STONES.map(s => ({ ...s, status: s.status || 'published' })));

  const [inquiries, setInquiries] = useState<Inquiry[]>(() => INQUIRIES.map(i => ({ ...i })));
  const [facets, setFacets] = useState<Facets>(() => JSON.parse(JSON.stringify(FACETS)));
  const [tagOptions, setTagOptions] = useState<string[]>(() => [...TAGS]);

  // Load the live catalogue + filter/keyword vocab from the DB after sign-in;
  // keep the static seed as fallback so the UI renders before these resolve.
  useEffect(() => {
    if (!me) return;
    fetch('/api/stones')
      .then(r => r.ok ? r.json() : null)
      .then((rows: Stone[] | null) => { if (Array.isArray(rows)) setStones(rows); })
      .catch(() => {});
    fetch('/api/facets')
      .then(r => r.ok ? r.json() : null)
      .then((data: Record<string, { name: string }[]> | null) => {
        if (data) setFacets(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.map(o => o.name)])));
      })
      .catch(() => {});
    fetch('/api/tags')
      .then(r => r.ok ? r.json() : null)
      .then((rows: { name: string }[] | null) => { if (Array.isArray(rows)) setTagOptions(rows.map(t => t.name)); })
      .catch(() => {});
  }, [me?.id]);
  const [toast, showToast] = useToast();

  const go = (r: string) => { setRoute(r); document.querySelector('.view')?.scrollTo({ top: 0 }); };

  const newInquiries = inquiries.filter(i => i.status === 'new').length;

  // Returns an error message on failure, or null on success.
  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        return msg.error || 'เข้าสู่ระบบไม่สำเร็จ';
      }
      setMe(await res.json());
      return null;
    } catch {
      return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ลองใหม่อีกครั้ง';
    }
  };
  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    setMe(null);
    setRoute('dashboard');
  };

  if (!authChecked) return <div className="auth-boot" />;
  if (!me) return <Login onLogin={login} />;

  // Only owner/admin may see the Users management menu.
  const canManageUsers = me.role === 'owner' || me.role === 'admin';
  const nav = canManageUsers ? NAV : NAV.filter(g => g.group !== 'Settings');
  // If a viewer/editor somehow lands on 'users', bounce them to the dashboard.
  const activeRoute = (!canManageUsers && route === 'users') ? 'dashboard' : route;

  const ctx: AdminCtx = { route: activeRoute, go, stones, setStones, inquiries, setInquiries, facets, setFacets, tagOptions, setTagOptions, showToast };
  let Page;
  switch (activeRoute) {
    case 'stones': Page = <StonesPage {...ctx} />; break;
    case 'clearance': Page = <ClearancePage {...ctx} />; break;
    case 'inquiries': Page = <InquiriesPage {...ctx} />; break;
    case 'pages': Page = <PagesPage {...ctx} />; break;
    case 'media': Page = <MediaPage {...ctx} />; break;
    case 'facets': Page = <FacetsPage {...ctx} />; break;
    case 'tags': Page = <TagsPage {...ctx} />; break;
    case 'users': Page = <UsersPage {...ctx} />; break;
    default: Page = <Dashboard {...ctx} />;
  }

  const cur = nav.flatMap(g => g.items).find(i => i.id === activeRoute) || { label: 'Dashboard' };

  return (
    <div className="shell">
      <Sidebar nav={nav} user={me} onUserUpdate={setMe} route={activeRoute} go={go} onLogout={logout} newInquiries={newInquiries} showToast={showToast} />
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
function Login({ onLogin }: { onLogin: (email: string, password: string) => Promise<string | null> }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(null); setBusy(true);
    const error = await onLogin(email.trim(), pw);
    if (error) { setErr(error); setBusy(false); }
  };
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
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="name@stoneclubthailand.com" />
          </div>
          <div className="fld">
            <label>Password</label>
            <input value={pw} onChange={e => setPw(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" />
          </div>
          {err && <div className="login-err thai">{err}</div>}
          <div className="row">
            <span className={'rm' + (remember ? ' on' : '')} onClick={() => setRemember(r => !r)}>
              <span className="box">{remember && A.check({ width: 11, height: 11 })}</span> จดจำฉันไว้
            </span>
            <a href="#" onClick={e => e.preventDefault()}>ลืมรหัสผ่าน?</a>
          </div>
          <button type="submit" className="btn btn-dark btn-lg btn-block" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : <>เข้าสู่ระบบ · Enter Dashboard {A.arrow({ width: 16, height: 16 })}</>}</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR ---------------- */
const ROLE_LABELS: Record<AdminRole, string> = { owner: 'Owner', admin: 'Administrator', editor: 'Editor', viewer: 'Viewer' };

function Sidebar({ nav, user, onUserUpdate, route, go, onLogout, newInquiries, showToast }: { nav: typeof NAV; user: SessionUser; onUserUpdate: (u: SessionUser) => void; route: string; go: (r: string) => void; onLogout: () => void; newInquiries: number; showToast: (t: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const u = {
    name: user.name,
    role: ROLE_LABELS[user.role] ?? user.role,
    initials: user.initials || user.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?',
  };
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
        {nav.map(g => (
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
        <button className={'sb-user' + (menuOpen ? ' active' : '')} onClick={() => setMenuOpen(o => !o)}>
          <div className="av">{u.initials}</div>
          <div className="su-id">
            <div className="un">{u.name}</div>
            <div className="ur">{u.role}</div>
          </div>
          <span className="su-caret">{A.chevR({ width: 15, height: 15 })}</span>
        </button>

        {menuOpen && (
          <>
            <div className="sb-menu-back" onClick={() => setMenuOpen(false)} />
            <div className="sb-menu" role="menu">
              <button onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>{A.users({ width: 16, height: 16 })}<span>ดูโปรไฟล์ · Profile</span></button>
              <div className="sb-menu-sep" />
              <button className="danger" onClick={() => { setMenuOpen(false); onLogout(); }}>{A.logout({ width: 16, height: 16 })}<span>ออกจากระบบ · Sign out</span></button>
            </div>
          </>
        )}
      </div>
      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onUserUpdate={onUserUpdate} showToast={showToast} />}
    </aside>
  );
}

/* ---------------- PROFILE MODAL (editable self-service) ---------------- */
function ProfileModal({ user, onClose, onUserUpdate, showToast }: { user: SessionUser; onClose: () => void; onUserUpdate: (u: SessionUser) => void; showToast: (t: string) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [inits, setInits] = useState(user.initials);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const initials = inits || name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const pwOk = pw === '' || pw.length >= 8;
  const canSave = name.trim() !== '' && /\S+@\S+\.\S+/.test(email) && pwOk && !busy;

  const save = async () => {
    if (!canSave) return;
    setErr(null); setBusy(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), initials: inits.trim(), ...(pw ? { password: pw } : {}) }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || 'บันทึกไม่สำเร็จ');
      }
      const updated: SessionUser = await res.json();
      onUserUpdate(updated);
      showToast('อัปเดตโปรไฟล์เรียบร้อย');
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="modal-back" onClick={() => !busy && onClose()} />
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">{A.x({ width: 18, height: 18 })}</button>
        <div className="profile-head">
          <span className="av av-lg">{initials}</span>
          <div>
            <div className="profile-name">{name || 'โปรไฟล์'}</div>
            <span className="badge badge-prem" style={{ marginTop: 6 }}>{user.role === 'owner' && A.star({ width: 11, height: 11 })}<span className="d" />{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
        </div>

        <div className="profile-form">
          <Field label="ชื่อ-สกุล" span2>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อที่แสดงในระบบ" />
          </Field>
          <div className="fld-grid c3">
            <Field label="อีเมล" span2>
              <input className="inp" type="email" value={email} autoComplete="username" onChange={e => setEmail(e.target.value)} placeholder="name@stoneclubthailand.com" />
            </Field>
            <Field label="ตัวย่อ" thHint="ปล่อยว่างเพื่อสร้างอัตโนมัติ">
              <input className="inp" value={inits} maxLength={3} onChange={e => setInits(e.target.value.toUpperCase())} placeholder={name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()} />
            </Field>
          </div>
          <Field label="รหัสผ่านใหม่" thHint="เว้นว่างไว้หากไม่ต้องการเปลี่ยน" span2>
            <input className="inp" type="password" value={pw} autoComplete="new-password" onChange={e => setPw(e.target.value)} placeholder="••••••••" />
          </Field>
          {pw !== '' && pw.length < 8 && <div className="hint" style={{ fontSize: 12, color: '#9a2b2b', fontFamily: 'var(--thai)' }}>รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร</div>}
        </div>

        <p className="profile-note thai">สิทธิ์การใช้งาน (role) เปลี่ยนเองไม่ได้ ต้องให้ผู้ดูแลระบบกำหนดที่เมนู Users</p>
        {err && <div className="login-err thai" style={{ margin: '14px 0 0' }}>{err}</div>}

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button className="btn btn-solid" onClick={save} disabled={!canSave} style={{ opacity: canSave ? 1 : .5 }}>{A.save()} {busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </div>
      </div>
    </>
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
