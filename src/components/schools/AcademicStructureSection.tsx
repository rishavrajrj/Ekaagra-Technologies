'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  AcademicStructureData,
} from '@/lib/types';
import type { IntakeSectionKey } from '@/lib/schoolIntake';
import {
  normalizeAcademicStructure,
  validateAcademicStructure,
  deriveClassesOfferedSummary,
  getAcademicSetupProgress,
} from '@/lib/academicStructureUtils';

import AcademicSetupNavigator from './academic/AcademicSetupNavigator';
import Step1AcademicYear from './academic/Step1AcademicYear';
import Step2GradesClasses from './academic/Step2GradesClasses';
import Step3SectionsStreams from './academic/Step3SectionsStreams';
import Step4SubjectCatalog from './academic/Step4SubjectCatalog';
import Step5SubjectApplicability from './academic/Step5SubjectApplicability';
import Step6SubjectTeachers from './academic/Step6SubjectTeachers';
import Step7ClassTeachers from './academic/Step7ClassTeachers';
import Step8AcademicReview from './academic/Step8AcademicReview';

interface AcademicStructureSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (key: IntakeSectionKey) => void;
}

export default function AcademicStructureSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  onNavigateToSection,
}: AcademicStructureSectionProps) {
  // 1. Authoritative context from Section 1 (School Identity)
  const canonicalSchoolBoard = intakeData.schoolProfile?.board;
  const canonicalSchoolType = intakeData.schoolProfile?.schoolType;
  const staffMembers = intakeData.staffFaculty?.staffMembers;

  // 2. Normalized Academic Structure
  const structure: AcademicStructureData = useMemo(() => {
    return normalizeAcademicStructure(intakeData.institutionStructure, {
      fallbackBoard: canonicalSchoolBoard,
      staffMembers,
    });
  }, [intakeData.institutionStructure, canonicalSchoolBoard, staffMembers]);

  // 3. Real Progress and Metrics
  const progress = useMemo(() => {
    return getAcademicSetupProgress(structure, staffMembers);
  }, [structure, staffMembers]);

  // 4. Current Active Step in the 8-Step Workflow
  const [activeStep, setActiveStep] = useState<number>(() => {
    if (typeof structure.activeSetupStep === 'number' && structure.activeSetupStep >= 1 && structure.activeSetupStep <= 8) {
      return structure.activeSetupStep;
    }
    return 1;
  });

  // Keep activeStep synced if saved from backend
  useEffect(() => {
    if (structure.activeSetupStep && structure.activeSetupStep !== activeStep) {
      setActiveStep(structure.activeSetupStep);
    }
  }, [structure.activeSetupStep]);

  // Track if user modified after confirmation to show special banner
  const [wasConfirmedBeforeEdit, setWasConfirmedBeforeEdit] = useState(false);

  // 5. Update helper that automatically invalidates confirmation upon structural edits
  const updateStructure = useCallback(
    (next: AcademicStructureData, isStructuralChange = true) => {
      if (isStructuralChange && (structure.confirmed || structure.academicStructureConfirmed)) {
        setWasConfirmedBeforeEdit(true);
        next = {
          ...next,
          confirmed: false,
          academicStructureConfirmed: false,
          structureStatus: 'review_required',
        };
      }

      const normalizedNext = normalizeAcademicStructure(next, {
        fallbackBoard: canonicalSchoolBoard,
        fallbackSession: next.currentAcademicSession,
        staffMembers,
      });
      normalizedNext.activeSetupStep = activeStep;

      updateSectionDirect('institutionStructure', normalizedNext);
    },
    [structure.confirmed, structure.academicStructureConfirmed, activeStep, canonicalSchoolBoard, staffMembers, updateSectionDirect]
  );

  const handleStepChange = (newStep: number) => {
    setActiveStep(newStep);
    updateStructure({
      ...structure,
      activeSetupStep: newStep,
    }, false);
  };

  const isConfirmed = Boolean(structure.confirmed || structure.academicStructureConfirmed);

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* Re-confirmation warning banner if edited after confirmation */}
      {wasConfirmedBeforeEdit && !isConfirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <h4 className="font-bold text-xs text-amber-950">
              Academic Structure Modified — Re-confirmation Required
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              You modified your academic structure after previously confirming. Please review your
              updated structure in Step 8 and re-confirm before finalizing your onboarding submission.
            </p>
          </div>
        </div>
      )}

      {/* ── 1. GUIDED PROGRESSION NAVIGATOR ──────────────────────────── */}
      <AcademicSetupNavigator
        currentStep={activeStep}
        onSelectStep={handleStepChange}
        progress={progress}
      />

      {/* ── 2. ACTIVE STEP WORKSPACE ─────────────────────────────────── */}
      <div className="transition-all duration-150">
        {activeStep === 1 && (
          <Step1AcademicYear
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(2)}
            canonicalSchoolBoard={canonicalSchoolBoard}
          />
        )}

        {activeStep === 2 && (
          <Step2GradesClasses
            structure={structure}
            schoolType={canonicalSchoolType}
            campuses={intakeData.campuses || []}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(3)}
            onPrev={() => handleStepChange(1)}
          />
        )}

        {activeStep === 3 && (
          <Step3SectionsStreams
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(4)}
            onPrev={() => handleStepChange(2)}
          />
        )}

        {activeStep === 4 && (
          <Step4SubjectCatalog
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(5)}
            onPrev={() => handleStepChange(3)}
          />
        )}

        {activeStep === 5 && (
          <Step5SubjectApplicability
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(6)}
            onPrev={() => handleStepChange(4)}
          />
        )}

        {activeStep === 6 && (
          <Step6SubjectTeachers
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(7)}
            onPrev={() => handleStepChange(5)}
            intakeData={intakeData}
            onNavigateToSection={onNavigateToSection}
          />
        )}

        {activeStep === 7 && (
          <Step7ClassTeachers
            structure={structure}
            onChange={(updated) => updateStructure(updated, true)}
            onNext={() => handleStepChange(8)}
            onPrev={() => handleStepChange(6)}
            intakeData={intakeData}
            onNavigateToSection={onNavigateToSection}
          />
        )}

        {activeStep === 8 && (
          <Step8AcademicReview
            structure={structure}
            onChange={(updated) => updateStructure(updated, false)}
            onNavigateToStep={(step) => handleStepChange(step)}
            onPrev={() => handleStepChange(7)}
            project={project}
            intakeData={intakeData}
          />
        )}
      </div>
    </div>
  );
}
