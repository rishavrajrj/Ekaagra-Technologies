'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminLoginAction } from '@/app/actions';
import Logo from '@/components/ui/Logo';
import { Lock, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    startTransition(async () => {
      const res = await adminLoginAction(password);
      if (res.success) {
        router.push('/admin/leads');
        router.refresh();
      } else {
        setErrorMsg(res.message || 'Authentication failed.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Lead Management System
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Sign in to access inbound client enquiries and proposals.
          </p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs sm:text-sm text-red-800 font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2"
              >
                Admin Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter administrator password"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-3.5 text-sm text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#131B2E] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !password}
              className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold py-3.5 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA] disabled:opacity-50 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#4338CA]/25 cursor-pointer"
            >
              <span>{isPending ? 'Verifying...' : 'Access Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-xs text-[#94A3B8]">
              Protected with End-to-End Session Security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
