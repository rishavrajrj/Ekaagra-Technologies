'use client';

import { processSteps } from '@/lib/data';

export default function ProcessTimeline() {
  return (
    <div className="relative">
      {/* Desktop Horizontal Line */}
      <div 
        aria-hidden="true" 
        className="hidden lg:block absolute top-7 left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-blue-500/20 via-blue-500/50 to-blue-500/20 z-0"
      ></div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8 relative z-10">
        {processSteps.map((step, index) => (
          <div
            key={step.number}
            className="group bg-[#0b0f19] border border-white/10 rounded-xl p-6 hover:border-blue-500/50 hover:bg-[#0e1424] transition-all duration-300 flex flex-col justify-between h-full shadow-lg"
          >
            <div>
              {/* Step indicator circle */}
              <div className="flex items-center justify-between mb-5">
                <span className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 group-hover:bg-blue-600 group-hover:border-blue-400 text-blue-400 group-hover:text-white text-xs font-mono font-bold flex items-center justify-center transition-all duration-300 shadow-md">
                  {step.number}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Step {index + 1}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {step.description}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Phase 0{index + 1}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-400 transition-colors"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
