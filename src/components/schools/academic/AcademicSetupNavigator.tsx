'use client';

import React from 'react';
import {
  Calendar,
  GraduationCap,
  Layers,
  BookOpen,
  CheckSquare,
  Users,
  Award,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { AcademicSetupProgress } from '@/lib/academicStructureUtils';

interface AcademicSetupNavigatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  progress: AcademicSetupProgress;
}

export const ACADEMIC_STEPS = [
  {
    step: 1,
    title: 'Academic Year',
    shortDesc: 'Define the academic session & calendar',
    icon: Calendar,
  },
  {
    step: 2,
    title: 'Grades & Classes',
    shortDesc: 'Define academic levels your school offers',
    icon: GraduationCap,
  },
  {
    step: 3,
    title: 'Sections & Streams',
    shortDesc: 'Divide grades into sections & optional streams',
    icon: Layers,
  },
  {
    step: 4,
    title: 'Subjects & Curriculum',
    shortDesc: 'Define what students learn in reusable catalog',
    icon: BookOpen,
  },
  {
    step: 5,
    title: 'Subject Applicability',
    shortDesc: 'Decide which subjects apply to each group',
    icon: CheckSquare,
  },
  {
    step: 6,
    title: 'Subject Teachers',
    shortDesc: 'Assign teachers to subjects & teaching groups',
    icon: Users,
  },
  {
    step: 7,
    title: 'Class Teachers',
    shortDesc: 'Assign class/section teachers for each group',
    icon: Award,
  },
  {
    step: 8,
    title: 'Academic Review',
    shortDesc: 'Audit live structure, warnings & confirm',
    icon: ClipboardCheck,
  },
] as const;

export default function AcademicSetupNavigator({
  currentStep,
  onSelectStep,
  progress,
}: AcademicSetupNavigatorProps) {
  const getStepStatus = (step: number) => {
    switch (step) {
      case 1:
        return {
          isComplete: progress.step1.isComplete,
          text: progress.step1.isComplete ? '✓ Complete' : 'Incomplete',
          badgeText: progress.step1.summaryText,
        };
      case 2:
        return {
          isComplete: progress.step2.isComplete,
          text: progress.step2.isComplete ? '✓ Complete' : 'Needs grades',
          badgeText: progress.step2.summaryText,
        };
      case 3:
        return {
          isComplete: progress.step3.isComplete,
          text: progress.step3.isComplete ? '✓ Configured' : 'Optional',
          badgeText: progress.step3.summaryText,
        };
      case 4:
        return {
          isComplete: progress.step4.isComplete,
          text: progress.step4.isComplete ? '✓ Configured' : 'No subjects',
          badgeText: progress.step4.summaryText,
        };
      case 5:
        return {
          isComplete: progress.step5.isComplete,
          text: progress.step5.isComplete ? '✓ Complete' : 'In progress',
          badgeText: progress.step5.summaryText,
        };
      case 6:
        return {
          isComplete: progress.step6.isComplete,
          text: progress.step6.isComplete
            ? '✓ All assigned'
            : progress.step6.missingCount > 0
            ? `${progress.step6.missingCount} unassigned`
            : 'In progress',
          badgeText: progress.step6.summaryText,
        };
      case 7:
        return {
          isComplete: progress.step7.isComplete,
          text: progress.step7.isComplete
            ? '✓ All assigned'
            : progress.step7.missingCount > 0
            ? `${progress.step7.missingCount} unassigned`
            : 'In progress',
          badgeText: progress.step7.summaryText,
        };
      case 8:
        return {
          isComplete: progress.step8.isComplete,
          text: progress.step8.isConfirmed
            ? '✓ Confirmed'
            : progress.step8.totalWarnings > 0
            ? `⚠ ${progress.step8.totalWarnings} warnings`
            : 'Ready to review',
          badgeText: progress.step8.summaryText,
        };
      default:
        return { isComplete: false, text: '', badgeText: '' };
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-5">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA] font-bold text-[10px] tracking-wider uppercase">
              Guided Setup Assistant
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="text-[#64748B] text-xs font-semibold">
              Step {currentStep} of 8
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#131B2E] tracking-tight mt-0.5">
            Academic Setup
          </h2>
          <p className="text-[#64748B] text-xs">
            Configure how your school is organized for the academic year.
          </p>
        </div>

        {/* Real Data Progress Bar */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 min-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Overall Progress</span>
            <span className="text-sm font-extrabold text-[#4338CA]">
              {progress.overallPercentage}%
            </span>
          </div>
          <div className="w-36 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress.overallPercentage === 100
                  ? 'bg-emerald-500'
                  : progress.overallPercentage >= 60
                  ? 'bg-[#4338CA]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progress.overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ACADEMIC_STEPS.map((s) => {
          const status = getStepStatus(s.step);
          const isActive = currentStep === s.step;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onSelectStep(s.step)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                isActive
                  ? 'bg-[#EEF2FF]/60 border-[#4338CA] shadow-xs ring-2 ring-[#4338CA]/10'
                  : 'bg-[#F8FAFC]/50 hover:bg-[#F1F5F9]/80 border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-[#4338CA] text-white'
                        : status.isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#94A3B8] block">
                      STEP {s.step}
                    </span>
                    <h4
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-[#4338CA]' : 'text-[#131B2E]'
                      }`}
                    >
                      {s.title}
                    </h4>
                  </div>
                </div>

                {status.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : s.step === 8 && progress.step8.totalWarnings > 0 ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0 mt-0.5" />
                )}
              </div>

              {/* Status pill with real data */}
              <div className="pt-1 border-t border-[#F1F5F9]/80 flex items-center justify-between text-[10px]">
                <span
                  className={`font-semibold truncate max-w-[130px] ${
                    status.isComplete ? 'text-emerald-700' : 'text-[#64748B]'
                  }`}
                  title={status.badgeText}
                >
                  {status.badgeText}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-bold text-[9px] ${
                    status.isComplete
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isActive
                      ? 'bg-[#4338CA]/10 text-[#4338CA]'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {status.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
