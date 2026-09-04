import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ShowcaseProvider } from '@/components/showcase/ShowcaseProvider';
import ShowcaseMode from '@/components/showcase/ShowcaseMode';
import ScrollProgress from '@/components/motion/ScrollProgress';
import BackToTop from '@/components/motion/BackToTop';
import PricingOfferPopup from '@/components/ui/PricingOfferPopup';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

import {
  SITE_URL,
  BRAND_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  organizationSchema,
  websiteSchema,
} from '@/lib/seo.config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: BRAND_NAME }],
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: '/images/logo/logo.webp', type: 'image/webp' },
    ],
    shortcut: ['/images/logo/logo.webp'],
    apple: [
      { url: '/images/logo/logo.webp', type: 'image/webp' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: BRAND_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`light ${plusJakartaSans.variable} ${inter.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <head>
        <link rel="icon" href="/images/logo/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/images/logo/logo.webp" />
        <link rel="shortcut icon" href="/images/logo/logo.webp" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema()),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#131B2E] antialiased font-sans selection:bg-[#4338CA] selection:text-white">
        <ShowcaseProvider>
          <ScrollProgress />
          <Navbar />
          <main className="flex-1 pt-18">{children}</main>
          <Footer />
          <BackToTop />
          <ShowcaseMode />
          <PricingOfferPopup />
        </ShowcaseProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}



