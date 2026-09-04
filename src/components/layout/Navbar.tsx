'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ShowcaseManualButton from '@/components/showcase/ShowcaseManualButton';
import { useShowcase } from '@/components/showcase/ShowcaseProvider';
import MagneticButton from '@/components/motion/MagneticButton';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { isOpen: isShowcaseOpen } = useShowcase();

  // Links for desktop nav bar
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Our Work', href: '/projects' },
    { label: 'Services', href: '/services' },
    { label: 'Schools', href: '/schools' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isShowcaseOpen) {
    return null;
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm'
            : 'bg-[#FAF7F2]/85 backdrop-blur-sm border-b border-[#E2E8F0]/60'
        }`}
      >
        <nav
          className="site-container h-18 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Logo Mark */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 transition-transform duration-200 hover:scale-[1.02] min-w-0"
            aria-label="Ekaagra Technologies Home"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-[#F1ECE4]/80 border border-[#E2E8F0] rounded-full px-4 py-1.5 shadow-inner">
            {navLinks.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 rounded-full ${
                    isActive
                      ? 'text-white bg-[#4338CA] shadow-sm'
                      : 'text-[#475569] hover:text-[#131B2E] hover:bg-white/70'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right CTA */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <ShowcaseManualButton variant="navbar" />
            <MagneticButton maxDistance={6}>
              <Link
                href="/get-quote"
                className="premium-shimmer-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold tracking-wide uppercase rounded-xl transition-all duration-200 shadow-lg shadow-[#4338CA]/25 hover:shadow-xl hover:shadow-[#4338CA]/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Build My Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </MagneticButton>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              className="p-2 sm:p-2.5 text-[#131B2E] border border-[#E2E8F0] rounded-xl bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#4338CA] transition-all flex items-center justify-center cursor-pointer shadow-sm"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed inset-x-0 top-18 bottom-0 bg-[#FAF7F2] z-40 flex flex-col justify-between p-6 transition-all duration-300 ease-in-out border-t border-[#E2E8F0] shadow-2xl overflow-y-auto ${
          isOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col space-y-2 pt-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest px-3 mb-1">
            Menu Navigation
          </span>
          {navLinks.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border flex items-center justify-between ${
                  isActive
                    ? 'text-white bg-[#4338CA] border-[#4338CA] shadow-md shadow-[#4338CA]/30'
                    : 'text-[#131B2E] bg-white/60 border-[#E2E8F0] hover:bg-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </Link>
            );
          })}
        </div>

        <div className="pt-6 mt-auto border-t border-[#E2E8F0] space-y-4">
          <Link
            href="/get-quote"
            className="flex items-center justify-center gap-2 w-full px-5 py-4 bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold tracking-wide uppercase rounded-xl transition-all shadow-xl shadow-[#4338CA]/30"
            onClick={() => setIsOpen(false)}
          >
            <Sparkles className="w-4 h-4 text-[#F4C95D]" />
            <span>Build My Website</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-xs text-[#64748B] font-medium">
            Ekaagra Technologies • Beautiful Websites That Convert
          </p>
        </div>
      </div>
    </>
  );
}





