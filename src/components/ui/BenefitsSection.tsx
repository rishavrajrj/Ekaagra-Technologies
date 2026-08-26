'use client';

import {
  Sparkles,
  Smartphone,
  Zap,
  Search,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Headphones,
} from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      icon: Sparkles,
      color: 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20',
      title: 'Beautiful by Design',
      description:
        'A customized visual identity crafted around your specific brand personality, colors, and audience — never a generic template.',
    },
    {
      icon: Smartphone,
      color: 'bg-[#F97360]/10 text-[#F97360] border-[#F97360]/20',
      title: 'Mobile First & Responsive',
      description:
        'Most of your customers visit on mobile. Every layout is handcrafted to feel fast, effortless, and intuitive on touchscreens.',
    },
    {
      icon: Zap,
      color: 'bg-[#F4C95D]/20 text-[#B45309] border-[#F4C95D]/40',
      title: 'Fast & Lightweight',
      description:
        'Engineered with modern standards for smooth page navigation and fast loading across mobile connections.',
    },
    {
      icon: Search,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Search & SEO Foundation',
      description:
        'Structured with clean semantic HTML, descriptive page titles, and Schema.org metadata for organic search discovery.',
    },
    {
      icon: MessageCircle,
      color: 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20',
      title: 'Easy to Contact & Inquire',
      description:
        'Direct WhatsApp chat buttons, click-to-call links, interactive Google Maps, and validated enquiry forms that deliver leads to you.',
    },
    {
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Secure & Reliable',
      description:
        'Automated SSL encryption, secure forms, high reliability, and dependable hosting on modern cloud infrastructure.',
    },
    {
      icon: TrendingUp,
      color: 'bg-[#F97360]/10 text-[#F97360] border-[#F97360]/20',
      title: 'Scalable Architecture',
      description:
        'Start with a multi-page website and upgrade seamlessly to dynamic portals, school ERP, or mobile apps as you grow.',
    },
    {
      icon: Headphones,
      color: 'bg-[#F4C95D]/20 text-[#B45309] border-[#F4C95D]/40',
      title: 'Ongoing Support & Care',
      description:
        'We stand behind our work with post-launch domain guidance, content updates, maintenance, and responsive technical support.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#FAF7F2] border-b border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
            BUILT-IN VALUE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            What you get with every Ekaagra website
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Every digital product we deliver is engineered around these eight pillars to ensure long-term business return.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm hover:shadow-xl hover:border-[#4338CA]/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${b.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#131B2E] tracking-tight group-hover:text-[#4338CA] transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

