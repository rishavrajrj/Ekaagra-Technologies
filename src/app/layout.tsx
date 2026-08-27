import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://ekaagratechnologies.in'),
  title: {
    default: 'Ekaagra Technologies | Premium Website & Digital Product Studio',
    template: '%s | Ekaagra Technologies',
  },
  description:
    'Ekaagra Technologies designs and develops beautiful, fast, and conversion-focused websites, web applications, mobile apps, and custom software systems.',
  keywords: [
    'website design agency',
    'custom web development',
    'business websites',
    'school website design',
    'school ERP systems',
    'web applications',
    'android app development',
    'Ekaagra Technologies',
  ],
  authors: [{ name: 'Ekaagra Technologies' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Ekaagra Technologies',
    title: 'Ekaagra Technologies | Premium Website & Digital Product Studio',
    description:
      'Beautiful, fast and conversion-focused websites designed around your business — not another generic template.',
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
      lang="en"
      className={`light ${plusJakartaSans.variable} ${inter.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'Ekaagra Technologies',
              description:
                'Premium website design and digital product development studio creating high-converting websites, web applications, Android apps, and School ERP systems.',
              url: 'https://ekaagratechnologies.in',
              serviceType: [
                'Website Design & Development',
                'Web Application Development',
                'Mobile App Development',
                'School ERP Systems',
                'Custom Business Software',
              ],
              areaServed: {
                '@type': 'Country',
                name: 'India',
              },
              knowsAbout: [
                'Website Design',
                'Next.js',
                'React',
                'TypeScript',
                'Tailwind CSS',
                'Android Development',
                'PostgreSQL',
                'Supabase',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#131B2E] antialiased font-sans selection:bg-[#4338CA] selection:text-white">
        <Navbar />
        <main className="flex-1 pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}



