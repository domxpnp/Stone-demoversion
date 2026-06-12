'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STONES } from '@/data/stones';
import { useStore } from '@/context/StoreContext';
import Icon from '@/components/ui/Icon';
import Img from '@/components/ui/Img';

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { inBasket, addToBasket } = useStore();
  const s = STONES.find(x => x.id === params.id) ?? STONES[0];

  const views = [
    { img: s.img, label: 'Raw Slab' },
    { img: s.img, label: 'Macro Detail' },
    { img: '/photos/kitchen-island.jpg', label: 'In-Situ' },
  ];
  const [active, setActive] = useState(0);
  const added = inBasket(s.id);

  return (
    <div className="page">
      <div className="container">
        <button className="back-link" onClick={() => router.push('/collection')}>
          <Icon.arrowL /> Back to Collection
        </button>

        <div className="prod-grid">
          {/* gallery */}
          <div>
            <div className="prod-main">
              <Img className="prod-mainimg" src={views[active].img} alt={s.name} />
              <button className="prod-zoom" aria-label="Zoom">
                <Icon.zoom />
              </button>
            </div>
            <div className="prod-thumbs">
              {views.map((v, i) => (
                <button
                  key={i}
                  className="prod-thumb"
                  onClick={() => setActive(i)}
                  style={i === active ? { outline: '2px solid var(--gold)', outlineOffset: '-2px' } : undefined}
                >
                  <Img src={v.img} alt={v.label} />
                  <span className="tlabel">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* info */}
          <div className="prod-info">
            {s.premium && <span className="badge-prem">Premium</span>}
            <h1 className="prod-title">{s.name}</h1>
            <div className="prod-sub">{s.material} · {s.origin}</div>
            <p className="prod-desc">{s.desc}</p>
            <p className="prod-thaidesc">{s.thai}</p>

            <div className="prod-tags">
              {s.tags.map(tag => (
                <button
                  key={tag}
                  className="prod-tag"
                  onClick={() => router.push(`/collection?tag=${encodeURIComponent(tag)}`)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="spec-label">Technical Specifications</div>
            <table className="spec-table">
              <tbody>
                <tr><td>Material</td><td>{s.material}</td></tr>
                <tr><td>Origin</td><td>{s.origin}</td></tr>
                <tr><td>Finish</td><td>{s.finish}</td></tr>
                <tr><td>Color</td><td>{s.color}</td></tr>
                {Object.entries(s.spec).map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td>{v}</td></tr>
                ))}
                <tr>
                  <td>Applications</td>
                  <td style={{ maxWidth: '260px' }}>{s.applications}</td>
                </tr>
              </tbody>
            </table>

            <div className="prod-actions">
              {added ? (
                <button className="btn btn-block in-basket">
                  <Icon.check /> In Your Project Basket
                </button>
              ) : (
                <button className="btn btn-block btn-solid" onClick={() => addToBasket(s.id)}>
                  <Icon.basket /> Add to Project Basket
                </button>
              )}
              <div className="row2">
                <button className="btn"><Icon.mail /> Request Sample</button>
                <button className="btn"><Icon.doc /> Get Specs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
