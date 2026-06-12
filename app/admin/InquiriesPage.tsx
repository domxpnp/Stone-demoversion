'use client';

/* ===== STONECLUB ADMIN — Inquiries (Project Palette requests) ===== */
import { useState } from 'react';
import type { Stone } from '@/data/stones';
import { A, Badge, Drawer, STATUS, fmtDate, AdminCtx, onImgError } from './ui';
import type { Inquiry } from './adminData';

type StoneLike = Pick<Stone, 'name' | 'img'>;

export default function InquiriesPage({ inquiries, setInquiries, stones, showToast }: AdminCtx) {
  const [filter, setFilter] = useState('open');
  const [openInq, setOpenInq] = useState<Inquiry | null>(null);

  const stoneById = (id: string): StoneLike => stones.find(s => s.id === id) || { name: id, img: '/photos/' + id + '.jpg' };

  const FILTERS = [
    { id: 'open', label: 'Open' }, { id: 'new', label: 'New' }, { id: 'quoted', label: 'Quoted' },
    { id: 'won', label: 'Won' }, { id: 'archived', label: 'Archived' }, { id: 'all', label: 'All' },
  ];
  const match = (inq: Inquiry) => filter === 'all' ? true
    : filter === 'open' ? ['new', 'in-progress', 'quoted'].includes(inq.status)
      : inq.status === filter;
  const filtered = inquiries.filter(match);

  const setStatus = (id: string, status: string) => {
    setInquiries(inquiries.map(i => i.id === id ? { ...i, status } : i));
    setOpenInq(o => o && o.id === id ? { ...o, status } : o);
    showToast('อัปเดตสถานะเป็น "' + STATUS[status].th + '"');
  };

  const counts = {
    open: inquiries.filter(i => ['new', 'in-progress', 'quoted'].includes(i.status)).length,
    new: inquiries.filter(i => i.status === 'new').length,
  };

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Sales · คำขอจากลูกค้า</span>
          <h1>Inquiries</h1>
          <p className="ph-sub">คำขอจาก Project Palette และฟอร์มติดต่อ · {counts.open} รายการที่กำลังดำเนินการ</p>
        </div>
        <div className="ph-actions">
          <button className="btn">{A.copy()} Export CSV</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          {FILTERS.map(f => (
            <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
              {f.label}{f.id === 'new' && counts.new > 0 ? ' (' + counts.new + ')' : ''}
            </button>
          ))}
        </div>
        <span className="count-note">{filtered.length} inquir{filtered.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Client</th><th>Project</th><th>Requested stones</th><th>Status</th><th>Received</th><th></th></tr></thead>
          <tbody>
            {filtered.map(inq => (
              <tr key={inq.id} onClick={() => setOpenInq(inq)}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }} className="thai">{inq.name}</div>
                  <div className="meta-sm thai" style={{ textTransform: 'none', letterSpacing: 0 }}>{inq.company}</div>
                </td>
                <td className="thai" style={{ maxWidth: 230 }}>{inq.project}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {inq.items.slice(0, 3).map((it, i) => (
                      <img key={i} src={stoneById(it.id).img} alt="" onError={onImgError} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', border: '2px solid var(--card)', marginLeft: i ? -9 : 0 }} />
                    ))}
                    <span className="meta-sm" style={{ marginLeft: 10 }}>{inq.items.length} item{inq.items.length > 1 ? 's' : ''}</span>
                  </div>
                </td>
                <td><Badge status={inq.status} /></td>
                <td className="thai" style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(inq.date)}</td>
                <td><div className="row-act"><button className="icon-btn">{A.chevR()}</button></div></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6}><div className="empty"><div className="serif">No inquiries</div><p>ไม่มีคำขอในสถานะนี้</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={!!openInq} onClose={() => setOpenInq(null)}>
        {openInq && <InquiryDetail inq={openInq} stoneById={stoneById} onStatus={setStatus} onClose={() => setOpenInq(null)} />}
      </Drawer>
    </div>
  );
}

function InquiryDetail({ inq, stoneById, onStatus, onClose }: {
  inq: Inquiry;
  stoneById: (id: string) => StoneLike;
  onStatus: (id: string, status: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="drawer-head">
        <div className="dh-l">
          <div style={{ minWidth: 0 }}>
            <div className="dh-t thai">{inq.name}</div>
            <div className="dh-s">{inq.id} · {inq.channel}</div>
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>{A.x()}</button>
      </div>

      <div className="drawer-body inq-detail">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Badge status={inq.status} />
          <span className="thai" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(inq.date)}</span>
        </div>

        <div className="id-meta">
          <div><div className="k">Company</div><div className="v thai">{inq.company}</div></div>
          <div><div className="k">Project</div><div className="v thai">{inq.project}</div></div>
          <div><div className="k">Email</div><div className="v"><a href={'mailto:' + inq.email}>{inq.email}</a></div></div>
          <div><div className="k">Phone</div><div className="v">{inq.phone}</div></div>
        </div>

        <div className="fsec-t">Requested stones · {inq.items.length}</div>
        {inq.items.map((it, i) => {
          const s = stoneById(it.id);
          return (
            <div className="inq-item" key={i}>
              <img src={s.img} alt="" onError={onImgError} />
              <div>
                <div className="ii-n">{s.name}</div>
                <div className="ii-q">{it.qty}</div>
                {it.note && <div className="ii-note">“{it.note}”</div>}
              </div>
            </div>
          );
        })}

        <div className="fsec-t" style={{ marginTop: 24 }}>Message</div>
        <div className="inq-msg">{inq.message}</div>

        <div className="fsec-t" style={{ marginTop: 24 }}>Update status</div>
        <div className="status-pick">
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} className={'chip' + (inq.status === k ? ' on' : '')} onClick={() => onStatus(inq.id, k)}>{v.label} · {v.th}</button>
          ))}
        </div>
      </div>

      <div className="drawer-foot">
        <button className="btn btn-danger" onClick={() => { onStatus(inq.id, 'archived'); onClose(); }}>เก็บถาวร</button>
        <div className="spacer" />
        <button className="btn" onClick={() => window.open('mailto:' + inq.email)}>{A.mail()} ตอบกลับ</button>
        <button className="btn btn-solid" onClick={() => onStatus(inq.id, 'quoted')}>{A.check()} ทำใบเสนอราคา</button>
      </div>
    </>
  );
}
