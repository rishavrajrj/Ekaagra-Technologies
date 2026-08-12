'use client';

import { useState } from 'react';
import { 
  Globe, 
  Smartphone, 
  Code2, 
  GraduationCap, 
  Terminal,
  Database,
  ShieldCheck
} from 'lucide-react';

export default function HeroVisual() {
  const [activeTab, setActiveTab] = useState<'WEB' | 'MOBILE' | 'SOFTWARE' | 'ERP'>('WEB');

  const tabDetails = {
    WEB: {
      title: 'High-Performance Web Platform',
      tech: 'Next.js 16 • React 19 • Tailwind CSS',
      status: 'Production Ready',
      metrics: [
        { label: 'Lighthouse Score', val: '99/100' },
        { label: 'TTFB', val: '45ms' },
        { label: 'Responsive Viewports', val: 'All Devices' },
      ],
      snippet: 'const app = createDigitalSolution({\n  stack: ["React", "Next.js", "Vercel"],\n  seo: "Optimized",\n  responsive: true\n});',
    },
    MOBILE: {
      title: 'Native Android Mobile App',
      tech: 'Java • Kotlin • Android SDK',
      status: 'Store Approved',
      metrics: [
        { label: 'App Size', val: '12.4 MB' },
        { label: 'Offline Support', val: 'Active' },
        { label: 'Architecture', val: 'Clean MVVM' },
      ],
      snippet: 'class AndroidSolution : MobileApp() {\n  override fun onInit() {\n    connectAPI(baseUrl)\n    enableOfflineCache()\n  }\n}',
    },
    SOFTWARE: {
      title: 'Custom Business Architecture',
      tech: 'Java • Spring Boot • PostgreSQL',
      status: 'Enterprise Grade',
      metrics: [
        { label: 'API Latency', val: '< 18ms' },
        { label: 'Uptime SLA', val: '99.9%' },
        { label: 'Security', val: 'Role Access' },
      ],
      snippet: '@RestController\n@RequestMapping("/api/v1/business")\npublic class SystemService {\n  @Autowired WorkflowEngine workflow;\n}',
    },
    ERP: {
      title: 'Integrated School & Institution ERP',
      tech: 'Full-Stack ERP System',
      status: 'Live & Operational',
      metrics: [
        { label: 'Modules', val: 'Admissions, Fees, Exams' },
        { label: 'Portals', val: 'Parent & Staff' },
        { label: 'Database', val: 'Relational DB' },
      ],
      snippet: '// School ERP Sync\nsyncDatabase({\n  students: activeRoster,\n  fees: ledgerEntries,\n  results: examBoard\n});',
    },
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/20 rounded-2xl blur-xl opacity-70 animate-pulse-subtle"></div>

      {/* Main Terminal/Workspace Window */}
      <div className="relative bg-[#0e1320] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Window Topbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#090d16]/90 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-blue-400" />
              ekaagra-studio // build-system
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">System Live</span>
          </div>
        </div>

        {/* Layer Tabs Selector */}
        <div className="p-3 bg-[#0b0f19] border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto">
          {(['WEB', 'MOBILE', 'SOFTWARE', 'ERP'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400/30'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/[0.05]'
                }`}
              >
                {tab === 'WEB' && <Globe className="w-3.5 h-3.5" />}
                {tab === 'MOBILE' && <Smartphone className="w-3.5 h-3.5" />}
                {tab === 'SOFTWARE' && <Code2 className="w-3.5 h-3.5" />}
                {tab === 'ERP' && <GraduationCap className="w-3.5 h-3.5" />}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Inner Content Area */}
        <div className="p-5 space-y-4">
          {/* Active Product Preview Banner */}
          <div className="bg-[#131a2b] border border-white/10 rounded-xl p-4 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block mb-1">
                  Architecture Layer
                </span>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {tabDetails[activeTab].title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {tabDetails[activeTab].tech}
                </p>
              </div>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-md">
                {tabDetails[activeTab].status}
              </span>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06]">
              {tabDetails[activeTab].metrics.map((m, i) => (
                <div key={i} className="bg-[#090d16]/70 p-2 rounded-lg border border-white/[0.04]">
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block">
                    {m.label}
                  </span>
                  <span className="text-xs font-bold text-white tracking-tight block mt-0.5">
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Code & Process Preview */}
          <div className="bg-[#080b13] border border-white/10 rounded-xl p-3.5 font-mono text-xs text-slate-300 relative group overflow-hidden">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 border-b border-white/[0.06] pb-1.5">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-blue-400" />
                implementation.ts
              </span>
              <span className="text-emerald-400 font-sans font-semibold text-[10px]">Compiled ✓</span>
            </div>
            <pre className="text-blue-300/90 text-[11px] leading-relaxed overflow-x-auto">
              <code>{tabDetails[activeTab].snippet}</code>
            </pre>
          </div>

          {/* Connected System Footprint Bar */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:text-white transition-colors">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Custom Database
              </span>
              <span className="flex items-center gap-1 hover:text-white transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Secure API
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Ekaagra Core v2.4
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Connection Tag */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Tailored Workflows
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Clean Code Architecture
        </span>
      </div>
    </div>
  );
}
