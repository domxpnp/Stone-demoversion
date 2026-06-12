/* ===== STONECLUB ADMIN — back-office seed data ===== */

export interface InquiryItem {
  id: string;
  qty: string;
  note?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  channel: string;
  date: string;
  status: string;
  project: string;
  items: InquiryItem[];
  message: string;
}

export interface PageField {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  value: string;
}

export interface PageContent {
  label: string;
  fields: PageField[];
}

export interface Activity {
  who: string;
  action: string;
  target: string;
  time: string;
  type: string;
}

/* Customer inquiries (from the public "Project Palette" basket) */
export const INQUIRIES: Inquiry[] = [
  {
    id: 'INQ-2041', name: 'Pichaya Wattanakul', company: 'Studio Manaya Architects',
    email: 'pichaya@manaya.co.th', phone: '089-441-2208', channel: 'Palette',
    date: '2026-06-11T09:24:00', status: 'new',
    project: 'The Reserve Residences — Lobby & Lift Lobbies',
    items: [
      { id: 'bianco-carrara', qty: '200–500 sqm', note: 'Polished, bookmatched for lift lobby feature wall.' },
      { id: 'nero-marquina', qty: 'Under 50 sqm', note: 'Reception desk front.' },
    ],
    message: 'ต้องการใบเสนอราคาพร้อมตัวอย่างแผ่นจริง ภายในสัปดาห์นี้ครับ โครงการอยู่ทองหล่อ',
  },
  {
    id: 'INQ-2040', name: 'James Holloway', company: 'HBA Bangkok',
    email: 'j.holloway@hba.com', phone: '086-220-7781', channel: 'Palette',
    date: '2026-06-10T16:02:00', status: 'quoted',
    project: 'Aman Residences — Spa Suites',
    items: [
      { id: 'jade-onyx', qty: 'Under 50 sqm', note: 'Backlit feature panel, 2 walls.' },
      { id: 'silver-travertine', qty: '200–500 sqm', note: 'Honed, spa flooring.' },
    ],
    message: 'Please confirm lead time for backlit onyx and slab reservation.',
  },
  {
    id: 'INQ-2039', name: 'ศุภวิช เจริญสุข', company: 'บ้านพักส่วนตัว',
    email: 'supawit.j@gmail.com', phone: '081-909-4412', channel: 'Contact form',
    date: '2026-06-09T11:48:00', status: 'in-progress',
    project: 'บ้านเขาใหญ่ — ครัวและห้องน้ำมาสเตอร์',
    items: [
      { id: 'dark-emperador', qty: 'Under 50 sqm', note: 'ท็อปครัวและ vanity' },
    ],
    message: 'สนใจหินสีเข้ม อยากให้ทีมงานช่วยแนะนำลายที่เข้ากับไม้วอลนัทครับ',
  },
  {
    id: 'INQ-2038', name: 'Lucia Fontana', company: 'Fontana Interni',
    email: 'lucia@fontana-interni.it', phone: '+39 02 8843', channel: 'Palette',
    date: '2026-06-08T08:15:00', status: 'won',
    project: 'Private Villa — Phuket',
    items: [
      { id: 'azul-bahia', qty: 'Under 50 sqm', note: 'Statement island, single slab.' },
      { id: 'bianco-carrara', qty: '500–1,000 sqm', note: 'Villa flooring throughout.' },
    ],
    message: 'Confirmed order. Awaiting shipping schedule to Phuket port.',
  },
  {
    id: 'INQ-2037', name: 'Krit Tangsai', company: 'Density Design Lab',
    email: 'krit@density.studio', phone: '092-115-0034', channel: 'Palette',
    date: '2026-06-06T14:30:00', status: 'archived',
    project: 'Restaurant Fit-out — Sukhumvit',
    items: [
      { id: 'nero-marquina', qty: '50–200 sqm', note: 'Bar & floor.' },
    ],
    message: 'Project on hold by client. Revisit Q4.',
  },
];

/* Editable page content blocks (mirrors the public site) */
export const PAGES: Record<string, PageContent> = {
  home: {
    label: 'Home / หน้าแรก',
    fields: [
      { key: 'hero_kicker', label: 'Hero kicker (TH)', type: 'text', value: 'หินธรรมชาติระดับพรีเมียม' },
      { key: 'hero_title', label: 'Hero title', type: 'text', value: 'Stone, refined' },
      { key: 'hero_sub', label: 'Hero subtitle (TH)', type: 'textarea', value: 'นำเข้าและคัดสรรหินอ่อน หินแกรนิต และโอนิกซ์ จากเหมืองชั้นนำทั่วโลก สำหรับงานสถาปัตยกรรมและงานออกแบบภายในระดับสูง' },
      { key: 'featured_title', label: 'Featured section title', type: 'text', value: 'Featured Slabs' },
    ],
  },
  about: {
    label: 'About / เกี่ยวกับเรา',
    fields: [
      { key: 'about_eyebrow', label: 'Eyebrow', type: 'text', value: 'Since 1998 · Pak Chong' },
      { key: 'about_title', label: 'Title', type: 'text', value: 'A quarter-century in stone' },
      { key: 'about_lead', label: 'Lead paragraph (TH)', type: 'textarea', value: 'บริษัท สโตนคลับ จำกัด เป็นผู้ผลิตและจัดจำหน่ายหินธรรมชาติทุกชนิด นำเข้าและส่งออกหินทั่วโลก ตั้งอยู่ที่ปากช่อง–เขาใหญ่' },
      { key: 'stat_years', label: 'Stat — years', type: 'text', value: '25+' },
      { key: 'stat_projects', label: 'Stat — projects', type: 'text', value: '1,200+' },
      { key: 'stat_countries', label: 'Stat — countries sourced', type: 'text', value: '14' },
      { key: 'stat_slabs', label: 'Stat — slabs in stock', type: 'text', value: '9,000+' },
    ],
  },
  contact: {
    label: 'Contact / ติดต่อ',
    fields: [
      { key: 'addr_th', label: 'Address (TH)', type: 'textarea', value: '258 หมู่ 5 ต.กลางดง อ.ปากช่อง จ.นครราชสีมา 30320' },
      { key: 'email', label: 'Email', type: 'text', value: 'info@stoneclubthailand.com' },
      { key: 'phone', label: 'Phone', type: 'text', value: '044-009927 · 086-465-7340' },
      { key: 'line', label: 'LINE Official', type: 'text', value: '@stoneclubthailand' },
      { key: 'hours', label: 'Opening hours (TH)', type: 'text', value: 'จันทร์–เสาร์ 08:30–17:30 น.' },
    ],
  },
};

/* Recent activity feed for the dashboard */
export const ACTIVITY: Activity[] = [
  { who: 'Nattapong', action: 'อัปเดตราคา', target: 'Bianco Carrara', time: '2 นาทีที่แล้ว', type: 'edit' },
  { who: 'System', action: 'คำขอใหม่จาก', target: 'Studio Manaya', time: '38 นาทีที่แล้ว', type: 'inquiry' },
  { who: 'Mali', action: 'เผยแพร่สินค้า', target: 'Jade Onyx', time: '2 ชั่วโมงที่แล้ว', type: 'publish' },
  { who: 'Nattapong', action: 'อัปโหลดรูป 3 ไฟล์', target: 'Media Library', time: 'เมื่อวานนี้', type: 'media' },
  { who: 'Mali', action: 'ปิดการขาย', target: 'INQ-2038 · Phuket Villa', time: '2 วันที่แล้ว', type: 'won' },
];

export const ADMIN_USER = { name: 'Nattapong S.', role: 'Administrator', initials: 'NS' };
