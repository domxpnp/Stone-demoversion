import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost, IBM_Plex_Sans_Thai } from 'next/font/google';
import { StoreProvider } from '@/context/StoreContext';
import SiteChrome from '@/components/SiteChrome';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

const ibmThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'STONECLUB THAILAND',
  description: 'ผู้นำเข้าและจัดจำหน่ายหินธรรมชาติ นำเข้า-ส่งออกทั่วโลก รับประกันคุณภาพและราคาที่ดีที่สุด',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${cormorant.variable} ${jost.variable} ${ibmThai.variable}`}>
      <body>
        <StoreProvider>
          <SiteChrome>{children}</SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
