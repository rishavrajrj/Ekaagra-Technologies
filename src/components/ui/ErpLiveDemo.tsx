'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Users,
  CreditCard,
  BookOpen,
  Bell,
  Shield,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  GraduationCap,
  ExternalLink,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Bus,
  FileText
} from 'lucide-react';

type Role = 'Admin' | 'Principal' | 'Teacher' | 'Accountant' | 'Parent' | 'Student';

interface DemoRoleConfig {
  label: Role;
  email: string;
  badge: string;
  badgeActive: string;
}

const DEMO_ROLES: DemoRoleConfig[] = [
  {
    label: 'Admin',
    email: 'admin@roshanischool.com',
    badge: 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-300',
    badgeActive: 'bg-indigo-600 text-white border-indigo-700',
  },
  {
    label: 'Principal',
    email: 'principal@roshanischool.com',
    badge: 'bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-300',
    badgeActive: 'bg-purple-600 text-white border-purple-700',
  },
  {
    label: 'Teacher',
    email: 'teacher@roshanischool.com',
    badge: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300',
    badgeActive: 'bg-emerald-600 text-white border-emerald-700',
  },
  {
    label: 'Accountant',
    email: 'accountant@roshanischool.com',
    badge: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300',
    badgeActive: 'bg-amber-600 text-white border-amber-700',
  },
  {
    label: 'Parent',
    email: 'parent@roshanischool.com',
    badge: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-300',
    badgeActive: 'bg-blue-600 text-white border-blue-700',
  },
  {
    label: 'Student',
    email: 'student@roshanischool.com',
    badge: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-300',
    badgeActive: 'bg-rose-600 text-white border-rose-700',
  },
];

export default function ErpLiveDemo() {
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [email, setEmail] = useState('admin@roshanischool.com');
  const [password, setPassword] = useState('TestPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [attendanceToggled, setAttendanceToggled] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': false,
    '4': true,
    '5': true,
  });

  const handleSelectRole = (role: DemoRoleConfig) => {
    setSelectedRole(role.label);
    setEmail(role.email);
    setPassword('TestPass123!');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const toggleStudent = (id: string) => {
    setAttendanceToggled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full h-full bg-[#031B3A] text-white flex flex-col font-sans overflow-y-auto select-none relative text-left">
      {/* --- Top Live ERP Status Bar -------------------------------- */}
      <div className="bg-[#021329]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shrink-0 relative z-30">
        <div className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/20">
            <Image
              src="/images/projects/roshani-public-school-erp/logo.webp"
              alt="RPS Logo"
              fill
              sizes="24px"
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="font-serif">ROSHANI PUBLIC SCHOOL ERP</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                LIVE DEMO
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Back to Login</span>
            </button>
          )}
          <a
            href="https://roshani-public-school-erp.vercel.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4C542] hover:bg-[#eab82e] text-[#031B3A] text-[10px] font-black tracking-wide transition-all shadow-sm"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* --- State 1: Exact 1:1 Login Page -------------------------- */}
      {!isLoggedIn ? (
        <div className="relative flex-1 min-h-full flex flex-col justify-between overflow-hidden bg-[#031B3A]">
          {/* Authentic High-Res Background with 2-Layer Gradient Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/projects/roshani-public-school-erp/BuildingViewFront.webp"
              alt="Roshani Public School Front Building"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
              priority
              className="object-cover object-top scale-100"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, rgba(3, 27, 58, 0.88) 0%, rgba(3, 27, 58, 0.65) 45%, rgba(3, 27, 58, 0.32) 100%), linear-gradient(to bottom, rgba(3, 27, 58, 0.4) 0%, rgba(3, 27, 58, 0.75) 100%)',
              }}
            />
          </div>

          {/* Page Content Container */}
          <div className="relative z-10 w-full min-h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
            {/* School Header */}
            <header className="w-full flex items-center justify-between shrink-0 mb-2 sm:mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative inline-flex items-center justify-center shrink-0 w-12 h-12 sm:w-16 sm:h-16">
                  <Image
                    src="/images/projects/roshani-public-school-erp/logo.webp"
                    alt="Roshani Public School Logo"
                    fill
                    sizes="(max-width: 640px) 48px, 64px"
                    className="object-contain drop-shadow-md"
                  />
                </div>
                <div className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  <span className="font-extrabold text-base sm:text-xl md:text-2xl tracking-tight font-serif uppercase block leading-none">
                    ROSHANI
                  </span>
                  <span className="font-extrabold text-base sm:text-xl md:text-2xl tracking-tight font-serif uppercase block leading-tight">
                    PUBLIC SCHOOL
                  </span>
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-[#F4C542] block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    SCHOOL MANAGEMENT ERP
                  </span>
                </div>
              </div>
            </header>

            {/* Main Interactive Grid */}
            <main className="w-full my-auto py-2 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
              {/* Left Column: Hero Typography & Capabilities */}
              <div className="order-2 lg:order-1 lg:col-span-7 space-y-2.5 sm:space-y-3.5 text-white flex flex-col items-start">
                <div className="space-y-0.5 drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans leading-tight">
                    One School.
                  </h1>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-sans leading-tight text-[#F4C542]">
                    One Platform.
                  </h1>
                </div>

                <div className="w-12 h-[2.5px] bg-[#F4C542] rounded-full my-1.5 shadow-sm" />

                <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium max-w-[450px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Manage academics, students, attendance, fees, examinations and communication from one secure platform.
                </p>

                {/* 6 Feature Badges */}
                <div className="pt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 max-w-[480px] w-full text-left">
                  {[
                    { icon: GraduationCap, title: 'Students', subtitle: 'Management' },
                    { icon: Users, title: 'Attendance', subtitle: 'Tracking' },
                    { icon: CreditCard, title: 'Fees', subtitle: 'Management' },
                    { icon: BookOpen, title: 'Examinations', subtitle: '& Reports' },
                    { icon: Bell, title: 'Communication', subtitle: '& Notices' },
                    { icon: ShieldCheck, title: 'Secure', subtitle: '& Reliable' },
                  ].map((cap, idx) => {
                    const IconComp = cap.icon;
                    return (
                      <div
                        key={idx}
                        className="p-2 sm:p-2.5 rounded-xl bg-[#031B3A]/60 backdrop-blur-md border border-white/20 shadow-md flex items-center sm:flex-col sm:items-start gap-2 hover:border-[#F4C542]/50 transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-[#F4C542] shrink-0">
                          <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] sm:text-xs font-bold text-white leading-tight">
                            {cap.title}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-white/80 font-medium leading-tight">
                            {cap.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Exact Replica Login Card */}
              <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
                <div className="w-full max-w-[340px] sm:max-w-[360px] rounded-[16px] overflow-hidden bg-white text-slate-900 shadow-2xl border border-slate-200">
                  {/* Card Header */}
                  <div className="bg-[#0f2440] py-3.5 sm:py-4 px-4 text-center border-b-[4px] border-[#B91C5C]">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1.5 border-[3px] border-white/40 mx-auto shadow-sm">
                      <Image
                        src="/images/projects/roshani-public-school-erp/logo.webp"
                        alt="RPS Logo"
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <h2 className="font-serif text-white text-lg sm:text-xl font-extrabold mb-0.5 leading-tight tracking-tight">
                      Welcome Back
                    </h2>
                    <p className="text-slate-200 text-[11px] sm:text-xs font-medium leading-normal">
                      Sign in to your school account
                    </p>
                  </div>

                  {/* Form Body */}
                  <form onSubmit={handleLogin} className="p-3.5 sm:p-5 space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-800">
                        Admin Email / Passcode
                      </label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin2026 or admin@roshanipublicschool.com"
                        className="w-full px-3 py-1.5 h-[36px] sm:h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white text-[#0f172a] font-medium text-xs sm:text-sm focus:border-[#B91C5C] focus:ring-3 focus:ring-[#B91C5C]/15 transition-all focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-slate-800">
                        Password (for email sign-in)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-1.5 pr-9 h-[36px] sm:h-[38px] rounded-[8px] border border-[#cbd5e1] bg-white text-[#0f172a] font-medium text-xs sm:text-sm focus:border-[#B91C5C] focus:ring-3 focus:ring-[#B91C5C]/15 transition-all focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-semibold select-none text-[11px] sm:text-xs">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-3.5 h-3.5 rounded border-slate-400 text-[#B91C5C] focus:ring-[#B91C5C]/20"
                        />
                        <span>Remember Me</span>
                      </label>
                      <span className="text-[#B91C5C] hover:text-[#9e144c] font-bold text-[11px] sm:text-xs cursor-pointer">
                        Forgot Password?
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full justify-center py-2 px-3 h-[38px] sm:h-[40px] bg-[#B91C5C] hover:bg-[#9e144c] text-white rounded-[8px] text-xs sm:text-sm font-bold transition-all border-none shadow-md hover:shadow-[0_4px_12px_rgba(185,28,92,0.3)] active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Sign In to Portal →</span>
                    </button>

                    {/* ⚡ Quick Demo Logins Section */}
                    <div className="pt-2.5 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-[11px] font-extrabold tracking-tight text-slate-700 uppercase font-mono">
                          ⚡ Quick Demo Logins
                        </span>
                        <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-500 font-mono">
                          1-Click Fill
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {DEMO_ROLES.map((r) => {
                          const isActive = selectedRole === r.label;
                          return (
                            <button
                              key={r.label}
                              type="button"
                              onClick={() => handleSelectRole(r)}
                              className={`py-1 px-1 text-[10px] sm:text-xs font-bold rounded-md border transition-all active:scale-95 text-center cursor-pointer shadow-2xs ${
                                isActive ? r.badgeActive : r.badge
                              }`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="w-full flex flex-col sm:flex-row items-center justify-between pt-3 text-[10px] sm:text-xs text-white/90 border-t border-white/20 gap-1.5 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] mt-2">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                <span>Secure Access • Trusted Platform • Better Education</span>
              </div>
              <p className="text-white/75 font-semibold">© 2026 Roshani Public School</p>
            </footer>
          </div>
        </div>
      ) : (
        /* --- State 2: Live Authenticated ERP Portal View ------------- */
        <div className="flex-1 p-4 sm:p-5 space-y-3.5 bg-[#021329]/80 relative z-10">
          {/* Dashboard Header Bar */}
          <div className="bg-[#031B3A] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#F4C542] text-[#031B3A] font-black text-sm flex items-center justify-center shadow">
                {selectedRole[0]}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>Logged in as: {email}</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {selectedRole.toUpperCase()} DASHBOARD
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Academic Session: 2026–27 • Cloud Sync Active
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Switch / Log Out</span>
            </button>
          </div>

          {/* ADMIN & PRINCIPAL VIEW */}
          {(selectedRole === 'Admin' || selectedRole === 'Principal') && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">TOTAL STUDENTS</div>
                  <div className="text-lg font-black text-white mt-0.5">1,420</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">↑ +14% Admissions</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">FEES COLLECTED</div>
                  <div className="text-lg font-black text-[#F4C542] mt-0.5">₹28.4 Lakh</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">92.4% on time</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">ATTENDANCE TODAY</div>
                  <div className="text-lg font-black text-white mt-0.5">96.8%</div>
                  <div className="text-[9px] text-slate-300 font-semibold">1,374 Present</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">FACULTY ON DUTY</div>
                  <div className="text-lg font-black text-white mt-0.5">48 / 50</div>
                  <div className="text-[9px] text-blue-300 font-semibold">2 on Leave</div>
                </div>
              </div>

              <div className="bg-[#031B3A] border border-white/10 rounded-xl p-3 space-y-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Recent Fee Collections &amp; Digital Receipts</span>
                  <span className="text-[10px] text-[#F4C542] font-mono">Live PostgreSQL Sync</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Aarav Kumar Sharma', class: 'Class 10-A', amount: '₹14,500', mode: 'UPI', time: '10m ago' },
                    { name: 'Ananya Gupta', class: 'Class 8-B', amount: '₹12,800', mode: 'NetBanking', time: '25m ago' },
                    { name: 'Rohan Verma', class: 'Class 6-C', amount: '₹11,200', mode: 'Cash Counter', time: '1h ago' },
                  ].map((f, idx) => (
                    <div
                      key={idx}
                      className="bg-[#021329]/70 px-3 py-2 rounded-lg flex items-center justify-between text-[11px] border border-white/5"
                    >
                      <div>
                        <span className="font-bold text-white">{f.name}</span>{' '}
                        <span className="text-[9px] text-slate-400">({f.class})</span>
                        <span className="ml-2 text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                          {f.mode}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#F4C542]">{f.amount}</span>
                        <span className="text-[9px] text-slate-400 ml-2">{f.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEACHER VIEW */}
          {selectedRole === 'Teacher' && (
            <div className="bg-[#031B3A] border border-white/10 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">Class 10-A Daily Attendance Register</div>
                  <div className="text-[10px] text-slate-400">Class Teacher: Mrs. Sunita Sharma • Section A</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Tap student to toggle status
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: '1', roll: 'Roll 01', name: 'Aarav Kumar Sharma', status: 'Present' },
                  { id: '2', roll: 'Roll 02', name: 'Aditi Priyadarshini', status: 'Present' },
                  { id: '3', roll: 'Roll 03', name: 'Aman Deep Singh', status: 'Absent' },
                  { id: '4', roll: 'Roll 04', name: 'Ananya Gupta', status: 'Present' },
                  { id: '5', roll: 'Roll 05', name: 'Ayush Raj', status: 'Present' },
                ].map((s) => {
                  const isPresent = attendanceToggled[s.id] ?? (s.status === 'Present');
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-[11px] border transition-all text-left cursor-pointer ${
                        isPresent
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-slate-400">{s.roll}</span>
                        <span className="font-bold text-white">{s.name}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide ${
                          isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isPresent ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACCOUNTANT VIEW */}
          {selectedRole === 'Accountant' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">TODAY&apos;S CASH</div>
                  <div className="text-lg font-black text-white mt-0.5">₹1,45,000</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">18 Counter Receipts</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">UPI / ONLINE GATEWAY</div>
                  <div className="text-lg font-black text-[#F4C542] mt-0.5">₹4,82,500</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">Auto-reconciled</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 font-bold">OVERDUE DEFAULTERS</div>
                  <div className="text-lg font-black text-rose-400 mt-0.5">42 Students</div>
                  <div className="text-[9px] text-rose-300 font-semibold">SMS Reminders Sent</div>
                </div>
              </div>
            </div>
          )}

          {/* PARENT / STUDENT VIEW */}
          {(selectedRole === 'Parent' || selectedRole === 'Student') && (
            <div className="space-y-3">
              <div className="bg-[#031B3A] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4C542] text-[#031B3A] font-black text-xs flex items-center justify-center shadow">
                    AS
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">Aarav Sharma • Class 10-A</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Roll #01 • Admission No: RPS-2022-0491
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  Fee Cleared: Q1 &amp; Q2
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">TERM 1 SCORE</div>
                  <div className="text-lg font-black text-[#F4C542] mt-0.5">94.6%</div>
                  <div className="text-[9px] text-emerald-400">Grade: A1 (Distinction)</div>
                </div>
                <div className="bg-[#031B3A] border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-bold">SCHOOL BUS GPS</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">Route #04</div>
                  <div className="text-[9px] text-slate-300">Reached School Gate</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

