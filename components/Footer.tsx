'use client';

import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">STONECLUB <span className="it">Thailand</span></div>
          <p className="thai footer-desc">
            บริษัท สโตนคลับ จำกัด · ผู้นำเข้าและจัดจำหน่ายหินธรรมชาติทุกชนิด
            นำเข้า–ส่งออกทั่วโลก ในปากช่อง–เขาใหญ่
          </p>
        </div>
        <div className="footer-col">
          <div className="label">Navigate</div>
          <button onClick={() => router.push('/collection')}>Collection</button>
          <button onClick={() => router.push('/clearance')}>Stock Clearance</button>
          <button onClick={() => router.push('/about')}>About</button>
          <button onClick={() => router.push('/contact')}>Contact</button>
          <button className="thai" onClick={() => router.push('/palette')}>Project Palette</button>
        </div>
        <div className="footer-col">
          <div className="label">Contact</div>
          <span className="thai">258 หมู่ 5 ต.กลางดง อ.ปากช่อง</span>
          <span className="thai">จ.นครราชสีมา 30320</span>
          <span>info@stoneclubthailand.com</span>
          <span>044-009927 · 086-465-7340</span>
        </div>
      </div>
      <div className="footer-mega">STONECLUB <span className="it">TH</span></div>
      <div className="container footer-base">
        <span className="thai">© 2026 บริษัท สโตนคลับ จำกัด · Stoneclub Thailand. All rights reserved.</span>
        <span className="thai footer-tag">คุณภาพและราคาที่ดีที่สุด</span>
      </div>
    </footer>
  );
}
