import Link from 'next/link';
import { Sparkles, CheckCircle2, Eye, Rocket, Compass, Layout, Code2, ArrowRight } from 'lucide-react';
import StaggerReveal from '@/components/motion/StaggerReveal';

interface ProcessTimelineProps {
  showLink?: boolean;
}

export default function ProcessTimeline({ showLink = true }: ProcessTimelineProps) {
  const steps = [
    {
      number: '01',
      title: 'Discover',
      icon: Compass,
      description: 'Understand your business model, target audience, competitors, and exact goals.',
      badge: 'Discovery Call',
      theme: {
        border: 'border-sky-300 hover:border-sky-500',
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
        numberBg: 'bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white border border-sky-200/60',
        titleHover: 'group-hover:text-sky-600',
        shadowHover: 'hover:shadow-sky-500/10',
      },
    },
    {
      number: '02',
      title: 'Direction',
      icon: Layout,
      description: 'Define the visual direction, page layout structure, and conversion sitemap.',
      badge: 'Wireframes',
      theme: {
        border: 'border-indigo-300 hover:border-indigo-500',
        badge: 'bg-indigo-50 text-[#4338CA] border-indigo-200',
        numberBg: 'bg-indigo-50 text-[#4338CA] group-hover:bg-[#4338CA] group-hover:text-white border border-indigo-200/60',
        titleHover: 'group-hover:text-[#4338CA]',
        shadowHover: 'hover:shadow-indigo-500/10',
      },
    },
    {
      number: '03',
      title: 'Design',
      icon: Sparkles,
      description: 'Create the polished visual interface, mockups, typography, and branded assets.',
      badge: 'Visual Identity',
      theme: {
        border: 'border-purple-300 hover:border-purple-500',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        numberBg: 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white border border-purple-200/60',
        titleHover: 'group-hover:text-purple-600',
        shadowHover: 'hover:shadow-purple-500/10',
      },
    },
    {
      number: '04',
      title: 'Develop',
      icon: Code2,
      description: 'Turn approved designs into ultra-fast, responsive, clean code with database integration.',
      badge: 'Clean Code',
      theme: {
        border: 'border-amber-300 hover:border-amber-500',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        numberBg: 'bg-amber-50 text-amber-800 group-hover:bg-amber-600 group-hover:text-white border border-amber-200/60',
        titleHover: 'group-hover:text-amber-700',
        shadowHover: 'hover:shadow-amber-500/10',
      },
    },
    {
      number: '05',
      title: 'Review & Approval',
      icon: Eye,
      description: 'You test everything on a private live staging link and give final approval before public launch.',
      badge: 'Client Approval ★',
      highlighted: true,
      theme: {
        border: 'border-2 border-[#F97360] shadow-md shadow-[#F97360]/15 animate-approval-pulse',
        badge: 'bg-[#F97360]/15 text-[#EA580C] font-extrabold border-[#F97360]/30',
        numberBg: 'bg-[#F97360] text-white border border-[#EA580C]/40',
        titleHover: 'group-hover:text-[#EA580C]',
        shadowHover: 'hover:shadow-[#F97360]/20',
      },
    },
    {
      number: '06',
      title: 'Launch & Support',
      icon: Rocket,
      description: 'Deploy to fast edge hosting, connect custom domain, configure SSL, and provide post-launch care.',
      badge: 'Go Live 🚀',
      theme: {
        border: 'border-emerald-300 hover:border-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        numberBg: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-200/60',
        titleHover: 'group-hover:text-emerald-600',
        shadowHover: 'hover:shadow-emerald-500/10',
      },
    },
  ];

  return (
    <div className="relative flex flex-col gap-4 sm:gap-5">
      {/* Desktop Horizontal Line with Traveling Light Beam */}
      <div 
        aria-hidden="true" 
        className="hidden lg:block absolute top-8 left-[6%] right-[6%] h-[2px] overflow-hidden z-0"
        style={{
          background: 'linear-gradient(to right, rgb(186, 230, 253), rgb(165, 180, 252), rgb(192, 132, 250), rgb(253, 230, 138), rgba(249, 115, 96, 0.3), rgb(134, 239, 172))'
        }}
      >
        <div className="absolute top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-[#4338CA] to-transparent animate-traveling-beam" />
      </div>

      {/* Steps Grid with Staggered Entrance */}
      <StaggerReveal staggerInterval={65} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 relative z-10 items-stretch">
        {steps.map((step) => {
          return (
            <div
              key={step.number}
              className={`card-popup-sm group rounded-xl p-3.5 sm:p-4 flex flex-col justify-between border min-w-0 h-full bg-white transition-all duration-300 ${
                step.theme.border
              } ${step.theme.shadowHover} ${
                step.highlighted ? '' : 'shadow-sm'
              }`}
            >
              <div className="space-y-2.5 min-w-0">
                {/* Step indicator circle */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 shadow-sm shrink-0 ${step.theme.numberBg}`}
                  >
                    {step.number}
                  </span>
                  <span
                    className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${step.theme.badge}`}
                  >
                    {step.badge}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3
                    className={`text-sm sm:text-base font-extrabold text-[#131B2E] tracking-tight transition-colors ${step.theme.titleHover}`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#64748B] mt-1 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.highlighted && (
                <div className="mt-2.5 pt-2 border-t border-[#F97360]/20 flex items-center gap-1.5 text-[9.5px] font-bold text-[#EA580C]">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Zero surprises before launch</span>
                </div>
              )}
            </div>
          );
        })}
      </StaggerReveal>

      {/* Editorial Process Link Row */}
      {showLink && (
        <div className="pt-2 text-center">
          <Link
            href="/process"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
          >
            <span>Explore Detailed 6-Step Development Methodology &amp; Staging Checkpoints</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}


