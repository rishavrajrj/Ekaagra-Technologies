'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  FileText,
  Percent,
  Calendar,
  Bus,
  Home,
  Utensils,
  BookOpen,
  Shirt,
  Compass,
  Award,
  Users,
  ChevronRight,
  Calculator,
  Globe,
  Info,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  FeesConfigurationData,
  CommonFeeItem,
  OptionalServiceConfig,
  PaymentPlanConfig,
  ScholarshipConfigData,
  AcademicClassConfig,
  MeritScholarshipSlab,
  FeeNoteItem,
} from '@/lib/types';
import {
  normalizeFeesData,
  resolveClassFees,
  calculateFeeBreakdown,
  generateAnnualChargesSummary,
  generateInclusionsExclusions,
  validateFeeStructure,
  formatFeeCurrency,
  isPreNurseryClass,
  DEFAULT_ANNUAL_CHARGES_INCLUSIONS,
} from '@/lib/feeCalculationEngine';
import { getSuggestedClassesForSchoolType } from '@/lib/academicStructureUtils';
import { useCampusAcademicScope } from '@/hooks/useCampusAcademicScope';
import { filterFeesByCampusScope } from '@/lib/campusAcademicScopeService';
import CampusAcademicScopeSummary from './CampusAcademicScopeSummary';
import AddEditFeeModal from './fees/AddEditFeeModal';
import OverrideClassFeeModal from './fees/OverrideClassFeeModal';
import DeleteFeeConfirmModal from './fees/DeleteFeeConfirmModal';

interface FeeStructureSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  activeCampusId?: string;
  onNavigateToSection?: (sectionKey: any) => void;
}

type FeeTabKey =
  | 'common_fees'
  | 'admission_fees'
  | 'optional_services'
  | 'class_matrix'
  | 'payment_plans'
  | 'scholarships'
  | 'inclusions_notes'
  | 'preview';

export default function FeeStructureSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  activeCampusId,
  onNavigateToSection,
}: FeeStructureSectionProps) {
  // 1. Inherit active classes from Campus Academic Scope (Single Source of Truth)
  const campusScope = useCampusAcademicScope(activeCampusId, intakeData);
  const activeClasses: AcademicClassConfig[] = campusScope.activeClasses || campusScope.classes || [];

  // Academic session inherited from Academic Structure
  const academicSession = intakeData.institutionStructure?.currentAcademicSession || '2026-2027';

  // 2. Normalized Fees Data strictly scoped to Campus Academic Scope
  const feesConfig: FeesConfigurationData = useMemo(() => {
    const raw = normalizeFeesData(intakeData.feesConfiguration, {
      classes: activeClasses,
      session: academicSession,
    });
    return filterFeesByCampusScope(raw, campusScope);
  }, [intakeData.feesConfiguration, activeClasses, academicSession, campusScope]);

  // Mutator helper to update fees configuration in intakeData
  const updateFees = useCallback(
    (updater: (prev: FeesConfigurationData) => FeesConfigurationData) => {
      const updated = updater(feesConfig);
      const normalized = normalizeFeesData(updated, {
        classes: activeClasses,
        session: academicSession,
      });
      const filtered = filterFeesByCampusScope(normalized, campusScope);
      updateSectionDirect('feesConfiguration', filtered);
    },
    [feesConfig, activeClasses, academicSession, campusScope, updateSectionDirect]
  );

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<FeeTabKey>('common_fees');

  // Class-wise matrix student type toggle
  const [matrixStudentType, setMatrixStudentType] = useState<'new_admission' | 'existing_student'>('new_admission');

  // Modal states
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<CommonFeeItem | null>(null);
  const [isAdmissionOnlyModal, setIsAdmissionOnlyModal] = useState(false);

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<{
    className: string;
    classId: string;
    feeId: string;
    feeName: string;
    feeCategory: string;
    inheritedAmount: number;
    frequency: string;
    existingCustomAmount?: number;
    isAlreadyOverridden?: boolean;
  } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<CommonFeeItem | null>(null);

  // Live calculation simulator controls
  const [calcClass, setCalcClass] = useState<string>(activeClasses[0]?.name || '');

  // Synchronize calcClass with active campus classes
  useEffect(() => {
    if (activeClasses.length > 0 && !activeClasses.some((c) => c.name === calcClass)) {
      setCalcClass(activeClasses[0].name);
    } else if (activeClasses.length === 0 && calcClass !== '') {
      setCalcClass('');
    }
  }, [activeClasses, calcClass]);
  const [calcStudentType, setCalcStudentType] = useState<'new_admission' | 'existing_student'>('new_admission');
  const [calcPaymentPlan, setCalcPaymentPlan] = useState<PaymentPlanConfig['frequency']>('yearly');
  const [calcScholarship, setCalcScholarship] = useState<'none' | 'merit' | 'defence' | 'girls' | 'sibling'>('none');
  const [calcMeritScore, setCalcMeritScore] = useState<number>(85);

  // Validation diagnostics
  const validation = useMemo(() => {
    return validateFeeStructure(feesConfig, { classes: activeClasses, session: academicSession });
  }, [feesConfig, activeClasses, academicSession]);

  // Handlers for Common Fees & Admission Fees
  const handleOpenAddFee = (isAdmissionOnly = false) => {
    setFeeToEdit(null);
    setIsAdmissionOnlyModal(isAdmissionOnly);
    setAddEditModalOpen(true);
  };

  const handleOpenEditFee = (fee: CommonFeeItem) => {
    setFeeToEdit(fee);
    setIsAdmissionOnlyModal(Boolean(fee.isAdmissionOnly));
    setAddEditModalOpen(true);
  };

  const handleSaveFee = (savedFee: CommonFeeItem, forceUpdateAll = false) => {
    updateFees((prev) => {
      const listKey = savedFee.isAdmissionOnly ? 'newStudentFees' : 'commonFees';
      const existingList = prev[listKey] || [];
      const index = existingList.findIndex((f) => f.id === savedFee.id);

      let nextList: CommonFeeItem[];
      if (index >= 0) {
        nextList = [...existingList];
        nextList[index] = savedFee;
      } else {
        nextList = [...existingList, savedFee];
      }

      // If forceUpdateAll is true, clear overrides for this fee across all classes
      let nextOverrides = { ...(prev.classOverrides || {}) };
      if (forceUpdateAll && index >= 0) {
        for (const clsName of Object.keys(nextOverrides)) {
          if (nextOverrides[clsName]?.[savedFee.id]) {
            delete nextOverrides[clsName][savedFee.id];
          }
        }
      }

      return {
        ...prev,
        [listKey]: nextList,
        classOverrides: nextOverrides,
      };
    });
  };

  const handleConfirmDeleteFee = () => {
    if (!feeToDelete) return;
    const targetId = feeToDelete.id;
    const isAdmission = Boolean(feeToDelete.isAdmissionOnly);

    updateFees((prev) => {
      const listKey = isAdmission ? 'newStudentFees' : 'commonFees';
      const filtered = (prev[listKey] || []).filter((f) => f.id !== targetId);

      // Clean up orphaned overrides for this fee
      const nextOverrides = { ...(prev.classOverrides || {}) };
      for (const cls of Object.keys(nextOverrides)) {
        if (nextOverrides[cls]?.[targetId]) {
          delete nextOverrides[cls][targetId];
        }
      }

      return {
        ...prev,
        [listKey]: filtered,
        classOverrides: nextOverrides,
      };
    });
    setFeeToDelete(null);
  };

  // Class Override Handlers
  const handleOpenOverride = (
    className: string,
    classId: string,
    fee: { id: string; name: string; category: string; amount: number; frequency: string; isCustom: boolean }
  ) => {
    const existingOverride = feesConfig.classOverrides?.[className]?.[fee.id];
    setOverrideTarget({
      className,
      classId,
      feeId: fee.id,
      feeName: fee.name,
      feeCategory: fee.category,
      inheritedAmount: fee.amount,
      frequency: fee.frequency,
      existingCustomAmount: existingOverride?.amount,
      isAlreadyOverridden: fee.isCustom,
    });
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = (amount: number, notes?: string) => {
    if (!overrideTarget) return;
    const { className, feeId } = overrideTarget;

    updateFees((prev) => {
      const classMap = { ...(prev.classOverrides?.[className] || {}) };
      classMap[feeId] = {
        amount,
        isCustom: true,
        notes,
      };

      return {
        ...prev,
        classOverrides: {
          ...(prev.classOverrides || {}),
          [className]: classMap,
        },
      };
    });
  };

  const handleResetToGlobal = () => {
    if (!overrideTarget) return;
    const { className, feeId } = overrideTarget;

    updateFees((prev) => {
      const classMap = { ...(prev.classOverrides?.[className] || {}) };
      delete classMap[feeId];

      const nextOverrides = { ...(prev.classOverrides || {}) };
      if (Object.keys(classMap).length === 0) {
        delete nextOverrides[className];
      } else {
        nextOverrides[className] = classMap;
      }

      return {
        ...prev,
        classOverrides: nextOverrides,
      };
    });
  };

  // Optional Service Toggle
  const handleToggleService = (serviceId: string, isProvided: boolean) => {
    updateFees((prev) => ({
      ...prev,
      optionalServices: (prev.optionalServices || []).map((s) =>
        s.id === serviceId ? { ...s, isProvided } : s
      ),
    }));
  };

  const handleUpdateServiceField = (serviceId: string, field: keyof OptionalServiceConfig, val: any) => {
    updateFees((prev) => ({
      ...prev,
      optionalServices: (prev.optionalServices || []).map((s) =>
        s.id === serviceId ? { ...s, [field]: val } : s
      ),
    }));
  };

  // Calculation Simulator Result
  const simulationResult = useMemo(() => {
    return calculateFeeBreakdown({
      className: calcClass,
      studentType: calcStudentType,
      paymentPlanFrequency: calcPaymentPlan,
      scholarshipType: calcScholarship,
      meritScorePercentage: calcMeritScore,
      feesConfig,
    });
  }, [calcClass, calcStudentType, calcPaymentPlan, calcScholarship, calcMeritScore, feesConfig]);

  // Inclusions and Exclusions
  const naturalLanguageAnnualSummary = useMemo(() => {
    return generateAnnualChargesSummary(
      feesConfig.annualChargesInclusions,
      feesConfig.annualChargesCustomText
    );
  }, [feesConfig.annualChargesInclusions, feesConfig.annualChargesCustomText]);

  const { included, notIncluded } = useMemo(() => {
    return generateInclusionsExclusions(feesConfig);
  }, [feesConfig]);

  // Tab definitions
  const tabs: Array<{ id: FeeTabKey; label: string; icon: any; count?: number }> = [
    { id: 'common_fees', label: '1. Common Fees', icon: DollarSign, count: feesConfig.commonFees?.length || 0 },
    { id: 'admission_fees', label: '2. Admission Fees', icon: Shield, count: feesConfig.newStudentFees?.length || 0 },
    { id: 'optional_services', label: '3. Optional Services', icon: Layers, count: (feesConfig.optionalServices || []).filter((s) => s.isProvided).length },
    { id: 'class_matrix', label: '4. Class-wise Matrix', icon: Calculator, count: activeClasses.length },
    { id: 'payment_plans', label: '5. Payment Plans', icon: Calendar },
    { id: 'scholarships', label: '6. Scholarships & Discounts', icon: Percent },
    { id: 'inclusions_notes', label: '7. Inclusions & Policies', icon: FileText },
    { id: 'preview', label: '8. Live Preview', icon: Globe },
  ];

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* ─── CANONICAL CAMPUS ACADEMIC SCOPE SUMMARY ─────────────────── */}
      <CampusAcademicScopeSummary
        scope={campusScope}
        onNavigateToClasses={() => onNavigateToSection?.('campuses')}
      />

      {/* ─── BANNER: INHERITANCE & ARCHITECTURE ──────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl sm:rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                Intelligent Inheritance Engine
              </span>
              <span className="text-slate-400 text-xs">• Session {academicSession}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Fee Structure & Financial Policies
            </h3>
            <p className="text-xs text-indigo-100/80 leading-relaxed">
              <strong>Configure once, inherit everywhere.</strong> Common fees automatically propagate across all {activeClasses.length} academic classes. Override amounts only for specific class exceptions.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
              <span className="block text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Readiness</span>
              <span className="text-xl font-black text-emerald-400">{validation.percentage}%</span>
            </div>
          </div>
        </div>

        {/* Validation Warnings / Blockers */}
        {validation.blockers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-start space-x-2 text-rose-300 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Blocker: {validation.blockers[0]}</span>
          </div>
        )}
      </div>

      {/* ─── TAB NAVIGATION BAR ────────────────────────────────────────── */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
              {typeof t.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: COMMON / GLOBAL FEES (Rule 5, 6) ───────────────────── */}
      {activeTab === 'common_fees' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Common / Global Fees</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Set fees that apply to multiple or all students once. These values automatically appear in the class-wise fee structure.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddFee(false)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Common Fee</span>
            </button>
          </div>

          {/* Common Fees Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Fee Component</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Student Type</th>
                  <th className="py-3 px-3">Applicable Classes</th>
                  <th className="py-3 px-3">Website</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(feesConfig.commonFees || []).map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{fee.name}</div>
                      {fee.description && (
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                          {fee.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium">
                        {fee.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-sm">
                      {formatFeeCurrency(fee.amount)}
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-600">{fee.frequency}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fee.studentType === 'both'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : fee.studentType === 'new_only'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {fee.studentType === 'both'
                          ? 'Both'
                          : fee.studentType === 'new_only'
                          ? 'New Only'
                          : 'Existing Only'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {fee.applicableClasses === 'all' ? (
                        <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>All Classes ({activeClasses.length})</span>
                        </span>
                      ) : (
                        <span>{fee.applicableClasses.length} Classes Selected</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {fee.isVisibleOnWebsite !== false ? (
                        <span className="text-emerald-600 flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Visible</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center space-x-1">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Hidden</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFee(fee)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Fee"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeeToDelete(fee);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Fee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start space-x-3 text-indigo-950">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Tip:</strong> If you set <strong>Annual Charges = ₹12,000</strong> for All Classes, Pre-Nursery through Class 12 automatically inherit ₹12,000 without entering it class-by-class. To customize Class 6 to ₹15,000, simply click Override in the <strong>Class-wise Matrix</strong> tab.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ADMISSION / NEW STUDENT FEES (Rule 7, 8) ───────────── */}
      {activeTab === 'admission_fees' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                  One-Time Charges
                </span>
                <h4 className="text-base font-bold text-slate-900">Admission &amp; New Student Fees</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                These one-time charges apply strictly to new admissions and NEVER appear in existing student fee totals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddFee(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Admission Fee</span>
            </button>
          </div>

          {/* Admission Fees Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Charge Name</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Refundable?</th>
                  <th className="py-3 px-3">Payment Timing</th>
                  <th className="py-3 px-3">Applicable Classes</th>
                  <th className="py-3 px-3">Website</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(feesConfig.newStudentFees || []).map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{fee.name}</div>
                      {fee.description && (
                        <div className="text-[10px] text-slate-400 font-normal">{fee.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-sm">
                      {formatFeeCurrency(fee.amount)}
                    </td>
                    <td className="py-3 px-3">
                      {fee.isRefundable ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Yes (Refundable)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px]">
                          Non-refundable
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 capitalize">
                      {fee.paymentTiming === 'at_admission'
                        ? 'At Admission'
                        : fee.paymentTiming === 'before_session'
                        ? 'Before Session'
                        : 'Scheduled'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {fee.applicableClasses === 'all'
                        ? `All Classes (${activeClasses.length})`
                        : `${fee.applicableClasses.length} Classes`}
                    </td>
                    <td className="py-3 px-3">
                      {fee.isVisibleOnWebsite !== false ? (
                        <span className="text-emerald-600 text-[11px] font-medium">Visible</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Hidden</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFee(fee)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeeToDelete(fee);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: OPTIONAL SERVICES (Rule 9, 10, 11) ─────────────────── */}
      {activeTab === 'optional_services' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-bold text-slate-900">Optional School Services</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable only the services your school provides. Enabled services can be configured class-wise and presented transparently to parents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(feesConfig.optionalServices || []).map((srv) => {
              const isEnabled = srv.isProvided;
              return (
                <div
                  key={srv.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                      : 'bg-slate-50/70 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{srv.name}</span>
                        {isEnabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 text-slate-600">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{srv.description}</p>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleService(srv.id, !isEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Configuration (Rule 10) */}
                  {isEnabled && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs animate-in fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Base Fee Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={srv.feeAmount ?? 0}
                            onChange={(e) => handleUpdateServiceField(srv.id, 'feeAmount', Number(e.target.value))}
                            className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Frequency</label>
                        <select
                          value={srv.frequency || 'monthly'}
                          onChange={(e) => handleUpdateServiceField(srv.id, 'frequency', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 capitalize"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half_yearly">Half-Yearly</option>
                          <option value="annually">Annually</option>
                          <option value="one_time">One-time</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`req-${srv.id}`}
                            checked={srv.isRequired || false}
                            onChange={(e) => handleUpdateServiceField(srv.id, 'isRequired', e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <label htmlFor={`req-${srv.id}`} className="text-[11px] text-slate-700 font-medium">
                            Mandatory for enrolled students
                          </label>
                        </div>
                        {srv.key === 'transport' && (
                          <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                            Route-based Pricing
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: CLASS-WISE FEE MATRIX (Rule 12, 13, 14, 15, 16) ────── */}
      {activeTab === 'class_matrix' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Generated Class-wise Fee Matrix</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically calculated from Common Fees, Admission Fees, and Optional Services. Click any fee to set a class-level override.
              </p>
            </div>

            {/* Student Type Toggle (Rule 16) */}
            {activeClasses.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMatrixStudentType('new_admission')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    matrixStudentType === 'new_admission'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Admission
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixStudentType('existing_student')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    matrixStudentType === 'existing_student'
                      ? 'bg-white text-indigo-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Student
                </button>
              </div>
            )}
          </div>

          {activeClasses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h5 className="text-sm font-bold text-slate-800 mb-1">
                No academic classes configured for this campus
              </h5>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Please configure classes under Campus Academic Scope &amp; Levels before viewing or configuring the class-wise fee matrix.
              </p>
              {onNavigateToSection && (
                <button
                  type="button"
                  onClick={() => onNavigateToSection('campuses')}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Configure Campus Classes
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Matrix Container */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 sticky top-0 z-10 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 min-w-[180px] bg-slate-50 sticky left-0 z-20 border-r border-slate-200">
                    Fee Component
                  </th>
                  {activeClasses.map((cls) => (
                    <th key={cls.id} className="py-3 px-3 text-center min-w-[125px] border-r border-slate-200">
                      <div>{cls.name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{cls.level || 'Academic'}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* One-Time Admission Charges (Only in new admission view) */}
                {matrixStudentType === 'new_admission' &&
                  (feesConfig.newStudentFees || []).map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800 bg-white sticky left-0 z-10 border-r border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <span>{fee.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                            One-time
                          </span>
                        </div>
                      </td>
                      {activeClasses.map((cls) => {
                        const override = feesConfig.classOverrides?.[cls.name]?.[fee.id];
                        const isCustom = Boolean(override?.isCustom);
                        const displayAmount = isCustom && override ? override.amount : fee.amount;

                        return (
                          <td
                            key={cls.id || cls.name}
                            onClick={() =>
                              handleOpenOverride(cls.name, cls.id || cls.name, {
                                id: fee.id,
                                name: fee.name,
                                category: fee.category,
                                amount: fee.amount,
                                frequency: fee.frequency,
                                isCustom,
                              })
                            }
                            className="py-2.5 px-3 text-center border-r border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition group"
                          >
                            <div className="font-mono font-bold text-slate-900">{formatFeeCurrency(displayAmount)}</div>
                            <div className="text-[9px] mt-0.5">
                              {isCustom ? (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                                  Custom
                                </span>
                              ) : (
                                <span className="text-slate-400 group-hover:text-indigo-600">🔗 Inherited</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                {/* Common Fees Rows */}
                {(feesConfig.commonFees || []).map((fee) => {
                  // Check student type eligibility
                  if (matrixStudentType === 'new_admission' && fee.studentType === 'existing_only') return null;
                  if (matrixStudentType === 'existing_student' && fee.studentType === 'new_only') return null;

                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800 bg-white sticky left-0 z-10 border-r border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <span>{fee.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal capitalize">({fee.frequency})</span>
                        </div>
                      </td>
                      {activeClasses.map((cls) => {
                        const isPreNursery = isPreNurseryClass(cls.name);

                        // Rule 8: Pre-Nursery has NO existing students
                        if (isPreNursery && matrixStudentType === 'existing_student') {
                          return (
                            <td key={cls.id} className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-50 text-slate-400">
                              <span className="text-[10px] italic">Not Applicable</span>
                            </td>
                          );
                        }

                        const override = feesConfig.classOverrides?.[cls.name]?.[fee.id];
                        const isCustom = Boolean(override?.isCustom);
                        const displayAmount = isCustom && override ? override.amount : fee.amount;

                        return (
                          <td
                            key={cls.id || cls.name}
                            onClick={() =>
                              handleOpenOverride(cls.name, cls.id || cls.name, {
                                id: fee.id,
                                name: fee.name,
                                category: fee.category,
                                amount: fee.amount,
                                frequency: fee.frequency,
                                isCustom,
                              })
                            }
                            className="py-2.5 px-3 text-center border-r border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition group"
                          >
                            <div className="font-mono font-bold text-slate-900">{formatFeeCurrency(displayAmount)}</div>
                            <div className="text-[9px] mt-0.5">
                              {isCustom ? (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                                  Custom
                                </span>
                              ) : (
                                <span className="text-slate-400 group-hover:text-indigo-600">🔗 Inherited</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Optional Services Rows */}
                {(feesConfig.optionalServices || [])
                  .filter((s) => s.isProvided)
                  .map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-700 bg-white sticky left-0 z-10 border-r border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <span>{srv.name}</span>
                          <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-semibold">
                            Optional
                          </span>
                        </div>
                      </td>
                      {activeClasses.map((cls) => {
                        const isPreNursery = isPreNurseryClass(cls.name);
                        if (isPreNursery && matrixStudentType === 'existing_student') {
                          return (
                            <td key={cls.id} className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-50 text-slate-400">
                              <span className="text-[10px] italic">Not Applicable</span>
                            </td>
                          );
                        }

                        const override = feesConfig.classOverrides?.[cls.name]?.[srv.id];
                        const isCustom = Boolean(override?.isCustom);
                        const displayAmount = isCustom && override ? override.amount : (srv.feeAmount ?? 0);

                        return (
                          <td
                            key={cls.id || cls.name}
                            onClick={() =>
                              handleOpenOverride(cls.name, cls.id || cls.name, {
                                id: srv.id,
                                name: srv.name,
                                category: 'Optional Service',
                                amount: srv.feeAmount || 0,
                                frequency: srv.frequency || 'monthly',
                                isCustom,
                              })
                            }
                            className="py-2.5 px-3 text-center border-r border-slate-200 cursor-pointer hover:bg-indigo-50/50 transition group"
                          >
                            <div className="font-mono text-slate-700">{formatFeeCurrency(displayAmount)}</div>
                            <div className="text-[9px] mt-0.5">
                              {isCustom ? (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                                  Custom
                                </span>
                              ) : (
                                <span className="text-indigo-600">Optional</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Status Legend:</span>
            <span className="flex items-center space-x-1">
              <span className="text-slate-400">🔗 Inherited</span> — Auto-derived from common fees
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200 text-[10px]">
                Custom
              </span>{' '}
              — Class-specific override
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-indigo-600 font-semibold">Optional</span> — Charged separately per opted route
            </span>
          </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 5: PAYMENT PLANS (Rule 18, 19) ────────────────────────── */}
      {activeTab === 'payment_plans' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-bold text-slate-900">Payment Plans &amp; Yearly Discounts</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Allow parents to pay in flexible billing intervals. Configure automated discounts for upfront yearly payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(feesConfig.paymentPlans || []).map((plan) => {
              const isYearly = plan.frequency === 'yearly';
              return (
                <div
                  key={plan.frequency}
                  className={`p-4.5 rounded-2xl border transition-all ${
                    plan.isEnabled
                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                      : 'bg-slate-50/70 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 capitalize">{plan.frequency} Plan</span>
                    <input
                      type="checkbox"
                      checked={plan.isEnabled}
                      onChange={(e) => {
                        const copy = (feesConfig.paymentPlans || []).map((p) =>
                          p.frequency === plan.frequency ? { ...p, isEnabled: e.target.checked } : p
                        );
                        updateFees((prev) => ({ ...prev, paymentPlans: copy }));
                      }}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">
                    {plan.frequency === 'monthly' && '12 installments per academic year'}
                    {plan.frequency === 'quarterly' && '4 quarterly installments'}
                    {plan.frequency === 'half_yearly' && '2 half-yearly installments'}
                    {plan.frequency === 'yearly' && 'Full academic session paid in 1 payment'}
                  </p>

                  {isYearly && plan.isEnabled && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 text-xs animate-in fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Yearly Payment Discount (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={plan.yearlyDiscountPercentage ?? 5}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              const copy = (feesConfig.paymentPlans || []).map((p) =>
                                p.frequency === 'yearly' ? { ...p, yearlyDiscountPercentage: val } : p
                              );
                              updateFees((prev) => ({ ...prev, paymentPlans: copy }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-mono font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Applies To</label>
                        <select
                          value={plan.discountAppliesTo || 'tuition_only'}
                          onChange={(e) => {
                            const copy = (feesConfig.paymentPlans || []).map((p) =>
                              p.frequency === 'yearly' ? { ...p, discountAppliesTo: e.target.value as any } : p
                            );
                            updateFees((prev) => ({ ...prev, paymentPlans: copy }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs"
                        >
                          <option value="tuition_only">Tuition Fee Only (Recommended)</option>
                          <option value="all_academic">All Academic Fees</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs">Example Calculation (Rule 19):</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              If Monthly Tuition = <strong>₹5,000</strong> → Annual Tuition = <strong>₹60,000</strong>.
              A <strong>5% Yearly Discount</strong> applies strictly to Tuition: ₹60,000 × 5% = <strong>-₹3,000</strong>.
              Discounted tuition payable = <strong>₹57,000</strong>. One-time admission fees and caution deposits are never discounted.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 6: SCHOLARSHIPS & DISCOUNTS (Rule 20 to 25) ───────────── */}
      {activeTab === 'scholarships' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Scholarships &amp; Fee Concessions</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure merit slabs, defence wards, girls empowerment concessions, and stacking rules.
              </p>
            </div>
            {/* Stacking Rules Selector (Rule 25) */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-600">Discount Stacking:</span>
              <select
                value={feesConfig.scholarships?.stackingRule || 'highest_only'}
                onChange={(e) => {
                  updateFees((prev) => ({
                    ...prev,
                    scholarships: {
                      ...(prev.scholarships || ({} as any)),
                      stackingRule: e.target.value as any,
                    },
                  }));
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold bg-white"
              >
                <option value="highest_only">Highest Applicable Discount Only</option>
                <option value="stackable">Allow Multiple Stackable Discounts</option>
              </select>
            </div>
          </div>

          {/* 1. Merit Slabs (Rule 21) */}
          <div className="p-4.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <h5 className="font-bold text-sm text-slate-900">Previous Academic Result Based Scholarship</h5>
              </div>
              <input
                type="checkbox"
                checked={feesConfig.scholarships?.meritScholarship?.isEnabled ?? true}
                onChange={(e) => {
                  updateFees((prev) => ({
                    ...prev,
                    scholarships: {
                      ...(prev.scholarships || ({} as any)),
                      meritScholarship: {
                        ...(prev.scholarships?.meritScholarship || ({} as any)),
                        isEnabled: e.target.checked,
                      },
                    },
                  }));
                }}
                className="rounded text-indigo-600"
              />
            </div>

            {feesConfig.scholarships?.meritScholarship?.isEnabled !== false && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-2">
                  <span className="col-span-4">Score Range (%)</span>
                  <span className="col-span-3">Discount %</span>
                  <span className="col-span-4">Applies To</span>
                  <span className="col-span-1 text-right">Del</span>
                </div>

                {(feesConfig.scholarships?.meritScholarship?.slabs || []).map((slab, idx) => (
                  <div
                    key={slab.id}
                    className="grid grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-slate-200 items-center shadow-2xs text-xs"
                  >
                    <div className="col-span-4 flex items-center space-x-1">
                      <input
                        type="number"
                        value={slab.minPercentage}
                        onChange={(e) => {
                          const copy = [...(feesConfig.scholarships?.meritScholarship?.slabs || [])];
                          copy[idx].minPercentage = Number(e.target.value);
                          updateFees((prev) => ({
                            ...prev,
                            scholarships: {
                              ...prev.scholarships!,
                              meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                            },
                          }));
                        }}
                        className="w-14 px-2 py-1 border border-slate-200 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-400 font-bold">% to</span>
                      <input
                        type="number"
                        value={slab.maxPercentage}
                        onChange={(e) => {
                          const copy = [...(feesConfig.scholarships?.meritScholarship?.slabs || [])];
                          copy[idx].maxPercentage = Number(e.target.value);
                          updateFees((prev) => ({
                            ...prev,
                            scholarships: {
                              ...prev.scholarships!,
                              meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                            },
                          }));
                        }}
                        className="w-14 px-2 py-1 border border-slate-200 rounded text-center font-mono font-bold"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>

                    <div className="col-span-3 flex items-center space-x-1">
                      <input
                        type="number"
                        value={slab.discountPercentage}
                        onChange={(e) => {
                          const copy = [...(feesConfig.scholarships?.meritScholarship?.slabs || [])];
                          copy[idx].discountPercentage = Number(e.target.value);
                          updateFees((prev) => ({
                            ...prev,
                            scholarships: {
                              ...prev.scholarships!,
                              meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                            },
                          }));
                        }}
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-center font-mono font-bold text-emerald-600"
                      />
                      <span className="text-slate-500 font-bold">%</span>
                    </div>

                    <div className="col-span-4">
                      <select
                        value={slab.appliesTo}
                        onChange={(e) => {
                          const copy = [...(feesConfig.scholarships?.meritScholarship?.slabs || [])];
                          copy[idx].appliesTo = e.target.value as any;
                          updateFees((prev) => ({
                            ...prev,
                            scholarships: {
                              ...prev.scholarships!,
                              meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                            },
                          }));
                        }}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                      >
                        <option value="net_tuition">Net Tuition Fee</option>
                        <option value="tuition">Tuition Fee</option>
                        <option value="total_fee">Total Academic Fee</option>
                      </select>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (feesConfig.scholarships?.meritScholarship?.slabs || []).filter(
                            (s) => s.id !== slab.id
                          );
                          updateFees((prev) => ({
                            ...prev,
                            scholarships: {
                              ...prev.scholarships!,
                              meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                            },
                          }));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newSlab: MeritScholarshipSlab = {
                      id: `merit-${Date.now()}`,
                      minPercentage: 75,
                      maxPercentage: 79.99,
                      discountPercentage: 5,
                      appliesTo: 'net_tuition',
                    };
                    const copy = [...(feesConfig.scholarships?.meritScholarship?.slabs || []), newSlab];
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        meritScholarship: { ...prev.scholarships!.meritScholarship, slabs: copy },
                      },
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition cursor-pointer"
                >
                  + Add Result Slab
                </button>
              </div>
            )}
          </div>

          {/* 2. Defence and Girls Scholarships (Rule 22, 23) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Defence Scholarship */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Wards of Defence Personnel</span>
                <input
                  type="checkbox"
                  checked={feesConfig.scholarships?.defenceScholarship?.isEnabled ?? true}
                  onChange={(e) => {
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        defenceScholarship: {
                          ...prev.scholarships!.defenceScholarship,
                          isEnabled: e.target.checked,
                        },
                      },
                    }));
                  }}
                  className="rounded text-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-slate-500 text-xs">Discount:</label>
                <input
                  type="number"
                  value={feesConfig.scholarships?.defenceScholarship?.discountPercentage ?? 5}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        defenceScholarship: {
                          ...prev.scholarships!.defenceScholarship,
                          discountPercentage: val,
                        },
                      },
                    }));
                  }}
                  className="w-16 px-2.5 py-1 border border-slate-200 rounded font-mono font-bold text-center"
                />
                <span className="text-slate-500 font-bold">% on Net Tuition</span>
              </div>
            </div>

            {/* Girls Scholarship */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Girls Scholarship (Beti Shiksha)</span>
                <input
                  type="checkbox"
                  checked={feesConfig.scholarships?.girlsScholarship?.isEnabled ?? true}
                  onChange={(e) => {
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        girlsScholarship: {
                          ...prev.scholarships!.girlsScholarship,
                          isEnabled: e.target.checked,
                        },
                      },
                    }));
                  }}
                  className="rounded text-indigo-600"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-slate-500 text-xs">Discount:</label>
                <input
                  type="number"
                  value={feesConfig.scholarships?.girlsScholarship?.discountPercentage ?? 10}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        girlsScholarship: {
                          ...prev.scholarships!.girlsScholarship,
                          discountPercentage: val,
                        },
                      },
                    }));
                  }}
                  className="w-16 px-2.5 py-1 border border-slate-200 rounded font-mono font-bold text-center"
                />
                <span className="text-slate-500 font-bold">% on Net Tuition</span>
              </div>
            </div>
          </div>

          {/* 3. Scholarship Seat Availability (Rule 24) */}
          <div className="p-4.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h5 className="font-bold text-slate-900 text-xs">Scholarship Seat Availability Limit</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-slate-600 font-semibold">Scholarship Seat Limit:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feesConfig.scholarships?.seatAvailability?.seatLimitPercentage ?? 25}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        seatAvailability: {
                          ...prev.scholarships!.seatAvailability,
                          seatLimitPercentage: val,
                        },
                      },
                    }));
                  }}
                  className="w-16 px-2.5 py-1 border border-slate-200 rounded font-mono font-bold text-center bg-white"
                />
                <span className="text-slate-600 font-bold">% of total intake</span>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-slate-600 font-semibold">Allocation:</label>
                <select
                  value={feesConfig.scholarships?.seatAvailability?.allocation || 'fcfs'}
                  onChange={(e) => {
                    updateFees((prev) => ({
                      ...prev,
                      scholarships: {
                        ...prev.scholarships!,
                        seatAvailability: {
                          ...prev.scholarships!.seatAvailability,
                          allocation: e.target.value as any,
                        },
                      },
                    }));
                  }}
                  className="px-2.5 py-1 border border-slate-200 rounded bg-white text-xs"
                >
                  <option value="fcfs">First Come First Serve</option>
                  <option value="merit">Merit Based Ranking</option>
                  <option value="school_selection">School Selection Committee</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: INCLUSIONS, EXCLUSIONS & NOTES (Rule 26 to 29) ─────── */}
      {activeTab === 'inclusions_notes' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-6 shadow-2xs">
          {/* Annual Charges Inclusion (Rule 26) */}
          <div className="space-y-3 border-b border-slate-100 pb-5">
            <div>
              <h4 className="text-base font-bold text-slate-900">Annual Charges Inclusions</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Select items covered under the Annual Composite Fee. The parent website automatically generates a clean sentence from these selections.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {DEFAULT_ANNUAL_CHARGES_INCLUSIONS.map((item) => {
                const isChecked = (feesConfig.annualChargesInclusions || []).includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const prevIds = feesConfig.annualChargesInclusions || [];
                        const nextIds = e.target.checked
                          ? [...prevIds, item.id]
                          : prevIds.filter((id) => id !== item.id);
                        updateFees((prev) => ({ ...prev, annualChargesInclusions: nextIds }));
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom addition to Annual Charges */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Additional Component (Optional):
              </label>
              <input
                type="text"
                value={feesConfig.annualChargesCustomText || ''}
                onChange={(e) => updateFees((prev) => ({ ...prev, annualChargesCustomText: e.target.value }))}
                placeholder="e.g. Annual Swimming Pool Access, Olympiad Preparation"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Generated Natural Language Preview (Rule 26) */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <div className="font-bold text-[10px] uppercase text-emerald-800 tracking-wider mb-0.5">
                Auto-Generated Parent Website Text:
              </div>
              <p className="italic leading-relaxed">&ldquo;{naturalLanguageAnnualSummary}&rdquo;</p>
            </div>
          </div>

          {/* Included vs Excluded Breakdown (Rule 27) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>What&apos;s Included in Regular Fees</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-emerald-800 text-xs">
                {included.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <span className="font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>What&apos;s Not Included (Charged Separately)</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs">
                {notIncluded.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Fee Notes (Rule 29) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Important Fee Policies &amp; Notes</h4>
                <p className="text-[11px] text-slate-500">
                  Select which standard policies to publish on the public website. You can edit any note text.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {(feesConfig.feeNotes || []).map((note, idx) => (
                <div
                  key={note.id}
                  className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <input
                    type="checkbox"
                    checked={note.isPublished}
                    onChange={(e) => {
                      const copy = [...(feesConfig.feeNotes || [])];
                      copy[idx].isPublished = e.target.checked;
                      updateFees((prev) => ({ ...prev, feeNotes: copy }));
                    }}
                    className="mt-1 rounded text-indigo-600"
                  />
                  <input
                    type="text"
                    value={note.text}
                    onChange={(e) => {
                      const copy = [...(feesConfig.feeNotes || [])];
                      copy[idx].text = e.target.value;
                      updateFees((prev) => ({ ...prev, feeNotes: copy }));
                    }}
                    className="flex-1 bg-transparent border-none text-slate-800 text-xs focus:ring-0 p-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 8: LIVE CALCULATION & WEBSITE PREVIEW (Rule 30, 31, 32) ─ */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Admin Live Calculator (Rule 30) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-bold text-slate-900">Live Fee Calculation Simulator</h4>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Admin Diagnostic Tool
              </span>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Class</label>
                <select
                  value={calcClass}
                  onChange={(e) => setCalcClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {activeClasses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Student</label>
                <select
                  value={calcStudentType}
                  onChange={(e) => setCalcStudentType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="new_admission">New Admission</option>
                  <option value="existing_student">Existing Student</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Payment Plan</label>
                <select
                  value={calcPaymentPlan}
                  onChange={(e) => setCalcPaymentPlan(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half-Yearly</option>
                  <option value="yearly">Yearly (Upfront)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">Scholarship</label>
                <select
                  value={calcScholarship}
                  onChange={(e) => setCalcScholarship(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="none">No Scholarship</option>
                  <option value="merit">Merit (Academic Result)</option>
                  <option value="defence">Wards of Defence (5%)</option>
                  <option value="girls">Girls Scholarship (10%)</option>
                  <option value="sibling">Sibling Discount (10%)</option>
                </select>
              </div>
            </div>

            {/* If Merit selected, score range input */}
            {calcScholarship === 'merit' && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center space-x-3 text-xs">
                <span className="font-bold text-slate-700">Previous Exam Score:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={calcMeritScore}
                  onChange={(e) => setCalcMeritScore(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-200 rounded font-mono font-bold text-center bg-white"
                />
                <span className="text-slate-500 font-semibold">%</span>
              </div>
            )}

            {/* Simulation Line-by-Line Breakdown (Rule 30) */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex justify-between font-bold text-[11px] uppercase tracking-wider text-slate-600">
                <span>Line Item</span>
                <span>Annual Amount</span>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {simulationResult.isPreNurseryExempt ? (
                  <div className="p-4 text-center text-slate-500 italic">
                    Not applicable — Pre-Nursery is a new-admission-only class.
                  </div>
                ) : (
                  <>
                    {simulationResult.breakdownItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between py-2 px-3 text-xs ${
                          item.isDiscount ? 'text-rose-600 font-semibold bg-rose-50/50 rounded-lg' : 'text-slate-800'
                        }`}
                      >
                        <div>
                          <span>{item.label}</span>
                          {item.note && <span className="text-[10px] text-slate-400 ml-1.5">({item.note})</span>}
                        </div>
                        <span className="font-mono font-bold">
                          {item.isDiscount ? '-' : ''}
                          {formatFeeCurrency(item.amount)}
                        </span>
                      </div>
                    ))}

                    {/* Total Row */}
                    <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-between px-3 py-2 bg-indigo-50/60 rounded-xl text-indigo-950 font-bold text-sm">
                      <span>Estimated Payable (Year 1)</span>
                      <span className="font-mono text-base font-black text-indigo-700">
                        {formatFeeCurrency(simulationResult.netEstimatedPayable)}
                      </span>
                    </div>

                    {simulationResult.cautionMoneyRefundable > 0 && (
                      <div className="px-3 pt-1 text-[11px] text-emerald-700 font-medium">
                        ✓ Includes {formatFeeCurrency(simulationResult.cautionMoneyRefundable)} 100% refundable Caution Money.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Scholarships and discounts are calculated according to the school&apos;s configured eligibility and stacking rules.
            </p>
          </div>

          {/* Parent-Friendly Public Website Preview (Rule 31, 32) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-indigo-200 p-6 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                  Parent-Facing Website View
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">
                  Official Fee Structure {academicSession}
                </h4>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Class: </span>
                <strong className="text-slate-900">{calcClass}</strong>
                <span className="mx-2">•</span>
                <span className="capitalize">{calcStudentType.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Public Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* One-Time Charges (If New Admission) */}
              {calcStudentType === 'new_admission' && (
                <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    One-Time Admission Charges
                  </h5>
                  <div className="space-y-2 text-xs">
                    {(feesConfig.newStudentFees || []).map((fee) => (
                      <div key={fee.id} className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>
                          {fee.name}
                          {fee.isRefundable && <span className="text-emerald-700 font-semibold ml-1">(Refundable)</span>}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{formatFeeCurrency(fee.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring Academic Charges */}
              <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Academic Fees &amp; Tuition
                </h5>
                <div className="space-y-2 text-xs">
                  {resolveClassFees(calcClass, calcClass, feesConfig, calcStudentType)
                    .filter((f) => !f.isOptionalService && f.frequency !== 'one_time')
                    .map((item) => (
                      <div key={item.id} className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatFeeCurrency(item.amount)} / {item.frequency}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Summary Inclusions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Inclusions:</p>
              <p className="text-slate-600 leading-relaxed italic">{naturalLanguageAnnualSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ────────────────────────────────────────────────────── */}
      <AddEditFeeModal
        isOpen={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        onSave={handleSaveFee}
        feeToEdit={feeToEdit}
        existingFees={isAdmissionOnlyModal ? feesConfig.newStudentFees || [] : feesConfig.commonFees || []}
        classes={activeClasses}
        isAdmissionOnlyMode={isAdmissionOnlyModal}
        overriddenClassesCount={
          feeToEdit
            ? Object.values(feesConfig.classOverrides || {}).filter((o) => o[feeToEdit.id]?.isCustom).length
            : 0
        }
        inheritedClassesCount={
          feeToEdit
            ? activeClasses.length -
              Object.values(feesConfig.classOverrides || {}).filter((o) => o[feeToEdit.id]?.isCustom).length
            : 0
        }
      />

      {overrideTarget && (
        <OverrideClassFeeModal
          isOpen={overrideModalOpen}
          onClose={() => {
            setOverrideModalOpen(false);
            setOverrideTarget(null);
          }}
          className={overrideTarget.className}
          feeName={overrideTarget.feeName}
          feeCategory={overrideTarget.feeCategory}
          inheritedAmount={overrideTarget.inheritedAmount}
          frequency={overrideTarget.frequency}
          existingCustomAmount={overrideTarget.existingCustomAmount}
          isAlreadyOverridden={overrideTarget.isAlreadyOverridden}
          onSaveOverride={handleSaveOverride}
          onResetToGlobal={handleResetToGlobal}
        />
      )}

      {feeToDelete && (
        <DeleteFeeConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setFeeToDelete(null);
          }}
          feeName={feeToDelete.name}
          feeAmount={feeToDelete.amount}
          frequency={feeToDelete.frequency}
          inheritedClassesCount={
            activeClasses.length -
            Object.values(feesConfig.classOverrides || {}).filter((o) => o[feeToDelete.id]?.isCustom).length
          }
          overriddenClassesCount={
            Object.values(feesConfig.classOverrides || {}).filter((o) => o[feeToDelete.id]?.isCustom).length
          }
          onConfirmDelete={handleConfirmDeleteFee}
        />
      )}
    </div>
  );
}
