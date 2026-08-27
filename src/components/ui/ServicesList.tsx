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
  const coreServices = services.slice(0, 5);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {coreServices.map((service, index) => {
        const Icon = iconMap[service.icon] || Code2;
        const num = String(index + 1).padStart(2, '0');

        return (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:border-[#4338CA]/40 hover:shadow-2xl hover:shadow-[#4338CA]/10 hover:-translate-y-1"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center border border-[#4338CA]/20 group-hover:scale-110 group-hover:bg-[#4338CA] group-hover:text-white transition-all duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-[#64748B]">
                  {num}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors tracking-tight">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Highlight features */}
              <div className="pt-2 space-y-2 border-t border-[#E2E8F0]">
                {service.features.slice(0, 3).map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#4338CA] group-hover:text-[#3730A3] transition-colors">
              <span>Explore Capability</span>
              <div className="w-8 h-8 rounded-full bg-[#4338CA]/10 flex items-center justify-center group-hover:bg-[#4338CA] group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}


