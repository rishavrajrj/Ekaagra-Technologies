import Link from 'next/link';
import Image from 'next/image';
import { services } from '@/lib/data';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#060911] text-slate-400 border-t border-white/10 relative overflow-hidden" role="contentinfo">
      {/* Subtle background watermark */}
      <div 
        aria-hidden="true" 
        className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/3 select-none pointer-events-none opacity-[0.02] text-white font-extrabold text-[14vw] tracking-tighter leading-none whitespace-nowrap"
      >
        EKAAGRA
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-white/[0.08]">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block" aria-label="Ekaagra Technologies Home">
              <span className="text-xl font-black text-white tracking-wider uppercase font-mono">
                EKAAGRA <span className="text-blue-500 font-bold text-sm">TECH</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Independent digital product studio. We design and develop custom websites, web applications, mobile software, and enterprise ERP solutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Available for new projects</span>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {service.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/solutions" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Projects Showcase
                </Link>
              </li>
              <li>
                <Link href="/process" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Our Process
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Pricing &amp; Rates
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-xs text-slate-400 hover:text-white transition-colors">
                  About Ekaagra
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Action Column */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Get Started
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Have a project requirement? Talk to our technology team today.
            </p>
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider uppercase rounded border border-white/15 transition-all duration-200"
            >
              <span>Request Quote</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} Ekaagra Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300">Web • Mobile • Software • ERP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


