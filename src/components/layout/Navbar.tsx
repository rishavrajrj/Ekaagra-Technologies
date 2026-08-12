'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MoreVertical, X, ArrowUpRight } from 'lucide-react';
import { navItems } from '@/lib/data';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Filter out Home & Contact from desktop pill list for clean layout
  const navLinks = navItems.filter((item) => item.href !== '/' && item.href !== '/contact');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
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

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#090d16]/95 dark:bg-[#090d16]/95 light:bg-white/95 backdrop-blur-md border-b border-white/10 dark:border-white/10 light:border-slate-200 shadow-2xl'
            : 'bg-[#090d16]/85 dark:bg-[#090d16]/85 light:bg-white/90 backdrop-blur-sm border-b border-white/5 dark:border-white/5 light:border-slate-200/60 shadow-lg'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="Ekaagra Technologies Home">
            <span className="text-lg font-black text-white dark:text-white light:text-slate-900 tracking-wider uppercase font-mono group-hover:text-blue-400 transition-colors">
              EKAAGRA <span className="text-blue-500 font-bold text-xs">TECH</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] dark:bg-white/[0.03] light:bg-slate-100/80 border border-white/10 dark:border-white/10 light:border-slate-200 rounded-full px-4 py-1.5 backdrop-blur-sm">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 text-xs font-medium tracking-wide uppercase transition-all duration-200 rounded-full ${
                    isActive
                      ? 'text-white bg-blue-600/90 shadow-sm'
                      : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-200/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wider uppercase rounded-md transition-all duration-200 shadow-md shadow-blue-900/30 hover:shadow-blue-600/20 active:translate-y-0.5"
            >
              <span>Start a Project</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="p-2.5 text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white dark:hover:text-white light:hover:text-slate-950 border border-white/15 dark:border-white/15 light:border-slate-300 rounded-xl bg-white/10 dark:bg-white/10 light:bg-slate-100 hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center cursor-pointer"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              title={isOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Solid Opaque Overlay */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-x-0 top-16 bottom-0 bg-[#090d16] dark:bg-[#090d16] light:bg-white z-40 flex flex-col justify-between p-6 transition-all duration-300 ease-in-out border-t border-white/10 dark:border-white/10 light:border-slate-200 shadow-2xl overflow-y-auto ${
          isOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col space-y-2 pt-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-widest px-3 mb-1">
            Navigation Menu
          </span>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 border flex items-center justify-between ${
                  isActive
                    ? 'text-white bg-blue-600 dark:bg-blue-600 light:text-white border-blue-500 shadow-md shadow-blue-900/40'
                    : 'text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white light:hover:text-slate-900 bg-white/[0.04] dark:bg-white/[0.04] light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 border-white/10 dark:border-white/10 light:border-slate-200'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </Link>
            );
          })}
        </div>

        <div className="pt-6 mt-auto border-t border-white/10 dark:border-white/10 light:border-slate-200 space-y-4">
          <Link
            href="/get-quote"
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-600/30"
            onClick={() => setIsOpen(false)}
          >
            <span>Start a Project</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 tracking-wider uppercase font-mono">
            Ekaagra Technologies • Building Digital Solutions
          </p>
        </div>
      </div>
    </>
  );
}



