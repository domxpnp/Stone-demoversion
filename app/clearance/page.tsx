'use client';

import { useRouter } from 'next/navigation';
import { CLEARANCE_ITEMS, BADGE_LABELS } from '@/data/clearance';
import Reveal from '@/components/ui/Reveal';
import Img from '@/components/ui/Img';
import Icon from '@/components/ui/Icon';

export default function ClearancePage() {
  const router = useRouter();

  return (
    <div>
      {/* hero */}
      <section className="clr-hero">
        <div className="clr-hero-img" style={{ backgroundImage: 'url(/photos/unsplash.jpg)' }} />
        <div className="clr-hero-content">
          <span className="clr-kicker">Special Offer</span>
          <h1 className="clr-title">
            Stock
            <span className="it">Clearance</span>
          </h1>
          <p className="clr-sub">
            Premium natural stones at exceptional value. Selected slabs from our
            inventory — available while stocks last. Inquire today to secure your
            allocation.
          </p>
          <p className="clr-note">No pricing listed — contact us for availability &amp; quotation</p>
        </div>
      </section>

      {/* grid */}
      <section className="clr-section">
        <div className="container">
          <Reveal className="clr-sec-head">
            <div>
              <span className="label" style={{ display: 'block', marginBottom: '10px' }}>Current Availability</span>
              <h2>Clearance Items</h2>
            </div>
            <button className="btn-ghost" onClick={() => router.push('/contact')}>
              Enquire All <Icon.arrow />
            </button>
          </Reveal>

          <div className="clr-grid">
            {CLEARANCE_ITEMS.map((item, i) => (
              <Reveal key={item.id} delay={(i % 3) * 80}>
                <button className="clr-card" onClick={() => router.push('/contact')}>
                  <div className="clr-imgwrap">
                    <Img className="clr-img" src={item.img} alt={item.name} />
                    <span className={`clr-badge ${item.badge}`}>
                      {BADGE_LABELS[item.badge]}
                    </span>
                    <span className="clr-enquire">Enquire Now</span>
                  </div>
                  <div className="clr-material">{item.material}</div>
                  <div className="clr-name">{item.name}</div>
                </button>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal className="clr-cta">
            <span className="label">Don&apos;t Miss Out</span>
            <h2>Stock is limited and allocated on a first-come basis</h2>
            <p>
              Our team will provide full specifications, slab availability, and quantities
              upon inquiry. No pricing is listed — contact us directly.
            </p>
            <div className="clr-cta-btns">
              <button className="btn btn-solid" onClick={() => router.push('/contact')}>
                Contact Sales Team
              </button>
              <button className="btn" onClick={() => router.push('/palette')}>
                Send Spec <span className="arr"><Icon.arrow /></span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
