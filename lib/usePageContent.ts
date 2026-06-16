'use client';

import { useEffect, useState } from 'react';
import type { PageContent } from '@/app/admin/adminData';

// Client hook: fetch one page's content from GET /api/pages (the same
// endpoint the admin uses) and return a field getter.
//
//   const f = usePageContent('home');
//   <h1>{f('hero_title', 'fallback text')}</h1>
//
// `fallback` is shown until the DB responds, and also if the page/field
// doesn't exist yet — so the UI never renders blank.
export function usePageContent(pageId: string) {
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    fetch('/api/pages')
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((pages: Record<string, PageContent>) => {
        if (!alive) return;
        const page = pages[pageId];
        if (page) setFields(Object.fromEntries(page.fields.map(f => [f.key, f.value])));
      })
      .catch(err => console.error('โหลดเนื้อหา "' + pageId + '" ไม่สำเร็จ:', err));
    return () => { alive = false; };
  }, [pageId]);

  return (key: string, fallback = '') => fields[key] ?? fallback;
}
