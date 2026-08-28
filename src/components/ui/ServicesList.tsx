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

export default function ServicesList() {
  const coreServices = services.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {coreServices.map((service, index) => {
          const Icon = iconMap[service.icon] || Code2;
          const num = String(index + 1).padStart(2, '0');

          return (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="card-popup group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-[#E2E8F0] bg-white transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center border border-[#4338CA]/20 group-hover:scale-105 group-hover:bg-[#4338CA] group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#64748B]">
                    {num}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors tracking-tight">
                    {service.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
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
              </div>

              <div className="pt-4 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#4338CA] group-hover:text-[#3730A3] transition-colors">
                <span>Explore Capability</span>
                <div className="w-7 h-7 rounded-full bg-[#4338CA]/10 flex items-center justify-center group-hover:bg-[#4338CA] group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center pt-1">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
        >
          <span>View All 8 Specialized Capabilities &amp; Software Systems</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}


