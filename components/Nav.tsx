'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { CLEARANCE_STORAGE_KEY, DEFAULT_CLEARANCE_SETTINGS, loadClearanceConfig } from '@/data/clearance';
import Icon from './ui/Icon';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { basket } = useStore();
  const overHero = pathname === '/';
  const [solid, setSolid] = useState(!overHero);
  // language switcher — UI only for now (no i18n wired up yet)
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');
  const [menuOpen, setMenuOpen] = useState(false);
  // clearance page can be toggled off / relabelled from the admin
  const [clearance, setClearance] = useState(DEFAULT_CLEARANCE_SETTINGS);

  useEffect(() => {
    const read = () => setClearance(loadClearanceConfig().settings);
    read();
    const sync = (e: StorageEvent) => { if (e.key === CLEARANCE_STORAGE_KEY) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    setSolid(!overHero);
    if (!overHero) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  // close the mobile drawer whenever the route changes
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const dark = overHero && !solid;

  const links: [string, string][] = [
    ['Product', '/collection'],
    ...(clearance.enabled ? [[clearance.navLabel, '/clearance'] as [string, string]] : []),
    ['About', '/about'],
    ['Contact', '/contact'],
  ];

  return (
    <header className={`nav${solid ? ' nav-solid' : ''}${dark ? ' nav-over' : ''}`}>
      <div className="nav-inner">
        <button className="brand" onClick={() => router.push('/')}>
          STONECLUB <span>THAILAND</span>
        </button>
        <nav className="nav-links">
          {links.map(([label, path]) => (
            <button
              key={path}
              className={`nav-link${pathname === path ? ' active' : ''}`}
              onClick={() => router.push(path)}
            >
              {label}
            </button>
          ))}
          <div className="nav-actions">
            <div className="lang-switch" role="group" aria-label="Language">
              {(['TH', 'EN'] as const).map(l => (
                <button
                  key={l}
                  className={lang === l ? 'on' : ''}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                >
                  {l}
                </button>
              ))}
            </div>
            <button className="palette-btn thai" onClick={() => router.push('/palette')}>
              เลือกหิน / PALETTE
            </button>
            <button className="basket-btn" onClick={() => router.push('/palette')} aria-label="Project basket">
              <Icon.basket />
              {basket.length > 0 && <span className="badge">{basket.length}</span>}
            </button>
          </div>
        </nav>

        {/* mobile cluster — basket + hamburger */}
        <div className="nav-mobile">
          <button className="basket-btn" onClick={() => router.push('/palette')} aria-label="Project basket">
            <Icon.basket />
            {basket.length > 0 && <span className="badge">{basket.length}</span>}
          </button>
          <button
            className={`nav-burger${menuOpen ? ' on' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div className={`nav-drawer${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="nav-drawer-panel" onClick={e => e.stopPropagation()}>
          {links.map(([label, path]) => (
            <button
              key={path}
              className={`nav-mlink${pathname === path ? ' active' : ''}`}
              onClick={() => router.push(path)}
            >
              {label}
            </button>
          ))}
          <div className="nav-drawer-actions">
            <button className="palette-btn thai" onClick={() => router.push('/palette')}>
              เลือกหิน / PALETTE
            </button>
            <div className="lang-switch" role="group" aria-label="Language">
              {(['TH', 'EN'] as const).map(l => (
                <button
                  key={l}
                  className={lang === l ? 'on' : ''}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
