'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  MapPin,
  FileText,
  Lock,
  ArrowRight,
  BookOpen,
  Settings,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import {
  STAFF_FIELD_CATEGORIES,
  STAFF_FIELD_DEFINITIONS,
  DEFAULT_ENABLED_STAFF_FIELDS,
  DEFAULT_REQUIRED_STAFF_FIELDS,
  StaffFieldCategory,
  StaffFieldDefinition,
} from '@/lib/staffFieldDefinitions';
import type { StaffFacultyConfigData, StaffCustomField } from '@/lib/types';
import StaffCustomFieldBuilder from './StaffCustomFieldBuilder';

export interface StaffFieldSelectorProps {
  token?: string;
  config: StaffFacultyConfigData;
  schoolName?: string;
  customFields?: StaffCustomField[];
  onUpdateConfig: (updated: Partial<StaffFacultyConfigData>) => void;
  onUpdateCustomFields?: (fields: StaffCustomField[]) => void;
  onContinueToTemplate: () => void;
  onBackToDirectory?: () => void;
  isSaving?: boolean;
}

const CATEGORY_ICONS: Record<StaffFieldCategory, React.ComponentType<{ className?: string }>> = {
  employment: Briefcase,
  personal: User,
  contact: Phone,
  address: MapPin,
  qualification: GraduationCap,
  teaching: BookOpen,
  non_teaching: Settings,
  payroll: CreditCard,
  documents: FileText,
  custom: Sparkles,
};

export default function StaffFieldSelector({
  token,
  config,
  schoolName,
  customFields = [],
  onUpdateConfig,
  onUpdateCustomFields,
  onContinueToTemplate,
  onBackToDirectory,
  isSaving = false,
}: StaffFieldSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    employment: true,
    personal: true,
    contact: true,
    address: false,
    qualification: true,
    teaching: true,
    non_teaching: false,
    payroll: false,
    documents: false,
  });

  const enabledFields = config.enabledFields || DEFAULT_ENABLED_STAFF_FIELDS;
  const requiredFields = config.requiredFields || DEFAULT_REQUIRED_STAFF_FIELDS;

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleToggleField = (field: StaffFieldDefinition) => {
    if (field.lockedRequired) return;

    const isEnabled = enabledFields.includes(field.key);
    let nextEnabled: string[];
    let nextRequired = [...requiredFields];

    if (isEnabled) {
      nextEnabled = enabledFields.filter((k) => k !== field.key);
      nextRequired = nextRequired.filter((k) => k !== field.key);
    } else {
      nextEnabled = [...enabledFields, field.key];
      if (field.requiredByDefault && !nextRequired.includes(field.key)) {
        nextRequired.push(field.key);
      }
    }

    onUpdateConfig({
      enabledFields: nextEnabled,
      requiredFields: nextRequired,
    });
  };

  const handleToggleRequired = (field: StaffFieldDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (field.lockedRequired) return;
    if (!enabledFields.includes(field.key)) return;

    const isReq = requiredFields.includes(field.key);
    const nextRequired = isReq
      ? requiredFields.filter((k) => k !== field.key)
      : [...requiredFields, field.key];

    onUpdateConfig({ requiredFields: nextRequired });
  };

  // Presets
  const applyPreset = (preset: 'cbse' | 'lean' | 'complete') => {
    if (preset === 'lean') {
      onUpdateConfig({
        enabledFields: ['employee_code', 'staff_type', 'name', 'department', 'designation', 'status', 'phone', 'highest_qualification'],
        requiredFields: ['employee_code', 'staff_type', 'name', 'department', 'designation', 'status', 'phone'],
      });
    } else if (preset === 'cbse') {
      onUpdateConfig({
        enabledFields: [...DEFAULT_ENABLED_STAFF_FIELDS],
        requiredFields: [...DEFAULT_REQUIRED_STAFF_FIELDS],
      });
    } else if (preset === 'complete') {
      onUpdateConfig({
        enabledFields: Object.keys(STAFF_FIELD_DEFINITIONS),
        requiredFields: [...DEFAULT_REQUIRED_STAFF_FIELDS],
      });
    }
  };

  const canonicalCategories = STAFF_FIELD_CATEGORIES.filter((c) => c.id !== 'custom');
  const activeCustomFields = customFields.filter((c) => c.is_active !== false);

  return (
    <div className="space-y-6">
      {/* Configuration Header & Preset Quick Actions */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Staff Configuration
              </span>
              <span className="text-xs text-[#64748B]">
                {enabledFields.length} canonical + {activeCustomFields.length} custom fields enabled
              </span>
            </div>
            <h2 className="text-lg font-black text-[#131B2E] mt-1">Configure Faculty & Staff Fields</h2>
            <p className="text-xs text-[#64748B]">
              Select which fields your school requires. The Excel template, bulk import validator, and entry forms will adapt automatically.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('lean')}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Lean Roster
            </button>
            <button
              type="button"
              onClick={() => applyPreset('cbse')}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
            >
              CBSE Recommended
            </button>
            <button
              type="button"
              onClick={() => applyPreset('complete')}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              All Canonical
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Locked Core (Always Required)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Required in Excel & Form</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            <span>Optional Field</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">TEACHING</span>
            <span>Teaching Only</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">NON_TEACHING</span>
            <span>Non-Teaching Only</span>
          </div>
        </div>
      </div>

      {/* Canonical Category Accordions */}
      <div className="space-y-3">
        {canonicalCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Briefcase;
          const isExpanded = expandedCategories[cat.id];
          const catFields = Object.values(STAFF_FIELD_DEFINITIONS)
            .filter((f) => f.category === cat.id)
            .sort((a, b) => a.templateOrder - b.templateOrder);

          const enabledInCat = catFields.filter((f) => enabledFields.includes(f.key)).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden transition-all shadow-2xs"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/70 transition cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-black text-[#131B2E]">{cat.title}</h3>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {enabledInCat} / {catFields.length}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{cat.description}</p>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Category Fields List */}
              {isExpanded && (
                <div className="border-t border-[#E2E8F0] p-4 bg-slate-50/40 divide-y divide-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catFields.map((field) => {
                      const isEnabled = enabledFields.includes(field.key);
                      const isRequired = Boolean(
                        (field as any).isRequired ||
                        (field as any).isLocked ||
                        field.lockedRequired ||
                        requiredFields.includes(field.key)
                      );

                      return (
                        <div
                          key={field.key}
                          onClick={() => handleToggleField(field)}
                          className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isEnabled
                              ? 'bg-white border-indigo-200 shadow-2xs'
                              : 'bg-slate-100/60 border-slate-200 opacity-65 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start space-x-2.5 pr-2">
                            <div className="mt-0.5">
                              {field.lockedRequired ? (
                                <Lock className="w-4 h-4 text-indigo-600" />
                              ) : isEnabled ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className={`text-xs font-bold ${isEnabled ? 'text-[#131B2E]' : 'text-slate-500'}`}>
                                  {field.label}
                                </span>
                                {isRequired && (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                    Required
                                  </span>
                                )}
                                {field.staffTypeScope === 'TEACHING' && (
                                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                    Teaching
                                  </span>
                                )}
                                {field.staffTypeScope === 'NON_TEACHING' && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                    Non-Teaching
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B] line-clamp-1">{field.description}</p>
                              {field.sampleValue && (
                                <p className="text-[10px] text-slate-400 italic">e.g. {field.sampleValue}</p>
                              )}
                            </div>
                          </div>

                          {/* Toggle Required Button */}
                          {isEnabled && !field.lockedRequired && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleRequired(field, e)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition shrink-0 ${
                                isRequired
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {isRequired ? 'Mandatory' : 'Optional'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Extensible Custom Staff Fields Section */}
      <StaffCustomFieldBuilder
        token={token}
        customFields={customFields}
        onUpdateCustomFields={(newCustomFields) => {
          if (onUpdateCustomFields) {
            onUpdateCustomFields(newCustomFields);
          } else {
            onUpdateConfig({ customFields: newCustomFields });
          }
        }}
        disabled={isSaving}
      />

      {/* Bottom Sticky Action Footer */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#64748B]">
          <span className="font-bold text-[#131B2E]">{enabledFields.length + activeCustomFields.length} fields</span> configured (
          <span className="text-rose-600 font-bold">{requiredFields.length + activeCustomFields.filter((c) => c.is_required).length} required</span>)
        </div>

        <div className="flex items-center space-x-2">
          {onBackToDirectory && (
            <button
              type="button"
              onClick={onBackToDirectory}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={onContinueToTemplate}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Proceed to Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
