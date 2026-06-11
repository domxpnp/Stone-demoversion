'use client';

import { useRouter } from 'next/navigation';
import { STONES } from '@/data/stones';
import Reveal from '@/components/ui/Reveal';
import Icon from '@/components/ui/Icon';
import Img from '@/components/ui/Img';
import StoneCursor from '@/components/ui/StoneCursor';

export default function HomePage() {
  const router = useRouter();
  const featured = ['bianco-carrara', 'dark-emperador', 'jade-onyx']
    .map(id => STONES.find(s => s.id === id)!);

  const scrollDown = () => window.scrollTo({ top: window.innerHeight * 0.96, behavior: 'smooth' });

  return (
    <div>
      <StoneCursor label="View Stone" />

      {/* hero */}
      <section className="hero">
        <div className="hero-img" style={{ backgroundImage: 'url(/photos/unsplash.jpg)' }} />
        <div className="hero-grain" />
        <div className="hero-meta">
          <span>หินธรรมชาติทุกชนิด</span>
          <span>ปากช่อง<span className="dotsep" />เขาใหญ่<span className="dotsep" />นครราชสีมา</span>
        </div>
        <div className="hero-content">
          <div className="hero-kicker">STONECLUB THAILAND · นครราชสีมา</div>
          <h1 className="hero-title">
            หินธรรมชาติ
            <span className="it">ทุกชนิด</span>
          </h1>
          <p className="hero-sub">
            ผู้นำเข้าและจัดจำหน่ายหินธรรมชาติ นำเข้า–ส่งออกทั่วโลก
            รับประกันคุณภาพและราคาที่ดีที่สุด
          </p>
          <button className="hero-scroll" onClick={scrollDown}>
            <span className="dot"><Icon.chevD /></span>
            เลื่อนลงเพื่อดู
          </button>
        </div>
      </section>

      {/* marquee — stone names */}
      <div className="marquee">
        <div className="marquee-track">
          {[0, 1].map(k => (
            <div className="marquee-item" key={k} aria-hidden={k === 1}>
              {STONES.flatMap(s => [
                <span key={`${k}-${s.id}-n`}>{s.name}</span>,
                <span key={`${k}-${s.id}-s`} className="star">✦</span>,
              ])}
            </div>
          ))}
        </div>
      </div>

      {/* featured slabs */}
      <section className="section-pad">
        <div className="container">
          <Reveal className="sec-head">
            <div>
              <div className="sec-num">I.</div>
              <h2 className="sec-title">Exceptional <span className="it">Slabs</span></h2>
            </div>
            <button className="btn-ghost" onClick={() => router.push('/collection')}>
              View All <Icon.arrow />
            </button>
          </Reveal>
          <div className="slab-grid">
            {featured.map((s, i) => (
              <Reveal key={s.id} delay={i * 110}>
                <button className="slab-card" onClick={() => router.push(`/product/${s.id}`)}>
                  <div className="slab-imgwrap">
                    <Img className="slab-img" src={s.img} alt={s.name} />
                    <span className="slab-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="slab-corner"><Icon.arrow /></span>
                  </div>
                  <div className="slab-name">{s.name}</div>
                  <div className="slab-meta">{s.material} · <b>{s.origin}</b></div>
                  <div className="slab-finish">{s.finish}</div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* about teaser */}
      <section className="teaser split">
        <Reveal className="teaser-text">
          <div className="label-thai">เกี่ยวกับเรา</div>
          <h2 className="teaser-h" style={{ marginTop: '18px' }}>
            จากมือหิน
            <span className="it">สู่มือคุณ</span>
          </h2>
          <p>
            บริษัท สโตนคลับ จำกัด ตั้งอยู่ที่อำเภอปากช่อง จังหวัดนครราชสีมา
            เป็นผู้นำเข้าและจัดจำหน่ายหินธรรมชาติคุณภาพสูง ทั้งหินอ่อน หินแกรนิต
            หินสระว่ายน้ำ หินลูกเต้า หินกราย และหินธรรมชาติอื่นๆ
          </p>
          <p>
            เราคัดสรรหินที่ดีที่สุดจากทั้งในประเทศและต่างประเทศ พร้อมบริการนำเข้า
            และส่งออกตรงจวง เพื่อให้ลูกค้าได้รับสิ่งที่ดีที่สุด
          </p>
          <button className="btn" style={{ marginTop: '18px' }} onClick={() => router.push('/about')}>
            เกี่ยวกับเรา <span className="arr"><Icon.arrow /></span>
          </button>
        </Reveal>
        <div className="teaser-imgwrap">
          <div className="teaser-imgclip">
            <Img src="/photos/txtx.jpg" alt="ครัวหินธรรมชาติ" />
          </div>
          <Reveal className="teaser-tag" delay={150}>
            <div className="big">นำเข้า</div>
            <div className="small">ทั่วโลก</div>
          </Reveal>
        </div>
      </section>

      {/* for architects */}
      <section className="arch">
        <div className="container arch-grid">
          <Reveal>
            <div className="arch-imgwrap">
              <Img className="arch-img" src="/photos/kitchen-island.jpg" alt="โปรเจคสถาปนิก" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="sec-num">II.</div>
            <div className="label">For Architects</div>
            <h2 className="serif" style={{ marginTop: '16px' }}>
              Your Vision,
              <span className="it">Our Stone</span>
            </h2>
            <p>
              Build your Project Palette — select stones, specify quantities, and
              request a detailed quote tailored to your architectural project
              anywhere in Thailand.
            </p>
            <button className="btn" onClick={() => router.push('/collection')}>
              Explore Collection <span className="arr"><Icon.arrow /></span>
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
