'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Icon from './ui/Icon';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { basket } = useStore();
  const overHero = pathname === '/';
  const [solid, setSolid] = useState(!overHero);
  // language switcher — UI only for now (no i18n wired up yet)
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');

  useEffect(() => {
    setSolid(!overHero);
    if (!overHero) return;
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  const dark = overHero && !solid;

  const links: [string, string][] = [
    ['Product', '/collection'],
    ['Stock Clearance', '/clearance'],
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
      </div>
    </header>
  );
}
