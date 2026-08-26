'use client';

import { useState } from 'react';
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
  CalendarCheck,
  Sparkles
} from 'lucide-react';

type Role = 'Admin' | 'Teacher' | 'Parent' | 'Student';

export default function ErpLiveDemo() {
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [username, setUsername] = useState('admin@roshanischool.edu.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [attendanceToggled, setAttendanceToggled] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': false,
    '4': true,
    '5': true,
  });

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    if (role === 'Admin') setUsername('admin@roshanischool.edu.in');
    if (role === 'Teacher') setUsername('sunita.sharma@roshanischool.edu.in');
    if (role === 'Parent') setUsername('parent.aarav@gmail.com');
    if (role === 'Student') setUsername('RPS-2022-0491');
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
    <div className="w-full h-full bg-[#031B3A] text-white flex flex-col font-sans overflow-y-auto select-none relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F4C542]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4338CA]/20 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top Live ERP Status Bar ──────────────────────────────── */}
      <div className="bg-[#021329]/90 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 shrink-0 relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#F4C542] text-[#031B3A] font-black text-xs flex items-center justify-center shadow">
            R
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span>ROSHANI PUBLIC SCHOOL ERP</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                LIVE PORTAL
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Log Out</span>
            </button>
          ) : null}
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

      {/* ─── State 1: Actual Live Login Page Replica ──────────────── */}
      {!isLoggedIn ? (
        <div className="flex-1 p-4 sm:p-6 grid lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: School Information & Capabilities */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[10px] font-bold text-[#F4C542] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#F4C542]" />
              <span>Official Institutional ERP Portal • 2026–27</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Integrated School Management &amp; Cloud ERP
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Role-based digital access for Administration, Faculty, Parents &amp; Students.
              </p>
            </div>

            {/* 6 Capability Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { icon: Users, title: 'Attendance', subtitle: 'Live Cloud Register' },
                { icon: CreditCard, title: 'Fee Management', subtitle: 'UPI & Instant Receipt' },
                { icon: BookOpen, title: 'Examinations', subtitle: 'CBSE Report Cards' },
                { icon: Bell, title: 'Notices', subtitle: 'SMS & WhatsApp Broadcast' },
                { icon: ShieldCheck, title: 'Secure Access', subtitle: 'Multi-Role RBAC' },
                { icon: Zap, title: 'Live Sync', subtitle: 'Cloud Database' },
              ].map((cap, idx) => {
                const IconComp = cap.icon;
                return (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-[#021329]/60 border border-white/10 flex items-center gap-2 hover:border-[#F4C542]/40 transition-colors"
                  >
                    <div className="p-1 rounded-lg bg-white/10 text-[#F4C542] shrink-0">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{cap.title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{cap.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Live Sign-In Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-2xl bg-white text-slate-900 shadow-2xl p-4 sm:p-5 border border-slate-100 space-y-3.5">
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-xl bg-[#031B3A] text-[#F4C542] font-black text-sm mx-auto flex items-center justify-center shadow">
                  R
                </div>
                <h3 className="text-sm font-extrabold text-[#031B3A]">Sign In to ERP Portal</h3>
                <p className="text-[10px] text-slate-500 font-medium">Select your role to test the live system</p>
              </div>

              {/* Role Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
                {(['Admin', 'Teacher', 'Parent', 'Student'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedRole === r
                        ? 'bg-[#031B3A] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    {selectedRole === 'Student' ? 'Admission Number' : 'Username / Email'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#4338CA] bg-slate-50 text-slate-900 font-medium"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">Security Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-1.5 pl-8 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#4338CA] bg-slate-50 text-slate-900 font-medium"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#031B3A] hover:bg-[#072b5c] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <span>Sign In as {selectedRole}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-[9px] text-slate-400 font-mono">
                  Demo Credentials Pre-Filled • Instant Test
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── State 2: Live Authenticated ERP Dashboard ────────────── */
        <div className="flex-1 p-4 space-y-3.5 bg-[#021329]/70 relative z-10">
          {/* Dashboard Header Bar */}
          <div className="bg-[#031B3A] border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F4C542] text-[#031B3A] font-black text-xs flex items-center justify-center">
                {selectedRole[0]}
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Logged in as: {username}</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    {selectedRole.toUpperCase()} PORTAL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Session: 2026–27 • Terminal Verified</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Switch / Log Out</span>
            </button>
          </div>

          {/* ADMIN DASHBOARD */}
          {selectedRole === 'Admin' && (
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
                <div className="text-xs font-bold text-white">Live Cloud Fee Transactions</div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Aarav Kumar Sharma', class: 'Class 10-A', amount: '₹14,500', time: '10m ago' },
                    { name: 'Ananya Gupta', class: 'Class 8-B', amount: '₹12,800', time: '25m ago' },
                    { name: 'Rohan Verma', class: 'Class 6-C', amount: '₹11,200', time: '1h ago' },
                  ].map((f, idx) => (
                    <div key={idx} className="bg-[#021329]/60 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] border border-white/5">
                      <div className="font-bold text-white">{f.name} <span className="text-[9px] text-slate-400 font-normal">({f.class})</span></div>
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

          {/* TEACHER DASHBOARD */}
          {selectedRole === 'Teacher' && (
            <div className="bg-[#031B3A] border border-white/10 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <div className="text-xs font-bold text-white">Class 10-A Attendance Register</div>
                  <div className="text-[10px] text-slate-400">Class Teacher: Mrs. Sunita Sharma</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Tap student to toggle
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
                      className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] border transition-all text-left cursor-pointer ${
                        isPresent
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{s.roll}</span>
                        <span className="font-bold text-white">{s.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {isPresent ? '✓ PRESENT' : '✗ ABSENT'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PARENT / STUDENT DASHBOARD */}
          {(selectedRole === 'Parent' || selectedRole === 'Student') && (
            <div className="space-y-2.5">
              <div className="bg-[#031B3A] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F4C542] text-[#031B3A] font-black text-xs flex items-center justify-center">
                    AS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Aarav Sharma • Class 10-A</div>
                    <div className="text-[10px] text-slate-400 font-mono">Roll #01 • Admission No: RPS-2022-0491</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
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
