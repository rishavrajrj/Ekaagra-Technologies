import * as React from 'react';
import Link from 'next/link';
import { Globe, LayoutDashboard, Smartphone, Code2, GraduationCap, Building2, Server, Wrench, LucideIcon, ArrowUpRight } from 'lucide-react';
import type { Service } from '@/lib/types';

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

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export function ServiceCard({ service, className = '' }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || Code2;

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0e1320] p-6 transition-all hover:border-blue-500/40 hover:-translate-y-1 ${className}`}>
      <div>
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#080b13] border border-white/10 text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-white">{service.title}</h3>
        <p className="mb-6 text-xs text-slate-400 line-clamp-3 leading-relaxed">{service.description}</p>
      </div>
      <Link 
        href={`/services/${service.slug}`}
        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
      >
        <span>Explore Architecture</span>
        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}

export default ServiceCard;

