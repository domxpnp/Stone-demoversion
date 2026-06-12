export type BadgeType = 'limited' | 'clearance' | 'last';

export interface ClearanceItem {
  id: string;
  name: string;
  material: string;
  img: string;
  badge: BadgeType;
  hidden?: boolean;
}

export const BADGE_LABELS: Record<BadgeType, string> = {
  limited: 'Limited Stock',
  clearance: 'Clearance',
  last: 'Last Pieces',
};

/* swatch colours mirror .clr-badge.* in globals.css */
export const BADGE_COLORS: Record<BadgeType, string> = {
  limited: '#9b1c1c',
  clearance: '#dc2626',
  last: '#92400e',
};

export interface ClearanceSettings {
  /* whether the page is live on the site (also hides the nav link) */
  enabled: boolean;
  /* navigation label for the page */
  navLabel: string;
  /* grid density on desktop */
  columns: 2 | 3 | 4;
  /* show the "Enquire Now" label on card hover */
  showEnquireHover: boolean;
  hero: {
    kicker: string;
    titleTop: string;
    titleIt: string;
    sub: string;
    note: string;
    img: string;
  };
  section: {
    label: string;
    title: string;
  };
  cta: {
    label: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
}

export interface ClearanceConfig {
  settings: ClearanceSettings;
  items: ClearanceItem[];
}

export const DEFAULT_CLEARANCE_SETTINGS: ClearanceSettings = {
  enabled: true,
  navLabel: 'Stock Clearance',
  columns: 3,
  showEnquireHover: true,
  hero: {
    kicker: 'Special Offer',
    titleTop: 'Stock',
    titleIt: 'Clearance',
    sub: 'Premium natural stones at exceptional value. Selected slabs from our inventory — available while stocks last. Inquire today to secure your allocation.',
    note: 'No pricing listed — contact us for availability & quotation',
    img: '/photos/unsplash.jpg',
  },
  section: {
    label: 'Current Availability',
    title: 'Clearance Items',
  },
  cta: {
    label: "Don't Miss Out",
    title: 'Stock is limited and allocated on a first-come basis',
    body: 'Our team will provide full specifications, slab availability, and quantities upon inquiry. No pricing is listed — contact us directly.',
    primary: 'Contact Sales Team',
    secondary: 'Send Spec',
  },
};

export const CLEARANCE_ITEMS: ClearanceItem[] = [
  { id: 'clr-calacatta-oro', name: 'Calacatta Oro Marble', material: 'Marble', img: '/photos/bianco-carrara.jpg', badge: 'limited' },
  { id: 'clr-black-granite', name: 'Black Granite Slab', material: 'Granite', img: '/photos/nero-marquina.jpg', badge: 'clearance' },
  { id: 'clr-ivory-travertine', name: 'Ivory Travertine', material: 'Travertine', img: '/photos/silver-travertine.jpg', badge: 'last' },
  { id: 'clr-silver-slate', name: 'Silver Grey Slate', material: 'Slate', img: '/photos/blankimg.jpg', badge: 'clearance' },
  { id: 'clr-emperador-dark', name: 'Emperador Dark Marble', material: 'Marble', img: '/photos/dark-emperador.jpg', badge: 'limited' },
  { id: 'clr-botticino', name: 'Botticino Classico', material: 'Marble', img: '/photos/blankimg.jpg', badge: 'last' },
];

export const DEFAULT_CLEARANCE_CONFIG: ClearanceConfig = {
  settings: DEFAULT_CLEARANCE_SETTINGS,
  items: CLEARANCE_ITEMS,
};

/* ---- persistence (demo: localStorage so admin edits drive the live page) ---- */
const STORAGE_KEY = 'sc_clearance_config';
export const CLEARANCE_STORAGE_KEY = STORAGE_KEY;

/** Merge a stored (possibly partial/older) config over defaults so it stays valid. */
function withDefaults(raw: Partial<ClearanceConfig> | null): ClearanceConfig {
  if (!raw) return DEFAULT_CLEARANCE_CONFIG;
  const s: Partial<ClearanceSettings> = raw.settings || {};
  return {
    settings: {
      ...DEFAULT_CLEARANCE_SETTINGS,
      ...s,
      hero: { ...DEFAULT_CLEARANCE_SETTINGS.hero, ...(s.hero || {}) },
      section: { ...DEFAULT_CLEARANCE_SETTINGS.section, ...(s.section || {}) },
      cta: { ...DEFAULT_CLEARANCE_SETTINGS.cta, ...(s.cta || {}) },
    },
    items: Array.isArray(raw.items) ? raw.items : CLEARANCE_ITEMS,
  };
}

export function loadClearanceConfig(): ClearanceConfig {
  if (typeof window === 'undefined') return DEFAULT_CLEARANCE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return withDefaults(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_CLEARANCE_CONFIG;
  }
}

export function saveClearanceConfig(config: ClearanceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
