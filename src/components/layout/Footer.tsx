import Link from 'next/link';
import { services } from '@/lib/data';
import { ArrowRight, Sparkles, Mail, ShieldCheck, Heart } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import ShowcaseManualButton from '@/components/showcase/ShowcaseManualButton';

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

            <p className="text-xs font-medium text-[#64748B] pt-1">
              📍 Motihari, Bihar, India
            </p>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-xs font-bold text-[#131B2E] uppercase tracking-widest mb-4">
              What We Build
            </h3>
            <ul className="space-y-2.5">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors duration-200"
                  >
                    {service.title}
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
              <li>
                <Link href="/projects" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  Our Work
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  Industry Solutions
                </Link>
              </li>
              <li>
                <Link href="/process" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  How We Work
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  Pricing &amp; Packages
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs text-[#64748B] hover:text-[#4338CA] transition-colors">
                  Contact Us
                </Link>
              </li>
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
              <Link
                href="/get-quote"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
              >
                <span>Build My Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <ShowcaseManualButton variant="footer" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {currentYear} Ekaagra Technologies. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="hidden md:inline">Designed for businesses that want to stand out.</span>
            <ShowcaseManualButton variant="footer" className="text-[11px] py-1.5 px-3" />
          </div>
        </div>
      </div>
    </footer>
  );
}




