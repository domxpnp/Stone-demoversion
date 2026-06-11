'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STONES, FACETS } from '@/data/stones';
import Reveal from '@/components/ui/Reveal';
import Img from '@/components/ui/Img';
import StoneCursor from '@/components/ui/StoneCursor';

type Filters = Record<string, string[]>;

export default function CollectionPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({ Material: [], Origin: [], Finish: [], Color: [] });

  const toggle = (group: string, val: string) =>
    setFilters(f => ({
      ...f,
      [group]: f[group].includes(val) ? f[group].filter(x => x !== val) : [...f[group], val],
    }));

  const clearAll = () => setFilters({ Material: [], Origin: [], Finish: [], Color: [] });
  const anyActive = Object.values(filters).some(a => a.length > 0);

  const shown = STONES.filter(s =>
    Object.keys(filters).every(g => {
      const sel = filters[g];
      if (!sel.length) return true;
      return sel.includes(s[g.toLowerCase() as keyof typeof s] as string);
    })
  );

  return (
    <div className="page">
      <StoneCursor label="View Stone" />
      <div className="container">
        <Reveal className="page-head">
          <span className="label">The Slab Library</span>
          <h1 className="serif" style={{ fontSize: 'clamp(48px,6vw,84px)', fontWeight: 500, lineHeight: 1 }}>
            Our Collection
          </h1>
        </Reveal>

        <div className="coll-layout">
          {/* filters */}
          <aside className="filters">
            <div className="filter-count">Filter · {STONES.length} Stones</div>
            {Object.keys(FACETS).map(group => (
              <div className="filter-group" key={group}>
                <span className="label">{group}</span>
                {FACETS[group].map(val => {
                  const on = filters[group].includes(val);
                  const available = STONES.some(s => s[group.toLowerCase() as keyof typeof s] === val);
                  return (
                    <button
                      key={val}
                      className={`facet${on ? ' on' : ''}`}
                      style={!available ? { opacity: 0.4 } : undefined}
                      onClick={() => toggle(group, val)}
                    >
                      <span className="tick">{on ? '×' : ''}</span>{val}
                    </button>
                  );
                })}
              </div>
            ))}
            {anyActive && (
              <button className="clear-btn" onClick={clearAll}>Clear filters</button>
            )}
          </aside>

          {/* grid */}
          <div className="coll-grid">
            {shown.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 90}>
                <button className="slab-card" onClick={() => router.push(`/product/${s.id}`)}>
                  <div className="slab-imgwrap">
                    <Img className="slab-img" src={s.img} alt={s.name} />
                  </div>
                  <div className="slab-name">{s.name}</div>
                  <div className="slab-meta">{s.material} · <b>{s.origin}</b></div>
                  <div className="slab-finish">{s.finish}</div>
                </button>
              </Reveal>
            ))}
            {shown.length === 0 && (
              <div className="no-result">No stones match these filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
