'use client';

/* ===== STONECLUB ADMIN — Dashboard ===== */
import { A, Badge, fmtDate, AdminCtx } from './ui';
import { ACTIVITY } from './adminData';

function actIcon(t: string) {
  const map: Record<string, string> = { edit: 'edit', inquiry: 'inbox', publish: 'check', media: 'image', won: 'star' };
  return A[map[t] || 'edit']({ width: 16, height: 16 });
}

export default function Dashboard({ stones, inquiries, go }: AdminCtx) {
  const published = stones.filter(s => s.status !== 'draft').length;
  const premium = stones.filter(s => s.premium).length;
  const newInq = inquiries.filter(i => i.status === 'new').length;
  const openInq = inquiries.filter(i => ['new', 'in-progress', 'quoted'].includes(i.status)).length;

  const stats = [
    { icon: 'stone', v: stones.length, l: 'Stones in catalogue', d: published + ' published', dc: 'flat' },
    { icon: 'star', v: premium, l: 'Premium slabs', d: 'collector grade', dc: 'flat' },
    { icon: 'inbox', v: openInq, l: 'Open inquiries', d: '+' + newInq + ' new today', dc: 'up' },
    { icon: 'globe', v: '14', l: 'Countries sourced', d: 'live on site', dc: 'flat' },
  ];

  const quick = [
    { icon: 'plus', t: 'เพิ่มหินใหม่', d: 'Add a new slab to the catalogue', r: 'stones' },
    { icon: 'inbox', t: 'ดูคำขอใหม่', d: newInq + ' inquiries awaiting reply', r: 'inquiries' },
    { icon: 'pages', t: 'แก้เนื้อหาหน้า About', d: 'Edit page copy & stats', r: 'pages' },
    { icon: 'image', t: 'อัปโหลดรูปภาพ', d: 'Manage the media library', r: 'media' },
  ];

  return (
    <div>
      <div className="ph">
        <div>
          <span className="label">Overview</span>
          <h1>Good morning, <span className="it">Nattapong</span></h1>
          <p className="ph-sub">ภาพรวมเว็บไซต์และคำขอจากลูกค้า · วันพฤหัสบดีที่ 12 มิถุนายน 2569</p>
        </div>
        <div className="ph-actions">
          <button className="btn" onClick={() => window.open('/', '_blank')}>{A.ext()} ดูเว็บไซต์จริง</button>
          <button className="btn btn-solid" onClick={() => go('stones')}>{A.plus()} เพิ่มหินใหม่</button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="si">{A[s.icon]()}</div>
            <div className="sv">{s.v}</div>
            <div className="sl">{s.l}</div>
            <div className={'sd ' + s.dc}>{s.d}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        <div className="card">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <span className="thai" style={{ fontSize: 12, color: 'var(--muted)' }}>กิจกรรมล่าสุด</span>
          </div>
          {ACTIVITY.map((a, i) => (
            <div className={'act act-' + a.type} key={i}>
              <div className="ai">{actIcon(a.type)}</div>
              <div>
                <div className="at"><b>{a.who}</b> {a.action} <b>{a.target}</b></div>
                <div className="atime">{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="panel-head"><h3>Quick actions</h3></div>
          {quick.map((q, i) => (
            <button className="ql" key={i} onClick={() => go(q.r)}>
              <span className="qi">{A[q.icon]()}</span>
              <span style={{ flex: 1 }}>
                <span className="qt thai" style={{ display: 'block' }}>{q.t}</span>
                <span className="qd">{q.d}</span>
              </span>
              <span className="qarr">{A.chevR({ width: 16, height: 16 })}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h3>Latest inquiries</h3>
          <button className="more" onClick={() => go('inquiries')}>View all →</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Client</th><th>Project</th><th>Stones</th><th>Status</th><th>Received</th></tr></thead>
          <tbody>
            {inquiries.slice(0, 4).map(inq => (
              <tr key={inq.id} onClick={() => go('inquiries')}>
                <td><div style={{ fontWeight: 500, color: 'var(--ink)' }} className="thai">{inq.name}</div><div className="meta-sm">{inq.company}</div></td>
                <td className="thai" style={{ maxWidth: 240 }}>{inq.project}</td>
                <td className="meta-sm">{inq.items.length} item{inq.items.length > 1 ? 's' : ''}</td>
                <td><Badge status={inq.status} /></td>
                <td className="thai" style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtDate(inq.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
