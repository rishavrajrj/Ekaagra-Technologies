'use client';

import React, { useEffect } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Users,
  Building2,
  Check,
  X,
  ChevronRight,
  Shield,
  GraduationCap,
  ArrowRight,
  Compass,
  Calendar,
  Phone,
  MapPin,
  Heart,
  Lightbulb,
  FileText,
  Search,
  School,
  Star,
  CheckCircle2,
  Bell,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import RoshaniWebsitePreview, {
  type RoshaniVariant,
  normalizeRoshaniVariant,
} from './RoshaniWebsitePreview';
import ModalPortal from '@/components/ui/ModalPortal';

export { RoshaniWebsitePreview, normalizeRoshaniVariant, type RoshaniVariant };

export type CommunicationStyleValue =
  | 'Traditional & Prestigious'
  | 'Modern & Progressive'
  | 'Academic & Scholarly'
  | 'Warm & Community-focused'
  | 'Minimal & Professional';

export interface StyleConfig {
  value: CommunicationStyleValue;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetAudience: string;
  personalityTags: string[];
  fictionalSchool: {
    name: string;
    tagline: string;
    founded: string;
    affiliation: string;
    city: string;
  };
  hero: {
    headline: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
    badgeText: string;
  };
  stats: Array<{ label: string; value: string }>;
  sections: Array<{
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tag?: string;
  }>;
}

export const COMMUNICATION_STYLE_CONFIGS: readonly StyleConfig[] = [
  {
    value: 'Traditional & Prestigious',
    label: 'Traditional & Prestigious',
    badge: 'Heritage & Dignity',
    description: 'Heritage-driven, formal dignity, and classical institutional distinction.',
    icon: Award,
    targetAudience:
      'Best for schools that want an established, formal, and distinguished digital presence rooted in legacy.',
    personalityTags: ['Established', 'Trustworthy', 'Prestigious', 'Institutional'],
    fictionalSchool: {
      name: 'Roshani Public School',
      tagline: 'Shaping Character. Inspiring Excellence Since 2001.',
      founded: 'Est. 2001',
      affiliation: 'CBSE Affiliation No. 330943 • Under R.E.W.T.',
      city: 'Turkauliya, East Champaran, Bihar',
    },
    hero: {
      headline: 'Shaping Character. Inspiring Excellence.',
      subtext:
        'A premier co-educational senior secondary institution established in 2001 under the Roshani Educational and Welfare Trust (R.E.W.T.), dedicated to scholastic honor and moral distinction.',
      primaryCta: 'Explore Heritage',
      secondaryCta: 'Apply for Admission',
      badgeText: 'CBSE Affiliation No. 330943 • 25 Years of Excellence',
    },
    stats: [
      { label: 'Founded', value: '2001' },
      { label: 'CBSE Code', value: '330943' },
      { label: 'Grade Range', value: 'Nursery–XII' },
      { label: 'Legacy', value: '25+ Years' },
    ],
    sections: [
      {
        title: 'Heritage & Legacy',
        subtitle: 'Foundational Traditions',
        description:
          'Founded in 2001 under the guidance of R.E.W.T. to provide high-quality, value-based CBSE senior secondary education in East Champaran.',
        icon: Shield,
        tag: 'Tradition',
      },
      {
        title: 'Academic Excellence',
        subtitle: 'Scholastic Rigor',
        description:
          'Rigorous national CBSE curriculum covering Science (PCM/PCB), Commerce, and Arts streams with verified board performance.',
        icon: GraduationCap,
        tag: 'Scholastics',
      },
      {
        title: 'Leadership & Moral Growth',
        subtitle: 'Guiding Vision',
        description:
          'Steered by experienced educators dedicated to character formation, civic responsibility, and moral grounding in young scholars.',
        icon: Award,
        tag: 'Leadership',
      },
    ],
  },
  {
    value: 'Modern & Progressive',
    label: 'Modern & Progressive',
    badge: 'Innovation & Tech',
    description: 'Dynamic, future-oriented, and centered on innovation and 21st-century growth.',
    icon: Sparkles,
    targetAudience:
      'Best for schools focused on 21st-century skills, modern infrastructure, technology-enabled learning, and forward-thinking education.',
    personalityTags: ['Modern', 'Innovative', 'Future-focused', 'Dynamic'],
    fictionalSchool: {
      name: 'Roshani Public School',
      tagline: 'Smart DigiClass & 21st-Century Learning',
      founded: 'Est. 2001',
      affiliation: 'CBSE Affiliated • Smart Campus (Code: 330943)',
      city: 'Turkauliya, East Champaran, Bihar',
    },
    hero: {
      headline: 'Learning Today. Leading Tomorrow.',
      subtext:
        'Empowering curious minds through interactive DigiClassrooms, multimedia 3D learning modules, advanced science laboratories, and experiential pedagogy.',
      primaryCta: 'Apply for Admission',
      secondaryCta: '360° Virtual Campus Tour',
      badgeText: '✨ Smart DigiClassrooms & 2026-27 Admissions Open',
    },
    stats: [
      { label: 'Smart Classes', value: '100% Digitized' },
      { label: 'CBSE Code', value: '330943' },
      { label: 'Senior Streams', value: '3 Specialized' },
      { label: 'Computer Lab', value: 'High-Speed LAN' },
    ],
    sections: [
      {
        title: 'Smart DigiClass Learning',
        subtitle: 'Interactive Multimedia',
        description:
          'Digitally enabled classrooms equipped with interactive smart boards, 3D animated visual concepts, and syllabus-mapped digital courseware.',
        icon: Lightbulb,
        tag: 'Innovation',
      },
      {
        title: 'Modern Science & Tech Labs',
        subtitle: 'Hands-On Discovery',
        description:
          'Fully equipped Physics, Chemistry, Biology, and Computer Science laboratories designed for practical experimentation and STEM exploration.',
        icon: Compass,
        tag: 'Infrastructure',
      },
      {
        title: 'Student Experiences & Clubs',
        subtitle: 'Beyond the Classroom',
        description:
          'Extensive sports coaching, digital literacy, science symposiums, cultural activities, and debate societies.',
        icon: Sparkles,
        tag: 'Campus Life',
      },
    ],
  },
  {
    value: 'Academic & Scholarly',
    label: 'Academic & Scholarly',
    badge: 'Rigor & Research',
    description: 'Intellectual rigor, research-led pedagogy, and foundational scholarship.',
    icon: BookOpen,
    targetAudience:
      'Best for schools with high academic rigor, competitive exam excellence, strong scholastic achievements, and curriculum depth.',
    personalityTags: ['Intellectual', 'Academic', 'Research-led', 'Knowledge-driven'],
    fictionalSchool: {
      name: 'Roshani Public School',
      tagline: 'Shaping Bright Futures • Since 2001',
      founded: 'Est. 2001',
      affiliation: 'CBSE Affiliation No. 330943 • Senior Secondary',
      city: 'Turkauliya, East Champaran, Bihar',
    },
    hero: {
      headline: 'Shaping Bright Futures Since 2001.',
      subtext:
        'Turkauliya’s premier CBSE senior secondary institution offering complete curriculum alignment from Nursery to Class 12th with Science, Commerce, and Arts streams.',
      primaryCta: 'Apply for Admission',
      secondaryCta: 'Curriculum & Streams',
      badgeText: 'CBSE Affiliation No. 330943 • Nursery to Class XII',
    },
    stats: [
      { label: 'Established', value: 'Jan 7, 2001' },
      { label: 'CBSE Affiliation', value: 'No. 330943' },
      { label: 'Grade Range', value: 'Nursery–XII' },
      { label: 'Campus', value: 'Turkauliya' },
    ],
    sections: [
      {
        title: 'CBSE Curriculum',
        subtitle: 'NCERT Framework Aligned',
        description:
          'Comprehensive curriculum designed under NCERT guidelines ensuring academic competence, conceptual clarity, and strong board preparation.',
        icon: BookOpen,
        tag: 'Curriculum',
      },
      {
        title: 'Three Senior Streams',
        subtitle: 'Science, Commerce & Arts',
        description:
          'Dedicated senior secondary faculties offering specialized pathways in Science (PCM/PCB), Commerce, and Humanities with lab practicums.',
        icon: Search,
        tag: 'Senior Sec.',
      },
      {
        title: 'Academic Excellence',
        subtitle: 'Continuous Evaluation',
        description:
          'Rigorous formative assessments, periodic unit evaluations, remedial support sessions, and consistently outstanding CBSE board results.',
        icon: Award,
        tag: 'Evaluation',
      },
    ],
  },
  {
    value: 'Warm & Community-focused',
    label: 'Warm & Community-focused',
    badge: 'Inclusive & Nurturing',
    description: 'Compassionate, family-oriented, inclusive, and dedicated to student care.',
    icon: Users,
    targetAudience:
      'Best for schools emphasizing holistic nurturing, student well-being, close parent-teacher partnerships, and an inclusive, caring campus family.',
    personalityTags: ['Welcoming', 'Caring', 'Inclusive', 'Family-oriented'],
    fictionalSchool: {
      name: 'Roshani Public School',
      tagline: 'Where Every Child is Known, Nurtured & Celebrated',
      founded: 'Est. 2001',
      affiliation: 'Child-Centric CBSE Co-Educational Campus',
      city: 'Turkauliya, East Champaran, Bihar',
    },
    hero: {
      headline: 'Growing Together, Learning Together.',
      subtext:
        'A warm, child-centric learning community in Turkauliya where dedicated teachers, supportive parents, and joyful students flourish in a safe and loving environment.',
      primaryCta: 'Join Our Family',
      secondaryCta: 'Book Campus Tour',
      badgeText: '❤️ Child-Centric Learning • Safe & Secure Campus',
    },
    stats: [
      { label: 'Student-Teacher', value: '20:1 Ratio' },
      { label: 'CBSE Affil.', value: 'No. 330943' },
      { label: 'Co-Curriculars', value: '25+ Activities' },
      { label: 'Campus Safety', value: '24/7 Monitored' },
    ],
    sections: [
      {
        title: 'Our Caring Community',
        subtitle: 'Safe, Warm & Supportive',
        description:
          'A close-knit educational family where teachers provide individualized care and cultivate trust, curiosity, and emotional confidence.',
        icon: Heart,
        tag: 'Community',
      },
      {
        title: 'Holistic Development',
        subtitle: 'Sports, Arts & Activities',
        description:
          'Dedicated sports ground, athletics competitions, fine arts, drama, dance, and music to nurture balanced, joyful personalities.',
        icon: Users,
        tag: 'Holistic',
      },
      {
        title: 'Safe & Secure Campus',
        subtitle: 'Peace of Mind for Parents',
        description:
          '24/7 CCTV surveillance across all corridors and grounds, vetted transportation staff, and robust health & safety protocols.',
        icon: Star,
        tag: 'Safety',
      },
    ],
  },
  {
    value: 'Minimal & Professional',
    label: 'Minimal & Professional',
    badge: 'Clean & Structured',
    description: 'Clean, structured, and modern clarity with executive institutional tone.',
    icon: Building2,
    targetAudience:
      'Best for schools that prefer an uncluttered, modern executive aesthetic with high clarity, precision, and streamlined visitor pathways.',
    personalityTags: ['Clean', 'Professional', 'Structured', 'Clear'],
    fictionalSchool: {
      name: 'Roshani Public School',
      tagline: 'Education with Purpose • Institutional Discipline',
      founded: 'Est. 2001',
      affiliation: 'CBSE Affiliated Senior Secondary (Code: 330943)',
      city: 'Turkauliya, East Champaran, Bihar',
    },
    hero: {
      headline: 'Education with Purpose.',
      subtext:
        'Disciplined institutional execution with structured academic progression, verified CBSE compliance disclosures, and transparent communication for parents.',
      primaryCta: 'View Admissions 2026',
      secondaryCta: 'Mandatory Disclosures',
      badgeText: 'CBSE AFFILIATION NO. 330943 • EST. 2001',
    },
    stats: [
      { label: 'Established', value: '2001' },
      { label: 'CBSE Code', value: '330943' },
      { label: 'Grade Range', value: 'K-12' },
      { label: 'Disclosures', value: '100% Verified' },
    ],
    sections: [
      {
        title: '01 / Academic Framework',
        subtitle: 'Syllabus & Stream Structure',
        description:
          'Systematic NCERT & CBSE syllabus progression from foundation stages through senior secondary certification with modular evaluation.',
        icon: FileText,
        tag: 'Curriculum',
      },
      {
        title: '02 / Campus Facilities',
        subtitle: 'Infrastructure & Safety',
        description:
          'Purpose-built campus architecture with specialized science laboratories, central library, sports grounds, and transport fleet.',
        icon: Building2,
        tag: 'Campus',
      },
      {
        title: '03 / Admissions & Compliance',
        subtitle: 'Criteria & Guidelines',
        description:
          'Transparent admission criteria, age requirements, fee schedules, and verified CBSE mandatory public disclosure documentation.',
        icon: CheckCircle2,
        tag: 'Compliance',
      },
    ],
  },
] as const;

/**
 * MINI WEBSITE PREVIEW
 * Delegates to RoshaniWebsitePreview to render realistic, responsive miniature
 * website mockups grounded in the actual Roshani Public School reference design.
 */
export function MiniWebsitePreview({ style }: { style: StyleConfig }) {
  return <RoshaniWebsitePreview variant={style.value} />;
}

/**
 * FULL ACCESSIBLE MODAL / DRAWER
 * Displays an extensive, scrollable miniature school homepage with style-specific header,
 * hero banner, about story, curriculum cards, campus facilities, board statistics, and footer.
 */
interface ModalProps {
  style: StyleConfig;
  isOpen: boolean;
  isSelected: boolean;
  onClose: () => void;
  onSelect: () => void;
  onSwitchStyle?: (nextStyle: StyleConfig) => void;
}

export function CommunicationStylePreviewModal({
  style,
  isOpen,
  isSelected,
  onClose,
  onSelect,
  onSwitchStyle,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const IconComponent = style.icon;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#FAF7F2] shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#4338CA] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="preview-modal-title" className="text-base sm:text-lg font-bold text-[#131B2E]">
                    {style.label}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                    {style.badge}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    Roshani Public School Design
                  </span>
                  {isSelected && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Current Selection</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#475569] font-medium leading-normal">
                  {style.targetAudience}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {!isSelected && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect();
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Choose This Style</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Personality Tags Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-[#64748B]">
            <span className="font-semibold text-[#131B2E]">Your school website will feel:</span>
            <div className="flex flex-wrap gap-1.5">
              {style.personalityTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] font-medium text-[11px] text-[#334155] shadow-2xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Style Switcher Tabs */}
          {onSwitchStyle && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1.5 border-t border-slate-200/80 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Preview Other Styles:
              </span>
              {COMMUNICATION_STYLE_CONFIGS.map((s) => {
                const isActive = s.value === style.value;
                const TabIcon = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => onSwitchStyle(s)}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#4338CA] text-white shadow-xs'
                        : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-[#131B2E] hover:bg-slate-50'
                    }`}
                  >
                    <TabIcon className="w-3 h-3" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Miniature School Homepage Preview */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100 flex-1 min-h-0 space-y-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden max-w-3xl mx-auto text-slate-900">
            {/* Simulated School Website Header */}
            {renderSampleHeader(style)}

            {/* Simulated School Hero */}
            {renderSampleHero(style)}

            {/* Quick Metrics / Stats Bar */}
            <div className="border-y border-slate-200 bg-slate-50/90 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {style.stats.map((st) => (
                <div key={st.label} className="space-y-0.5">
                  <div className="text-base sm:text-lg font-bold text-[#131B2E]">{st.value}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {st.label}
                  </div>
                </div>
              ))}
            </div>

            {/* About Our School & Institutional Pillars */}
            <div className="p-4 sm:p-6 space-y-5 bg-white">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#4338CA]">
                  About Our School
                </span>
                <h4 className="text-base sm:text-xl font-bold text-slate-900">
                  A Legacy of Educational Excellence
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Roshani Public School, Turkauliya, East Champaran is affiliated with CBSE (Affiliation No. 330943) under R.E.W.T. offering child-centric education from Nursery through Class 12th.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {style.sections.map((sec) => {
                  const SecIcon = sec.icon;
                  return (
                    <div
                      key={sec.title}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#4338CA] shadow-2xs">
                            <SecIcon className="w-3.5 h-3.5" />
                          </div>
                          {sec.tag && (
                            <span className="text-[9px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                              {sec.tag}
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900">{sec.title}</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{sec.description}</p>
                      </div>
                      <div className="pt-1 text-[11px] font-semibold text-[#4338CA] flex items-center space-x-1">
                        <span>Learn more</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Principal's Message Section (Real School Leadership) */}
            <div className="bg-[#FAF7F2] p-4 sm:p-5 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-4 flex flex-col items-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/projects/roshani-public-school/principal.jpg"
                    alt="Mr. Avay Kumar, Principal"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#4338CA] shadow-sm mb-2"
                  />
                  <div className="font-bold text-xs text-slate-900">Mr. Avay Kumar</div>
                  <div className="text-[10px] text-slate-500">Principal, Roshani Public School</div>
                </div>
                <div className="sm:col-span-8 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA]">
                    From the Principal&apos;s Desk
                  </span>
                  <blockquote className="text-xs text-slate-700 italic border-l-2 border-[#4338CA] pl-3 py-0.5">
                    &ldquo;Since 2001, our mission has been to nurture curiosity, foster academic brilliance, and build strong moral character in every student.&rdquo;
                  </blockquote>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We integrate modern digital technology, smart DigiClassrooms, practical laboratory experiences, and robust co-curricular programs to nurture well-rounded personalities ready for national success.
                  </p>
                </div>
              </div>
            </div>

            {/* Announcements & Campus Events Snippet */}
            <div className="bg-white p-4 sm:p-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#4338CA]" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Notice Board &amp; Announcements
                  </span>
                </div>
                <span className="text-[10px] text-[#4338CA] font-semibold flex items-center space-x-1">
                  <span>Live Updates</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start space-x-2.5">
                  <div className="bg-indigo-50 text-indigo-700 p-1.5 rounded text-center shrink-0 font-bold leading-tight">
                    <span className="text-xs block">2026</span>
                    <span className="text-[8px] uppercase block">ADM</span>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h6 className="font-bold text-xs text-slate-900 truncate">
                      Admissions Open: Nursery to Class XII
                    </h6>
                    <p className="text-[10px] text-slate-500">
                      CBSE Affiliation 330943 • Science, Commerce &amp; Arts
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start space-x-2.5">
                  <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded text-center shrink-0 font-bold leading-tight">
                    <span className="text-xs block">CBSE</span>
                    <span className="text-[8px] uppercase block">DOCS</span>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h6 className="font-bold text-xs text-slate-900 truncate">
                      Mandatory Public Disclosures Active
                    </h6>
                    <p className="text-[10px] text-slate-500">
                      Society registration, fire safety &amp; building certificates
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated School Website Footer */}
            <div className="bg-slate-900 text-slate-300 p-4 sm:p-6 text-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/projects/roshani-public-school/logo.webp"
                      alt="RPS Logo"
                      className="w-5 h-5 rounded-full object-contain bg-white/10 p-0.5"
                    />
                    <span>Roshani Public School</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {style.fictionalSchool.tagline}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    CBSE Affiliation No. 330943 • Managed by R.E.W.T.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Quick Links</span>
                  <div className="space-y-0.5 text-[11px] text-slate-400">
                    <div>Admissions Guidelines &amp; Online Enquiry</div>
                    <div>Mandatory CBSE Public Disclosures</div>
                    <div>Academic Calendar &amp; Senior Streams</div>
                    <div>Campus Facilities &amp; Transport Fleet</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Campus Location</span>
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>Roshani Nagar, SH-54, Turkauliya, East Champaran</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>+91 9472405097 / +91 7903411151</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
                <span>© 2026 Roshani Public School. All rights reserved.</span>
                <span>CBSE Affiliation 330943 • Live reference preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            * Grounded in Roshani Public School&apos;s live visual identity and CBSE affiliation specifications.
          </p>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Close Sample
            </button>
            {!isSelected && (
              <button
                type="button"
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Select &ldquo;{style.label}&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

/**
 * Renders style-specific header for the full sample modal
 */
function renderSampleHeader(style: StyleConfig) {
  switch (style.value) {
    case 'Traditional & Prestigious':
      return (
        <div className="bg-[#0A1628] text-white border-b-2 border-amber-600">
          <div className="bg-[#070F1C] px-4 py-1 flex items-center justify-between text-[11px] text-amber-200/80 border-b border-amber-950 font-serif">
            <span>CBSE Affiliation No. 330943 • Managed by R.E.W.T.</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span>Principal&apos;s Desk</span>
              <span>CBSE Disclosures</span>
              <span>Turkauliya, Bihar</span>
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/logo.webp"
                alt="RPS Crest"
                className="w-8 h-8 rounded-full object-contain p-0.5 bg-amber-500/20 border border-amber-400 shrink-0"
              />
              <div>
                <h2 className="font-serif font-bold text-sm tracking-wide text-amber-100 uppercase">
                  ROSHANI PUBLIC SCHOOL
                </h2>
                <p className="text-[10px] text-amber-300/80 font-serif italic">
                  Shaping Character. Inspiring Excellence Since 2001.
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-xs font-serif text-slate-200">
              <span>Heritage</span>
              <span>Academics</span>
              <span>Disclosures</span>
              <span>Admissions</span>
              <span className="px-3 py-1 rounded bg-amber-600 text-white font-semibold shadow-2xs border border-amber-400">
                Apply for 2026-27
              </span>
            </div>
          </div>
        </div>
      );

    case 'Modern & Progressive':
      return (
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 px-4 py-1 flex items-center justify-between text-[11px] text-cyan-300/90 border-b border-indigo-900/40">
            <span>🚀 Smart DigiClass Learning • STEM Science Labs • 2026-27 Admissions Open</span>
            <div className="flex items-center space-x-3 text-slate-400 text-[10px]">
              <span>Digital Portal</span>
              <span>Computer Lab</span>
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/logo.webp"
                alt="RPS Logo"
                className="w-8 h-8 rounded-full object-contain p-0.5 bg-cyan-500/20 border border-cyan-400 shrink-0"
              />
              <div>
                <h2 className="font-extrabold text-sm tracking-tight text-white">ROSHANI PUBLIC SCHOOL</h2>
                <p className="text-[10px] text-cyan-400 font-medium">Smart DigiClass Campus • CBSE Affil. 330943</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-xs font-medium text-slate-300">
              <span>Smart Classes</span>
              <span>Academics</span>
              <span>Science Labs</span>
              <span>Virtual Tour</span>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-xs">
                Enroll Online
              </span>
            </div>
          </div>
        </div>
      );

    case 'Academic & Scholarly':
      return (
        <div className="bg-[#1A365D] text-white border-b border-blue-900">
          <div className="bg-[#0F2744] px-4 py-1 flex items-center justify-between text-[11px] text-blue-200 border-b border-blue-950">
            <span>Admissions Open — Academic Session 2026–27 | Nursery to Class XII</span>
            <div className="flex items-center space-x-3 text-[10px] text-blue-300">
              <span>CBSE Affiliation: 330943</span>
              <span>Turkauliya, East Champaran</span>
              <span>+91 9472405097</span>
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between bg-[#1A365D]">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/logo.webp"
                alt="Roshani Public School Logo"
                className="w-9 h-9 rounded-full object-contain p-0.5 bg-white border border-blue-200 shrink-0"
              />
              <div>
                <h2 className="font-bold text-sm tracking-tight text-white">
                  Roshani Public School
                </h2>
                <p className="text-[10px] text-blue-200">CBSE Affiliated · Est. 2001 (Affiliation No. 330943)</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-xs text-blue-100">
              <span className="hover:text-white">Home</span>
              <span className="hover:text-white">About</span>
              <span className="hover:text-white">Academics</span>
              <span className="hover:text-white">Facilities</span>
              <span className="hover:text-white">Notices</span>
              <span className="px-3 py-1 rounded bg-[#2563EB] text-white font-bold shadow-2xs">
                Apply Now
              </span>
            </div>
          </div>
        </div>
      );

    case 'Warm & Community-focused':
      return (
        <div className="bg-[#FFFDF8] text-slate-900 border-b border-amber-200">
          <div className="bg-amber-100/70 px-4 py-1 flex items-center justify-between text-[11px] text-amber-900 border-b border-amber-200">
            <span>❤️ Welcome to our caring school family • Nursery to Class XII • Admissions Open</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span>Turkauliya Campus</span>
              <span>Safe &amp; Secure</span>
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/logo.webp"
                alt="Roshani Logo"
                className="w-8 h-8 rounded-full object-contain p-0.5 bg-amber-100 border border-amber-300 shrink-0"
              />
              <div>
                <h2 className="font-bold text-sm tracking-tight text-amber-950">Roshani Public School</h2>
                <p className="text-[10px] text-amber-800">Where Every Child is Known, Nurtured &amp; Celebrated</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-xs font-semibold text-amber-950">
              <span>Our Family</span>
              <span>Student Wellbeing</span>
              <span>Activities &amp; Arts</span>
              <span>Parent Corner</span>
              <span className="px-3.5 py-1 rounded-full bg-amber-600 text-white font-bold shadow-xs">
                Visit Campus
              </span>
            </div>
          </div>
        </div>
      );

    case 'Minimal & Professional':
      return (
        <div className="bg-white text-zinc-900 border-b border-zinc-200 font-sans">
          <div className="bg-zinc-50 px-4 py-1 flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">
            <span>ROSHANI PUBLIC SCHOOL // OFFICIAL WEB PORTAL</span>
            <span>CBSE CODE: 330943 • EST. 2001</span>
          </div>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/logo.webp"
                alt="RPS"
                className="w-8 h-8 rounded-full object-contain p-0.5 bg-zinc-100 border border-zinc-300 shrink-0"
              />
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-900">
                  ROSHANI PUBLIC SCHOOL
                </h2>
                <p className="text-[10px] font-mono text-zinc-500">Senior Secondary Institution • Turkauliya, Bihar</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-5 text-xs uppercase tracking-wider font-semibold text-zinc-600">
              <span>01 / Academics</span>
              <span>02 / Campus</span>
              <span>03 / Governance</span>
              <span className="px-3 py-1 bg-zinc-900 text-white font-medium">
                Apply Now
              </span>
            </div>
          </div>
        </div>
      );
  }
}

/**
 * Renders style-specific hero for the full sample modal
 */
function renderSampleHero(style: StyleConfig) {
  switch (style.value) {
    case 'Traditional & Prestigious':
      return (
        <div className="relative overflow-hidden border-b border-amber-950">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/projects/roshani-public-school/BuildingViewFront.webp"
              alt="Roshani Campus"
              className="w-full h-full object-cover brightness-[0.35]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0C1E3C]/85 to-[#0A1628]/90" />
          </div>
          <div className="relative z-10 p-6 sm:p-10 text-center text-white max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-serif text-amber-300 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>CBSE Affiliation No. 330943 • Est. 2001</span>
            </div>
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-amber-50 leading-tight">
              Shaping Character.
              <br />
              <span className="text-amber-400 italic font-normal">Inspiring Excellence Since 2001.</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed">
              Turkauliya’s premier co-educational senior secondary institution offering complete curriculum depth and moral formation under R.E.W.T.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-2.5 font-serif">
              <button
                type="button"
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md border border-amber-400/40 cursor-pointer"
              >
                Explore Heritage
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#0A1628]/80 hover:bg-slate-800 text-amber-200 border border-amber-700/50 text-xs cursor-pointer"
              >
                Apply for Admission
              </button>
            </div>
          </div>
        </div>
      );

    case 'Modern & Progressive':
      return (
        <div className="relative overflow-hidden border-b border-indigo-900/50">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/projects/roshani-public-school/smart-classroom.webp"
              alt="Smart DigiClassroom"
              className="w-full h-full object-cover brightness-[0.3]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-slate-900/80" />
          </div>
          <div className="relative z-10 p-6 sm:p-10 text-white max-w-xl space-y-3.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-xs font-medium text-cyan-300 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Smart DigiClassrooms &amp; Science Labs</span>
            </div>
            <h3 className="font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              Learning Today.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-rose-300 bg-clip-text text-transparent">
                Leading Tomorrow.
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              Interactive 3D multimedia modules, state-of-the-art computer labs, and 21st-century experiential education in Turkauliya.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-lg inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Apply for Admission</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs cursor-pointer"
              >
                360° Virtual Tour
              </button>
            </div>
          </div>
        </div>
      );

    case 'Academic & Scholarly':
      return (
        <div className="bg-slate-50 border-b border-slate-300 p-4 sm:p-6">
          {/* Real Two-Column Layout from Reference Site */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Left Carousel Column (~68%) */}
            <div className="md:col-span-8 relative rounded-xl overflow-hidden min-h-[220px] bg-slate-900 flex flex-col justify-end p-4 sm:p-6 text-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/projects/roshani-public-school/BuildingViewFront.webp"
                alt="Roshani Campus"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-black/20" />

              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-[10px] backdrop-blur-2xs flex items-center space-x-1">
                <span>🏫</span>
                <span className="font-semibold">Main Campus</span>
              </div>

              <div className="relative z-10 space-y-2">
                <h3 className="font-bold text-xl sm:text-2xl text-white leading-tight">
                  Shaping Bright Futures
                  <br />
                  <span className="text-base font-light text-blue-200">Since 2001</span>
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 max-w-md">
                  Premier CBSE affiliated co-educational senior secondary institution in Turkauliya offering education from Nursery through Class XII.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Apply for Admission</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Notices Column (~32%) */}
            <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between shadow-2xs space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-xs text-[#1A365D] flex items-center space-x-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Latest Notices</span>
                  </h4>
                  <span className="inline-flex items-center text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    Live Updates
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100 space-y-0.5">
                    <div className="font-bold text-[11px] text-[#1A365D]">Admissions Open 2026–27</div>
                    <div className="text-[10px] text-slate-600">Nursery to Class XII (All Streams)</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                    <div className="font-bold text-[11px] text-slate-900">CBSE Affiliation 330943</div>
                    <div className="text-[10px] text-slate-600">Senior Secondary Accreditation</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                    <div className="font-bold text-[11px] text-slate-900">Smart DigiClass Learning</div>
                    <div className="text-[10px] text-slate-600">Interactive multimedia rooms</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-right">
                <span className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer">
                  View All Notices &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'Warm & Community-focused':
      return (
        <div className="relative overflow-hidden border-b border-amber-200">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/projects/roshani-public-school/kids-class.webp"
              alt="Students & Kids"
              className="w-full h-full object-cover brightness-[0.45]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/60 to-transparent" />
          </div>
          <div className="relative z-10 p-6 sm:p-10 text-white max-w-xl space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold shadow-2xs border border-white/30 backdrop-blur-xs">
              <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
              <span>Every Child Known, Nurtured &amp; Celebrated</span>
            </div>
            <h3 className="font-bold text-2xl sm:text-3xl text-white leading-tight">
              Growing Together,
              <br />
              <span className="text-amber-300 font-extrabold">Learning Together.</span>
            </h3>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              A joyful, supportive learning family in Turkauliya where caring educators and active parents build meaningful bonds of curiosity and character.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Join Our Family
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 text-xs font-semibold backdrop-blur-xs cursor-pointer"
              >
                Book Campus Tour
              </button>
            </div>
          </div>
        </div>
      );

    case 'Minimal & Professional':
      return (
        <div className="relative overflow-hidden border-b border-zinc-200 font-sans">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/projects/roshani-public-school/buildingView1.webp"
              alt="Roshani Campus Architecture"
              className="w-full h-full object-cover brightness-[0.35]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent" />
          </div>
          <div className="relative z-10 p-6 sm:p-10 text-white max-w-xl space-y-3">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              01 // CBSE AFFILIATION NO. 330943 • SENIOR SECONDARY
            </div>
            <h3 className="font-semibold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              Education with Purpose.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Focused institutional presentation with disciplined curriculum delivery, modern laboratory infrastructure, and transparent public disclosures.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5">
              <button
                type="button"
                className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs tracking-wider uppercase hover:bg-zinc-100 cursor-pointer"
              >
                Admissions 2026
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-white border border-zinc-700 text-xs uppercase font-medium cursor-pointer"
              >
                Mandatory Disclosures
              </button>
            </div>
          </div>
        </div>
      );
  }
}
