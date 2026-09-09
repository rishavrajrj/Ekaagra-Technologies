'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Save,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  StudentConfigData,
  Student,
} from '@/lib/types';
import type { IntakeSectionKey } from '@/lib/schoolIntake';
import { normalizeStudentConfig } from '@/lib/studentFieldDefinitions';
import { saveStudentConfigurationAction } from '@/app/studentActions';
import StudentFieldSelector from './students/StudentFieldSelector';
import StudentTemplateStage from './students/StudentTemplateStage';
import StudentImportStage from './students/StudentImportStage';

export interface StudentInformationSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  token: string;
  project?: SchoolProject | null;
  onNavigateToSection?: (key: IntakeSectionKey) => void;
}

export default function StudentInformationSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  token,
  project,
  onNavigateToSection,
}: StudentInformationSectionProps) {
  // Normalize current student configuration
  const config: StudentConfigData = useMemo(() => {
    return normalizeStudentConfig(intakeData.studentConfig, {
      sessionYear: intakeData.institutionStructure?.currentAcademicSession,
    });
  }, [intakeData.studentConfig, intakeData.institutionStructure?.currentAcademicSession]);

  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(config.activeStage || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const schoolName =
    intakeData.schoolProfile?.schoolName ||
    project?.school_name ||
    'Demo Public School';

  const academicStructure = intakeData.institutionStructure;

  // Update helper
  const handleUpdateConfig = useCallback(
    (updates: Partial<StudentConfigData>) => {
      const merged: StudentConfigData = {
        ...config,
        ...updates,
        activeStage,
      };
      updateSectionDirect('studentConfig', merged);
    },
    [config, activeStage, updateSectionDirect]
  );

  // Save draft configuration to backend
  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await saveStudentConfigurationAction(token, {
        ...config,
        activeStage,
      });

      if (res.success) {
        setSaveStatus('Configuration saved securely.');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus(res.error || 'Failed to save configuration.');
      }
    } catch (err: any) {
      setSaveStatus(err.message || 'Save error.');
    } finally {
      setIsSaving(false);
    }
  };

  const goToStage = (stage: 1 | 2 | 3) => {
    setActiveStage(stage);
    handleUpdateConfig({ activeStage: stage });
  };

  const handleImportCompleted = (importedStudents: Student[]) => {
    if (onNavigateToSection) {
      onNavigateToSection('admissions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & 3-Stage Stepper Navigation */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Step 9 • Student Master
              </span>
              <span className="text-xs text-[#64748B]">
                {config.students?.length || 0} students enrolled
              </span>
            </div>
            <h2 className="text-lg font-black text-[#131B2E]">Student Information & Configuration</h2>
            <p className="text-xs text-[#64748B]">
              Choose the information your school wants to maintain, create an import template, and add students securely.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {saveStatus && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md animate-fade-in">
                {saveStatus}
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveConfiguration}
              disabled={isSaving}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>
        </div>

        {/* 3-Stage Progress Nav */}
        <div className="grid grid-cols-3 gap-2">
          {/* Stage 1 Tab */}
          <button
            type="button"
            onClick={() => goToStage(1)}
            className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
              activeStage === 1
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-600/10'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStage === 1
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              1
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block truncate">
                Choose Information
              </span>
              <span className="text-[10px] text-[#64748B] block truncate">
                {config.enabledFields?.length || 0} fields selected
              </span>
            </div>
          </button>

          {/* Stage 2 Tab */}
          <button
            type="button"
            onClick={() => goToStage(2)}
            className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
              activeStage === 2
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-600/10'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStage === 2
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              2
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block truncate">
                Review & Template
              </span>
              <span className="text-[10px] text-[#64748B] block truncate">
                Excel & CSV templates
              </span>
            </div>
          </button>

          {/* Stage 3 Tab */}
          <button
            type="button"
            onClick={() => goToStage(3)}
            className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
              activeStage === 3
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-600/10'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStage === 3
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              3
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131B2E] block truncate">
                Upload Students
              </span>
              <span className="text-[10px] text-[#64748B] block truncate">
                Import & WebP Photos
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Active Stage Content */}
      {activeStage === 1 && (
        <StudentFieldSelector
          config={config}
          schoolName={schoolName}
          schoolId={project?.id}
          token={token}
          onUpdateConfig={handleUpdateConfig}
          onContinueToTemplate={() => goToStage(2)}
          isSaving={isSaving}
        />
      )}

      {activeStage === 2 && (
        <StudentTemplateStage
          config={config}
          schoolName={schoolName}
          academicStructure={academicStructure}
          onBackToFields={() => goToStage(1)}
          onProceedToUpload={() => goToStage(3)}
        />
      )}

      {activeStage === 3 && (
        <StudentImportStage
          config={config}
          token={token}
          schoolName={schoolName}
          academicStructure={academicStructure}
          onBackToTemplate={() => goToStage(2)}
          onImportComplete={handleImportCompleted}
        />
      )}
    </div>
  );
}
