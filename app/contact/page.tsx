'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Img from '@/components/ui/Img';

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

const SALES_TEAM = [
  { name: 'คุณ จิณณพัตห์ xxxxxxx', phone: '099-079-xxx' },
  { name: 'คุณ ธนาดุล xxxx',        phone: '081-497-xxxx' },
  { name: 'คุณ จีรชยา xxxxx',       phone: '086-877-xxxx' },
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', company: '', message: '' });
  const [sent, setSent] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); };

  return (
    <div className="page">
      <div className="container contact-grid">

        {/* ===== LEFT: contact info ===== */}
        <div>
          <span className="label-thai">ติดต่อเรา</span>
          <h1 className="contact-h" style={{ marginTop: '16px' }}>
            สนใจหิน
            <span className="it">ติดต่อได้เลย</span>
          </h1>
          <p className="contact-lead">
            ไม่ว่าจะเป็นโปรเจกต์ก่อสร้าง ตกแต่ง หรือต้องการตัวอย่างหิน
            ทีมงานของเราพร้อมช่วยเหลือคุณ
          </p>

          {/* Address */}
          <div className="cinfo">
            <div className="ic"><Icon.pin /></div>
            <div className="ct">
              <div className="t">ที่อยู่ / Address</div>
              <div className="v">
                <span style={{ color: 'var(--gold)', display: 'block' }}>บริษัท สโตนคลับ จำกัด</span>
                258 หมู่ 5 ต.กลางดง อ.ปากช่อง จ.นครราชสีมา 30320
                <br /><br />
                StoneClub Co., Ltd.<br />
                258 Moo 5 Klang Dong, Pak Chong,<br />
                Nakhon Ratchasima 30320, Thailand
              </div>
            </div>
          </div>

          {/* Office */}
          <div className="cinfo">
            <div className="ic"><Icon.phone /></div>
            <div className="ct">
              <div className="t">Office</div>
              <div className="v">044-009927<br />086-4657340</div>
            </div>
          </div>

          {/* Email */}
          <div className="cinfo">
            <div className="ic"><Icon.mail /></div>
            <div className="ct">
              <div className="t">Email</div>
              <div className="v">info@stoneclubthailand.com</div>
            </div>
          </div>

          {/* LINE Official */}
          <div className="cinfo">
            <div className="ic"><Icon.line /></div>
            <div className="ct">
              <div className="t">LINE Official</div>
              <div className="cinfo-qr">
                <Img src="/photos/lineoffi.png" alt="LINE Official QR Code" />
              </div>
            </div>
          </div>

          {/* Sales Team */}
          <div className="contact-sales">
            <span className="label">Sales Team</span>
            {SALES_TEAM.map((s) => (
              <div className="sales-row" key={s.phone}>
                <span className="sname">{s.name}</span>
                <span className="sphone">{s.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: form ===== */}
        <div className="form-card">
          {sent ? (
            <div className="form-sent">
              <div className="ic"><Icon.check /></div>
              <h3 className="thai">ส่งข้อความเรียบร้อยแล้ว</h3>
              <p>ทีมงาน Stoneclub จะติดต่อกลับภายใน 24 ชั่วโมง</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h3>ส่งคำถาม / สั่งซื้อ</h3>
              <div className="field2">
                <div className="field">
                  <label>Full Name <span className="req">*</span></label>
                  <input required value={form.name} onChange={set('name')} />
                </div>
                <div className="field">
                  <label>Email <span className="req">*</span></label>
                  <input type="email" required value={form.email} onChange={set('email')} />
                </div>
              </div>
              <div className="field2">
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={set('phone')} />
                </div>
                <div className="field">
                  <label>Company / Firm</label>
                  <input value={form.company} onChange={set('company')} />
                </div>
              </div>
              <div className="field">
                <label>Message</label>
                <textarea
                  placeholder="Tell us about your project..."
                  value={form.message}
                  onChange={set('message')}
                />
              </div>
              <button type="submit" className="btn btn-solid btn-block thai">
                ส่งข้อความ
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
