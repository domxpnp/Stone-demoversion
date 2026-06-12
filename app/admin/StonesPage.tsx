'use client';

/* ===== STONECLUB ADMIN — Catalogue: list + editor ===== */
import { useState, Dispatch, SetStateAction } from 'react';
import type { Stone } from '@/data/stones';
import { A, Drawer, Field, Toggle, Facets, AdminCtx, onImgError } from './ui';

export default function StonesPage({ stones, setStones, facets, tagOptions, setTagOptions, showToast }: AdminCtx) {
  const [q, setQ] = useState('');
  const [matFilter, setMatFilter] = useState('All');
  const [editing, setEditing] = useState<Stone | 'new' | null>(null);

  const materials = ['All', ...facets.Material.filter(m => stones.some(s => s.material === m))];

  const filtered = stones.filter(s => {
    if (matFilter !== 'All' && s.material !== matFilter) return false;
    if (q) {
      const hay = (s.name + ' ' + s.origin + ' ' + s.color + ' ' + s.material).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const save = (data: Stone) => {
    if (data.id && stones.some(s => s.id === data.id)) {
      setStones(stones.map(s => s.id === data.id ? data : s));
      showToast('บันทึก "' + data.name + '" เรียบร้อย');
    } else {
      const id = (data.name || 'new-stone').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stone-' + Date.now();
      setStones([{ ...data, id }, ...stones]);
      showToast('เพิ่ม "' + data.name + '" ลงแค็ตตาล็อกแล้ว');
    }
    setEditing(null);
  };
  const remove = (s: Stone) => {
    setStones(stones.filter(x => x.id !== s.id));
    showToast('ลบ "' + s.name + '" แล้ว');
  };
  const togglePublish = (s: Stone) => {
    setStones(stones.map(x => x.id === s.id ? { ...x, status: x.status === 'draft' ? 'published' : 'draft' } : x));
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · สินค้าหิน</span>
          <h1>Catalogue</h1>
          <p className="ph-sub">จัดการรายการหินทั้งหมดที่แสดงบนเว็บไซต์ · {stones.length} รายการ</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-solid" onClick={() => setEditing('new')}>{A.plus()} เพิ่มหินใหม่</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="tb-search" style={{ margin: 0, width: 280 }}>
          {A.search()}
          <input placeholder="ค้นหาชื่อ / แหล่งที่มา / สี…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {materials.map(m => (
            <button key={m} className={matFilter === m ? 'on' : ''} onClick={() => setMatFilter(m)}>{m}</button>
          ))}
        </div>
        <span className="count-note">{filtered.length} of {stones.length}</span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Stone</th><th>Material</th><th>Origin</th><th>Finish</th><th>Tier</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => setEditing(s)}>
                <td>
                  <div className="col-name">
                    <img className="th-img" src={s.img} alt="" onError={onImgError} />
                    <div><div className="nm">{s.name}</div><div className="id">{s.color} · {s.id}</div></div>
                  </div>
                </td>
                <td>{s.material}</td>
                <td>{s.origin}</td>
                <td className="meta-sm">{s.finish}</td>
                <td>{s.premium ? <span className="badge badge-prem">{A.star({ width: 11, height: 11 })} Premium</span> : <span style={{ color: 'var(--muted-2)' }}>Standard</span>}</td>
                <td>{s.status === 'draft' ? <span className="badge badge-mut"><span className="d" />Draft</span> : <span className="badge badge-ok"><span className="d" />Published</span>}</td>
                <td>
                  <div className="row-act" onClick={e => e.stopPropagation()}>
                    <button className="icon-btn" title={s.status === 'draft' ? 'Publish' : 'Unpublish'} onClick={() => togglePublish(s)}>{A.eye()}</button>
                    <button className="icon-btn" title="Edit" onClick={() => setEditing(s)}>{A.edit()}</button>
                    <button className="icon-btn del" title="Delete" onClick={() => remove(s)}>{A.trash()}</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7}><div className="empty"><div className="serif">No stones found</div><p>ลองปรับคำค้นหรือตัวกรอง</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <StoneEditor
            key={editing === 'new' ? 'new' : editing.id}
            stone={editing === 'new' ? null : editing}
            facets={facets}
            tagOptions={tagOptions}
            setTagOptions={setTagOptions}
            onSave={save}
            onClose={() => setEditing(null)}
            onDelete={editing !== 'new' ? () => { remove(editing); setEditing(null); } : null}
          />
        )}
      </Drawer>
    </div>
  );
}

const BLANK: Stone = {
  id: '', name: '', img: '/photos/bianco-carrara.jpg', material: 'Marble', origin: 'Italy', finish: 'Polished',
  color: 'White', premium: false, status: 'draft', desc: '', thai: '',
  spec: { Thickness: '', 'Slab Size': '', 'Water Absorption': '', 'Compressive Strength': '' },
  applications: '', tags: [],
};

function StoneEditor({ stone, facets, tagOptions, setTagOptions, onSave, onClose, onDelete }: {
  stone: Stone | null;
  facets: Facets;
  tagOptions: string[];
  setTagOptions: Dispatch<SetStateAction<string[]>>;
  onSave: (d: Stone) => void;
  onClose: () => void;
  onDelete: (() => void) | null;
}) {
  const [d, setD] = useState<Stone>(() => stone ? { ...stone, spec: { ...stone.spec }, tags: [...(stone.tags || [])] } : { ...BLANK, spec: { ...BLANK.spec }, tags: [] });
  const set = <K extends keyof Stone>(k: K, v: Stone[K]) => setD(p => ({ ...p, [k]: v }));
  const setSpec = (k: string, v: string) => setD(p => ({ ...p, spec: { ...p.spec, [k]: v } }));
  const isNew = !stone;

  // tag picker
  const [newTag, setNewTag] = useState('');
  const toggleTag = (tag: string) =>
    setD(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag] }));
  const addNewTag = () => {
    const v = newTag.trim();
    if (!v) return;
    const existing = tagOptions.find(t => t.toLowerCase() === v.toLowerCase());
    const tag = existing || v;
    if (!existing) setTagOptions([...tagOptions, v]);   // promote to master library
    setD(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags : [...p.tags, tag] }));
    setNewTag('');
  };
  // master options plus any tag already on this stone that isn't in the library
  const allTags = [...tagOptions, ...d.tags.filter(t => !tagOptions.includes(t))];

  const [specKeys, setSpecKeys] = useState<string[]>(() => Object.keys((stone || BLANK).spec));
  const addSpec = () => setSpecKeys(k => [...k, '']);

  return (
    <>
      <div className="drawer-head">
        <div className="dh-l">
          <img className="dh-img" src={d.img} alt="" onError={onImgError} />
          <div style={{ minWidth: 0 }}>
            <div className="dh-t">{d.name || (isNew ? 'New stone' : 'Untitled')}</div>
            <div className="dh-s">{isNew ? 'Creating · draft' : 'Editing · ' + d.id}</div>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>{A.x()}</button>
      </div>

      <div className="drawer-body">
        {/* identity */}
        <div className="fsec">
          <div className="fsec-t">Identity</div>
          <Field label="Stone name" span2>
            <input className="inp" value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Bianco Carrara" />
          </Field>
          <div className="fld-grid c3">
            <Field label="Material">
              <select className="sel" value={d.material} onChange={e => set('material', e.target.value)}>{facets.Material.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="Origin">
              <select className="sel" value={d.origin} onChange={e => set('origin', e.target.value)}>{facets.Origin.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="Finish">
              <select className="sel" value={d.finish} onChange={e => set('finish', e.target.value)}>{facets.Finish.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="Colour">
              <select className="sel" value={d.color} onChange={e => set('color', e.target.value)}>{facets.Color.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="Tier" span2>
              <Toggle on={!!d.premium} onChange={v => set('premium', v)} label={d.premium ? 'Premium · collector grade' : 'Standard'} />
            </Field>
          </div>
        </div>

        {/* image */}
        <div className="fsec">
          <div className="fsec-t">Hero image</div>
          <div className="img-edit">
            <img className="iv" src={d.img} alt="" onError={onImgError} />
            <div className="ie-r">
              <div className="hint">รูปแผ่นหินหลักที่แสดงในแค็ตตาล็อกและหน้าสินค้า · แนะนำสัดส่วน 3:4</div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 9 }}>
                <button className="btn btn-sm">{A.upload()} อัปโหลดรูป</button>
                <button className="btn btn-sm btn-ghost">เลือกจากคลัง</button>
              </div>
              <input className="inp" value={d.img} onChange={e => set('img', e.target.value)} style={{ fontSize: 12 }} />
            </div>
          </div>
        </div>

        {/* descriptions */}
        <div className="fsec">
          <div className="fsec-t">Descriptions</div>
          <Field label="Description (EN)" span2>
            <textarea className="txa en" value={d.desc} onChange={e => set('desc', e.target.value)} placeholder="Editorial description shown on the product page…" />
          </Field>
          <Field label="คำอธิบาย (ไทย)" thHint="Thai summary" span2>
            <textarea className="txa" value={d.thai} onChange={e => set('thai', e.target.value)} placeholder="คำอธิบายสั้น ๆ ภาษาไทย…" />
          </Field>
          <Field label="Applications" thHint="คั่นด้วยจุลภาค" span2>
            <input className="inp" value={d.applications} onChange={e => set('applications', e.target.value)} placeholder="Flooring, Wall Cladding, Countertops" />
          </Field>
        </div>

        {/* tags */}
        <div className="fsec">
          <div className="fsec-t">Tags · คีย์เวิร์ด {d.tags.length > 0 && <span style={{ color: 'var(--muted-2)', letterSpacing: 0, textTransform: 'none' }}>({d.tags.length})</span>}</div>
          <div className="hint" style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--thai)', marginBottom: 13, lineHeight: 1.6 }}>
            คลิกเพื่อติด/เอาออก · ใช้เป็นตัวกรองในหน้า Collection · จัดการคลังคีย์เวิร์ดได้ที่หน้า Tags
          </div>
          <div className="status-pick">
            {allTags.map(tag => (
              <button key={tag} className={'chip' + (d.tags.includes(tag) ? ' on' : '')} onClick={() => toggleTag(tag)}>
                {d.tags.includes(tag) && A.check({ width: 12, height: 12 })}{tag}
              </button>
            ))}
          </div>
          <div className="facet-add" style={{ marginTop: 13 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewTag())} placeholder="สร้างคีย์เวิร์ดใหม่แล้วติดทันที…" />
            <button className="btn btn-sm btn-ghost" onClick={addNewTag}>{A.plus()} เพิ่ม</button>
          </div>
        </div>

        {/* specs */}
        <div className="fsec">
          <div className="fsec-t">Technical specifications</div>
          <div className="spec-edit">
            {specKeys.map((k, i) => (
              <div className="spec-row" key={i}>
                <input className="inp" value={k} placeholder="Property" onChange={e => {
                  const nk = e.target.value; const val = d.spec[k];
                  setSpecKeys(ks => ks.map((x, j) => j === i ? nk : x));
                  setD(p => { const sp = { ...p.spec }; delete sp[k]; if (nk) sp[nk] = val || ''; return { ...p, spec: sp }; });
                }} />
                <input className="inp" value={d.spec[k] || ''} placeholder="Value" onChange={e => setSpec(k, e.target.value)} />
                <button className="icon-btn del" onClick={() => { setSpecKeys(ks => ks.filter((_, j) => j !== i)); setD(p => { const sp = { ...p.spec }; delete sp[k]; return { ...p, spec: sp }; }); }}>{A.trash()}</button>
              </div>
            ))}
          </div>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 11 }} onClick={addSpec}>{A.plus()} เพิ่มข้อมูลจำเพาะ</button>
        </div>
      </div>

      <div className="drawer-foot">
        {onDelete && <button className="btn btn-danger" onClick={onDelete}>{A.trash()} ลบ</button>}
        <div className="spacer" />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-solid" onClick={() => onSave(d)}>{A.save()} {isNew ? 'สร้างและบันทึก' : 'บันทึกการแก้ไข'}</button>
      </div>
    </>
  );
}
