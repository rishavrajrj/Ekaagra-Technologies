import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Ekaagra Technologies | Web, Software & Android Development',
    template: '%s | Ekaagra Technologies',
  },
  description:
    'Ekaagra Technologies builds professional websites, web applications, Android apps, custom software, and ERP solutions for businesses and organizations.',
  keywords: [
    'web development',
    'software development',
    'android development',
    'school ERP',
    'custom software',
    'web applications',
    'Ekaagra Technologies',
  ],
  authors: [{ name: 'Ekaagra Technologies' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Ekaagra Technologies',
    title: 'Ekaagra Technologies | Web, Software & Android Development',
    description:
      'Ekaagra Technologies builds professional websites, web applications, Android apps, custom software, and ERP solutions for businesses and organizations.',
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ProfessionalService',
              name: 'Ekaagra Technologies',
              description:
                'Software development business focused on creating practical digital solutions for businesses, educational institutions, organizations, and startups.',
              url: 'https://ekaagratechnologies.in',
              serviceType: [
                'Web Development',
                'Software Development',
                'Android App Development',
                'School ERP Systems',
                'Business Management Software',
              ],
              areaServed: {
                '@type': 'Country',
                name: 'India',
              },
              knowsAbout: [
                'Web Development',
                'React',
                'Next.js',
                'Java',
                'Spring Boot',
                'Android Development',
                'PostgreSQL',
                'MySQL',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased font-sans selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

