'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Img from '@/components/ui/Img';

interface Row {
  n: string;
  img: string;
  tag: string;
  flip?: boolean;
  th: string;
  it: string;
  p: string;
  list: [string, string][];
}

const ROWS: Row[] = [
  {
    n: 'I.', img: '/photos/bianco-carrara.jpg', tag: 'Material',
    th: 'หินทุกชนิด', it: 'in one place',
    p: 'หินอ่อน หินแกรนิต หินสระว่ายน้ำ หินลูกเต๋า หินทราย และหินธรรมชาติชนิดอื่นๆ ครบครันทั้งของไทยและต่างประเทศ คัดสรรเพื่อโครงการของคุณโดยเฉพาะ',
    list: [
      ['หินอ่อน', 'Marble'], ['หินแกรนิต', 'Granite'], ['หินสระว่ายน้ำ', 'Pool stone'],
      ['หินลูกเต๋า', 'Cube stone'], ['หินทราย', 'Sandstone'], ['ทรเวอร์ทีน · โอนิกซ์', 'Travertine · Onyx'],
    ],
  },
  {
    n: 'II.', img: '/photos/kitchen-wide.jpg', tag: 'Sourcing', flip: true,
    th: 'นำเข้า·ส่งออก', it: 'ทั่วโลก',
    p: 'เราคัดเลือกหินที่ดีที่สุดทั้งในประเทศและต่างประเทศ พร้อมบริการนำเข้าและส่งออกครบวงจร เพื่อให้ลูกค้าได้รับสิ่งที่ดีที่สุดเสมอ',
    list: [
      ['Italy', 'Carrara · Tuscany'], ['Spain', 'Marquina · Emperador'],
      ['Iran', 'Onyx · Travertine'], ['Brazil', 'Azul · Quartzite'], ['Turkey', 'Silver Travertine'],
    ],
  },
  {
    n: 'III.', img: '/photos/jade-onyx.jpg', tag: 'Promise',
    th: 'รับประกัน', it: 'คุณภาพ และราคา',
    p: 'รับประกันคุณภาพและราคาที่ดีที่สุดในปากช่อง–เขาใหญ่ ทุกแผ่นผ่านการคัดเลือกและตรวจสอบจากทีมผู้เชี่ยวชาญของ บริษัท สโตนคลับ จำกัด',
    list: [
      ['ตัวอย่างหินจริง', 'Real samples'],
      ['ตรวจวัดและตัดตามแบบ', 'Custom cut'],
      ['ขนส่งและติดตั้ง', 'Logistics'],
    ],
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <div className="container">
          {/* MASTHEAD */}
          <div className="ab-mast">
            <div className="left">
              <div className="eyebrow">About — เกี่ยวกับเรา</div>
              <h1>
                From the quarry,
                <span className="it">to your hand.</span>
              </h1>
              <p className="lead">
                <span className="dc">ที่</span>ตั้งของเราอยู่ในอำเภอปากช่อง จังหวัดนครราชสีมา
                บริษัท สโตนคลับ จำกัด เป็นผู้ผลิตและจัดจำหน่ายหินธรรมชาติทุกชนิด
                พร้อมบริการนำเข้า–ส่งออกทั่วโลก เพื่อความต้องการและสิ่งที่ดีที่สุดสำหรับลูกค้าทุกราย
              </p>
            </div>
            <div className="figure">
              <Img src="/photos/dark-emperador.jpg" alt="หินอ่อน Dark Emperador" />
              <div className="frame" />
              <div className="cap">Dark Emperador · Spain</div>
            </div>
          </div>

          {/* STATS */}
          <div className="ab-stats">
            <div className="ab-stat">
              <div className="num">2009</div>
              <div className="lbl">Established</div>
              <div className="th">ก่อตั้ง · ปากช่อง</div>
            </div>
            <div className="ab-stat">
              <div className="num">50<span className="it">+</span></div>
              <div className="lbl">Stone Varieties</div>
              <div className="th">หินธรรมชาติทุกชนิด</div>
            </div>
            <div className="ab-stat">
              <div className="num">6</div>
              <div className="lbl">Categories</div>
              <div className="th">หมวดหินครบครัน</div>
            </div>
            <div className="ab-stat">
              <div className="num">∞</div>
              <div className="lbl">Worldwide Reach</div>
              <div className="th">นำเข้า · ส่งออกทั่วโลก</div>
            </div>
          </div>
        </div>
      </div>

      {/* QUOTE */}
      <section className="ab-quote">
        <div className="bgimg" style={{ backgroundImage: 'url(/photos/kitchen-island.jpg)' }} />
        <div className="container">
          <span className="mark">&ldquo;</span>
          <blockquote>
            หินทุกแผ่นคือ <span className="em">ลายเซ็นของธรรมชาติ</span> — เรามีหน้าที่นำมันมาวางในที่ที่เหมาะสมที่สุดในโครงการของคุณ
          </blockquote>
          <div className="attrib">บริษัท สโตนคลับ จำกัด · ปากช่อง</div>
        </div>
      </section>

      {/* EDITORIAL ROWS */}
      <div className="container">
        <div className="ab-rows">
          {ROWS.map((r, i) => (
            <div key={i} className={'ab-row' + (r.flip ? ' flip' : '')}>
              <div className="ab-img">
                <Img src={r.img} alt={r.th} />
                <span className="tag">{r.tag}</span>
              </div>
              <div className="ab-text">
                <div className="rn">{r.n}</div>
                <h3>{r.th} <span className="it">{r.it}</span></h3>
                <p>{r.p}</p>
                <ul>
                  {r.list.map(([t, e], j) => (
                    <li key={j}>{t}<span>{e}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CITIES TICKER */}
      <section className="ab-cities">
        <span className="label">Delivering to</span>
        <div className="ab-cities-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <div className="ab-city" key={k}>
              ปากช่อง<span className="sep">✦</span>
              Bangkok<span className="sep">✦</span>
              <span className="it">Milano</span><span className="sep">✦</span>
              Singapore<span className="sep">✦</span>
              <span className="it">Dubai</span><span className="sep">✦</span>
              Tokyo<span className="sep">✦</span>
              <span className="it">New York</span><span className="sep">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="bg" style={{ backgroundImage: 'url(/photos/kitchen-island.jpg)' }} />
        <div className="cta-inner">
          <div className="eyebrow">Begin Your Project</div>
          <h2>Curate your <span className="it">stone palette.</span></h2>
          <button className="btn btn-light" onClick={() => router.push('/collection')}>
            ดูคอลเลคชันหิน <span className="arr"><Icon.arrow /></span>
          </button>
        </div>
      </section>
    </div>
  );
}