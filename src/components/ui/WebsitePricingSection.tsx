'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import { MaintenanceModal, MaintenanceTriggerButton } from '@/components/ui/MaintenanceModal';
import BusinessPricingCarousel from '@/components/ui/BusinessPricingCarousel';

interface WebsitePricingSectionProps {
  className?: string;
  showSectionHeading?: boolean;
}

export function WebsitePricingSection({
  className = '',
  showSectionHeading = true,
}: WebsitePricingSectionProps) {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  return (
    <section id="website-plans" className={`py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2] ${className}`}>
      <MaintenanceModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
      />

      <div className="site-container space-y-10">
        {showSectionHeading && (
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                TRANSPARENT BUSINESS PRICING
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Year 1 Setup with ~50% Annual Renewal
              </h2>
              <p className="section-supporting-subtitle mx-auto">
                Year 1 covers custom architecture, responsive engineering, and public launch. From Year 2 onward, renewal covers production hosting, domain upkeep, maintenance, and technical stability.
              </p>
            </div>
          </Reveal>
        )}

        {/* 7-Plan Responsive Business Pricing Carousel (3 Desktop / 2 Tablet / 1 Mobile) */}
        <Reveal delay={80}>
          <BusinessPricingCarousel mode="link" />
        </Reveal>

        {/* Global Maintenance Trigger Strip */}
        <Reveal delay={150}>
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-[#131B2E]">
                  ✓ Maintenance is included on all website plans.
                </span>{' '}
                <span className="text-[#64748B]">
                  Ensures your website remains properly deployed, live, and operational.
                </span>
              </div>
            </div>

            <MaintenanceTriggerButton onOpen={() => setMaintenanceModalOpen(true)} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default WebsitePricingSection;
