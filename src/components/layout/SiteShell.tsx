'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/motion/ScrollProgress';
import BackToTop from '@/components/motion/BackToTop';
import ShowcaseMode from '@/components/showcase/ShowcaseMode';
import PricingOfferPopup from '@/components/ui/PricingOfferPopup';
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalone =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/school-onboarding') ||
    pathname?.startsWith('/schools/onboarding') ||
    pathname?.startsWith('/business-requirements') ||
    pathname?.startsWith('/design-review');

  // If on an admin or dedicated portal page, do not render consumer navbar, footer, or popups
  if (isStandalone) {
    const isAdmin = pathname?.startsWith('/admin');
    return (
      <div
        className={`min-h-[100dvh] w-full flex flex-col ${
          isAdmin ? 'bg-[#0B1120] text-slate-100' : ''
        }`}
      >
        {children}
      </div>
    );
  }

  // Public consumer site shell
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
      <BackToTop />
      <ShowcaseMode />
      <PricingOfferPopup />
    </>
  );
}
