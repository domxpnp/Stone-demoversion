'use client';

/* ===== STONECLUB ADMIN — Catalogue: list + editor ===== */
import { useState, useRef, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import type { Stone } from '@/data/stones';
import { A, Drawer, Field, Toggle, Facets, AdminCtx, onImgError } from './ui';

const PAGE_SIZES = [10, 20, 50, 100];

// Mirror of the server's paginated envelope (lib/stones.ts → ListStonesResult).
interface StonePage { rows: Stone[]; total: number; page: number; limit: number; totalPages: number; }

export default function StonesPage({ stones, setStones, facets, tagOptions, setTagOptions, showToast }: AdminCtx) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [matFilter, setMatFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [reloadKey, setReloadKey] = useState(0);   // bump to force a refetch of the current view
  const [editing, setEditing] = useState<Stone | 'new' | null>(null);

  // server-driven list state (only the current page lives in the client)
  const [rows, setRows] = useState<Stone[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const materials = ['All', ...facets.Material];
  const refetch = () => setReloadKey(k => k + 1);

  // debounce the search box so we don't hit the DB on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // fetch one page from the server whenever the query, filter, sort, or page changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (debouncedQ) params.set('q', debouncedQ);
    if (matFilter !== 'All') params.set('material', matFilter);
    const sort = sorting[0];
    if (sort) { params.set('sort', sort.id); params.set('dir', sort.desc ? 'desc' : 'asc'); }
    fetch(`/api/stones?${params.toString()}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: StonePage | null) => {
        if (ignore || !data) return;
        setRows(data.rows);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        // a delete on the last page can leave us past the end — step back
        if (page > data.totalPages) setPage(data.totalPages);
      })
      .catch(() => { if (!ignore) showToast('โหลดรายการไม่สำเร็จ — ลองใหม่อีกครั้ง'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [debouncedQ, matFilter, page, pageSize, sorting, reloadKey]);

  const [busy, setBusy] = useState(false);

  const save = async (data: Stone) => {
    if (busy) return;
    const isUpdate = !!data.id && (rows.some(s => s.id === data.id) || stones.some(s => s.id === data.id));
    setBusy(true);
    try {
      const res = await fetch(isUpdate ? `/api/stones/${data.id}` : '/api/stones', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || 'บันทึกไม่สำเร็จ');
      }
      const saved: Stone = await res.json();
      if (isUpdate) {
        setRows(rows.map(s => s.id === saved.id ? saved : s));
        setStones(stones.map(s => s.id === saved.id ? saved : s));   // keep shared state (dashboard/facets/tags) fresh
        showToast('บันทึก "' + saved.name + '" เรียบร้อย');
      } else {
        setStones([saved, ...stones]);
        showToast('เพิ่ม "' + saved.name + '" ลงแค็ตตาล็อกแล้ว');
        // reveal the new row in server order: jump to page 1 (or refetch if already there)
        if (page === 1) refetch(); else setPage(1);
      }
      setEditing(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (s: Stone) => {
    const prevRows = rows, prevTotal = total, prevStones = stones;
    setRows(rows.filter(x => x.id !== s.id));            // optimistic
    setTotal(t => Math.max(0, t - 1));
    setStones(stones.filter(x => x.id !== s.id));
    try {
      const res = await fetch(`/api/stones/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('ลบ "' + s.name + '" แล้ว');
      refetch();                                          // pull the next row in to fill the page
    } catch {
      setRows(prevRows); setTotal(prevTotal); setStones(prevStones);   // rollback
      showToast('ลบไม่สำเร็จ — ลองใหม่อีกครั้ง');
    }
  };
  const togglePublish = async (s: Stone) => {
    const next = s.status === 'draft' ? 'published' : 'draft';
    const prevRows = rows, prevStones = stones;
    setRows(rows.map(x => x.id === s.id ? { ...x, status: next } : x));        // optimistic
    setStones(stones.map(x => x.id === s.id ? { ...x, status: next } : x));
    try {
      const res = await fetch(`/api/stones/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prevRows); setStones(prevStones);                                // rollback
      showToast('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // changing the search or facet filter always restarts from page 1
  const onSearch = (v: string) => { setQ(v); setPage(1); };
  const onMaterial = (m: string) => { setMatFilter(m); setPage(1); };
  const onPageSize = (n: number) => { setPageSize(n); setPage(1); };

  // ----- TanStack Table: columns + headless instance (server sort/pagination) -----
  const col = createColumnHelper<Stone>();
  const columns = useMemo<ColumnDef<Stone, any>[]>(() => [
    col.accessor('name', {
      header: 'Stone',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="col-name">
            <img className="th-img" src={s.img} alt="" loading="lazy" onError={onImgError} />
            <div><div className="nm">{s.name}</div><div className="id">{s.color} · {s.id}</div></div>
          </div>
        );
      },
    }),
    col.accessor('material', { header: 'Material' }),
    col.accessor('origin', { header: 'Origin' }),
    col.accessor('finish', { header: 'Finish', cell: ({ getValue }) => <span className="meta-sm">{getValue()}</span> }),
    col.accessor('premium', {
      header: 'Tier',
      cell: ({ getValue }) => getValue()
        ? <span className="badge badge-prem">{A.star({ width: 11, height: 11 })} Premium</span>
        : <span style={{ color: 'var(--muted-2)' }}>Standard</span>,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => getValue() === 'draft'
        ? <span className="badge badge-mut"><span className="d" />Draft</span>
        : <span className="badge badge-ok"><span className="d" />Published</span>,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="row-act" onClick={e => e.stopPropagation()}>
            <button className="icon-btn" title={s.status === 'draft' ? 'Publish' : 'Unpublish'} onClick={() => togglePublish(s)}>{A.eye()}</button>
            <button className="icon-btn" title="Edit" onClick={() => setEditing(s)}>{A.edit()}</button>
            <button className="icon-btn del" title="Delete" onClick={() => remove(s)}>{A.trash()}</button>
          </div>
        );
      },
    }),
    // handlers are recreated each render; rebuild cell closures so they're never stale
  ], [rows, stones, total, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: updater => {
      setSorting(prev => (typeof updater === 'function' ? updater(prev) : updater));
      setPage(1);   // a new sort order means we start from the first page again
    },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  });

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

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
          <input placeholder="ค้นหาชื่อ / แหล่งที่มา / สี…" value={q} onChange={e => onSearch(e.target.value)} />
        </div>
        <div className="seg">
          {materials.map(m => (
            <button key={m} className={matFilter === m ? 'on' : ''} onClick={() => onMaterial(m)}>{m}</button>
          ))}
        </div>
        <span className="count-note">{loading ? 'กำลังโหลด…' : `${total} รายการ`}</span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();   // false | 'asc' | 'desc'
                  return (
                    <th
                      key={header.id}
                      className={canSort ? 'th-sort' : undefined}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="th-sort-in">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className={'sort-ind' + (sorted ? ' on' : '')}>
                            {sorted === 'desc' ? '▼' : sorted === 'asc' ? '▲' : '↕'}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.original.id} onClick={() => setEditing(row.original)}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length}><div className="empty"><div className="serif">No stones found</div><p>ลองปรับคำค้นหรือตัวกรอง</p></div></td></tr>
            )}
            {loading && rows.length === 0 && (
              <tr><td colSpan={columns.length}><div className="empty"><p>กำลังโหลด…</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <div className="pager-size">
          <span>แสดง</span>
          <select className="sel" value={pageSize} onChange={e => onPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>ต่อหน้า · {from}–{to} จาก {total}</span>
        </div>
        {totalPages > 1 && (
          <div className="pager-ctrl">
            <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>{A.arrowL({ width: 15, height: 15 })} ก่อนหน้า</button>
            <span className="pager-cur">หน้า {page} / {totalPages}</span>
            <button className="btn btn-sm" disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>ถัดไป {A.arrow({ width: 15, height: 15 })}</button>
          </div>
        )}
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

  // hero image upload → POST /api/upload, then store the returned path in `img`
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
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
                <button className="btn btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {A.upload()} {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
                </button>
                <button className="btn btn-sm btn-ghost" disabled>เลือกจากคลัง</button>
              </div>
              {uploadErr && <div className="login-err thai" style={{ margin: '0 0 9px' }}>{uploadErr}</div>}
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
