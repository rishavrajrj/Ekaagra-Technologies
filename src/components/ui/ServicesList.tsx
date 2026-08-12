'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { services } from '@/lib/data';

export default function ServicesList() {
  return (
    <div className="divide-y divide-white/10 border-t border-b border-white/10">
      {services.map((service, index) => {
        const num = String(index + 1).padStart(2, '0');
        return (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group py-7 sm:py-9 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:bg-white/[0.02] border-l-2 border-l-transparent hover:border-l-blue-500"
          >
            <div className="flex items-start md:items-center gap-6 sm:gap-8 flex-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-600 group-hover:text-blue-400 transition-colors duration-300 shrink-0">
                {num}
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed group-hover:text-slate-300 transition-colors">
                  {service.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors shrink-0">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">Explore Service</span>
              <div className="w-10 h-10 rounded-full border border-white/10 group-hover:border-blue-500/50 bg-white/5 group-hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
