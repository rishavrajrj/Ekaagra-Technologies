import type { Metadata } from 'next';
import Link from 'next/link';
import FeaturedProjectCarousel from '@/components/ui/FeaturedProjectCarousel';
import { projects } from '@/lib/data';
import { ArrowRight, Sparkles } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'Explore our portfolio of real websites, web applications, and custom software systems designed for businesses, schools, and organizations.',
};

export default function ProjectsPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative">
        <div className="site-container text-center space-y-4">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
              PROVEN TRACK RECORD
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
              Our Work &amp; Case Studies
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Real products, custom websites, web platforms, and mobile software applications built around actual client requirements.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Featured Showcase & Case Studies Section with Arrow Carousel */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]" id="portfolio">
        <div className="site-container space-y-12 sm:space-y-16">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-8">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                  FEATURED WORK &amp; CASE STUDIES
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
                  Websites that make businesses look better.
                </h2>
                <p className="text-base text-[#64748B] max-w-2xl leading-relaxed">
                  Every project is designed around the people who will use it — and the business goals behind it.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Interactive Featured Project Carousel & Connected Case Studies Grid */}
          <FeaturedProjectCarousel
            projects={projects}
            gridProjects={projects}
            gridTitle="Interactive Showroom • Click any card to load in the showcase above"
            gridSubtitle={`Showing all ${projects.length} Case Studies`}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
              Ready to Build Your Project?
            </h2>
            <p className="text-base text-[#64748B] max-w-lg mx-auto leading-relaxed mt-2">
              Let us collaborate to build a customized digital solution tailored to your exact business goals.
            </p>
            <div className="pt-6">
              <MagneticButton maxDistance={6}>
                <Link 
                  href="/get-quote"
                  className="premium-shimmer-btn inline-flex items-center gap-2 px-8 py-4 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 hover:-translate-y-0.5"
                >
                  <span>Build My Website</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
