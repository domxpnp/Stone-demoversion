'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STONES } from '@/data/stones';
import { useStore, QTY_OPTS } from '@/context/StoreContext';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icon';
import Img from '@/components/ui/Img';

export default function PalettePage() {
  const router = useRouter();
  const { basket, removeFromBasket, updateBasket } = useStore();
  const [showEmail, setShowEmail] = useState(false);

  const items = basket
    .map(b => ({ ...b, stone: STONES.find(s => s.id === b.id) }))
    .filter(x => x.stone) as Array<{ id: string; qty: string; note: string; stone: typeof STONES[0] }>;

  return (
    <div className="page">
      <div className="container">
        <Reveal className="page-head">
          <span className="label">Your Selections</span>
          <h1 className="serif" style={{ fontSize: 'clamp(46px,6vw,80px)', fontWeight: 500, lineHeight: 1 }}>
            Project Inquiry Basket
          </h1>
          <p className="thai" style={{ maxWidth: '440px', marginTop: '16px', color: 'var(--ink-2)', fontSize: '15px', lineHeight: 1.8 }}>
            คัดเลือกหินสำหรับโปรเจกต์ ระบุปริมาณ และส่งคำขอรึกษาโปรเจกต์มายังทีมงานของเรา
          </p>
        </Reveal>

        {items.length === 0 ? (
          <div className="pal-empty">
            <div className="serif">Your basket is empty</div>
            <p>เลือกหินจากคอลเล็กชันเพื่อเริ่มต้นโปรเจกต์ของคุณ</p>
            <button className="btn btn-solid" onClick={() => router.push('/collection')}>
              Browse Collection <span className="arr"><Icon.arrow /></span>
            </button>
          </div>
        ) : (
          <div className="pal-layout">
            {/* items */}
            <div>
              <div className="pal-count">{items.length} Stones Selected</div>
              {items.map(it => (
                <div className="pal-item" key={it.id}>
                  <Img className="thumb" src={it.stone.img} alt={it.stone.name} />
                  <div>
                    <div className="pi-head">
                      <div>
                        <div className="pi-name">{it.stone.name}</div>
                        <div className="pi-meta">{it.stone.material} · {it.stone.origin}</div>
                      </div>
                      <button className="rm" onClick={() => removeFromBasket(it.id)} aria-label="Remove">
                        <Icon.trash />
                      </button>
                    </div>
                    <div className="pi-field">
                      <div className="lab">Estimated Quantity</div>
                      <div className="qty-wrap">
                        <select
                          className="qty-select"
                          value={it.qty}
                          onChange={e => updateBasket(it.id, { qty: e.target.value })}
                        >
                          {QTY_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <span className="chev"><Icon.chevD /></span>
                      </div>
                    </div>
                    <div className="pi-field">
                      <div className="lab">Notes for this stone</div>
                      <textarea
                        className="pi-note"
                        placeholder="ความต้องการพิเศษ, ห้องที่ใช้งาน, ผิวสำเร็จ..."
                        value={it.note}
                        onChange={e => updateBasket(it.id, { note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* summary */}
            <aside className="pal-summary">
              <h3>Ready to Proceed?</h3>
              <div className="sub">{items.length} stones in your project basket</div>
              {items.map(it => (
                <div className="sum-row" key={it.id}>
                  <span className="nm">{it.stone.name}</span>
                  <span className="q">{it.qty}</span>
                </div>
              ))}
              <button
                className="btn btn-solid btn-block"
                style={{ marginTop: '26px' }}
                onClick={() => setShowEmail(true)}
              >
                Request Project Consultation
              </button>
              <p className="note">
                No payment required. Our project team will contact you within 24 hours.
              </p>
            </aside>
          </div>
        )}
      </div>

      {showEmail && <EmailModal items={items} onClose={() => setShowEmail(false)} />}
    </div>
  );
}

function EmailModal({
  items,
  onClose,
}: {
  items: Array<{ id: string; qty: string; stone: typeof STONES[0] }>;
  onClose: () => void;
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="label">Inquiry Submitted</span>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="email-line">
            <div className="ic"><Icon.check /></div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>ส่งคำขอเรียบร้อยแล้ว</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>ข้อมูลทั้งหมดถูกส่งไปยังอีเมลของ Stoneclub</div>
            </div>
          </div>
          <div className="email-sheet">
            <h4>New Project Inquiry — Stoneclub Thailand</h4>
            <div className="es-sub">To: info@stoneclubthailand.com</div>
            <div>A new project inquiry has been submitted through the Stoneclub Thailand website.</div>
            <hr />
            <div style={{ fontSize: '11px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>
              Stones Requested
            </div>
            {items.map(it => (
              <div className="es-row" key={it.id}>
                <span className="k">{it.stone.name} · {it.stone.material}</span>
                <span className="v">{it.qty}</span>
              </div>
            ))}
            <hr />
            <div className="es-row">
              <span className="k">Submitted</span>
              <span className="v">{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="es-row">
              <span className="k">Status</span>
              <span className="v">Awaiting team response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
