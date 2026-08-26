'use client';

import { Sparkles, CheckCircle2, Eye, Rocket, Compass, Layout, Code2 } from 'lucide-react';

export default function ProcessTimeline() {
  const steps = [
    {
      number: '01',
      title: 'Discover',
      icon: Compass,
      description: 'Understand your business model, target audience, competitors, and exact goals.',
      badge: 'Discovery Call',
    },
    {
      number: '02',
      title: 'Direction',
      icon: Layout,
      description: 'Define the visual direction, page layout structure, and conversion sitemap.',
      badge: 'Wireframes',
    },
    {
      number: '03',
      title: 'Design',
      icon: Sparkles,
      description: 'Create the polished visual interface, mockups, typography, and branded assets.',
      badge: 'Visual Identity',
    },
    {
      number: '04',
      title: 'Develop',
      icon: Code2,
      description: 'Turn approved designs into ultra-fast, responsive, clean code with database integration.',
      badge: 'Clean Code',
    },
    {
      number: '05',
      title: 'Review & Approval',
      icon: Eye,
      description: 'You test everything on a private live staging link and give final approval before public launch.',
      badge: 'Client Approval ★',
      highlighted: true,
    },
    {
      number: '06',
      title: 'Launch & Support',
      icon: Rocket,
      description: 'Deploy to fast edge hosting, connect custom domain, configure SSL, and provide post-launch care.',
      badge: 'Go Live 🚀',
    },
  ];

  return (
    <div className="relative space-y-8">
      {/* Desktop Horizontal Line */}
      <div 
        aria-hidden="true" 
        className="hidden lg:block absolute top-10 left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-[#4338CA]/20 via-[#4338CA]/50 to-[#4338CA]/20 z-0"
      />

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className={`group rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between h-full border ${
                step.highlighted
                  ? 'bg-white border-2 border-[#F97360] shadow-xl shadow-[#F97360]/10 scale-[1.03]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#4338CA]/40 shadow-sm hover:shadow-xl'
              }`}
            >
              <div className="space-y-4">
                {/* Step indicator circle */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 shadow-sm ${
                      step.highlighted
                        ? 'bg-[#F97360] text-white'
                        : 'bg-[#4338CA]/10 text-[#4338CA] group-hover:bg-[#4338CA] group-hover:text-white'
                    }`}
                  >
                    {step.number}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      step.highlighted
                        ? 'bg-[#F97360]/15 text-[#EA580C] font-extrabold'
                        : 'bg-[#FAF7F2] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#131B2E] tracking-tight group-hover:text-[#4338CA] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.highlighted && (
                <div className="mt-4 pt-3 border-t border-[#F97360]/20 flex items-center gap-1.5 text-[10px] font-bold text-[#EA580C]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero surprises before launch</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


