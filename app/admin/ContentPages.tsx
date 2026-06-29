'use client';

/* ===== STONECLUB ADMIN — Pages content, Media library, Filters ===== */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { A, Drawer, Field, AdminCtx, onImgError } from './ui';
import { PAGES, PageContent } from './adminData';

/* ---------------- PAGES (editable content blocks) ---------------- */
export function PagesPage({ showToast }: AdminCtx) {
  const [active, setActive] = useState('home');
  // Seed from the static PAGES so the UI renders instantly, then replace
  // with live data from the DB once /api/pages responds.
  const [data, setData] = useState<Record<string, PageContent>>(() => JSON.parse(JSON.stringify(PAGES)));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getDataAll();
  }, []);

  const getDataAll = () => {
    fetch('/api/pages')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((pages: Record<string, PageContent>) => {
        if (pages && Object.keys(pages).length) setData(pages);
      })
      .catch(err => console.error('โหลดเนื้อหาหน้าจาก /api/pages ไม่สำเร็จ:', err));
  };
  const page = data[active];

  const set = (key: string, val: string) => {
    setData(p => ({ ...p, [active]: { ...p[active], fields: p[active].fields.map(f => f.key === key ? { ...f, value: val } : f) } }));
    setDirty(true);
  };
  const save = async () => {
    try {
      const res = await fetch('/api/pages/' + active, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: page.label, fields: page.fields }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setDirty(false);
      showToast('บันทึกเนื้อหาหน้า "' + page.label.split(' / ')[0] + '" แล้ว');
    } catch (err) {
      console.error('บันทึก /api/pages/' + active + ' ไม่สำเร็จ:', err);
      showToast('บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };

  const TABS = Object.entries(data).map(([k, v]) => ({ id: k, label: v.label }));

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · เนื้อหาหน้าเว็บ</span>
          <h1>Pages</h1>
          <p className="ph-sub">แก้ไขข้อความและตัวเลขที่แสดงบนหน้าเว็บไซต์โดยตรง</p>
        </div>
        <div className="ph-actions">
          <button className="btn" onClick={() => window.open('/', '_blank')}>{A.ext()} ดูตัวอย่าง</button>
          <button className="btn btn-solid" onClick={save} disabled={!dirty} style={{ opacity: dirty ? 1 : .5 }}>{A.save()} บันทึก{dirty ? ' *' : ''}</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          {TABS.map(t => (
            <button key={t.id} className={active === t.id ? 'on' : ''} onClick={() => setActive(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: 720 }}>
        {page.fields.map(f => (
          <Field key={f.key} label={f.label} span2>
            {f.type === 'textarea'
              ? <textarea className={'txa' + (/[A-Za-z]/.test(f.value) && !/[ก-๙]/.test(f.value) ? ' en' : '')} value={f.value} onChange={e => set(f.key, e.target.value)} />
              : <input className={'inp' + (/[ก-๙]/.test(f.value) ? ' thai' : '')} value={f.value} onChange={e => set(f.key, e.target.value)} />}
          </Field>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MEDIA LIBRARY ---------------- */
export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  alt: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

// Human-readable byte size for the tile caption.
function fmtBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

export function MediaPage({ showToast }: AdminCtx) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/media')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows: MediaAsset[]) => { if (Array.isArray(rows)) setAssets(rows); })
      .catch(() => showToast('โหลดคลังรูปภาพไม่สำเร็จ — ลองใหม่อีกครั้ง'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload real files → /api/upload (which records the MediaAsset), then refetch.
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || uploading) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error();
        ok++;
      } catch { fail++; }
    }
    setUploading(false);
    load();
    if (ok) showToast(`อัปโหลด ${ok} ไฟล์สำเร็จ` + (fail ? ` · ล้มเหลว ${fail}` : ''));
    else if (fail) showToast('อัปโหลดไม่สำเร็จ — รองรับเฉพาะรูปภาพ ≤ 8MB');
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(e.target.files);
    e.target.value = '';   // allow re-picking the same file
  };

  const copyPath = async (url: string) => {
    try { await navigator.clipboard.writeText(url); showToast('คัดลอกพาธแล้ว: ' + url); }
    catch { showToast('คัดลอกไม่สำเร็จ — พาธ: ' + url); }
  };

  const saveMeta = async (data: MediaAsset) => {
    try {
      const res = await fetch('/api/media/' + data.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: data.filename, alt: data.alt }),
      });
      if (!res.ok) throw new Error();
      const saved: MediaAsset = await res.json();
      setAssets(a => a.map(m => m.id === saved.id ? saved : m));
      showToast('บันทึกข้อมูลรูปแล้ว');
      setEditing(null);
    } catch { showToast('บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  const remove = async (m: MediaAsset) => {
    const prev = assets;
    setAssets(assets.filter(x => x.id !== m.id));   // optimistic
    try {
      const res = await fetch('/api/media/' + m.id, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('ลบ "' + (m.filename || m.url) + '" แล้ว');
    } catch { setAssets(prev); showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · คลังรูปภาพ</span>
          <h1>Media library</h1>
          <p className="ph-sub">รูปภาพทั้งหมดที่อัปโหลดเข้าระบบ · {loading ? 'กำลังโหลด…' : `${assets.length} ไฟล์`}</p>
        </div>
        <div className="ph-actions">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
          <button className="btn btn-solid" disabled={uploading} onClick={() => fileRef.current?.click()}>{A.upload()} {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}</button>
        </div>
      </div>
      <div className="media-grid">
        <div className="media-up" onClick={() => !uploading && fileRef.current?.click()}>
          {A.upload()}
          <span className="mu-t">{uploading ? 'กำลังอัปโหลด…' : 'เลือกไฟล์เพื่ออัปโหลด'}</span>
        </div>
        {loading && Array.from({ length: 8 }).map((_, i) => <MediaSkeleton key={'sk' + i} />)}
        {!loading && assets.map(m => (
          <MediaTile key={m.id} m={m} onCopy={copyPath} onEdit={setEditing} onRemove={remove} />
        ))}
        {!loading && assets.length === 0 && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <div className="serif">ยังไม่มีรูปในคลัง</div>
            <p>กด “อัปโหลด” เพื่อเพิ่มรูปภาพแรก</p>
          </div>
        )}
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <MediaEditor
            key={editing.id}
            asset={editing}
            onSave={saveMeta}
            onClose={() => setEditing(null)}
            onDelete={() => { remove(editing); setEditing(null); }}
          />
        )}
      </Drawer>
    </div>
  );
}

// One library tile. Tracks its own image-load state so each photo fades in over
// a shimmer skeleton, and lazy-loads so off-screen images don't decode up front.
function MediaTile({ m, onCopy, onEdit, onRemove }: {
  m: MediaAsset;
  onCopy: (url: string) => void;
  onEdit: (m: MediaAsset) => void;
  onRemove: (m: MediaAsset) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState(m.url);
  return (
    <div className="media-tile">
      <div className={'mt-img' + (loaded ? '' : ' skel')} onClick={() => onCopy(m.url)} title="คลิกเพื่อคัดลอกพาธ">
        {/* User-uploaded files are served straight from public/uploads, so we skip
            the next/image optimizer (`unoptimized`): on a self-hosted box the
            optimizer can't reliably fetch a just-written file and returns 400. We
            still get lazy-loading and the fade-in skeleton. */}
        <Image
          src={src}
          alt={m.alt}
          fill
          unoptimized
          sizes="(max-width:640px) 50vw, (max-width:1100px) 33vw, 22vw"
          className={loaded ? 'on' : ''}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(true); if (src !== '/photos/blankimg.jpg') setSrc('/photos/blankimg.jpg'); }}
        />
        <div className="mt-act" onClick={e => e.stopPropagation()}>
          <button className="icon-btn" title="คัดลอกพาธ" onClick={() => onCopy(m.url)}>{A.copy()}</button>
          <button className="icon-btn" title="แก้ไขข้อมูล" onClick={() => onEdit(m)}>{A.edit()}</button>
          <button className="icon-btn del" title="ลบ" onClick={() => onRemove(m)}>{A.trash()}</button>
        </div>
      </div>
      <div className="mt-meta">
        <div className="mt-name">{m.filename || m.url.split('/').pop()}</div>
        <div className="mt-dim">{fmtBytes(m.bytes) || (m.alt ? m.alt : 'รูปภาพ')}</div>
      </div>
    </div>
  );
}

// Placeholder tile shown while the library list is being fetched.
function MediaSkeleton() {
  return (
    <div className="media-tile">
      <div className="mt-img skel" />
      <div className="mt-meta">
        <div className="skel-line" />
        <div className="skel-line sm" />
      </div>
    </div>
  );
}

function MediaEditor({ asset, onSave, onClose, onDelete }: {
  asset: MediaAsset;
  onSave: (d: MediaAsset) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [d, setD] = useState<MediaAsset>(() => ({ ...asset }));
  return (
    <>
      <div className="drawer-head">
        <div className="dh-l">
          <img className="dh-img" src={d.url} alt="" onError={onImgError} />
          <div style={{ minWidth: 0 }}>
            <div className="dh-t">{d.filename || 'Untitled'}</div>
            <div className="dh-s">{fmtBytes(d.bytes) || 'รูปภาพ'}</div>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>{A.x()}</button>
      </div>

      <div className="drawer-body">
        <div className="fsec">
          <div className="fsec-t">Details</div>
          <Field label="File name" span2><input className="inp" value={d.filename} onChange={e => setD(p => ({ ...p, filename: e.target.value }))} placeholder="e.g. bianco-carrara.jpg" /></Field>
          <Field label="Alt text" thHint="คำอธิบายรูปสำหรับ SEO / การเข้าถึง" span2><input className="inp" value={d.alt} onChange={e => setD(p => ({ ...p, alt: e.target.value }))} placeholder="คำอธิบายสั้น ๆ ของรูป" /></Field>
        </div>
        <div className="fsec">
          <div className="fsec-t">Path</div>
          <Field label="Public URL" span2><input className="inp" value={d.url} readOnly style={{ fontSize: 12, opacity: .8 }} /></Field>
        </div>
      </div>

      <div className="drawer-foot">
        <button className="btn btn-danger" onClick={onDelete}>{A.trash()} ลบ</button>
        <div className="spacer" />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-solid" onClick={() => onSave(d)}>{A.save()} บันทึก</button>
      </div>
    </>
  );
}

/* ---------------- FILTERS / FACETS ---------------- */
// One lookup option as the API returns it. `facets` in the shared context stays
// a names-only map (the Stone editor selects consume that); this page keeps the
// id-bearing list it needs for rename/delete and mirrors names back to context.
interface LookupOption { id: number; name: string; }
type FacetItems = Record<string, LookupOption[]>;

const FACET_GROUPS = [
  { key: 'Material', th: 'วัสดุ' }, { key: 'Origin', th: 'แหล่งที่มา' },
  { key: 'Finish', th: 'ผิวสัมผัส' }, { key: 'Color', th: 'สี' },
];

export function FacetsPage({ setFacets, stones, showToast }: AdminCtx) {
  const [items, setItems] = useState<FacetItems>({ Material: [], Origin: [], Finish: [], Color: [] });
  const [loading, setLoading] = useState(true);

  // Push the names-only view to the shared context so the Stone editor's
  // material/origin/finish/colour selects reflect edits made here.
  const apply = (next: FacetItems) => {
    setItems(next);
    setFacets({
      Material: next.Material.map(o => o.name),
      Origin: next.Origin.map(o => o.name),
      Finish: next.Finish.map(o => o.name),
      Color: next.Color.map(o => o.name),
    });
  };

  useEffect(() => {
    fetch('/api/facets')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: FacetItems) => apply(data))
      .catch(() => showToast('โหลดตัวกรองไม่สำเร็จ — ลองใหม่อีกครั้ง'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const usage = (group: string, val: string) => stones.filter(s => {
    const key = group === 'Color' ? 'color' : group.toLowerCase();
    return (s as unknown as Record<string, unknown>)[key] === val;
  }).length;

  const add = async (group: string, val: string) => {
    val = val.trim();
    if (!val) return;
    if (items[group].some(o => o.name.toLowerCase() === val.toLowerCase())) { showToast('มี "' + val + '" อยู่แล้ว'); return; }
    try {
      const res = await fetch('/api/facets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, name: val }) });
      if (!res.ok) throw new Error();
      const opt: LookupOption = await res.json();
      apply({ ...items, [group]: [...items[group], opt] });
      showToast('เพิ่ม "' + opt.name + '" ใน ' + group);
    } catch { showToast('เพิ่มไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  const rename = async (group: string, id: number, name: string) => {
    name = name.trim();
    if (!name) return;
    const prev = items;
    apply({ ...items, [group]: items[group].map(o => o.id === id ? { ...o, name } : o) }); // optimistic
    try {
      const res = await fetch('/api/facets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, id, name }) });
      if (!res.ok) throw new Error();
      showToast('เปลี่ยนชื่อเป็น "' + name + '" แล้ว');
    } catch { apply(prev); showToast('เปลี่ยนชื่อไม่สำเร็จ — อาจมีชื่อซ้ำ'); }
  };

  const remove = async (group: string, id: number, name: string) => {
    const prev = items;
    apply({ ...items, [group]: items[group].filter(o => o.id !== id) }); // optimistic
    try {
      const res = await fetch('/api/facets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group, id }) });
      if (!res.ok) throw new Error();
      showToast('ลบ "' + name + '" แล้ว');
    } catch { apply(prev); showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · ตัวกรอง</span>
          <h1>Filters</h1>
          <p className="ph-sub">จัดการตัวเลือกตัวกรองในหน้า Collection (Material / Origin / Finish / Colour){loading ? ' · กำลังโหลด…' : ''}</p>
        </div>
      </div>
      <div className="facet-cols">
        {FACET_GROUPS.map(g => (
          <FacetCard key={g.key} group={g.key} th={g.th} values={items[g.key]}
            usage={v => usage(g.key, v)}
            onAdd={v => add(g.key, v)}
            onRename={(id, v) => rename(g.key, id, v)}
            onRemove={(id, name) => remove(g.key, id, name)} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- TAGS (master keyword vocabulary) ---------------- */
export function TagsPage({ setTagOptions, stones, showToast }: AdminCtx) {
  const [items, setItems] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [val, setVal] = useState('');

  // Mirror names back to the shared context so the Stone editor's tag picker
  // sees the same master vocabulary.
  const apply = (next: LookupOption[]) => { setItems(next); setTagOptions(next.map(t => t.name)); };

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: LookupOption[]) => apply(data))
      .catch(() => showToast('โหลดคีย์เวิร์ดไม่สำเร็จ — ลองใหม่อีกครั้ง'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const usage = (tag: string) => stones.filter(s => s.tags.includes(tag)).length;

  const add = async () => {
    const v = val.trim();
    if (!v) return;
    if (items.some(t => t.name.toLowerCase() === v.toLowerCase())) { showToast('มี "' + v + '" อยู่แล้ว'); setVal(''); return; }
    try {
      const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: v }) });
      if (!res.ok) throw new Error();
      const t: LookupOption = await res.json();
      apply([...items, t]);
      showToast('เพิ่มคีย์เวิร์ด "' + t.name + '"');
      setVal('');
    } catch { showToast('เพิ่มไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  const rename = async (id: number, name: string) => {
    name = name.trim();
    if (!name) return;
    const prev = items;
    apply(items.map(t => t.id === id ? { ...t, name } : t)); // optimistic
    try {
      const res = await fetch('/api/tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name }) });
      if (!res.ok) throw new Error();
      showToast('เปลี่ยนชื่อเป็น "' + name + '" แล้ว');
    } catch { apply(prev); showToast('เปลี่ยนชื่อไม่สำเร็จ — อาจมีชื่อซ้ำ'); }
  };

  const remove = async (id: number, name: string) => {
    const prev = items;
    apply(items.filter(t => t.id !== id)); // optimistic
    try {
      const res = await fetch('/api/tags', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error();
      showToast('ลบ "' + name + '" แล้ว');
    } catch { apply(prev); showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง'); }
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · คีย์เวิร์ด</span>
          <h1>Tags</h1>
          <p className="ph-sub">คลังคีย์เวิร์ดกลางสำหรับติดให้หินแต่ละก้อน · ใช้เป็นตัวกรองในหน้า Collection · {loading ? 'กำลังโหลด…' : items.length + ' คีย์เวิร์ด'}</p>
        </div>
      </div>

      <div className="facet-card" style={{ maxWidth: 720 }}>
        <h4>Keyword library</h4>
        <div className="fc-sub thai" style={{ textTransform: 'none', letterSpacing: '.04em' }}>เพิ่ม / แก้ไข / ลบคีย์เวิร์ด · ตัวเลขคือจำนวนหินที่ใช้อยู่</div>
        <div className="facet-chips">
          {items.map(t => (
            <EditableChip key={t.id} name={t.name} count={usage(t.name)} onRename={n => rename(t.id, n)} onRemove={() => remove(t.id, t.name)} />
          ))}
          {!loading && items.length === 0 && <span className="thai" style={{ color: 'var(--muted)', fontSize: 13 }}>ยังไม่มีคีย์เวิร์ด — เพิ่มด้านล่าง</span>}
        </div>
        <div className="facet-add">
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="เพิ่มคีย์เวิร์ดใหม่…" />
          <button className="btn btn-sm btn-solid" onClick={add}>{A.plus()} เพิ่ม</button>
        </div>
      </div>
    </div>
  );
}

// A chip whose name is click-to-edit inline (rename), with a trailing delete
// button. Shared by the Filters facet cards and the Tags keyword library.
function EditableChip({ name, count, onRename, onRemove }: {
  name: string;
  count: number;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  useEffect(() => { setVal(name); }, [name]);

  const commit = () => {
    setEditing(false);
    const v = val.trim();
    if (v && v !== name) onRename(v); else setVal(name);
  };

  return (
    <span className="facet-chip">
      {editing ? (
        <input
          className="fc-edit"
          autoFocus
          value={val}
          size={Math.max(4, val.length)}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setVal(name); setEditing(false); }
          }}
        />
      ) : (
        <>
          <button className="fc-name" title="คลิกเพื่อแก้ไขชื่อ" onClick={() => setEditing(true)}>{name}</button>
          {count > 0 && <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>· {count}</span>}
        </>
      )}
      <button className="x" title={count > 0 ? 'มีหิน ' + count + ' รายการใช้อยู่' : 'ลบ'} onClick={onRemove}>{A.x({ width: 13, height: 13 })}</button>
    </span>
  );
}

function FacetCard({ group, th, values, usage, onAdd, onRename, onRemove }: {
  group: string;
  th: string;
  values: LookupOption[];
  usage: (v: string) => number;
  onAdd: (v: string) => void;
  onRename: (id: number, v: string) => void;
  onRemove: (id: number, name: string) => void;
}) {
  const [val, setVal] = useState('');
  const submit = () => { onAdd(val); setVal(''); };
  return (
    <div className="facet-card">
      <h4>{group}</h4>
      <div className="fc-sub thai" style={{ textTransform: 'none', letterSpacing: '.04em' }}>{th} · {values.length} options</div>
      <div className="facet-chips">
        {values.map(o => (
          <EditableChip key={o.id} name={o.name} count={usage(o.name)} onRename={n => onRename(o.id, n)} onRemove={() => onRemove(o.id, o.name)} />
        ))}
        {values.length === 0 && <span className="thai" style={{ color: 'var(--muted)', fontSize: 13 }}>ยังไม่มีตัวเลือก</span>}
      </div>
      <div className="facet-add">
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder={'เพิ่มตัวเลือก ' + group + '…'} />
        <button className="btn btn-sm btn-solid" onClick={submit}>{A.plus()} เพิ่ม</button>
      </div>
    </div>
  );
}
