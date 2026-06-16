'use client';

/* ===== STONECLUB ADMIN — Pages content, Media library, Filters ===== */
import { useEffect, useState } from 'react';
import { A, Field, AdminCtx, onImgError } from './ui';
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
export function MediaPage({ showToast }: AdminCtx) {
  const seed = [
    { src: '/photos/bianco-carrara.jpg', name: 'bianco-carrara.jpg', dim: '3:4 · Stone' },
    { src: '/photos/dark-emperador.jpg', name: 'dark-emperador.jpg', dim: '3:4 · Stone' },
    { src: '/photos/jade-onyx.jpg', name: 'jade-onyx.jpg', dim: '3:4 · Stone' },
    { src: '/photos/azul-bahia.jpg', name: 'azul-bahia.jpg', dim: '3:4 · Stone' },
    { src: '/photos/silver-travertine.jpg', name: 'silver-travertine.jpg', dim: '3:4 · Stone' },
    { src: '/photos/nero-marquina.jpg', name: 'nero-marquina.jpg', dim: '3:4 · Stone' },
    { src: '/photos/hero-kitchen.jpg', name: 'hero-kitchen.jpg', dim: '16:9 · Interior' },
    { src: '/photos/kitchen-island.jpg', name: 'kitchen-island.jpg', dim: '4:3 · Interior' },
    { src: '/photos/kitchen-wide.jpg', name: 'kitchen-wide.jpg', dim: '16:9 · Interior' },
  ];
  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · คลังรูปภาพ</span>
          <h1>Media library</h1>
          <p className="ph-sub">รูปภาพทั้งหมดที่ใช้บนเว็บไซต์ · {seed.length} ไฟล์</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-solid" onClick={() => showToast('เปิดหน้าต่างอัปโหลด (ตัวอย่าง)')}>{A.upload()} อัปโหลด</button>
        </div>
      </div>
      <div className="media-grid">
        <div className="media-up" onClick={() => showToast('ลากรูปมาวางเพื่ออัปโหลด (ตัวอย่าง)')}>
          {A.upload()}
          <span className="mu-t">ลากวาง / เลือกไฟล์</span>
        </div>
        {seed.map((m, i) => (
          <div className="media-tile" key={i} onClick={() => showToast('คัดลอกพาธ: ' + m.src)}>
            <div className="mt-img"><img src={m.src} alt="" onError={onImgError} /></div>
            <div className="mt-meta"><div className="mt-name">{m.name}</div><div className="mt-dim">{m.dim}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- FILTERS / FACETS ---------------- */
export function FacetsPage({ facets, setFacets, stones, showToast }: AdminCtx) {
  const add = (group: string, val: string) => {
    val = val.trim(); if (!val || facets[group].includes(val)) return;
    setFacets({ ...facets, [group]: [...facets[group], val] });
    showToast('เพิ่ม "' + val + '" ใน ' + group);
  };
  const remove = (group: string, val: string) => {
    setFacets({ ...facets, [group]: facets[group].filter(v => v !== val) });
  };
  const usage = (group: string, val: string) => stones.filter(s => {
    const key = group === 'Color' ? 'color' : group.toLowerCase();
    return (s as unknown as Record<string, unknown>)[key] === val;
  }).length;

  const GROUPS = [
    { key: 'Material', th: 'วัสดุ' }, { key: 'Origin', th: 'แหล่งที่มา' },
    { key: 'Finish', th: 'ผิวสัมผัส' }, { key: 'Color', th: 'สี' },
  ];

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · ตัวกรอง</span>
          <h1>Filters</h1>
          <p className="ph-sub">จัดการตัวเลือกตัวกรองในหน้า Collection (Material / Origin / Finish / Colour)</p>
        </div>
      </div>
      <div className="facet-cols">
        {GROUPS.map(g => (
          <FacetCard key={g.key} group={g.key} th={g.th} values={facets[g.key]} usage={v => usage(g.key, v)} onAdd={v => add(g.key, v)} onRemove={v => remove(g.key, v)} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- TAGS (master keyword vocabulary) ---------------- */
export function TagsPage({ tagOptions, setTagOptions, stones, showToast }: AdminCtx) {
  const [val, setVal] = useState('');

  const usage = (tag: string) => stones.filter(s => s.tags.includes(tag)).length;

  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (tagOptions.some(t => t.toLowerCase() === v.toLowerCase())) { showToast('มี "' + v + '" อยู่แล้ว'); setVal(''); return; }
    setTagOptions([...tagOptions, v]);
    showToast('เพิ่มคีย์เวิร์ด "' + v + '"');
    setVal('');
  };
  const remove = (tag: string) => {
    setTagOptions(tagOptions.filter(t => t !== tag));
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Content · คีย์เวิร์ด</span>
          <h1>Tags</h1>
          <p className="ph-sub">คลังคีย์เวิร์ดกลางสำหรับติดให้หินแต่ละก้อน · ใช้เป็นตัวกรองในหน้า Collection · {tagOptions.length} คีย์เวิร์ด</p>
        </div>
      </div>

      <div className="facet-card" style={{ maxWidth: 720 }}>
        <h4>Keyword library</h4>
        <div className="fc-sub thai" style={{ textTransform: 'none', letterSpacing: '.04em' }}>เพิ่ม/ลบคีย์เวิร์ด · ตัวเลขคือจำนวนหินที่ใช้อยู่</div>
        <div className="facet-chips">
          {tagOptions.map(t => {
            const n = usage(t);
            return (
              <span className="facet-chip" key={t}>
                {t}{n > 0 && <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>· {n}</span>}
                <button className="x" title={n > 0 ? 'มีหิน ' + n + ' รายการใช้อยู่' : 'ลบ'} onClick={() => remove(t)}>{A.x({ width: 13, height: 13 })}</button>
              </span>
            );
          })}
          {tagOptions.length === 0 && <span className="thai" style={{ color: 'var(--muted)', fontSize: 13 }}>ยังไม่มีคีย์เวิร์ด — เพิ่มด้านล่าง</span>}
        </div>
        <div className="facet-add">
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="เพิ่มคีย์เวิร์ดใหม่…" />
          <button className="btn btn-sm btn-solid" onClick={add}>{A.plus()} เพิ่ม</button>
        </div>
      </div>
    </div>
  );
}

function FacetCard({ group, th, values, usage, onAdd, onRemove }: {
  group: string;
  th: string;
  values: string[];
  usage: (v: string) => number;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [val, setVal] = useState('');
  const submit = () => { onAdd(val); setVal(''); };
  return (
    <div className="facet-card">
      <h4>{group}</h4>
      <div className="fc-sub thai" style={{ textTransform: 'none', letterSpacing: '.04em' }}>{th} · {values.length} options</div>
      <div className="facet-chips">
        {values.map(v => {
          const n = usage(v);
          return (
            <span className="facet-chip" key={v}>
              {v}{n > 0 && <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>· {n}</span>}
              <button className="x" title={n > 0 ? 'มีหิน ' + n + ' รายการใช้อยู่' : 'ลบ'} onClick={() => onRemove(v)}>{A.x({ width: 13, height: 13 })}</button>
            </span>
          );
        })}
      </div>
      <div className="facet-add">
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder={'เพิ่มตัวเลือก ' + group + '…'} />
        <button className="btn btn-sm btn-solid" onClick={submit}>{A.plus()} เพิ่ม</button>
      </div>
    </div>
  );
}
