'use client';

/* ===== STONECLUB ADMIN — Users: back-office accounts (CRUD) ===== */
import { useEffect, useState } from 'react';
import { A, Drawer, Field, Toggle, AdminCtx } from './ui';
import type { AdminAccount, AdminRole } from './adminData';

type AccountDraft = AdminAccount & { password?: string };

const ROLES: { id: AdminRole; label: string; th: string; cls: string }[] = [
  { id: 'owner', label: 'Owner', th: 'เจ้าของระบบ', cls: 'badge-prem' },
  { id: 'admin', label: 'Administrator', th: 'ผู้ดูแลระบบ', cls: 'badge-ok' },
  { id: 'editor', label: 'Editor', th: 'แก้ไขเนื้อหา', cls: 'badge-info' },
  { id: 'viewer', label: 'Viewer', th: 'ดูอย่างเดียว', cls: 'badge-mut' },
];
const roleMeta = (r: AdminRole) => ROLES.find(x => x.id === r) || ROLES[3];

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function UsersPage({ showToast }: AdminCtx) {
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | AdminRole>('All');
  const [editing, setEditing] = useState<AdminAccount | 'new' | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((rows: AdminAccount[]) => setUsers(rows))
      .catch(err => { console.error('โหลดผู้ใช้จาก /api/users ไม่สำเร็จ:', err); showToast('โหลดรายชื่อผู้ใช้ไม่สำเร็จ'); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (q) {
      const hay = (u.name + ' ' + u.email).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const save = async (data: AccountDraft) => {
    const isNew = !data.id;
    try {
      const res = await fetch(isNew ? '/api/users' : '/api/users/' + data.id, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || ('HTTP ' + res.status));
      }
      const saved: AdminAccount = await res.json();
      setUsers(prev => isNew ? [...prev, saved] : prev.map(u => u.id === saved.id ? saved : u));
      showToast(isNew ? 'เพิ่มผู้ใช้ "' + saved.name + '" แล้ว' : 'บันทึก "' + saved.name + '" เรียบร้อย');
      setEditing(null);
    } catch (err) {
      console.error('บันทึกผู้ใช้ไม่สำเร็จ:', err);
      showToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };

  const remove = async (u: AdminAccount) => {
    try {
      const res = await fetch('/api/users/' + u.id, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showToast('ลบผู้ใช้ "' + u.name + '" แล้ว');
    } catch (err) {
      console.error('ลบผู้ใช้ไม่สำเร็จ:', err);
      showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };

  const toggleActive = async (u: AdminAccount) => {
    const next = { ...u, active: !u.active };
    setUsers(prev => prev.map(x => x.id === u.id ? next : x));   // optimistic
    try {
      const res = await fetch('/api/users/' + u.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (err) {
      console.error('สลับสถานะผู้ใช้ไม่สำเร็จ:', err);
      setUsers(prev => prev.map(x => x.id === u.id ? u : x));    // rollback
      showToast('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Settings · ผู้ใช้ระบบ</span>
          <h1>Users</h1>
          <p className="ph-sub">จัดการบัญชีผู้ดูแลที่เข้าสู่ระบบหลังบ้าน · {users.length} บัญชี</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-solid" onClick={() => setEditing('new')}>{A.plus()} เพิ่มผู้ใช้</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="tb-search" style={{ margin: 0, width: 280 }}>
          {A.search()}
          <input placeholder="ค้นหาชื่อ / อีเมล…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          <button className={roleFilter === 'All' ? 'on' : ''} onClick={() => setRoleFilter('All')}>All</button>
          {ROLES.map(r => (
            <button key={r.id} className={roleFilter === r.id ? 'on' : ''} onClick={() => setRoleFilter(r.id)}>{r.label}</button>
          ))}
        </div>
        <span className="count-note">{filtered.length} of {users.length}</span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rm = roleMeta(u.role);
              return (
                <tr key={u.id} onClick={() => setEditing(u)}>
                  <td>
                    <div className="col-name">
                      <span className="av av-sm">{u.initials || initialsFrom(u.name)}</span>
                      <div><div className="nm">{u.name}</div></div>
                    </div>
                  </td>
                  <td className="meta-sm">{u.email}</td>
                  <td><span className={'badge ' + rm.cls}>{u.role === 'owner' && A.star({ width: 11, height: 11 })}<span className="d" />{rm.label}</span></td>
                  <td>{u.active
                    ? <span className="badge badge-ok"><span className="d" />Active</span>
                    : <span className="badge badge-mut"><span className="d" />Disabled</span>}</td>
                  <td>
                    <div className="row-act" onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" title={u.active ? 'Disable' : 'Enable'} onClick={() => toggleActive(u)}>{A.eye()}</button>
                      <button className="icon-btn" title="Edit" onClick={() => setEditing(u)}>{A.edit()}</button>
                      <button className="icon-btn del" title="Delete" onClick={() => remove(u)}>{A.trash()}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5}><div className="empty"><div className="serif">No users found</div><p>{users.length ? 'ลองปรับคำค้นหรือตัวกรอง' : 'ยังไม่มีผู้ใช้ — เพิ่มบัญชีแรกได้เลย'}</p></div></td></tr>
            )}
            {loading && (
              <tr><td colSpan={5}><div className="empty"><p>กำลังโหลด…</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <UserEditor
            key={editing === 'new' ? 'new' : editing.id}
            user={editing === 'new' ? null : editing}
            onSave={save}
            onClose={() => setEditing(null)}
            onDelete={editing !== 'new' ? () => { remove(editing); setEditing(null); } : null}
          />
        )}
      </Drawer>
    </div>
  );
}

const BLANK: AdminAccount = { id: '', name: '', initials: '', email: '', role: 'viewer', active: true };

function UserEditor({ user, onSave, onClose, onDelete }: {
  user: AdminAccount | null;
  onSave: (d: AccountDraft) => void;
  onClose: () => void;
  onDelete: (() => void) | null;
}) {
  const [d, setD] = useState<AdminAccount>(() => user ? { ...user } : { ...BLANK });
  const [pw, setPw] = useState('');
  const set = <K extends keyof AdminAccount>(k: K, v: AdminAccount[K]) => setD(p => ({ ...p, [k]: v }));
  const isNew = !user;
  const initials = d.initials || initialsFrom(d.name);
  const pwOk = isNew ? pw.length >= 8 : (pw === '' || pw.length >= 8);
  const canSave = d.name.trim() !== '' && /\S+@\S+\.\S+/.test(d.email) && pwOk;
  const submit = () => onSave({ ...d, ...(pw ? { password: pw } : {}) });

  return (
    <>
      <div className="drawer-head">
        <div className="dh-l">
          <span className="av av-lg">{initials}</span>
          <div style={{ minWidth: 0 }}>
            <div className="dh-t">{d.name || (isNew ? 'New user' : 'Untitled')}</div>
            <div className="dh-s">{isNew ? 'Creating · viewer' : 'Editing · ' + roleMeta(d.role).label}</div>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>{A.x()}</button>
      </div>

      <div className="drawer-body">
        <div className="fsec">
          <div className="fsec-t">Account</div>
          <Field label="Full name" span2>
            <input className="inp" value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Nattapong S." />
          </Field>
          <div className="fld-grid c3">
            <Field label="Email" span2>
              <input className="inp" type="email" value={d.email} onChange={e => set('email', e.target.value)} placeholder="name@stoneclubthailand.com" />
            </Field>
            <Field label="Initials" thHint="ปล่อยว่างเพื่อสร้างอัตโนมัติ">
              <input className="inp" value={d.initials} maxLength={3} onChange={e => set('initials', e.target.value.toUpperCase())} placeholder={initialsFrom(d.name)} />
            </Field>
          </div>
        </div>

        <div className="fsec">
          <div className="fsec-t">Role · สิทธิ์การใช้งาน</div>
          <div className="hint" style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--thai)', marginBottom: 13, lineHeight: 1.6 }}>
            กำหนดระดับสิทธิ์ของผู้ใช้ในระบบหลังบ้าน
          </div>
          <div className="status-pick">
            {ROLES.map(r => (
              <button key={r.id} className={'chip' + (d.role === r.id ? ' on' : '')} onClick={() => set('role', r.id)}>
                {d.role === r.id && A.check({ width: 12, height: 12 })}{r.label} · {r.th}
              </button>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="fsec-t">Password · รหัสผ่าน</div>
          <Field label={isNew ? 'Password' : 'New password'} thHint={isNew ? 'อย่างน้อย 8 ตัวอักษร' : 'เว้นว่างไว้หากไม่ต้องการเปลี่ยน'} span2>
            <input className="inp" type="password" value={pw} autoComplete="new-password"
              onChange={e => setPw(e.target.value)}
              placeholder={isNew ? 'ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ…' : '••••••••'} />
          </Field>
          {pw !== '' && pw.length < 8 && <div className="hint" style={{ fontSize: 12, color: 'var(--danger, #9a2b2b)', fontFamily: 'var(--thai)' }}>รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร</div>}
        </div>

        <div className="fsec">
          <div className="fsec-t">Access</div>
          <Field label="Status" span2>
            <Toggle on={d.active} onChange={v => set('active', v)} label={d.active ? 'Active · เข้าสู่ระบบได้' : 'Disabled · ถูกระงับการเข้าใช้'} />
          </Field>
        </div>
      </div>

      <div className="drawer-foot">
        {onDelete && <button className="btn btn-danger" onClick={onDelete}>{A.trash()} ลบ</button>}
        <div className="spacer" />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-solid" disabled={!canSave} style={{ opacity: canSave ? 1 : .5 }} onClick={submit}>{A.save()} {isNew ? 'สร้างและบันทึก' : 'บันทึกการแก้ไข'}</button>
      </div>
    </>
  );
}
