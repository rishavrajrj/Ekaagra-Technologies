'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  School,
  Building2,
  Users,
  Palette,
  Globe,
  BookOpen,
  GraduationCap,
  UserCheck,
  DollarSign,
  Calendar,
  Award,
  Clock,
  Bus,
  Home as HomeIcon,
  Library as LibraryIcon,
  Share2,
  Search,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Check,
  Sparkles,
  Layers,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import {
  verifySchoolTokenAction,
  saveSchoolIntakeDraftAction,
  submitSchoolIntakeAction,
} from '@/app/schoolProjectActions';
import type {
  SchoolProject,
  UniversalIntakeData,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  CampusBranchData,
} from '@/lib/types';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '@/lib/schoolIntake';

interface Props {
  token: string;
}

const ONBOARDING_STEPS = [
  { id: 'identity', title: 'School Identity', icon: School, description: 'Official name, boards, contacts & addresses' },
  { id: 'campuses', title: 'Campuses & Branches', icon: Building2, description: 'Multiple school branches & facilities' },
  { id: 'leadership', title: 'Leadership & Desk', icon: Users, description: 'Principal, Vice Principal & Management desk' },
  { id: 'branding', title: 'Branding & Colors', icon: Palette, description: 'Colors, crest, logos, vision & motto' },
  { id: 'websitePages', title: 'Website & Pages', icon: Globe, description: 'Public site structure & page checklist' },
  { id: 'schoolContent', title: 'About & Philosophy', icon: BookOpen, description: 'Institutional history, pedagogy & USPs' },
  { id: 'academics', title: 'Academic Structure', icon: GraduationCap, description: 'Sessions, classes, sections & subjects' },
  { id: 'staff', title: 'Staff & Faculty', icon: UserCheck, description: 'Teacher roster, qualifications & directory' },
  { id: 'students', title: 'Student Config', icon: Layers, description: 'Admission numbers, ID format & house system' },
  { id: 'admissions', title: 'Admissions Desk', icon: Calendar, description: 'Admission process, criteria & online enquiry' },
  { id: 'fees', title: 'Fees & Finance', icon: DollarSign, description: 'Class fee heads, schedules & online payment' },
  { id: 'attendance', title: 'Attendance & Schedule', icon: Clock, description: 'Daily attendance, timings & timetable' },
  { id: 'exams', title: 'Exams & Assessment', icon: Award, description: 'Exam terms, grading rules & report cards' },
  { id: 'operations', title: 'Campus Facilities & Ops', icon: Bus, description: 'Facilities, Transport, Hostel & Library' },
  { id: 'tech', title: 'CMS, Domain & Tech', icon: Settings, description: 'Publishing workflow, social, domain & SEO' },
  { id: 'review', title: 'Review & Confirm', icon: ShieldCheck, description: 'Final summary review & legal confirmation' },
];

export default function SchoolOnboardingPortal({ token }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [project, setProject] = useState<SchoolProject | null>(null);
  const [changeRequests, setChangeRequests] = useState<SchoolIntakeChangeRequest[]>([]);
  const [customFields, setCustomFields] = useState<SchoolProjectCustomField[]>([]);
  const [customRequirements, setCustomRequirements] = useState<SchoolProjectCustomRequirement[]>([]);

  // Form State
  const [intakeData, setIntakeData] = useState<UniversalIntakeData | null>(null);
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Saving / Submitting States
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submittedVersion, setSubmittedVersion] = useState<number>(1);

  // Load project & submission
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const res = await verifySchoolTokenAction(token);
      if (!res.success || !res.project) {
        setLoadError(res.error || 'Invalid or expired onboarding session.');
        setIsLoading(false);
        return;
      }

      setProject(res.project);
      setChangeRequests(res.changeRequests || []);
      setCustomFields(res.customFields || []);
      setCustomRequirements(res.customRequirements || []);

      if (res.submission && res.submission.intake_payload) {
        setIntakeData(res.submission.intake_payload);
        setCustomData(res.submission.custom_fields_data || {});
      } else {
        const initial = createInitialIntakeData({
          schoolName: res.project.school_name,
          contactName: res.project.primary_contact_name,
          contactEmail: res.project.primary_contact_email,
          contactPhone: res.project.primary_contact_phone,
          city: res.project.city,
          state: res.project.state,
          domainRequirement: res.project.domain_requirement,
        });
        setIntakeData(initial);
      }

      setIsLoading(false);
    }
    init();
  }, [token]);

  // Completeness score
  const completeness = useMemo(() => {
    if (!project || !intakeData) return { percentage: 0, missingFields: [] };
    return calculateIntakeCompleteness(project.product_id, intakeData, customFields);
  }, [project, intakeData, customFields]);

  // Field updater
  const updateSectionField = (section: keyof UniversalIntakeData, field: string, value: any) => {
    if (!intakeData) return;
    setIntakeData({
      ...intakeData,
      [section]: {
        ...((intakeData[section] as any) || {}),
        [field]: value,
      },
    });
  };

  // Direct section updater
  const updateSectionDirect = (section: keyof UniversalIntakeData, value: any) => {
    if (!intakeData) return;
    setIntakeData({
      ...intakeData,
      [section]: value,
    });
  };

  // Draft saving
  const handleSaveDraft = async () => {
    if (!intakeData) return;
    setIsSaving(true);
    setSaveMessage(null);
    const res = await saveSchoolIntakeDraftAction(token, intakeData, customData);
    if (res.success) {
      setSaveMessage({ text: 'Progress saved successfully! You can resume at any time.', type: 'success' });
      setTimeout(() => setSaveMessage(null), 4000);
    } else {
      setSaveMessage({ text: res.error || 'Failed to save draft', type: 'error' });
    }
    setIsSaving(false);
  };

  // Final Submission
  const handleSubmit = async () => {
    if (!intakeData) return;
    if (!intakeData.clientConfirmation?.isConfirmed) {
      alert('Please check the confirmation declaration box before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSaveMessage(null);
    const res = await submitSchoolIntakeAction(token, intakeData, customData);
    if (res.success) {
      setIsSubmitSuccess(true);
      setSubmittedVersion(res.versionNumber || 1);
    } else {
      setSaveMessage({ text: res.error || 'Submission error', type: 'error' });
    }
    setIsSubmitting(false);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-slate-200">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Accessing School Onboarding</h2>
          <p className="text-sm text-slate-500">Verifying secure token and loading your institution requirements session...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !project || !intakeData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-rose-200">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Onboarding Session</h2>
          <p className="text-sm text-slate-600">{loadError || 'The requested onboarding link is invalid or expired.'}</p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success Confirmation View
  if (isSubmitSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 max-w-2xl w-full p-8 md:p-10 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
              Requirements Successfully Submitted
            </span>
            <h1 className="text-3xl font-extrabold text-white">{project.school_name}</h1>
            <p className="text-slate-300 text-sm max-w-lg mx-auto">
              Your institutional requirements have been securely recorded in the School Database (Version {submittedVersion}).
              Our technical deployment team is now reviewing your structure to initialize your live website and ERP.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-left grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Project Reference:</span>
              <span className="font-mono font-bold text-blue-400">{project.project_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Completeness:</span>
              <span className="font-bold text-emerald-400">{completeness.percentage}% Verified</span>
            </div>
            <div>
              <span className="text-slate-400 block">Submitted At:</span>
              <span className="text-slate-200">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Next Milestone:</span>
              <span className="text-amber-400 font-semibold">Technical Architecture Review</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setIsSubmitSuccess(false)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
            >
              View Submitted Details
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              Return to Ekaagra Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = ONBOARDING_STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo />
            <div className="hidden sm:block h-5 w-px bg-slate-300" />
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">Institutional Onboarding</span>
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-xs md:max-w-md">{project.school_name}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Progress pill */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="text-xs font-medium text-slate-600">Completion:</span>
              <span className={`text-xs font-bold ${completeness.percentage >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {completeness.percentage}%
              </span>
              <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>

            {/* Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {/* Step Navigation next */}
            {currentStepIndex < ONBOARDING_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(ONBOARDING_STEPS.length - 1, prev + 1))}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Form'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Save Banner message */}
        {saveMessage && (
          <div
            className={`text-xs text-center py-1.5 font-medium border-t ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {saveMessage.text}
          </div>
        )}
      </header>

      {/* Main Layout: Left Stepper & Right Active Section */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stepper Navigation */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="px-2 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding Steps</span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>

            <nav className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {ONBOARDING_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition text-xs ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate flex-1">
                      <span className="block truncate">{step.title}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Active Form Section */}
        <main className="lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-8">
            {/* Step Title & Description */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step {currentStepIndex + 1}</span>
                <h2 className="text-2xl font-extrabold text-slate-900">{currentStep.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentStep.description}</p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
                ID: {currentStep.id}
              </span>
            </div>

            {/* STEP 1: IDENTITY */}
            {currentStep.id === 'identity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official School Name *</label>
                    <input
                      type="text"
                      value={intakeData.schoolProfile.schoolName || ''}
                      onChange={(e) => updateSectionField('schoolProfile', 'schoolName', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      placeholder="e.g. St. Xavier International Academy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Display / Short Name</label>
                    <input
                      type="text"
                      value={intakeData.schoolProfile.displayName || ''}
                      onChange={(e) => updateSectionField('schoolProfile', 'displayName', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      placeholder="e.g. SXIA Motihari"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Affiliation / Board *</label>
                    <select
                      value={intakeData.schoolProfile.board || 'CBSE'}
                      onChange={(e) => updateSectionField('schoolProfile', 'board', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="Bihar State Board">BSEB (Bihar School Examination Board)</option>
                      <option value="UP Board">UP Board</option>
                      <option value="IB">IB / Cambridge International</option>
                      <option value="Other">Other State Board / Recognized Authority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Affiliation / Registration No.</label>
                    <input
                      type="text"
                      value={intakeData.schoolProfile.affiliationNumber || ''}
                      onChange={(e) => updateSectionField('schoolProfile', 'affiliationNumber', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      placeholder="e.g. CBSE/AFF/330123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Established Year</label>
                    <input
                      type="number"
                      value={intakeData.schoolProfile.establishmentYear || '2015'}
                      onChange={(e) => updateSectionField('schoolProfile', 'establishmentYear', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">School Type</label>
                    <select
                      value={intakeData.schoolProfile.schoolType || 'Co-Educational Day School'}
                      onChange={(e) => updateSectionField('schoolProfile', 'schoolType', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="Co-Educational Day School">Co-Educational Day School</option>
                      <option value="Day-cum-Boarding School">Day-cum-Boarding School</option>
                      <option value="Residential Boarding School">Residential Boarding School</option>
                      <option value="Boys School">Boys School</option>
                      <option value="Girls School">Girls School</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>Official Communications & Location</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                      <input
                        type="email"
                        value={intakeData.schoolProfile.officialEmail || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'officialEmail', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="principal@school.edu"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone *</label>
                      <input
                        type="text"
                        value={intakeData.schoolProfile.officialPhone || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'officialPhone', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official WhatsApp</label>
                      <input
                        type="text"
                        value={intakeData.schoolProfile.whatsappNumber || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'whatsappNumber', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Address *</label>
                      <input
                        type="text"
                        value={intakeData.schoolProfile.address || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'address', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="Campus Road, Near Gandhi Chowk"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City / Town *</label>
                      <input
                        type="text"
                        value={intakeData.schoolProfile.city || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'city', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="Motihari"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        value={intakeData.schoolProfile.state || ''}
                        onChange={(e) => updateSectionField('schoolProfile', 'state', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        placeholder="Bihar"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CAMPUSES */}
            {currentStep.id === 'campuses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    If your institution operates multiple physical branches or kindergarten blocks, add them below.
                  </p>
                  <button
                    onClick={() => {
                      const existing = intakeData.campuses || [];
                      const nextNum = existing.length + 1;
                      updateSectionDirect('campuses', [
                        ...existing,
                        {
                          id: `campus-${Date.now()}`,
                          name: `Branch Campus ${nextNum}`,
                          code: `CAMPUS-${nextNum}`,
                          address: '',
                          city: intakeData.schoolProfile.city || 'Motihari',
                          state: intakeData.schoolProfile.state || 'Bihar',
                          pin: '845401',
                          contactPhone: intakeData.schoolProfile.officialPhone || '',
                          isMainCampus: false,
                        },
                      ]);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Campus</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(intakeData.campuses || []).map((camp, cIdx) => (
                    <div key={camp.id || cIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                            {cIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{camp.name || `Campus ${cIdx + 1}`}</span>
                          {camp.isMainCampus && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              Main Campus
                            </span>
                          )}
                        </div>
                        {cIdx > 0 && (
                          <button
                            onClick={() => {
                              const updated = (intakeData.campuses || []).filter((_, i) => i !== cIdx);
                              updateSectionDirect('campuses', updated);
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Campus Name</label>
                          <input
                            type="text"
                            value={camp.name}
                            onChange={(e) => {
                              const copy = [...(intakeData.campuses || [])];
                              copy[cIdx] = { ...copy[cIdx], name: e.target.value };
                              updateSectionDirect('campuses', copy);
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Campus Phone</label>
                          <input
                            type="text"
                            value={camp.contactPhone}
                            onChange={(e) => {
                              const copy = [...(intakeData.campuses || [])];
                              copy[cIdx] = { ...copy[cIdx], contactPhone: e.target.value };
                              updateSectionDirect('campuses', copy);
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Google Maps Link</label>
                          <input
                            type="text"
                            value={camp.googleMapsLink || ''}
                            onChange={(e) => {
                              const copy = [...(intakeData.campuses || [])];
                              copy[cIdx] = { ...copy[cIdx], googleMapsLink: e.target.value };
                              updateSectionDirect('campuses', copy);
                            }}
                            placeholder="https://maps.app.goo.gl/..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: LEADERSHIP */}
            {currentStep.id === 'leadership' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Principal */}
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">Principal's Desk</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Principal's Full Name *</label>
                      <input
                        type="text"
                        value={intakeData.leadership?.principalName || ''}
                        onChange={(e) => updateSectionField('leadership', 'principalName', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="e.g. Dr. Rajesh Kumar Sharma, M.Sc., B.Ed."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Principal's Message for Website</label>
                      <textarea
                        rows={4}
                        value={intakeData.leadership?.principalMessage || ''}
                        onChange={(e) => updateSectionField('leadership', 'principalMessage', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="Dear students, parents and well-wishers, welcome to our institution..."
                      />
                    </div>
                  </div>

                  {/* Management */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Management / Chairperson Desk</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Director / Chairperson Name</label>
                      <input
                        type="text"
                        value={intakeData.leadership?.managementContactName || ''}
                        onChange={(e) => updateSectionField('leadership', 'managementContactName', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="e.g. Er. S. P. Singh"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Management Desk Message</label>
                      <textarea
                        rows={4}
                        value={intakeData.leadership?.managementMessage || ''}
                        onChange={(e) => updateSectionField('leadership', 'managementMessage', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                        placeholder="Message from the desk of the managing committee..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: BRANDING */}
            {currentStep.id === 'branding' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Brand Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={intakeData.brandingDesign.primaryColor || '#1E40AF'}
                        onChange={(e) => updateSectionField('brandingDesign', 'primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={intakeData.brandingDesign.primaryColor || '#1E40AF'}
                        onChange={(e) => updateSectionField('brandingDesign', 'primaryColor', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Brand Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={intakeData.brandingDesign.secondaryColor || '#3B82F6'}
                        onChange={(e) => updateSectionField('brandingDesign', 'secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <input
                        type="text"
                        value={intakeData.brandingDesign.secondaryColor || '#3B82F6'}
                        onChange={(e) => updateSectionField('brandingDesign', 'secondaryColor', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">School Tagline / Motto</label>
                    <input
                      type="text"
                      value={intakeData.brandingDesign.taglineOrMotto || ''}
                      onChange={(e) => updateSectionField('brandingDesign', 'taglineOrMotto', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                      placeholder="e.g. Excellence, Discipline, Integrity"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vision Statement</label>
                    <textarea
                      rows={3}
                      value={intakeData.brandingDesign.visionStatement || ''}
                      onChange={(e) => updateSectionField('brandingDesign', 'visionStatement', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                      placeholder="To nurture compassionate, innovative leaders..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mission Statement</label>
                    <textarea
                      rows={3}
                      value={intakeData.brandingDesign.missionStatement || ''}
                      onChange={(e) => updateSectionField('brandingDesign', 'missionStatement', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                      placeholder="To deliver a holistic curriculum combining science, arts and ethics..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: WEBSITE PAGES */}
            {currentStep.id === 'websitePages' && (
              <div className="space-y-6">
                <p className="text-xs text-slate-500">
                  Select all the pages your school website requires. These will be provisioned directly in your CMS.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    'Home',
                    'About School',
                    'Principal Message',
                    'Management Desk',
                    'Vision & Mission',
                    'Academics',
                    'Departments',
                    'Faculty Directory',
                    'Campus Facilities',
                    'Photo & Video Gallery',
                    'Notice Board & Circulars',
                    'School Events',
                    'Achievements & Awards',
                    'Admissions Online Form',
                    'Fee Information',
                    'Examination Results',
                    'Student Life & Activities',
                    'Hostel & Residence',
                    'Transport & Routes',
                    'Library Catalog',
                    'Careers & Vacancies',
                    'Contact Us',
                    'Mandatory Disclosures (CBSE)',
                  ].map((pg) => {
                    const isSelected = (intakeData.websiteRequirements?.requiredPages || []).includes(pg);
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => {
                          const current = intakeData.websiteRequirements?.requiredPages || [];
                          const next = isSelected ? current.filter((p) => p !== pg) : [...current, pg];
                          updateSectionField('websiteRequirements', 'requiredPages', next);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start space-x-2 transition text-xs ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="leading-tight">{pg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 7: ACADEMIC STRUCTURE */}
            {currentStep.id === 'academics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Academic Session *</label>
                    <input
                      type="text"
                      value={intakeData.institutionStructure?.currentAcademicSession || '2026-2027'}
                      onChange={(e) => updateSectionField('institutionStructure', 'currentAcademicSession', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Session Start Date</label>
                    <input
                      type="date"
                      value={intakeData.institutionStructure?.sessionStartDate || '2026-04-01'}
                      onChange={(e) => updateSectionField('institutionStructure', 'sessionStartDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Session End Date</label>
                    <input
                      type="date"
                      value={intakeData.institutionStructure?.sessionEndDate || '2027-03-31'}
                      onChange={(e) => updateSectionField('institutionStructure', 'sessionEndDate', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Classes & Sections</h3>
                    <span className="text-xs text-slate-400">{(intakeData.institutionStructure?.classes || []).length} Classes Active</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {(intakeData.institutionStructure?.classes || []).map((c, i) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 block">{c.name}</span>
                        <span className="text-[10px] text-slate-500">Sec: {(c.sections || []).join(', ') || 'None'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 11: FEES */}
            {currentStep.id === 'fees' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs">
                  <DollarSign className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-blue-900 block">Fee Categories & Online Payment</span>
                    <p className="text-blue-700 mt-0.5">
                      Fee structures defined here populate your ERP ledger and website fee circulars.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(intakeData.feesConfiguration?.classFeeStructures || []).map((fee, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{fee.className}</span>
                        <span className="text-blue-600">₹{fee.amount} / {fee.frequency}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Due Day: {fee.dueDateDay || 10}th of month</span>
                        <span>Late Fee: ₹{fee.lateFeePerDay || 10}/day</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 14: OPERATIONS (CONDITIONAL TRANSPORT, HOSTEL, LIBRARY) */}
            {currentStep.id === 'operations' && (
              <div className="space-y-6">
                {/* Transport Section */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                        <Bus className="w-4 h-4 text-blue-600" />
                        <span>School Transport & Buses</span>
                      </h3>
                      <p className="text-xs text-slate-500">Enable if your school runs bus or van routes for student commuting.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.transportConfig?.enabled || false}
                        onChange={(e) => updateSectionField('transportConfig', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {intakeData.transportConfig?.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Bus Fleet Count</label>
                        <input
                          type="number"
                          value={intakeData.transportConfig?.vehiclesCount || 4}
                          onChange={(e) => updateSectionField('transportConfig', 'vehiclesCount', parseInt(e.target.value, 10))}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          type="checkbox"
                          id="gps"
                          checked={intakeData.transportConfig?.gpsTrackingRequired || false}
                          onChange={(e) => updateSectionField('transportConfig', 'gpsTrackingRequired', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <label htmlFor="gps" className="text-xs font-medium text-slate-700">
                          Real-time GPS Tracking Integration Needed
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Library Section */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                        <LibraryIcon className="w-4 h-4 text-emerald-600" />
                        <span>Library Management</span>
                      </h3>
                      <p className="text-xs text-slate-500">Enable for automated book accession, circulation & barcode issue.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.libraryConfig?.enabled || false}
                        onChange={(e) => updateSectionField('libraryConfig', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 16: REVIEW & CONFIRM */}
            {currentStep.id === 'review' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Institutional Onboarding Summary</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      {completeness.percentage}% Form Complete
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review your inputs. Submitting this form writes your configuration directly to the School Database without manual re-entry.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Institution:</span>
                      <span className="font-bold text-slate-800 truncate block">{intakeData.schoolProfile.schoolName}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Board / Type:</span>
                      <span className="font-bold text-slate-800 truncate block">{intakeData.schoolProfile.board}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Campuses:</span>
                      <span className="font-bold text-slate-800 block">{(intakeData.campuses || []).length} Active</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Pages Selected:</span>
                      <span className="font-bold text-slate-800 block">{(intakeData.websiteRequirements?.requiredPages || []).length} Pages</span>
                    </div>
                  </div>
                </div>

                {/* Legal Confirmation Box */}
                <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="confirm-declaration"
                      checked={intakeData.clientConfirmation?.isConfirmed || false}
                      onChange={(e) => {
                        updateSectionField('clientConfirmation', 'isConfirmed', e.target.checked);
                        updateSectionField('clientConfirmation', 'confirmedAt', new Date().toISOString());
                      }}
                      className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="confirm-declaration" className="text-xs font-semibold text-slate-800 leading-relaxed cursor-pointer">
                      "I confirm that the information provided is accurate to the best of my knowledge and represents the official requirements for our school website and software system."
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirming Authority Name *</label>
                      <input
                        type="text"
                        value={intakeData.clientConfirmation?.confirmedByName || ''}
                        onChange={(e) => updateSectionField('clientConfirmation', 'confirmedByName', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        placeholder="e.g. Principal / Secretary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Designation *</label>
                      <input
                        type="text"
                        value={intakeData.clientConfirmation?.confirmedByDesignation || ''}
                        onChange={(e) => updateSectionField('clientConfirmation', 'confirmedByDesignation', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        placeholder="e.g. Principal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Stepper Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center space-x-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                </button>

                {currentStepIndex < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.min(ONBOARDING_STEPS.length - 1, prev + 1))}
                    className="inline-flex items-center space-x-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>Save & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center space-x-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Complete Onboarding'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
