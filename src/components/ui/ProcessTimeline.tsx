import { Sparkles, CheckCircle2, Eye, Rocket, Compass, Layout, Code2 } from 'lucide-react';
import StaggerReveal from '@/components/motion/StaggerReveal';

export default function ProcessTimeline() {
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
        className="hidden lg:block absolute top-8 left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-sky-200 via-indigo-200 via-purple-200 via-amber-200 via-[#F97360]/30 to-emerald-200 overflow-hidden z-0"
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
                    className={`text-sm sm:text-base font-extrabold text-[#131B2E] tracking-tight transition-colors truncate ${step.theme.titleHover}`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
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

      {/* Built Around Your Approval Supporting Assurance Panel */}
      <div className="bg-white/80 border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-sm relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 pb-2 border-b border-[#E2E8F0]/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] font-bold text-[9px] uppercase tracking-wider rounded-md shrink-0">
              Client Assurance
            </span>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
              Built Around Your Approval
            </h3>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            You stay in control from the first conversation to the final launch — with clear deliverables, review checkpoints, and no surprise decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 pt-2.5">
          <div className="flex items-start gap-2 bg-[#FAF7F2]/60 rounded-lg p-2 border border-[#E2E8F0]/60 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block">01 — Clear Deliverables</span>
              <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                Every stage has a defined outcome so you always know what is being worked on.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-[#FAF7F2]/60 rounded-lg p-2 border border-[#E2E8F0]/60 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block">02 — Your Approval Matters</span>
              <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                Nothing important moves forward without your review and approval.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-[#FAF7F2]/60 rounded-lg p-2 border border-[#E2E8F0]/60 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F97360] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block">03 — Ready to Launch</span>
              <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                Final testing, deployment, domain, SSL, and post-launch support are handled for you.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Workflow Assurance Strip */}
      <div className="pt-3 border-t border-[#E2E8F0]">
        <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
            <span>PRIVATE STAGING PREVIEW</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
            <span>EXPLICIT CLIENT SIGN-OFF</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
            <span>ZERO DOWNTIME DNS CUTOVER</span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>30-DAY COMPLIMENTARY SUPPORT</span>
          </div>
        </div>
      </div>
    </div>
  );
}


