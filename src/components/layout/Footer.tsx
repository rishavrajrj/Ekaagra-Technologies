import Link from 'next/link';
import { services } from '@/lib/data';
import { ArrowRight, Sparkles, Mail, ShieldCheck, Heart } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ShowcaseManualButton from '@/components/showcase/ShowcaseManualButton';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FAF7F2] text-[#475569] border-t border-[#E2E8F0] relative overflow-hidden" role="contentinfo">
      {/* Subtle background ambient blur */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 right-0 w-96 h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none"
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-0 left-0 w-96 h-96 bg-[#F97360]/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="site-container pt-16 pb-12 relative z-10">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-[#E2E8F0]">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]" aria-label="Ekaagra Technologies Home">
                <Logo size="md" />
              </Link>
              
              <p className="text-sm text-[#64748B] max-w-sm leading-relaxed">
                We design and build custom websites, web applications, mobile apps, and business software systems designed to represent your organization with clarity and authority.
              </p>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#131B2E]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Available for new website &amp; software projects</span>
              </div>

              <div className="space-y-1 text-xs font-medium text-[#64748B] pt-1">
                <p>📍 Motihari, East Champaran, Bihar, India</p>
                <p>
                  ✉️{' '}
                  <a href="mailto:ekaagratechnologies@gmail.com" className="hover:text-[#4338CA] transition-colors">
                    ekaagratechnologies@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Services Column */}
            <div>
              <h3 className="text-xs font-bold text-[#131B2E] uppercase tracking-widest mb-4">
                What We Build
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/website-development-motihari"
                    className="group inline-flex items-center gap-1 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] transition-colors duration-200"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      Web Development in Motihari &rarr;
                    </span>
                  </Link>
                </li>
                {services.slice(0, 5).map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="group inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#4338CA] transition-colors duration-200"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {service.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation Column */}
            <div>
              <h3 className="text-xs font-bold text-[#131B2E] uppercase tracking-widest mb-4">
                Navigation
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: 'Our Work', href: '/projects' },
                  { label: 'Services', href: '/services' },
                  { label: 'Industry Solutions', href: '/solutions' },
                  { label: 'How We Work', href: '/process' },
                  { label: 'Pricing & Packages', href: '/pricing' },
                  { label: 'Blog & Guides', href: '/blog' },
                  { label: 'About Us', href: '/about' },
                  { label: 'Contact Us', href: '/contact' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#4338CA] transition-colors duration-200"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Action Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#131B2E] uppercase tracking-widest">
                Ready to Upgrade?
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Get a tailored design estimate for your business or school website within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 items-start">
                <MagneticButton maxDistance={5}>
                  <Link
                    href="/get-quote"
                    className="premium-shimmer-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20 hover:-translate-y-0.5"
                  >
                    <span>Build My Website</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </MagneticButton>
                <ShowcaseManualButton variant="footer" />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {currentYear} Ekaagra Technologies. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="hidden md:inline">Designed for businesses that want to stand out.</span>
            <ShowcaseManualButton variant="footer" className="hidden lg:inline-flex text-[11px] py-1.5 px-3" />
          </div>
        </div>
      </div>
    </footer>
  );
}




