'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  Users,
  KeyRound,
  Clock,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Bell,
  Eye,
  Plus,
  Trash2,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Check,
  X,
  AlertCircle,
  Shield,
  Smartphone,
  Server,
  UserCheck,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  SecurityAccessData,
  AdministrativeAccessModel,
  PermissionModelOption,
  PermissionMatrixItem,
  TwoFactorRequirement,
  AuditLoggingPolicy,
  DataExportPermissionModel,
  HighRiskApprovalPolicy,
  DataAccessPrinciple,
  DataDeletionPolicy,
} from '@/lib/types';
import {
  ADMINISTRATIVE_ACCESS_MODELS,
  ADMINISTRATOR_ROLE_CATALOG,
  PERMISSION_MODEL_OPTIONS,
  PERMISSION_CATEGORIES,
  TWO_FACTOR_POLICIES,
  AUTHENTICATION_METHODS,
  LOCKOUT_DURATIONS,
  SESSION_TIMEOUTS,
  CONCURRENT_SESSION_OPTIONS,
  AUDIT_LOGGING_POLICIES,
  AUDIT_EVENTS_CATALOG,
  AUDIT_RETENTION_PERIODS,
  DATA_EXPORT_POLICIES,
  SENSITIVE_DATA_CATEGORIES,
  EXPORT_FORMATS,
  NOTIFICATION_CHANNELS,
  HIGH_RISK_APPROVAL_POLICIES,
  HIGH_RISK_ACTIONS,
  DATA_ACCESS_PRINCIPLES,
  DATA_DELETION_POLICIES,
  createDefaultSecurityPrivacyData,
  normalizeSecurityPrivacyData,
  validateSecurityPrivacyData,
  generateSecurityPolicySummary,
  getSecurityBaselineRecommendations,
} from '@/lib/securityPrivacyUtils';

interface SecurityPrivacySectionProps {
  project?: SchoolProject;
  intakeData?: UniversalIntakeData;
  updateSectionField?: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
  externalErrors?: Record<string, string>;
}

export default function SecurityPrivacySection({
  project,
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  externalErrors = {},
}: SecurityPrivacySectionProps) {
  // Ensure security data is properly initialized & normalized from legacy or partial payloads
  const securityData: SecurityAccessData = useMemo(() => {
    return normalizeSecurityPrivacyData(intakeData?.securityPrivacy);
  }, [intakeData?.securityPrivacy]);

  const [newRoleInput, setNewRoleInput] = useState('');
  const [customRoleError, setCustomRoleError] = useState<string | null>(null);

  const isCmsOnly = project?.product_id === 'school-website-cms';

  const validation = useMemo(() => {
    return validateSecurityPrivacyData(securityData, project?.product_id);
  }, [securityData, project?.product_id]);

  // Live error set: merge external submission errors and live validation errors
  const activeErrors = useMemo(() => {
    const merged: Record<string, string> = { ...(externalErrors || {}) };
    for (const [k, msg] of Object.entries(validation.errors)) {
      merged[k] = msg;
    }
    return merged;
  }, [validation.errors, externalErrors]);

  const updateSecurityState = useCallback(
    (updater: (prev: SecurityAccessData) => SecurityAccessData) => {
      const updated = updater(securityData);
      updated.administratorsCount = updated.administratorCount;
      updated.roles = updated.administratorRoles;
      updated.require2FAForAdmin = updated.twoFactor?.required === 'Required for all administrators';
      updated.loginMethods = updated.twoFactor?.methods;
      if (updated.sessionSecurity?.sessionTimeout) {
        const parsedMins = parseInt(updated.sessionSecurity.sessionTimeout, 10);
        if (!isNaN(parsedMins)) {
          updated.sessionTimeoutMinutes = updated.sessionSecurity.sessionTimeout.includes('hour')
            ? parsedMins * 60
            : parsedMins;
        }
      }
      if (updated.auditLogging?.retentionPeriod) {
        if (updated.auditLogging.retentionPeriod.includes('year')) {
          const yrs = parseInt(updated.auditLogging.retentionPeriod, 10) || 1;
          updated.auditLogsRetentionMonths = yrs * 12;
        } else if (updated.auditLogging.retentionPeriod.includes('day')) {
          const days = parseInt(updated.auditLogging.retentionPeriod, 10) || 30;
          updated.auditLogsRetentionMonths = Math.max(1, Math.round(days / 30));
        }
      }
      updateSectionDirect?.('securityPrivacy', updated);
    },
    [securityData, updateSectionDirect]
  );

  const dynamicSummary = useMemo(() => {
    return generateSecurityPolicySummary(securityData);
  }, [securityData]);

  const baselineRecommendations = useMemo(() => {
    return getSecurityBaselineRecommendations(securityData);
  }, [securityData]);

  const handleAddCustomRole = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) {
      setCustomRoleError('Please enter a role title');
      return;
    }
    const currentCustom = securityData.customRoles || [];
    const isDuplicate = currentCustom.some((r) => r.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setCustomRoleError('This custom role already exists');
      return;
    }
    setCustomRoleError(null);
    setNewRoleInput('');
    updateSecurityState((prev) => ({
      ...prev,
      customRoles: [...(prev.customRoles || []), trimmed],
    }));
  };

  const handleRemoveCustomRole = (indexToRemove: number) => {
    updateSecurityState((prev) => ({
      ...prev,
      customRoles: (prev.customRoles || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleTogglePermission = (
    categoryId: string,
    action: keyof PermissionMatrixItem,
    value: boolean
  ) => {
    updateSecurityState((prev) => {
      const currentPerms = prev.permissions || {};
      const currentCategoryPerms: PermissionMatrixItem = currentPerms[categoryId] || {
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      };
      return {
        ...prev,
        permissions: {
          ...currentPerms,
          [categoryId]: {
            ...currentCategoryPerms,
            [action]: value,
          },
        },
      };
    });
  };

  const handleApplyMatrixPreset = (preset: 'all' | 'rbac' | 'readonly') => {
    updateSecurityState((prev) => {
      const newPerms: Record<string, PermissionMatrixItem> = {};
      PERMISSION_CATEGORIES.forEach((cat) => {
        if (preset === 'all') {
          newPerms[cat.id] = { view: true, create: true, edit: true, delete: true, export: true };
        } else if (preset === 'readonly') {
          newPerms[cat.id] = { view: true, create: false, edit: false, delete: false, export: false };
        } else {
          newPerms[cat.id] = {
            view: true,
            create: ['student_records', 'admissions', 'attendance', 'examinations'].includes(cat.id),
            edit: ['student_records', 'admissions', 'attendance', 'examinations'].includes(cat.id),
            delete: ['student_records'].includes(cat.id),
            export: ['reports', 'student_records', 'attendance'].includes(cat.id),
          };
        }
      });
      return {
        ...prev,
        permissions: newPerms,
      };
    });
  };

  return (
    <div className="space-y-6 text-xs text-[#334155]">
      {/* 1. TOP VALIDATION ERROR BANNER */}
      {Object.keys(activeErrors).length > 0 && (
        <div
          id="security-validation-banner"
          role="alert"
          tabIndex={-1}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please resolve the following security configuration requirement{Object.keys(activeErrors).length > 1 ? 's' : ''} to continue:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700 pl-1 font-medium">
            {Object.entries(activeErrors).map(([field, msg]) => (
              <li key={field}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. INTRODUCTION CARD & EXPLICIT SECURITY BOUNDARY NOTICE */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-[#FAF7F2] border border-[#C7D2FE] p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#4338CA] text-white">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-[#131B2E]">
                Security, Privacy &amp; Administrative Access
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Configure administrator access, authentication requirements, session security, audit
              logging, privacy controls and data export policies for the school&apos;s platform.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[11px] text-[#475569] shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#4338CA] font-bold">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Security Policy &amp; Non-Credential Notice</span>
          </div>
          <p className="leading-relaxed font-medium text-[#334155]">
            This section defines administrative security and privacy policies. This portal does not store, accept, or manage administrative passwords, OTPs, recovery codes, or credentials directly.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            These settings define the school&apos;s security policy and onboarding requirements. Actual enforcement is handled by the connected authentication, authorization, and platform services.
          </p>
        </div>
      </div>

      {/* 3. ADMINISTRATOR ACCOUNT CONFIGURATION */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">ADMINISTRATOR ACCESS</h4>
              <p className="text-[11px] text-[#64748B]">
                Define administrative headcount and role structures.
              </p>
            </div>
          </div>
        </div>

        {/* A. Expected administrator accounts */}
        <div className="space-y-1.5 max-w-md">
          <label className="block font-bold text-[#131B2E]" htmlFor="admin-headcount">
            Expected Administrator Accounts *
          </label>
          <div className="flex items-center gap-3">
            <input
              id="admin-headcount"
              type="number"
              min={1}
              max={100}
              value={securityData.administratorCount ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateSecurityState((prev) => ({
                  ...prev,
                  administratorCount: e.target.value === '' ? undefined : (isNaN(val) ? undefined : val),
                }));
              }}
              className={`w-36 px-3 py-2 rounded-xl bg-white border text-sm font-semibold transition ${
                activeErrors.administratorCount
                  ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-600'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10'
              }`}
            />
            <span className="text-[11px] text-[#64748B]">
              (Range: 1–100, default: 3)
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Approximate number of staff members who will require administrative access.
          </p>
          {activeErrors.administratorCount && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.administratorCount}
            </p>
          )}
        </div>

        {!isCmsOnly && (
          <>
            {/* B. Administrative access model */}
            <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <label className="block font-bold text-[#131B2E]">
            Administrative Access Model *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Administrative access model">
            {ADMINISTRATIVE_ACCESS_MODELS.map((model) => {
              const isSelected = securityData.accessModel === model;
              return (
                <button
                  key={model}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      accessModel: model,
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-[#131B2E]">{model}</span>
                    <span className="text-[11px] text-[#64748B]">
                      {model === 'Single Administrator' &&
                        'One primary administrator manages all portal configurations.'}
                      {model === 'Multiple Administrators' &&
                        'Multiple administrative staff with shared general access.'}
                      {model === 'Department-based Administrators' &&
                        'Heads of Finance, Transport, Hostel, and Academics control respective modules.'}
                      {model === 'Role-based Access Control (RBAC)' &&
                        'Granular role-based assignments with explicit capability permissions.'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {activeErrors.accessModel && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.accessModel}
            </p>
          )}
        </div>

        {/* C. Administrator roles multi-select */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <div>
              <label className="block font-bold text-[#131B2E]">Administrator Roles</label>
              <p className="text-[11px] text-[#64748B]">
                Select the institutional roles requiring platform administrative privileges.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#4338CA] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {(securityData.administratorRoles || []).length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ADMINISTRATOR_ROLE_CATALOG.map((role) => {
              const checked = (securityData.administratorRoles || []).includes(role);
              return (
                <label
                  key={role}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E] font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.administratorRoles || [];
                        const next = isChecking
                          ? Array.from(new Set([...current, role]))
                          : current.filter((r) => r !== role);
                        return {
                          ...prev,
                          administratorRoles: next,
                        };
                      });
                    }}
                    className="w-4 h-4 rounded-md text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-xs">{role}</span>
                </label>
              );
            })}
          </div>

          {activeErrors.administratorRoles && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.administratorRoles}
            </p>
          )}

          {/* Custom Role Tags Area */}
          {(securityData.administratorRoles || []).includes('Custom Role') && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-[#CBD5E1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#131B2E]">Custom Role Names</span>
                <span className="text-[11px] text-[#64748B]">Add bespoke administrative titles</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(securityData.customRoles || []).map((customRole, idx) => (
                  <span
                    key={`${customRole}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#CBD5E1] text-[#131B2E] font-semibold text-xs rounded-lg shadow-2xs"
                  >
                    <span>{customRole}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomRole(idx)}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Remove role"
                      aria-label={`Remove custom role ${customRole}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Discipline Committee Head"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  className="flex-1 max-w-sm px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold rounded-lg text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {customRoleError && (
                <p className="text-[11px] text-rose-600 font-medium">{customRoleError}</p>
              )}
              {activeErrors.customRoles && (
                <p className="text-[11px] text-rose-600 font-medium">{activeErrors.customRoles}</p>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </div>

      {/* 6. ROLE & PERMISSION MODEL */}
      {!isCmsOnly && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">ROLE &amp; PERMISSION MODEL</h4>
              <p className="text-[11px] text-[#64748B]">
                Define how administrative permissions should be separated across departments and responsibilities.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Role and permission model">
          {PERMISSION_MODEL_OPTIONS.map((opt) => {
            const isSelected = securityData.permissionModel === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() =>
                  updateSecurityState((prev) => ({
                    ...prev,
                    permissionModel: opt,
                  }))
                }
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                  isSelected
                    ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                    : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="block font-bold text-xs text-[#131B2E]">{opt}</span>
                  <span className="text-[11px] text-[#64748B]">
                    {opt === 'Full access for all administrators' &&
                      'All administrators share unrestricted access across all portal modules.'}
                    {opt === 'Standard predefined roles' &&
                      'Pre-packaged role profiles matching traditional school staff designations.'}
                    {opt === 'Strict role-based permissions' &&
                      'Default: Strict department boundaries with least-privilege principles.'}
                    {opt === 'Custom permission matrix' &&
                      'Full custom granularity matrix for View, Create, Edit, Delete and Export.'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Permission Matrix Table */}
        {securityData.permissionModel === 'Custom permission matrix' && (
          <div className="mt-4 border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-2xs space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
              <div>
                <span className="font-bold text-xs text-[#131B2E] block">
                  Custom Permission Matrix
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Configure capability allowances across functional categories.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyMatrixPreset('all')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#334155] font-semibold text-[11px] transition cursor-pointer"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMatrixPreset('rbac')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4338CA] font-semibold text-[11px] transition cursor-pointer"
                >
                  Standard RBAC
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMatrixPreset('readonly')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#334155] font-semibold text-[11px] transition cursor-pointer"
                >
                  View Only
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-1 sm:mx-0 border border-[#E2E8F0] rounded-xl">
              <table className="min-w-[640px] w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[11px] text-[#475569] font-bold">
                    <th scope="col" className="py-2.5 px-3">Permission Category</th>
                    <th scope="col" className="py-2.5 px-3 text-center w-16">View</th>
                    <th scope="col" className="py-2.5 px-3 text-center w-16">Create</th>
                    <th scope="col" className="py-2.5 px-3 text-center w-16">Edit</th>
                    <th scope="col" className="py-2.5 px-3 text-center w-16">Delete</th>
                    <th scope="col" className="py-2.5 px-3 text-center w-16">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const item = securityData.permissions?.[cat.id] || {
                      view: true,
                      create: false,
                      edit: false,
                      delete: false,
                      export: false,
                    };
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#131B2E]">{cat.label}</div>
                          <div className="text-[10px] text-[#64748B]">
                            {cat.description}
                          </div>
                        </td>
                        {(['view', 'create', 'edit', 'delete', 'export'] as const).map((action) => (
                          <td key={action} className="py-2.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(item[action])}
                                onChange={(e) =>
                                  handleTogglePermission(cat.id, action, e.target.checked)
                                }
                                className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                                aria-label={`${action} permission for ${cat.label}`}
                              />
                            </label>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeErrors.permissions && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.permissions}
              </p>
            )}
          </div>
        )}
      </div>
      )}

      {/* 5. TWO-FACTOR AUTHENTICATION */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">TWO-FACTOR AUTHENTICATION (2FA)</h4>
              <p className="text-[11px] text-[#64748B]">
                Strengthen administrator identity verification against credential theft.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-[#131B2E]">
            Should two-factor authentication be required for administrators? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Two-factor authentication requirement">
            {TWO_FACTOR_POLICIES.map((policy) => {
              const isSelected = securityData.twoFactor?.required === policy;
              return (
                <button
                  key={policy}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      twoFactor: {
                        ...(prev.twoFactor || {}),
                        required: policy,
                      },
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-[#131B2E]">{policy}</span>
                    <span className="text-[11px] text-[#64748B]">
                      {policy === 'Required for all administrators' &&
                        'Mandatory 2FA setup upon login for all staff with administrative roles.'}
                      {policy === 'Recommended but optional' &&
                        'Prompt staff during login, but allow voluntary opt-out.'}
                      {policy === 'Optional' && 'Available in profile settings for interested staff.'}
                      {policy === 'Not required' && 'Disabled by default for administrator accounts.'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {activeErrors.twoFactor && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.twoFactor}
            </p>
          )}
        </div>

        {/* Allowed Authentication Methods */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <label className="block font-bold text-[#131B2E]">
            Allowed Authentication Methods
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {AUTHENTICATION_METHODS.map((method) => {
              const checked = (securityData.twoFactor?.methods || []).includes(method.id);
              return (
                <label
                  key={method.id}
                  className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E]'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.twoFactor?.methods || [];
                        const next = isChecking
                          ? Array.from(new Set([...current, method.id]))
                          : current.filter((m) => m !== method.id);
                        return {
                          ...prev,
                          twoFactor: {
                            ...(prev.twoFactor || {}),
                            methods: next,
                          },
                        };
                      });
                    }}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs">{method.label}</span>
                      {method.recommended && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {activeErrors.twoFactorMethods && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.twoFactorMethods}
            </p>
          )}

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2 mt-2">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Security Recommendation:</strong> Authenticator apps and passkeys are recommended over SMS for administrator accounts.
            </span>
          </div>
        </div>
      </div>

      {/* 6. LOGIN & ACCOUNT SECURITY */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">LOGIN &amp; ACCOUNT SECURITY</h4>
              <p className="text-[11px] text-[#64748B]">
                Configure brute-force defense limits and institutional password policies.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Failed attempts */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="max-failed-attempts">
              Maximum Failed Login Attempts *
            </label>
            <input
              id="max-failed-attempts"
              type="number"
              min={3}
              max={20}
              value={securityData.loginSecurity?.maxFailedAttempts ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateSecurityState((prev) => ({
                  ...prev,
                  loginSecurity: {
                    ...(prev.loginSecurity || {}),
                    maxFailedAttempts: e.target.value === '' ? undefined : (isNaN(val) ? undefined : val),
                  },
                }));
              }}
              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 ${
                activeErrors.maxFailedAttempts ? 'border-rose-400' : 'border-[#E2E8F0]'
              }`}
            />
            <p className="text-[11px] text-[#64748B]">
              Number of consecutive failed logins before temporary account lockout (min 3, max 20, default 5).
            </p>
            {activeErrors.maxFailedAttempts && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.maxFailedAttempts}
              </p>
            )}
          </div>

          {/* Lockout duration */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="lockout-duration">
              Lockout Duration *
            </label>
            <select
              id="lockout-duration"
              value={securityData.loginSecurity?.lockoutDuration || '15 minutes'}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  loginSecurity: {
                    ...(prev.loginSecurity || {}),
                    lockoutDuration: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            >
              {LOCKOUT_DURATIONS.map((dur) => (
                <option key={dur} value={dur}>
                  {dur} {dur === '15 minutes' ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B]">
              Duration an account remains locked following failed attempts (default 15 minutes).
            </p>
          </div>
        </div>

        {/* Password Policy */}
        <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#131B2E]">Password Requirements</span>
            <span className="text-[11px] text-[#64748B]">Recommended defaults enabled</span>
          </div>

          <div className="max-w-xs space-y-1">
            <label className="block font-semibold text-[#131B2E]" htmlFor="min-password-len">
              Minimum Password Length *
            </label>
            <input
              id="min-password-len"
              type="number"
              min={8}
              max={64}
              value={securityData.loginSecurity?.minimumPasswordLength ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateSecurityState((prev) => ({
                  ...prev,
                  loginSecurity: {
                    ...(prev.loginSecurity || {}),
                    minimumPasswordLength: e.target.value === '' ? undefined : (isNaN(val) ? undefined : val),
                  },
                }));
              }}
              className={`w-32 px-3 py-1.5 rounded-lg bg-white border text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 ${
                activeErrors.minimumPasswordLength ? 'border-rose-400' : 'border-[#E2E8F0]'
              }`}
            />
            <p className="text-[10px] text-[#64748B]">Default: 12 (Minimum 8, Maximum 64)</p>
            {activeErrors.minimumPasswordLength && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.minimumPasswordLength}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {[
              { id: 'uppercaseRequired', label: 'Uppercase required' },
              { id: 'lowercaseRequired', label: 'Lowercase required' },
              { id: 'numberRequired', label: 'Number required' },
              { id: 'specialCharRequired', label: 'Special character required' },
              { id: 'preventCommonPasswords', label: 'Prevent common passwords' },
              { id: 'preventRecentPasswords', label: 'Prevent recently used passwords' },
              { id: 'allowPassphrases', label: 'Support multi-word passphrases' },
            ].map((req) => {
              const checked = Boolean((securityData.loginSecurity?.passwordRequirements as any)?.[req.id]);
              return (
                <label
                  key={req.id}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E] font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => ({
                        ...prev,
                        loginSecurity: {
                          ...(prev.loginSecurity || {}),
                          passwordRequirements: {
                            ...(prev.loginSecurity?.passwordRequirements || ({} as any)),
                            [req.id]: isChecking,
                          },
                        },
                      }));
                    }}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-xs">{req.label}</span>
                </label>
              );
            })}
          </div>

          {/* Password Expiration */}
          <div className="pt-2 border-t border-[#F1F5F9] max-w-xs space-y-1">
            <label className="block font-semibold text-[#131B2E]" htmlFor="password-expiration">
              Password Expiration Policy
            </label>
            <select
              id="password-expiration"
              value={securityData.loginSecurity?.passwordRequirements?.passwordExpirationDays ?? 0}
              onChange={(e) => {
                const days = parseInt(e.target.value, 10) || 0;
                updateSecurityState((prev) => ({
                  ...prev,
                  loginSecurity: {
                    ...(prev.loginSecurity || {}),
                    passwordRequirements: {
                      ...(prev.loginSecurity?.passwordRequirements || {}),
                      passwordExpirationDays: days,
                    },
                  },
                }));
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA]"
            >
              <option value={0}>Never expires (Recommended / default)</option>
              <option value={90}>Every 90 days</option>
              <option value={180}>Every 180 days</option>
              <option value={365}>Every 365 days (1 year)</option>
            </select>
            <p className="text-[10px] text-[#64748B]">Modern NIST guidelines recommend against forced rotation unless compromised.</p>
          </div>
        </div>
      </div>

      {/* 9. SESSION & DEVICE SECURITY */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">SESSION &amp; DEVICE SECURITY</h4>
              <p className="text-[11px] text-[#64748B]">
                Configure browser session lifespans, device limits, and login notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Session timeout */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="session-timeout">
              Session Timeout *
            </label>
            <select
              id="session-timeout"
              value={securityData.sessionSecurity?.sessionTimeout || '30 minutes'}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  sessionSecurity: {
                    ...(prev.sessionSecurity || {}),
                    sessionTimeout: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            >
              {SESSION_TIMEOUTS.map((t) => (
                <option key={t} value={t}>
                  {t} {t === '30 minutes' ? '(Recommended / default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B]">
              Recommended / default: 30 minutes.
            </p>
            {activeErrors.sessionTimeout && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.sessionTimeout}
              </p>
            )}
          </div>

          {/* Concurrent sessions */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="concurrent-session">
              Concurrent Sessions *
            </label>
            <select
              id="concurrent-session"
              value={securityData.sessionSecurity?.concurrentSessionPolicy || 'Limit to 3 devices'}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  sessionSecurity: {
                    ...(prev.sessionSecurity || {}),
                    concurrentSessionPolicy: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            >
              {CONCURRENT_SESSION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} {opt === 'Limit to 3 devices' ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B]">Default: Limit to 3 devices.</p>
          </div>
        </div>

        {/* Idle timeout with duration & Notifications */}
        <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={securityData.sessionSecurity?.idleTimeoutEnabled ?? true}
                  aria-label="Enable idle timeout screen lock"
                  onChange={(e) =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      sessionSecurity: {
                        ...(prev.sessionSecurity || {}),
                        idleTimeoutEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
              </label>
              <div>
                <span className="font-bold text-xs text-[#131B2E] block">Idle Timeout</span>
                <span className="text-[11px] text-[#64748B]">Enable screen lock upon lack of mouse/keyboard input</span>
              </div>
            </div>

            {securityData.sessionSecurity?.idleTimeoutEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Duration:</span>
                <select
                  aria-label="Idle timeout duration"
                  value={securityData.sessionSecurity?.idleTimeout || '15 minutes'}
                  onChange={(e) =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      sessionSecurity: {
                        ...(prev.sessionSecurity || {}),
                        idleTimeout: e.target.value,
                      },
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold focus:border-[#4338CA]"
                >
                  <option value="5 minutes">5 minutes</option>
                  <option value="10 minutes">10 minutes</option>
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                </select>
              </div>
            )}
          </div>

          {activeErrors.idleTimeout && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.idleTimeout}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#131B2E] block">New Device Notification</span>
                <span className="text-[10px] text-[#64748B]">Toggle ON by default</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityData.sessionSecurity?.newDeviceNotification ?? true}
                  onChange={(e) =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      sessionSecurity: {
                        ...(prev.sessionSecurity || {}),
                        newDeviceNotification: e.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
              </label>
            </div>

            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#131B2E] block">Suspicious Login Notification</span>
                <span className="text-[10px] text-[#64748B]">Toggle ON by default</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityData.sessionSecurity?.suspiciousLoginNotification ?? true}
                  onChange={(e) =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      sessionSecurity: {
                        ...(prev.sessionSecurity || {}),
                        suspiciousLoginNotification: e.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 10. AUDIT LOGGING */}
      {!isCmsOnly && (
        <>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">AUDIT LOGGING</h4>
              <p className="text-[11px] text-[#64748B]">
                Track and preserve chronological trails of administrative activities and changes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-[#131B2E]">
            Should administrative activities be recorded in audit logs? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Audit logging policy">
            {AUDIT_LOGGING_POLICIES.map((policy) => {
              const isSelected = securityData.auditLogging?.enabled === policy;
              return (
                <button
                  key={policy}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      auditLogging: {
                        ...(prev.auditLogging || {}),
                        enabled: policy,
                      },
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-xs text-[#131B2E]">{policy}</span>
                </button>
              );
            })}
          </div>
          {activeErrors.auditLogging && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.auditLogging}
            </p>
          )}
        </div>

        {/* Audit Events to Capture */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-[#131B2E]">Audit Events to Capture</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateSecurityState((prev) => ({
                    ...prev,
                    auditLogging: {
                      ...(prev.auditLogging || {}),
                      events: [...AUDIT_EVENTS_CATALOG],
                    },
                  }))
                }
                className="text-[11px] font-semibold text-[#4338CA] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() =>
                  updateSecurityState((prev) => ({
                    ...prev,
                    auditLogging: {
                      ...(prev.auditLogging || {}),
                      events: [],
                    },
                  }))
                }
                className="text-[11px] font-semibold text-[#64748B] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {AUDIT_EVENTS_CATALOG.map((evt) => {
              const checked = (securityData.auditLogging?.events || []).includes(evt);
              return (
                <label
                  key={evt}
                  className={`p-2 rounded-lg border flex items-center space-x-2 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E] font-medium'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.auditLogging?.events || [];
                        const next = isChecking
                          ? Array.from(new Set([...current, evt]))
                          : current.filter((x) => x !== evt);
                        return {
                          ...prev,
                          auditLogging: {
                            ...(prev.auditLogging || {}),
                            events: next,
                          },
                        };
                      });
                    }}
                    className="w-3.5 h-3.5 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-[11px] truncate" title={evt}>
                    {evt}
                  </span>
                </label>
              );
            })}
          </div>

          {activeErrors.auditEvents && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.auditEvents}
            </p>
          )}
        </div>
      </div>

      {/* 11. AUDIT LOG RETENTION */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">AUDIT LOG RETENTION</h4>
            <p className="text-[11px] text-[#64748B]">
              Specify the retention period for administrative audit records.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 max-w-md">
          <label className="block font-bold text-[#131B2E]" htmlFor="audit-retention">
            Retention Period *
          </label>
          <select
            id="audit-retention"
            value={securityData.auditLogging?.retentionPeriod || '1 year'}
            onChange={(e) =>
              updateSecurityState((prev) => ({
                ...prev,
                auditLogging: {
                  ...(prev.auditLogging || {}),
                  retentionPeriod: e.target.value,
                },
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
          >
            {AUDIT_RETENTION_PERIODS.map((period) => (
              <option key={period} value={period}>
                {period} {period === '1 year' ? '(Default)' : ''}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#64748B]">
            Longer retention may be appropriate for compliance, investigations and institutional audit requirements.
          </p>
          {activeErrors.retentionPeriod && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.retentionPeriod}
            </p>
          )}
        </div>
      </div>

      {/* 12. DATA EXPORT & PRIVACY CONTROLS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">DATA EXPORT &amp; PRIVACY</h4>
              <p className="text-[11px] text-[#64748B]">
                Configure data export permissions, sensitive category approvals, and batch limits.
              </p>
            </div>
          </div>
        </div>

        {/* Who can export */}
        <div className="space-y-2">
          <label className="block font-bold text-[#131B2E]">
            Who can export institutional data? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Data export permission model">
            {DATA_EXPORT_POLICIES.map((policy) => {
              const isSelected = securityData.dataExport?.permissionModel === policy;
              return (
                <button
                  key={policy}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      dataExport: {
                        ...(prev.dataExport || {}),
                        permissionModel: policy,
                      },
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-[#131B2E]">{policy}</span>
                    <span className="text-[11px] text-[#64748B]">
                      {policy === 'Super Administrators only' && 'Strict isolation to designated super-administrators only.'}
                      {policy === 'Administrators with explicit export permission' && 'Default: Authorized staff granted role-level export capabilities.'}
                      {policy === 'All administrators' && 'Any active administrator account can download reports.'}
                      {policy === 'Nobody' && 'Institutional export feature completely disabled.'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {activeErrors.dataExport && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.dataExport}
            </p>
          )}
        </div>

        {/* Require approval toggle */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-[#131B2E] block">
              Require approval before sensitive data export
            </span>
            <span className="text-[11px] text-[#64748B]">
              Demands supervisor authorization before exporting student personal records or financial files. Default: ON.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              aria-label="Require approval before sensitive data export"
              checked={securityData.dataExport?.approvalRequired ?? true}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  dataExport: {
                    ...(prev.dataExport || {}),
                    approvalRequired: e.target.checked,
                  },
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4338CA]" />
          </label>
        </div>

        {/* Sensitive data categories */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <label className="block font-bold text-[#131B2E]">
            Sensitive Data Categories (Requires Stricter Permissions)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SENSITIVE_DATA_CATEGORIES.map((cat) => {
              const checked = (securityData.dataExport?.sensitiveDataCategories || []).includes(cat);
              return (
                <label
                  key={cat}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E] font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.dataExport?.sensitiveDataCategories || [];
                        const next = isChecking
                          ? [...current, cat]
                          : current.filter((x) => x !== cat);
                        return {
                          ...prev,
                          dataExport: {
                            ...(prev.dataExport || {}),
                            sensitiveDataCategories: next,
                          },
                        };
                      });
                    }}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-xs">{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Export limits & Formats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="max-export-records">
              Maximum Records Per Export
            </label>
            <input
              id="max-export-records"
              type="number"
              min={100}
              max={1000000}
              step={500}
              value={securityData.dataExport?.maxRecordsPerExport ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateSecurityState((prev) => ({
                  ...prev,
                  dataExport: {
                    ...(prev.dataExport || {}),
                    maxRecordsPerExport: e.target.value === '' ? undefined : (isNaN(val) ? undefined : val),
                  },
                }));
              }}
              className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 ${
                activeErrors.maxRecordsPerExport ? 'border-rose-400' : 'border-[#E2E8F0]'
              }`}
            />
            <p className="text-[11px] text-[#64748B]">Range: 100 to 1,000,000 records (default: 10,000).</p>
            {activeErrors.maxRecordsPerExport && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.maxRecordsPerExport}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]">Export Formats</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EXPORT_FORMATS.map((fmt) => {
                const checked = (securityData.dataExport?.formats || []).includes(fmt);
                return (
                  <label
                    key={fmt}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                      checked
                        ? 'border-indigo-300 bg-indigo-50 text-[#4338CA]'
                        : 'border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isChecking = e.target.checked;
                        updateSecurityState((prev) => {
                          const current = prev.dataExport?.formats || [];
                          const next = isChecking
                            ? Array.from(new Set([...current, fmt]))
                            : current.filter((f) => f !== fmt);
                          return {
                            ...prev,
                            dataExport: {
                              ...(prev.dataExport || {}),
                              formats: next,
                            },
                          };
                        });
                      }}
                      className="w-3.5 h-3.5 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                    />
                    <span>{fmt}</span>
                  </label>
                );
              })}
            </div>

            {activeErrors.exportFormats && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {activeErrors.exportFormats}
              </p>
            )}

            <p className="text-[10px] text-[#64748B]">
              Raw database dumps are not exposed as a standard export option.
            </p>
          </div>
        </div>
      </div>

      {/* 13. DATA ACCESS RESTRICTIONS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">DATA ACCESS RESTRICTIONS</h4>
            <p className="text-[11px] text-[#64748B]">
              Enforce security-sensitive restrictions across campuses, departments, and records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'campusRestriction',
              title: 'Restrict administrators by campus',
              desc: 'Multi-campus institutions restrict staff visibility exclusively to their assigned branch.',
            },
            {
              id: 'departmentRestriction',
              title: 'Restrict administrators by department',
              desc: 'Limit staff members strictly to their designated operational department.',
            },
            {
              id: 'sensitiveStudentData',
              title: 'Restrict access to sensitive student information',
              desc: 'Shield medical histories, special need accommodations, and confidential welfare records.',
            },
            {
              id: 'financialData',
              title: 'Restrict financial data access',
              desc: 'Limit fee collections, ledger sheets, and bank transaction summaries to Accounts staff.',
            },
            {
              id: 'bulkAccessApproval',
              title: 'Require explicit permission for bulk data access',
              desc: 'Disallows unapproved mass queries across student, parent, or employee rosters.',
            },
          ].map((item) => {
            const key = item.id as keyof typeof securityData.accessRestrictions;
            const isChecked = Boolean(securityData.accessRestrictions?.[key]);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">{item.title}</span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">{item.desc}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    aria-label={item.title}
                    onChange={(e) =>
                      updateSecurityState((prev) => ({
                        ...prev,
                        accessRestrictions: {
                          ...(prev.accessRestrictions || {}),
                          [key]: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* 14. SECURITY NOTIFICATIONS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">SECURITY NOTIFICATIONS</h4>
              <p className="text-[11px] text-[#64748B]">
                Configure security event notifications and delivery channels.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'failedLogin', label: 'Notify administrators about failed login attempts' },
            { id: 'newDevice', label: 'Notify administrators about new device login' },
            { id: 'passwordChange', label: 'Notify administrators about password changes' },
            { id: 'twoFactorChange', label: 'Notify administrators about 2FA changes' },
            { id: 'permissionChange', label: 'Notify administrators about permission changes' },
            { id: 'dataExport', label: 'Notify administrators about data exports' },
            { id: 'suspiciousActivity', label: 'Notify administrators about suspicious activity' },
          ].map((item) => {
            const key = item.id as keyof typeof securityData.notifications;
            const checked = Boolean(securityData.notifications?.[key]);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-xs text-[#131B2E]">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    aria-label={item.label}
                    onChange={(e) =>
                      updateSecurityState((prev) => ({
                        ...prev,
                        notifications: {
                          ...(prev.notifications || {}),
                          [key]: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
                </label>
              </div>
            );
          })}
        </div>

        {/* Channels */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <label className="block font-bold text-[#131B2E]">Notification Channels</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {NOTIFICATION_CHANNELS.map((ch) => {
              const checked = (securityData.notifications?.channels || []).includes(ch);
              return (
                <label
                  key={ch}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/50 text-[#4338CA] font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.notifications?.channels || [];
                        const next = isChecking
                          ? Array.from(new Set([...current, ch]))
                          : current.filter((x) => x !== ch);
                        return {
                          ...prev,
                          notifications: {
                            ...(prev.notifications || {}),
                            channels: next,
                          },
                        };
                      });
                    }}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-xs">{ch}</span>
                </label>
              );
            })}
          </div>

          {activeErrors.notificationChannels && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.notificationChannels}
            </p>
          )}
        </div>
      </div>

      {/* 15. ADMINISTRATIVE APPROVAL */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">HIGH-RISK ACTION APPROVAL</h4>
            <p className="text-[11px] text-[#64748B]">
              Require secondary administrative sign-off for catastrophic or irreversible platform actions.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-[#131B2E]">
            Should high-risk administrative actions require approval? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" role="radiogroup" aria-label="High-risk action approval policy">
            {HIGH_RISK_APPROVAL_POLICIES.map((policy) => {
              const isSelected = securityData.highRiskApproval?.policy === policy;
              return (
                <button
                  key={policy}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    updateSecurityState((prev) => ({
                      ...prev,
                      highRiskApproval: {
                        ...(prev.highRiskApproval || {}),
                        policy,
                      },
                    }))
                  }
                  className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs ring-1 ring-[#4338CA]'
                      : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#4338CA] bg-[#4338CA]' : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-xs text-[#131B2E]">{policy}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* High-risk action items */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <label className="block font-bold text-[#131B2E]">
            High-Risk Actions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {HIGH_RISK_ACTIONS.map((action) => {
              const checked = (securityData.highRiskApproval?.actions || []).includes(action);
              return (
                <label
                  key={action}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition ${
                    checked
                      ? 'border-indigo-300 bg-indigo-50/40 text-[#131B2E] font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const isChecking = e.target.checked;
                      updateSecurityState((prev) => {
                        const current = prev.highRiskApproval?.actions || [];
                        const next = isChecking
                          ? Array.from(new Set([...current, action]))
                          : current.filter((x) => x !== action);
                        return {
                          ...prev,
                          highRiskApproval: {
                            ...(prev.highRiskApproval || {}),
                            actions: next,
                          },
                        };
                      });
                    }}
                    className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                  />
                  <span className="text-xs">{action}</span>
                </label>
              );
            })}
          </div>

          {activeErrors.highRiskActions && (
            <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {activeErrors.highRiskActions}
            </p>
          )}
        </div>
      </div>

      {/* 12. PRIVACY & DATA GOVERNANCE */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center space-x-2.5 border-b border-[#E2E8F0] pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">PRIVACY &amp; DATA GOVERNANCE</h4>
            <p className="text-[11px] text-[#64748B]">
              Establish foundational data access principles, record deletion policies, and incident notices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Access principle */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="access-principle">
              Data Access Principle *
            </label>
            <select
              id="access-principle"
              value={securityData.privacy?.accessPrinciple || 'Strict least-privilege access'}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  privacy: {
                    ...(prev.privacy || {}),
                    accessPrinciple: e.target.value as DataAccessPrinciple,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            >
              {DATA_ACCESS_PRINCIPLES.map((principle) => (
                <option key={principle} value={principle}>
                  {principle} {principle === 'Strict least-privilege access' ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B]">Default: Strict least-privilege access.</p>
          </div>

          {/* Deletion policy */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131B2E]" htmlFor="deletion-policy">
              Data Deletion Policy *
            </label>
            <select
              id="deletion-policy"
              value={securityData.privacy?.deletionPolicy || 'Manual approval required'}
              onChange={(e) =>
                updateSecurityState((prev) => ({
                  ...prev,
                  privacy: {
                    ...(prev.privacy || {}),
                    deletionPolicy: e.target.value as DataDeletionPolicy,
                  },
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            >
              {DATA_DELETION_POLICIES.map((dp) => (
                <option key={dp} value={dp}>
                  {dp} {dp === 'Manual approval required' ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B]">Default: Manual approval required.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-[#131B2E] block">Data Anonymization</span>
              <span className="text-[11px] text-[#64748B]">
                Support anonymization of historical records (Default: ON)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                aria-label="Support anonymization of historical records"
                checked={securityData.privacy?.anonymization ?? true}
                onChange={(e) =>
                  updateSecurityState((prev) => ({
                    ...prev,
                    privacy: {
                      ...(prev.privacy || {}),
                      anonymization: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
            </label>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-[#131B2E] block">Privacy Incident Notification</span>
              <span className="text-[11px] text-[#64748B]">
                Notify designated administrators about privacy/security incidents (Default: ON)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                aria-label="Notify designated administrators about privacy/security incidents"
                checked={securityData.privacy?.incidentNotification ?? true}
                onChange={(e) =>
                  updateSecurityState((prev) => ({
                    ...prev,
                    privacy: {
                      ...(prev.privacy || {}),
                      incidentNotification: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]" />
            </label>
          </div>
        </div>
      </div>
      </>
      )}

      {/* 17. SECURITY POLICY SUMMARY */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm tracking-wide text-white uppercase">
              SECURITY POLICY SUMMARY
            </h4>
          </div>
          <span className="text-[11px] text-indigo-200 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
            Dynamic Policy Summary
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {dynamicSummary.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-indigo-100">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 18. SECURITY RECOMMENDATION PANEL */}
      <div className="bg-slate-50 border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#4338CA]" />
            <h4 className="font-bold text-xs text-[#131B2E] uppercase tracking-wider">
              Recommended security baseline
            </h4>
          </div>
          <span className="text-[10px] text-[#64748B]">Enterprise Education Standard</span>
        </div>

        <div className="space-y-2">
          {baselineRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-3 rounded-xl border flex items-start space-x-3 transition ${
                rec.isCompliant
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50/80 text-amber-900'
              }`}
            >
              {rec.isCompliant ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs">{rec.title}</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{rec.recommendation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
