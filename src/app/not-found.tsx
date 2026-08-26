import Link from 'next/link';
import { ArrowRight, Sparkles, Home, Globe } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FAF7F2] text-[#131B2E] px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden text-center">
      {/* Ambient background glows */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-[#4338CA]/10 via-[#F97360]/10 to-[#F4C95D]/10 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
          <span>PAGE NOT FOUND</span>
        </div>

        <div className="space-y-2">
          <span className="text-8xl sm:text-9xl font-extrabold font-mono text-[#4338CA] tracking-tighter block">
            404
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-md mx-auto leading-relaxed">
            The link you followed may have moved or no longer exists. Let&apos;s get you back on track to exploring our work or building your website.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            <Globe className="w-4 h-4 text-[#4338CA]" />
            <span>Explore Our Work</span>
          </Link>
          <Link
            href="/get-quote"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F97360]/10 hover:bg-[#F97360]/20 text-[#F97360] border border-[#F97360]/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <span>Build My Website</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
