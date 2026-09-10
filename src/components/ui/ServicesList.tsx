import Link from 'next/link';
import {
  Globe,
  LayoutDashboard,
  Smartphone,
  Code2,
  GraduationCap,
  Building2,
  Server,
  Wrench,
  ArrowRight,
  Check,
} from 'lucide-react';
import { services } from '@/lib/data';
import type { LucideIcon } from 'lucide-react';

import Reveal from '@/components/motion/Reveal';
import StaggerReveal from '@/components/motion/StaggerReveal';

const iconMap: Record<string, LucideIcon> = {
  Globe,
  LayoutDashboard,
  Smartphone,
  Code2,
  GraduationCap,
  Building2,
  Server,
  Wrench,
};

interface ServicesListProps {
  showAll?: boolean;
}

export default function ServicesList({ showAll = false }: ServicesListProps) {
  const displayServices = showAll ? services : services.slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-5">
      <StaggerReveal staggerInterval={60} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {displayServices.map((service, index) => {
          const Icon = iconMap[service.icon] || Code2;
          const num = String(index + 1).padStart(2, '0');

          return (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="card-popup group relative flex flex-col justify-between p-4 sm:p-5 lg:p-5 rounded-2xl border border-[#E2E8F0] bg-white transition-all duration-300 h-full hover:border-[#4338CA]/40 hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center border border-[#4338CA]/20 group-hover:scale-110 group-hover:rotate-[5deg] group-hover:bg-[#4338CA] group-hover:text-white transition-all duration-300">
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#64748B]">
                    {num}
                  </span>
                </div>

                <div>
                  <h3 className="card-headline-title font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors tracking-tight text-base sm:text-lg">
                    {service.title}
                  </h3>
                  <p className="card-supporting-description mt-1 leading-relaxed font-normal text-xs sm:text-[13px] line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Highlight features */}
                <div className="pt-2 space-y-1.5 border-t border-[#E2E8F0]">
                  {service.features.slice(0, 2).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Technology Badges */}
                {service.technologies && service.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {service.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="text-[9.5px] sm:text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#475569] border border-[#E2E8F0]"
                      >
                        {tech}
                      </span>
                    ))}
                    {service.technologies.length > 3 && (
                      <span className="text-[9.5px] sm:text-[10px] font-mono text-[#94A3B8] px-1 py-0.5">
                        +{service.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#4338CA] group-hover:text-[#3730A3] transition-colors">
                <span>Explore Capability</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#4338CA]/10 flex items-center justify-center group-hover:bg-[#4338CA] group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </StaggerReveal>

      {!showAll && (
        <div className="text-center pt-0.5">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
          >
            <span>View All 8 Specialized Capabilities &amp; Software Systems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}


