'use client';

/* ===== STONECLUB ADMIN — Stock Clearance: front-page settings + live preview =====
   Settings (hero/section/cta + display options) are edited locally and saved with
   the top "บันทึก" button → PUT /api/clearance. Items persist immediately on every
   create / edit / delete / show-hide / reorder via /api/clearance(/:id). */
import { useEffect, useRef, useState } from 'react';
import {
  BADGE_COLORS,
  BADGE_LABELS,
  type BadgeType,
  type ClearanceConfig,
  type ClearanceItem,
  type ClearanceSettings,
  DEFAULT_CLEARANCE_CONFIG,
  DEFAULT_CLEARANCE_SETTINGS,
} from '@/data/clearance';
import { A, Drawer, Field, Toggle, AdminCtx, onImgError } from './ui';

const BADGES: BadgeType[] = ['limited', 'clearance', 'last'];

export default function ClearancePage({ showToast }: AdminCtx) {
  const [config, setConfig] = useState<ClearanceConfig>(DEFAULT_CLEARANCE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);          // settings have unsaved edits
  const [savingSettings, setSavingSettings] = useState(false);
  const [editing, setEditing] = useState<ClearanceItem | 'new' | null>(null);

  const { settings, items } = config;
  const visible = items.filter(i => !i.hidden).length;

  // Load the live config from the DB on mount.
  useEffect(() => {
    let ignore = false;
    fetch('/api/clearance')
      .then(r => (r.ok ? r.json() : null))
      .then((data: ClearanceConfig | null) => { if (!ignore && data) setConfig(data); })
      .catch(() => { if (!ignore) showToast('โหลดข้อมูล Clearance ไม่สำเร็จ — ลองใหม่อีกครั้ง'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- settings mutators (local until "บันทึก") ---- */
  const patch = (p: Partial<ClearanceSettings>) => { setConfig(c => ({ ...c, settings: { ...c.settings, ...p } })); setDirty(true); };
  const setHero = (k: keyof ClearanceSettings['hero'], v: string) => patch({ hero: { ...settings.hero, [k]: v } });
  const setSection = (k: keyof ClearanceSettings['section'], v: string) => patch({ section: { ...settings.section, [k]: v } });
  const setCta = (k: keyof ClearanceSettings['cta'], v: string) => patch({ cta: { ...settings.cta, [k]: v } });

  const saveSettings = async () => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/clearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      const saved: ClearanceSettings = await res.json();
      setConfig(c => ({ ...c, settings: saved }));
      setDirty(false);
      showToast('บันทึกการตั้งค่าหน้า Clearance แล้ว · เปิดหน้าเว็บเพื่อดูผล');
    } catch {
      showToast('บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง');
    } finally {
      setSavingSettings(false);
    }
  };
  const reset = () => { setConfig(c => ({ ...c, settings: JSON.parse(JSON.stringify(DEFAULT_CLEARANCE_SETTINGS)) })); setDirty(true); showToast('คืนค่าเริ่มต้นแล้ว — กด “บันทึก” เพื่อยืนยัน'); };

  /* ---- item ops (persist immediately) ---- */
  const setItems = (next: ClearanceItem[]) => setConfig(c => ({ ...c, items: next }));

  const saveItem = async (data: ClearanceItem) => {
    const isUpdate = !!data.id && items.some(i => i.id === data.id);
    try {
      const res = await fetch(isUpdate ? `/api/clearance/${data.id}` : '/api/clearance', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || 'บันทึกไม่สำเร็จ');
      }
      const saved: ClearanceItem = await res.json();
      if (isUpdate) {
        setItems(items.map(i => i.id === saved.id ? saved : i));
        showToast('บันทึก "' + saved.name + '" แล้ว');
      } else {
        setItems([...items, saved]);
        showToast('เพิ่ม "' + saved.name + '" แล้ว');
      }
      setEditing(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const removeItem = async (it: ClearanceItem) => {
    const prev = items;
    setItems(items.filter(i => i.id !== it.id));   // optimistic
    try {
      const res = await fetch(`/api/clearance/${it.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('ลบ "' + it.name + '" แล้ว');
    } catch {
      setItems(prev);
      showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };

  const toggleHidden = async (it: ClearanceItem) => {
    const next = !it.hidden;
    const prev = items;
    setItems(items.map(i => i.id === it.id ? { ...i, hidden: next } : i));   // optimistic
    try {
      const res = await fetch(`/api/clearance/${it.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      showToast('อัปเดตการแสดงผลไม่สำเร็จ');
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);   // optimistic
    try {
      const res = await fetch('/api/clearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.map(i => i.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      showToast('จัดลำดับไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · หน้าโปรโมชั่น</span>
          <h1>Stock <span className="it">Clearance</span></h1>
          <p className="ph-sub">ปรับแต่งหน้า Clearance บนเว็บไซต์ — หัวข้อ รายการหิน และลูกเล่นการแสดงผล · {visible}/{items.length} รายการแสดงอยู่</p>
        </div>
        <div className="ph-actions">
          <button className="btn" onClick={() => window.open('/clearance', '_blank')}>{A.ext()} ดูหน้าจริง</button>
          <button className="btn btn-solid" onClick={saveSettings} disabled={!dirty || savingSettings} style={{ opacity: dirty && !savingSettings ? 1 : .5 }}>{A.save()} {savingSettings ? 'กำลังบันทึก…' : `บันทึก${dirty ? ' *' : ''}`}</button>
        </div>
      </div>

      <div className="clr-admin">
        {/* ============ EDITOR COLUMN ============ */}
        <div className="clr-edit-col">
          {/* display options */}
          <div className="card card-pad">
            <div className="fsec-t">การแสดงผล · Display</div>
            <div className="clr-opt-row">
              <div>
                <div className="clr-opt-t">แสดงหน้านี้บนเว็บไซต์</div>
                <div className="clr-opt-s">ปิดเพื่อซ่อนหน้าและลิงก์ Clearance ออกจากเมนู</div>
              </div>
              <Toggle on={settings.enabled} onChange={v => patch({ enabled: v })} label={settings.enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'} />
            </div>
            <div className="clr-opt-row">
              <div>
                <div className="clr-opt-t">ป้าย “Enquire Now” ตอนชี้เมาส์</div>
                <div className="clr-opt-s">แถบเชิญชวนที่เลื่อนขึ้นมาเมื่อชี้ที่การ์ด</div>
              </div>
              <Toggle on={settings.showEnquireHover} onChange={v => patch({ showEnquireHover: v })} label={settings.showEnquireHover ? 'แสดง' : 'ซ่อน'} />
            </div>
            <div className="clr-opt-row">
              <div>
                <div className="clr-opt-t">จำนวนคอลัมน์ (จอใหญ่)</div>
                <div className="clr-opt-s">ความหนาแน่นของกริดรายการหิน</div>
              </div>
              <div className="seg">
                {[2, 3, 4].map(n => (
                  <button key={n} className={settings.columns === n ? 'on' : ''} onClick={() => patch({ columns: n as 2 | 3 | 4 })}>{n}</button>
                ))}
              </div>
            </div>
            <Field label="ป้ายชื่อในเมนู · Nav label">
              <input className="inp" value={settings.navLabel} onChange={e => patch({ navLabel: e.target.value })} />
            </Field>
          </div>

          {/* hero */}
          <div className="card card-pad">
            <div className="fsec-t">ส่วนหัว · Hero</div>
            <Field label="Kicker"><input className="inp" value={settings.hero.kicker} onChange={e => setHero('kicker', e.target.value)} /></Field>
            <div className="fld-grid">
              <Field label="Title — line 1"><input className="inp" value={settings.hero.titleTop} onChange={e => setHero('titleTop', e.target.value)} /></Field>
              <Field label="Title — italic line"><input className="inp" value={settings.hero.titleIt} onChange={e => setHero('titleIt', e.target.value)} /></Field>
            </div>
            <Field label="Subtitle"><textarea className="txa en" value={settings.hero.sub} onChange={e => setHero('sub', e.target.value)} /></Field>
            <Field label="Note line"><input className="inp" value={settings.hero.note} onChange={e => setHero('note', e.target.value)} placeholder="เว้นว่างเพื่อซ่อน" /></Field>
            <Field label="Background image"><input className="inp" value={settings.hero.img} onChange={e => setHero('img', e.target.value)} style={{ fontSize: 12 }} /></Field>
          </div>

          {/* section heading */}
          <div className="card card-pad">
            <div className="fsec-t">หัวข้อรายการ · Section heading</div>
            <div className="fld-grid">
              <Field label="Eyebrow label"><input className="inp" value={settings.section.label} onChange={e => setSection('label', e.target.value)} /></Field>
              <Field label="Heading"><input className="inp" value={settings.section.title} onChange={e => setSection('title', e.target.value)} /></Field>
            </div>
          </div>

          {/* items */}
          <div className="card card-pad">
            <div className="clr-items-head">
              <div className="fsec-t" style={{ margin: 0 }}>รายการหิน · Items ({items.length})</div>
              <button className="btn btn-sm btn-solid" onClick={() => setEditing('new')}>{A.plus()} เพิ่มรายการ</button>
            </div>
            <div className="clr-item-list">
              {items.map((it, i) => (
                <div className={'clr-item-row' + (it.hidden ? ' off' : '')} key={it.id}>
                  <div className="clr-reorder">
                    <button className="icon-btn" disabled={i === 0} title="เลื่อนขึ้น" onClick={() => move(i, -1)} style={{ transform: 'rotate(-90deg)' }}>{A.chevR({ width: 15, height: 15 })}</button>
                    <button className="icon-btn" disabled={i === items.length - 1} title="เลื่อนลง" onClick={() => move(i, 1)} style={{ transform: 'rotate(90deg)' }}>{A.chevR({ width: 15, height: 15 })}</button>
                  </div>
                  <img className="clr-item-img" src={it.img} alt="" onError={onImgError} />
                  <div className="clr-item-meta">
                    <div className="clr-item-name">{it.name}</div>
                    <div className="clr-item-sub">
                      {it.material}
                      <span className="clr-badge-dot" style={{ background: BADGE_COLORS[it.badge] }} />
                      {BADGE_LABELS[it.badge]}
                    </div>
                  </div>
                  <div className="row-act">
                    <button className="icon-btn" title={it.hidden ? 'แสดง' : 'ซ่อน'} onClick={() => toggleHidden(it)}>{A.eye()}</button>
                    <button className="icon-btn" title="แก้ไข" onClick={() => setEditing(it)}>{A.edit()}</button>
                    <button className="icon-btn del" title="ลบ" onClick={() => removeItem(it)}>{A.trash()}</button>
                  </div>
                </div>
              ))}
              {loading && items.length === 0 && <div className="empty"><p>กำลังโหลด…</p></div>}
              {!loading && items.length === 0 && <div className="empty"><div className="serif">ยังไม่มีรายการ</div><p>กด “เพิ่มรายการ” เพื่อเริ่ม</p></div>}
            </div>
          </div>

          {/* CTA */}
          <div className="card card-pad">
            <div className="fsec-t">ส่วนปิดท้าย · Call to action</div>
            <Field label="Eyebrow label"><input className="inp" value={settings.cta.label} onChange={e => setCta('label', e.target.value)} /></Field>
            <Field label="Heading"><textarea className="txa en" value={settings.cta.title} onChange={e => setCta('title', e.target.value)} style={{ minHeight: 64 }} /></Field>
            <Field label="Body"><textarea className="txa en" value={settings.cta.body} onChange={e => setCta('body', e.target.value)} /></Field>
            <div className="fld-grid">
              <Field label="Primary button"><input className="inp" value={settings.cta.primary} onChange={e => setCta('primary', e.target.value)} /></Field>
              <Field label="Secondary button"><input className="inp" value={settings.cta.secondary} onChange={e => setCta('secondary', e.target.value)} /></Field>
            </div>
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 6 }} onClick={reset}>{A.arrowL()} คืนค่าเริ่มต้นทั้งหมด</button>
          </div>
        </div>

        {/* ============ LIVE PREVIEW COLUMN ============ */}
        <div className="clr-preview-col">
          <div className="clr-pv-bar">
            <span className="clr-pv-dot" /> Live preview
            <span className="clr-pv-hint">{settings.enabled ? 'อัปเดตตามที่แก้ไขทันที' : 'หน้านี้ถูกปิดอยู่'}</span>
          </div>
          <Preview settings={settings} items={items.filter(i => !i.hidden)} />
        </div>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <ItemEditor
            key={editing === 'new' ? 'new' : editing.id}
            item={editing === 'new' ? null : editing}
            onSave={saveItem}
            onClose={() => setEditing(null)}
            onDelete={editing !== 'new' ? () => { removeItem(editing); setEditing(null); } : null}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ---------------- LIVE PREVIEW ---------------- */
function Preview({ settings, items }: { settings: ClearanceSettings; items: ClearanceItem[] }) {
  const { hero, section, cta } = settings;
  if (!settings.enabled) {
    return (
      <div className="clr-pv-frame">
        <div className="clr-pv-empty">
          <div className="serif">หน้านี้ถูกปิดอยู่</div>
          <p>ผู้เข้าชมจะไม่เห็นหน้า Clearance และลิงก์จะถูกซ่อนจากเมนู</p>
        </div>
      </div>
    );
  }
  return (
    <div className="clr-pv-frame">
      <div className="clr-pv-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(20,18,14,.25), rgba(20,18,14,.78)), url(${hero.img})` }}>
        <span className="clr-pv-kicker">{hero.kicker}</span>
        <div className="clr-pv-title">{hero.titleTop} <em>{hero.titleIt}</em></div>
        <p className="clr-pv-sub">{hero.sub}</p>
        {hero.note && <p className="clr-pv-note">{hero.note}</p>}
      </div>
      <div className="clr-pv-body">
        <div className="clr-pv-sechead">
          <span className="clr-pv-eyebrow">{section.label}</span>
          <h4>{section.title}</h4>
        </div>
        <div className="clr-pv-grid" style={{ gridTemplateColumns: `repeat(${settings.columns}, 1fr)` }}>
          {items.map(it => (
            <div className="clr-pv-card" key={it.id}>
              <div className="clr-pv-imgwrap">
                <img src={it.img} alt="" onError={onImgError} />
                <span className="clr-pv-badge" style={{ background: BADGE_COLORS[it.badge] }}>{BADGE_LABELS[it.badge]}</span>
                {settings.showEnquireHover && <span className="clr-pv-enquire">Enquire Now</span>}
              </div>
              <div className="clr-pv-mat">{it.material}</div>
              <div className="clr-pv-name">{it.name}</div>
            </div>
          ))}
          {items.length === 0 && <div className="clr-pv-noitems">ไม่มีรายการที่แสดงอยู่</div>}
        </div>
        <div className="clr-pv-cta">
          <span className="clr-pv-eyebrow">{cta.label}</span>
          <h5>{cta.title}</h5>
          <p>{cta.body}</p>
          <div className="clr-pv-btns">
            <span className="clr-pv-btn solid">{cta.primary}</span>
            <span className="clr-pv-btn">{cta.secondary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ITEM EDITOR (drawer) ---------------- */
const BLANK_ITEM: ClearanceItem = { id: '', name: '', material: '', img: '/photos/blankimg.jpg', badge: 'clearance', hidden: false };

function ItemEditor({ item, onSave, onClose, onDelete }: {
  item: ClearanceItem | null;
  onSave: (d: ClearanceItem) => void;
  onClose: () => void;
  onDelete: (() => void) | null;
}) {
  const [d, setD] = useState<ClearanceItem>(() => item ? { ...item } : { ...BLANK_ITEM });
  const set = <K extends keyof ClearanceItem>(k: K, v: ClearanceItem[K]) => setD(p => ({ ...p, [k]: v }));
  const isNew = !item;

  // image upload → POST /api/upload, then store the returned path in `img`
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';                 // allow re-picking the same file
    if (!file) return;
    setUploadErr(null); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || 'อัปโหลดไม่สำเร็จ');
      }
      const { url } = await res.json();
      set('img', url);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="drawer-head">
        <div className="dh-l">
          <img className="dh-img" src={d.img} alt="" onError={onImgError} />
          <div style={{ minWidth: 0 }}>
            <div className="dh-t">{d.name || (isNew ? 'New item' : 'Untitled')}</div>
            <div className="dh-s">{isNew ? 'Creating · clearance item' : 'Editing · ' + d.id}</div>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>{A.x()}</button>
      </div>

      <div className="drawer-body">
        <div className="fsec">
          <div className="fsec-t">Details</div>
          <Field label="Name" span2><input className="inp" value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Calacatta Oro Marble" /></Field>
          <Field label="Material" span2><input className="inp" value={d.material} onChange={e => set('material', e.target.value)} placeholder="e.g. Marble" /></Field>
        </div>

        <div className="fsec">
          <div className="fsec-t">Badge</div>
          <div className="status-pick">
            {BADGES.map(b => (
              <button key={b} className={'chip' + (d.badge === b ? ' on' : '')} onClick={() => set('badge', b)}>
                <span className="clr-badge-dot" style={{ background: BADGE_COLORS[b] }} />{BADGE_LABELS[b]}
              </button>
            ))}
          </div>
        </div>

        <div className="fsec">
          <div className="fsec-t">Image</div>
          <div className="img-edit">
            <img className="iv" src={d.img} alt="" onError={onImgError} />
            <div className="ie-r">
              <div className="hint">รูปแผ่นหินที่แสดงในกริด · แนะนำสัดส่วน 4:3</div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
                <button className="btn btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>{A.upload()} {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}</button>
                <button className="btn btn-sm btn-ghost" disabled>เลือกจากคลัง</button>
              </div>
              {uploadErr && <div className="login-err thai" style={{ margin: '0 0 9px' }}>{uploadErr}</div>}
              <input className="inp" value={d.img} onChange={e => set('img', e.target.value)} style={{ fontSize: 12 }} />
            </div>
          </div>
        </div>

        <div className="fsec">
          <div className="fsec-t">Visibility</div>
          <Toggle on={!d.hidden} onChange={v => set('hidden', !v)} label={d.hidden ? 'ซ่อนอยู่ — ไม่แสดงบนเว็บ' : 'แสดงบนเว็บ'} />
        </div>
      </div>

      <div className="drawer-foot">
        {onDelete && <button className="btn btn-danger" onClick={onDelete}>{A.trash()} ลบ</button>}
        <div className="spacer" />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-solid" onClick={() => onSave(d)} disabled={!d.name.trim()} style={{ opacity: d.name.trim() ? 1 : .5 }}>{A.save()} {isNew ? 'เพิ่มรายการ' : 'บันทึก'}</button>
      </div>
    </>
  );
}
