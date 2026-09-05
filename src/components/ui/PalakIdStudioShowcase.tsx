'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Move,
  RotateCw,
  QrCode,
  Printer,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Scan,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

type KeypointId = 'excel' | 'vector' | 'dualsided' | 'barcode' | 'photo' | 'print';

interface SampleStudent {
  id: string;
  name: string;
  role: string;
  classSection: string;
  rollNo: string;
  dob: string;
  bloodGroup: string;
  phone: string;
  barcode: string;
  qrCode: string;
  avatarBg: string;
  avatarText: string;
  badgeColor: string;
}

const SAMPLE_ROSTER: SampleStudent[] = [
  {
    id: 'ST-8942',
    name: 'Aarav Sharma',
    role: 'Student',
    classSection: 'Class 10 - Sec A',
    rollNo: '24',
    dob: '14-Aug-2010',
    bloodGroup: 'O+',
    phone: '+91 98350 XXXXX',
    barcode: '||| |||| || ||||| |||| |||',
    qrCode: 'EKA-ST8942-XAVIER',
    avatarBg: 'from-blue-600 to-indigo-800',
    avatarText: 'AS',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'ST-9021',
    name: 'Priya Kumari',
    role: 'Student',
    classSection: 'Class 12 - Sec B (Comm)',
    rollNo: '09',
    dob: '02-Dec-2008',
    bloodGroup: 'B+',
    phone: '+91 94720 XXXXX',
    barcode: '|||| ||| |||| || ||| |||||',
    qrCode: 'EKA-ST9021-XAVIER',
    avatarBg: 'from-purple-600 to-pink-700',
    avatarText: 'PK',
    badgeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'FAC-104',
    name: 'Vikramaditya Roy',
    role: 'Faculty',
    classSection: 'HOD Mathematics',
    rollNo: 'Emp #104',
    dob: '18-Mar-1988',
    bloodGroup: 'AB+',
    phone: '+91 91230 XXXXX',
    barcode: '|| ||||| ||| |||| |||| ||',
    qrCode: 'EKA-FAC104-XAVIER',
    avatarBg: 'from-emerald-700 to-teal-900',
    avatarText: 'VR',
    badgeColor: 'bg-emerald-600 text-white',
  },
];

interface KeypointDef {
  id: KeypointId;
  title: string;
  badge: string;
  summary: string;
  description: string;
  stat: string;
  statLabel: string;
  icon: typeof FileSpreadsheet;
  cardFocus: 'data' | 'grid' | 'flip' | 'barcode' | 'photo' | 'bleed';
}

const KEYPOINTS: KeypointDef[] = [
  {
    id: 'excel',
    title: 'Excel Roster Dynamic Data-Binding',
    badge: 'Bulk Import',
    summary: 'Direct .xlsx import with automated column-to-canvas mapping.',
    description:
      'Upload school rosters containing 1,000+ student rows. Palak ID Studio maps Name, Roll No, Class, Blood Group, and Parent Contacts directly into vector template placeholders in seconds without manual copy-paste errors.',
    stat: '1-Click',
    statLabel: '1,000+ records in < 60s',
    icon: FileSpreadsheet,
    cardFocus: 'data',
  },
  {
    id: 'vector',
    title: '0.5mm Precision Vector Canvas Studio',
    badge: 'CAD Precision',
    summary: 'Magnetic snap guides, sub-millimeter rulers & live layer locks.',
    description:
      'Engineered for industrial accuracy: 0.5mm snapping, alignment smart-guides, layer hierarchy, font kerning, and color-space calibration to ensure exact physical card specifications (CR80 standard 85.6mm × 53.98mm).',
    stat: '0.5 mm',
    statLabel: 'Sub-millimeter snap tolerance',
    icon: Move,
    cardFocus: 'grid',
  },
  {
    id: 'dualsided',
    title: 'Dual-Sided Synchronized Engine',
    badge: '3D Flip',
    summary: 'Coordinated front & back card authoring in portrait & landscape.',
    description:
      'Instantly toggle between front branding and back institutional terms, emergency contacts, guardian verification, and barcoded student details with synchronized layer states and orientation locks.',
    stat: 'Dual Sync',
    statLabel: 'Front & Back live render',
    icon: RotateCw,
    cardFocus: 'flip',
  },
  {
    id: 'barcode',
    title: 'Dynamic QR & Barcode Generation Engine',
    badge: 'Turnstile Ready',
    summary: 'Automated Code 128 barcodes and encrypted validation QR codes.',
    description:
      'Generates unique high-density Code 128 barcodes and 2D QR codes derived directly from student registration numbers. Fully calibrated for high-speed laser scanners and school turnstile gate systems.',
    stat: '100% Unique',
    statLabel: 'Turnstile gate compatible',
    icon: QrCode,
    cardFocus: 'barcode',
  },
  {
    id: 'photo',
    title: 'Automated Photo & Asset Alignment',
    badge: 'Smart Crop',
    summary: 'Auto-aspect ratio cropping, face-positioning & signature alpha.',
    description:
      'Bulk imports student photo directories, matching filenames to roster IDs. Applies automated face-centered framing, standard 3:4 passport aspect ratio cropping, and transparent signature placement.',
    stat: 'Auto Crop',
    statLabel: 'Passport aspect ratio',
    icon: UserCheck,
    cardFocus: 'photo',
  },
  {
    id: 'print',
    title: 'Industrial 600 DPI Gang Sheet Compiler',
    badge: 'Print Ready',
    summary: 'Automatic 12-up A4 PVC print sheets with 2mm bleed & crop marks.',
    description:
      'One-click compilation into high-density 600 DPI vector PDFs. Automatically inserts 2mm outer bleed margins, safety boundary guides, and corner crop marks for dual-sided PVC card press machines.',
    stat: '600 DPI',
    statLabel: 'Zero bleed errors',
    icon: Printer,
    cardFocus: 'bleed',
  },
];

export default function PalakIdStudioShowcase() {
  const [activeKeypoint, setActiveKeypoint] = useState<KeypointId>('excel');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showBleedGuides, setShowBleedGuides] = useState(false);
  const [enableLaserScan, setEnableLaserScan] = useState(true);

  const student = SAMPLE_ROSTER[selectedStudentIndex];
  const currentKeypointDef = KEYPOINTS.find((k) => k.id === activeKeypoint) || KEYPOINTS[0];

  const handleKeypointSelect = (id: KeypointId) => {
    setActiveKeypoint(id);
    const kp = KEYPOINTS.find((k) => k.id === id);
    if (kp?.cardFocus === 'flip') {
      setIsFlipped((prev) => !prev);
    } else if (kp?.cardFocus === 'bleed') {
      setShowBleedGuides(true);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden p-6 sm:p-10 space-y-10">
      {/* Section Header */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
          INTERACTIVE SAAS SHOWCASE • PALAK ID STUDIO
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
          Architectural Keypoints &amp; Precision ID Studio
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
          Palak ID Studio streamlines high-volume identity card production with CAD-level precision,
          instant Excel roster data-binding, and industrial 600 DPI press compilation.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Cols: Interactive 3D Card Simulation Engine */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-6">
          {/* Card Simulation Controls Bar */}
          <div className="w-full bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#E2E8F0] flex items-center justify-between gap-2 shadow-xs">
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold border border-[#E2E8F0] shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>Flip Card ({isFlipped ? 'Back' : 'Front'})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBleedGuides(!showBleedGuides)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showBleedGuides
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white hover:bg-slate-50 text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{showBleedGuides ? 'Hide Bleed' : '600 DPI Guides'}</span>
            </button>

            <button
              type="button"
              onClick={() => setEnableLaserScan(!enableLaserScan)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                enableLaserScan
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white hover:bg-slate-50 text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scan Laser</span>
            </button>
          </div>

          {/* 3D Flippable Card Perspective Wrapper */}
          <div className="w-full flex justify-center [perspective:1200px] py-2">
            <div
              className={`relative w-[290px] sm:w-[320px] h-[460px] sm:h-[490px] rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] shadow-2xl cursor-pointer ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
              onClick={() => setIsFlipped(!isFlipped)}
              title="Click card to flip"
            >
              {/* --- FRONT OF ID CARD --------------------------------- */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-white via-[#FBFDFF] to-slate-50 border-2 [backface-visibility:hidden] overflow-hidden flex flex-col justify-between p-4 shadow-xl transition-all duration-300 ${
                  activeKeypoint === 'vector'
                    ? 'border-[#4338CA] ring-4 ring-[#4338CA]/20'
                    : 'border-[#CBD5E1]'
                }`}
              >
                {/* 600 DPI Bleed & Margin Guides Overlay (if active) */}
                {showBleedGuides && (
                  <div className="absolute inset-0 pointer-events-none z-30">
                    {/* 2mm Bleed Outer Box */}
                    <div className="absolute inset-1 border border-dashed border-rose-500/70" />
                    {/* 3mm Safety Inner Box */}
                    <div className="absolute inset-3 border border-dotted border-cyan-500/80" />
                    <span className="absolute top-1 left-2 text-[8px] font-mono text-rose-600 bg-white/90 px-1 rounded">
                      2mm BLEED
                    </span>
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono text-cyan-700 bg-white/90 px-1 rounded">
                      SAFE PRINT ZONE (600 DPI)
                    </span>
                  </div>
                )}

                {/* Grid Overlay for Vector precision mode */}
                {activeKeypoint === 'vector' && (
                  <div className="absolute inset-0 bg-warm-grid pointer-events-none opacity-40 z-20" />
                )}

                {/* Lanyard Hole Punch & Clip representation */}
                <div className="w-full flex justify-center -mt-1 relative z-20">
                  <div className="w-14 h-3 bg-slate-300 rounded-full border border-slate-400 flex items-center justify-center shadow-inner">
                    <div className="w-10 h-1.5 bg-[#131B2E] rounded-full" />
                  </div>
                </div>

                {/* Institution Header */}
                <div className="text-center pt-2 pb-1 border-b border-[#E2E8F0] relative">
                  {/* Hologram Sheen Seal */}
                  <div className="absolute right-0 top-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-300 via-rose-300 to-cyan-300 opacity-80 border border-amber-400 shadow-xs flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                  </div>

                  <h4 className="text-xs font-black tracking-wider text-[#131B2E] uppercase font-display">
                    St. Xavier&apos;s Senior Academy
                  </h4>
                  <p className="text-[9px] font-mono text-[#64748B] uppercase tracking-wider">
                    Affiliated to CBSE • Chakia (Bihar)
                  </p>
                </div>

                {/* Photo & Role Badge Area */}
                <div className="flex flex-col items-center space-y-2 pt-2 relative">
                  <div
                    className={`relative w-24 h-28 rounded-xl overflow-hidden border-2 shadow-md flex items-center justify-center transition-all ${
                      activeKeypoint === 'photo'
                        ? 'border-[#F97360] ring-4 ring-[#F97360]/30 scale-105'
                        : 'border-[#CBD5E1]'
                    }`}
                  >
                    {/* Simulated High-Res Avatar */}
                    <div
                      className={`w-full h-full bg-gradient-to-br ${student.avatarBg} flex flex-col items-center justify-center text-white`}
                    >
                      <span className="text-2xl font-black font-display tracking-wider">
                        {student.avatarText}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest mt-1 opacity-80">
                        {student.role}
                      </span>
                    </div>

                    {/* Camera Corner Brackets (for photo alignment showcase) */}
                    {activeKeypoint === 'photo' && (
                      <div className="absolute inset-0 pointer-events-none p-1 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <span className="w-2 h-2 border-t-2 border-l-2 border-amber-300" />
                          <span className="w-2 h-2 border-t-2 border-r-2 border-amber-300" />
                        </div>
                        <div className="flex justify-between">
                          <span className="w-2 h-2 border-b-2 border-l-2 border-amber-300" />
                          <span className="w-2 h-2 border-b-2 border-r-2 border-amber-300" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student Name & Designation */}
                  <div className="text-center space-y-0.5">
                    <h5
                      className={`text-base font-extrabold text-[#131B2E] tracking-tight transition-colors ${
                        activeKeypoint === 'excel' ? 'text-[#4338CA]' : ''
                      }`}
                    >
                      {student.name}
                    </h5>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${student.badgeColor}`}
                    >
                      {student.role} • {student.id}
                    </span>
                  </div>
                </div>

                {/* Dynamic Data Fields (Excel Roster Linked) */}
                <div
                  className={`bg-[#FAF7F2] p-2.5 rounded-xl border space-y-1 text-[10px] transition-all ${
                    activeKeypoint === 'excel'
                      ? 'border-[#4338CA] bg-indigo-50/50 shadow-inner'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Class / Dept:</span>
                    <span className="font-bold text-[#131B2E]">{student.classSection}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Roll / Emp ID:</span>
                    <span className="font-bold text-[#131B2E]">{student.rollNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Date of Birth:</span>
                    <span className="font-bold text-[#131B2E]">{student.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Blood Group:</span>
                    <span className="font-bold text-rose-600">{student.bloodGroup}</span>
                  </div>
                </div>

                {/* Dynamic Barcode & Verification Area */}
                <div
                  className={`relative p-2 rounded-xl border bg-white flex flex-col items-center justify-center transition-all overflow-hidden ${
                    activeKeypoint === 'barcode'
                      ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-md'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  {/* Laser Scan Line Animation */}
                  {enableLaserScan && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981] animate-bounce pointer-events-none" />
                  )}

                  <div className="font-mono text-base font-black tracking-widest text-[#131B2E] select-none scale-y-125">
                    {student.barcode}
                  </div>
                  <div className="flex items-center justify-between w-full px-2 pt-1 text-[8px] font-mono text-[#64748B]">
                    <span>REG: {student.id}</span>
                    <span>VALID: 2026-27</span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="flex items-end justify-between px-1 pt-1 border-t border-[#E2E8F0] text-[8px] text-[#64748B]">
                  <div>
                    <span className="font-mono block">Holder Sign</span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic font-bold text-indigo-900 block text-[9px]">
                      S. Mukherjee
                    </span>
                    <span className="font-mono block">Principal</span>
                  </div>
                </div>
              </div>

              {/* --- BACK OF ID CARD ---------------------------------- */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-b from-[#131B2E] to-[#1E293B] text-white border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden flex flex-col justify-between p-4 shadow-xl border-[#334155]`}
              >
                {/* Magnetic Stripe representation */}
                <div className="w-full -mx-4 -mt-4 bg-black h-8 border-b border-white/10" />

                {/* Institutional Terms */}
                <div className="space-y-2 pt-2 text-[9px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cardholder Terms &amp; Conditions</span>
                  </div>
                  <ul className="space-y-1 list-disc pl-3 text-slate-300/90 leading-tight">
                    <li>This card is non-transferable and remains institutional property.</li>
                    <li>Must be visibly displayed within campus premises at all times.</li>
                    <li>Loss must be reported immediately to administrative office.</li>
                    <li>Dual-barcode enabled for automated turnstile gate entry.</li>
                  </ul>
                </div>

                {/* Emergency Contact Information */}
                <div className="bg-white/10 p-2 rounded-xl space-y-1 text-[9px] backdrop-blur-xs border border-white/10">
                  <span className="font-bold text-amber-300 block uppercase tracking-wider text-[8px]">
                    Emergency Guardian Verification:
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Parent/Contact:</span>
                    <span className="font-mono font-bold text-white">{student.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Campus Address:</span>
                    <span className="text-white text-right truncate max-w-[140px]">
                      Main Road, Chakia, Bihar
                    </span>
                  </div>
                </div>

                {/* Back QR Code & Verification Token */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono text-slate-400 block uppercase">
                      Digital Verification
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400">
                      {student.qrCode}
                    </span>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg p-1 flex items-center justify-center">
                    <QrCode className="w-full h-full text-[#131B2E]" />
                  </div>
                </div>

                {/* Flip back reminder */}
                <div className="text-center text-[8px] text-slate-400 font-mono">
                  Click card to view Front
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Roster Data-Binding Live Switcher */}
          <div className="w-full bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Live Excel Record Switcher</span>
              </span>
              <span className="text-[10px] text-[#64748B]">Simulate dynamic roster feed</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {SAMPLE_ROSTER.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedStudentIndex(idx)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedStudentIndex === idx
                      ? 'bg-white border-[#4338CA] shadow-sm ring-2 ring-[#4338CA]/20'
                      : 'bg-white/60 hover:bg-white border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  <span className="block text-[11px] font-bold text-[#131B2E] truncate">
                    {item.name.split(' ')[0]}
                  </span>
                  <span className="block text-[9px] text-[#64748B] truncate">
                    {item.role} • {item.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Architectural Keypoint Selectors & Deep Technical Detail */}
        <div className="lg:col-span-7 space-y-6">
          {/* Keypoints Grid Selectors */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              SELECT KEYPOINT TO SPOTLIGHT &amp; ANIMATE
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KEYPOINTS.map((kp) => {
                const Icon = kp.icon;
                const isSelected = activeKeypoint === kp.id;
                return (
                  <button
                    key={kp.id}
                    type="button"
                    onClick={() => handleKeypointSelect(kp.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF7F2] border-2 border-[#4338CA] shadow-md ring-2 ring-[#4338CA]/15'
                        : 'bg-white hover:bg-[#FAF7F2]/60 border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#4338CA] text-white shadow-md'
                              : 'bg-[#FAF7F2] text-[#4338CA] group-hover:bg-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#131B2E] leading-tight">
                            {kp.title}
                          </h4>
                          <span className="text-[10px] text-[#64748B]">{kp.badge}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Keypoint Deep-Dive Card */}
          <div className="bg-[#FAF7F2] p-6 sm:p-7 rounded-3xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {currentKeypointDef.badge} • DEEP DIVE
              </span>
              <div className="text-right">
                <span className="text-lg font-black text-[#131B2E] block">
                  {currentKeypointDef.stat}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono block">
                  {currentKeypointDef.statLabel}
                </span>
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-[#131B2E] tracking-tight">
              {currentKeypointDef.title}
            </h3>

            <p className="text-sm text-[#334155] leading-relaxed">
              {currentKeypointDef.description}
            </p>

            {/* Quick Architecture Proof Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                  ✓ Enterprise Benefit
                </span>
                <p className="text-xs text-[#64748B]">
                  Zero manual entry mistakes, exact color calibration, and instant turnstile barcode validation.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
                  ⚙️ Technical Standard
                </span>
                <p className="text-xs text-[#64748B]">
                  CR80 PVC card profile (85.6mm × 53.98mm) at 600 DPI vector PDF export with 2mm bleed margins.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Live Studio Launch Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#131B2E] to-[#1E293B] text-white">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">
                Want to test Palak ID Studio live in production?
              </span>
              <span className="text-[11px] text-slate-300 block">
                Deployed live at idcard.palakenterprises.shop
              </span>
            </div>

            <a
              href="https://idcard.palakenterprises.shop/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#131B2E] hover:bg-slate-100 font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              <span>Launch ID Studio</span>
              <Maximize2 className="w-3.5 h-3.5 text-[#4338CA]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
