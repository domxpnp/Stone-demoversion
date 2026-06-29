'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BADGE_LABELS,
  DEFAULT_CLEARANCE_CONFIG,
  type ClearanceConfig,
} from '@/data/clearance';
import Reveal from '@/components/ui/Reveal';
import Img from '@/components/ui/Img';
import Icon from '@/components/ui/Icon';

export default function ClearancePage() {
  const router = useRouter();

  // start from defaults for SSR, then hydrate from the live (DB-backed) config
  const [config, setConfig] = useState<ClearanceConfig>(DEFAULT_CLEARANCE_CONFIG);
  useEffect(() => {
    let ignore = false;
    fetch('/api/clearance')
      .then(r => (r.ok ? r.json() : null))
      .then((data: ClearanceConfig | null) => { if (!ignore && data) setConfig(data); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  const { settings } = config;
  const { hero, section, cta } = settings;
  const items = config.items.filter(i => !i.hidden);

  if (!settings.enabled) {
    return (
      <section className="clr-section">
        <div className="container">
          <Reveal className="clr-cta">
            <span className="label">Stock Clearance</span>
            <h2>Our clearance selection is being refreshed</h2>
            <p>New offers are on the way. In the meantime, our team is happy to help with availability and quotations.</p>
            <div className="clr-cta-btns">
              <button className="btn btn-solid" onClick={() => router.push('/contact')}>Contact Sales Team</button>
              <button className="btn" onClick={() => router.push('/collection')}>Browse Catalogue <span className="arr"><Icon.arrow /></span></button>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <div>
      {/* hero */}
      <section className="clr-hero">
        <div className="clr-hero-img" style={{ backgroundImage: `url(${hero.img})` }} />
        <div className="clr-hero-content">
          <span className="clr-kicker">{hero.kicker}</span>
          <h1 className="clr-title">
            {hero.titleTop}
            <span className="it">{hero.titleIt}</span>
          </h1>
          <p className="clr-sub">{hero.sub}</p>
          {hero.note && <p className="clr-note">{hero.note}</p>}
        </div>
      </section>

      {/* grid */}
      <section className="clr-section">
        <div className="container">
          <Reveal className="clr-sec-head">
            <div>
              <span className="label" style={{ display: 'block', marginBottom: '10px' }}>{section.label}</span>
              <h2>{section.title}</h2>
            </div>
            <button className="btn-ghost" onClick={() => router.push('/contact')}>
              Enquire All <Icon.arrow />
            </button>
          </Reveal>

          <div className="clr-grid" style={{ ['--clr-cols' as string]: settings.columns }}>
            {items.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 80}>
                <button className="clr-card" onClick={() => router.push('/contact')}>
                  <div className="clr-imgwrap">
                    <Img className="clr-img" src={item.img} alt={item.name} />
                    <span className={`clr-badge ${item.badge}`}>
                      {BADGE_LABELS[item.badge]}
                    </span>
                    {settings.showEnquireHover && <span className="clr-enquire">Enquire Now</span>}
                  </div>
                  <div className="clr-material">{item.material}</div>
                  <div className="clr-name">{item.name}</div>
                </button>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal className="clr-cta">
            <span className="label">{cta.label}</span>
            <h2>{cta.title}</h2>
            <p>{cta.body}</p>
            <div className="clr-cta-btns">
              <button className="btn btn-solid" onClick={() => router.push('/contact')}>
                {cta.primary}
              </button>
              <button className="btn" onClick={() => router.push('/palette')}>
                {cta.secondary} <span className="arr"><Icon.arrow /></span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
