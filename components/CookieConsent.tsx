'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';

const STORAGE_KEY = 'sc-cookie-consent';

/* Cookie consent bar — shown once until the visitor accepts or declines.
   The choice is persisted in localStorage so it never reappears. Rendered
   from SiteChrome, so it sits above every public page (not the admin). */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only decide after mount to avoid a hydration mismatch.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const choose = (value: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage blocked — just close for this session */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="cookie-bar" role="dialog" aria-live="polite" aria-label="การใช้คุกกี้">
      <div className="cookie-inner">
        <div className="cookie-icon" aria-hidden>
          <Icon.doc />
        </div>
        <div className="cookie-text">
          <div className="cookie-title">เราใช้คุกกี้เพื่อประสบการณ์ที่ดีขึ้น</div>
          <p className="thai">
            เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การเข้าชมและปรับปรุงการใช้งาน
            หากคุณใช้งานต่อ ถือว่ายอมรับ
            <a href="/privacy"> นโยบายความเป็นส่วนตัว</a> ของเรา
          </p>
        </div>
        <div className="cookie-actions">
          <button className="btn-ghost cookie-decline" onClick={() => choose('declined')}>
            ปฏิเสธ
          </button>
          <button className="btn btn-solid cookie-accept" onClick={() => choose('accepted')}>
            ยอมรับทั้งหมด <span className="arr"><Icon.check /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
