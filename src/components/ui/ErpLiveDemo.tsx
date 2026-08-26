'use client';

import { useState } from 'react';
import {
  Users,
  CreditCard,
  CalendarCheck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

type Role = 'admin' | 'teacher' | 'parent' | 'student';

export default function ErpLiveDemo() {
  const [activeRole, setActiveRole] = useState<Role>('admin');
  const [attendanceToggled, setAttendanceToggled] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': false,
    '4': true,
    '5': true,
  });

  const toggleStudent = (id: string) => {
    setAttendanceToggled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full h-full bg-[#0F172A] text-slate-100 flex flex-col font-sans overflow-y-auto select-none text-xs">
      {/* ─── Top ERP Navigation Bar ───────────────────────────────── */}
      <div className="bg-[#1E293B] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md">
            R
          </div>
          <div>
            <div className="font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>Roshani Public School ERP</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-bold rounded border border-emerald-500/30">
                v3.2 Cloud
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Academic Year 2026–27</div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          {(
            [
              { id: 'admin', label: '👑 Admin' },
              { id: 'teacher', label: '👨‍🏫 Teacher' },
              { id: 'parent', label: '👨‍👩‍👧 Parent' },
              { id: 'student', label: '🎓 Student' },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRole(r.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                activeRole === r.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <a
          href="https://roshani-public-school-erp.vercel.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-bold transition-all"
        >
          <span>Open Login</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* ─── Main Content Canvas based on Active Role ─────────────── */}
      <div className="flex-1 p-4 space-y-3 bg-[#0B132B]">
        {/* ─── ROLE: ADMIN ────────────────────────────────────────── */}
        {activeRole === 'admin' && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#1E293B] border border-slate-700/80 p-2.5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                  <span>TOTAL STUDENTS</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">1,420</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ +14% this session</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-700/80 p-2.5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                  <span>MONTHLY FEES</span>
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">₹28.4 Lakh</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">92.4% collected</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-700/80 p-2.5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                  <span>TODAY ATTENDANCE</span>
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">96.8%</div>
                <div className="text-[10px] text-slate-300 font-semibold mt-0.5">1,374 / 1,420 present</div>
              </div>

              <div className="bg-[#1E293B] border border-slate-700/80 p-2.5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                  <span>STAFF ON DUTY</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-lg font-black text-white mt-1">48 / 50</div>
                <div className="text-[10px] text-blue-300 font-semibold mt-0.5">2 on approved leave</div>
              </div>
            </div>

            {/* Recent Fee Transactions & Inquiries Table */}
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 text-xs">Recent Digital Fee Collections (Cloud Sync)</div>
                <span className="text-[10px] text-indigo-400 font-mono">Auto-Receipt Generation Active</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { name: 'Aarav Kumar Sharma', class: 'Class 10-A', amount: '₹14,500', mode: 'UPI / Razorpay', time: '10 mins ago' },
                  { name: 'Ananya Gupta', class: 'Class 8-B', amount: '₹12,800', mode: 'NetBanking', time: '28 mins ago' },
                  { name: 'Rohan Verma', class: 'Class 6-C', amount: '₹11,200', mode: 'Cash Counter', time: '1 hr ago' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 px-3 py-2 rounded-lg flex items-center justify-between text-[11px] border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                        {item.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{item.name}</div>
                        <div className="text-[9px] text-slate-400">{item.class} • {item.mode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{item.amount}</div>
                      <div className="text-[9px] text-slate-400">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── ROLE: TEACHER ──────────────────────────────────────── */}
        {activeRole === 'teacher' && (
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <div>
                <div className="font-bold text-slate-200 text-xs">Live Attendance Register (Class 10-A)</div>
                <div className="text-[10px] text-slate-400">Class Teacher: Mrs. Sunita Sharma</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Tap student to toggle
                </span>
              </div>
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
                        ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-slate-400">{s.roll}</span>
                      <span className="font-bold text-slate-200">{s.name}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
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

        {/* ─── ROLE: PARENT ───────────────────────────────────────── */}
        {activeRole === 'parent' && (
          <div className="space-y-3">
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                  AS
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs">Aarav Sharma (Class 10-A)</div>
                  <div className="text-[10px] text-slate-400">Admission No: RPS-2022-0491 • Father: Rajesh Sharma</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                Fee Cleared: Q1 &amp; Q2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#1E293B] border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Term 1 Performance</div>
                <div className="text-xl font-black text-emerald-400">94.6%</div>
                <div className="text-[10px] text-slate-300">Grade: A1 (Distinction in Science &amp; Maths)</div>
              </div>
              <div className="bg-[#1E293B] border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">School Bus GPS Tracking</div>
                <div className="text-xl font-black text-indigo-400">Route #04</div>
                <div className="text-[10px] text-emerald-300">Status: Reached School Gate (07:42 AM)</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ROLE: STUDENT ──────────────────────────────────────── */}
        {activeRole === 'student' && (
          <div className="bg-[#1E293B] border border-slate-700/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="font-bold text-slate-200 text-xs">Today's Class Timetable (Class 10-A)</div>
              <span className="text-[10px] text-indigo-400 font-mono">Period 4 in Progress</span>
            </div>

            <div className="space-y-1.5">
              {[
                { period: 'Period 1 (08:00 - 08:45)', subject: 'Mathematics (Algebra)', teacher: 'Mr. R. K. Mishra', status: 'Completed' },
                { period: 'Period 2 (08:45 - 09:30)', subject: 'Physics (Electricity)', teacher: 'Dr. Anita Verma', status: 'Completed' },
                { period: 'Period 3 (09:30 - 10:15)', subject: 'English Literature', teacher: 'Mrs. Priya Roy', status: 'Completed' },
                { period: 'Period 4 (10:30 - 11:15)', subject: 'Computer Science (Python & SQL)', teacher: 'Er. Rishav Raj', status: 'Active Now' },
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded-lg flex items-center justify-between text-[11px] border ${
                    p.status === 'Active Now'
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200 shadow-md'
                      : 'bg-slate-900/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100">{p.subject}</div>
                    <div className="text-[9px] text-slate-400">{p.period} • {p.teacher}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      p.status === 'Active Now'
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
