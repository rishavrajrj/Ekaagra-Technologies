'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  Users,
  MapPin,
  ShieldAlert,
  Sparkles,
  FileText,
  Lock,
  Asterisk,
  Info,
  Hash,
  ArrowRight,
  Save,
  Plus,
  Settings,
  Layers,
} from 'lucide-react';
import {
  STUDENT_FIELD_CATEGORIES,
  STUDENT_FIELD_DEFINITIONS,
  getFieldsByCategory,
  getOrderedStudentFields,
  getAllStudentCategories,
  StudentFieldCategory,
  StudentFieldDefinition,
} from '@/lib/studentFieldDefinitions';
import type { StudentConfigData, StudentCustomFieldDefinition, StudentCustomSection } from '@/lib/types';
import StudentRecordPreviewCard from './StudentRecordPreviewCard';
import CustomFieldModal from './CustomFieldModal';
import ManageCustomFieldsDrawer from './ManageCustomFieldsDrawer';
import {
  createOrUpdateCustomFieldAction,
  toggleCustomFieldStatusAction,
  deleteCustomFieldAction,
  reorderCustomFieldsAction,
} from '@/app/studentActions';

export interface StudentFieldSelectorProps {
  config: StudentConfigData;
  schoolName?: string;
  token?: string;
  schoolId?: string;
  onUpdateConfig: (updated: Partial<StudentConfigData>) => void;
  onContinueToTemplate: () => void;
  isSaving?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  academic: GraduationCap,
  personal: User,
  basic: User,
  parent: Users,
  address: MapPin,
  emergency: ShieldAlert,
  additional: Sparkles,
  documents: FileText,
};

export default function StudentFieldSelector({
  config,
  schoolName,
  token,
  schoolId,
  onUpdateConfig,
  onContinueToTemplate,
  isSaving = false,
}: StudentFieldSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    academic: true,
    personal: true,
    parent: true,
    address: false,
    emergency: false,
    additional: false,
    documents: false,
  });

  // Custom fields dialog states
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState<StudentCustomFieldDefinition | null>(null);

  const enabledFields = config.enabledFields || [];
  const requiredFields = config.requiredFields || [];

  const allCategories = useMemo(() => {
    return getAllStudentCategories(config.customSections);
  }, [config.customSections]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Toggle field enabled/disabled
  const handleToggleField = (field: StudentFieldDefinition) => {
    if (field.lockedRequired) return; // Cannot disable locked core fields

    const isEnabled = enabledFields.includes(field.key);
    let nextEnabled: string[];
    let nextRequired = [...requiredFields];

    if (isEnabled) {
      // Disable
      nextEnabled = enabledFields.filter((k) => k !== field.key);
      nextRequired = nextRequired.filter((k) => k !== field.key);
    } else {
      // Enable
      nextEnabled = [...enabledFields, field.key];
      if (field.requiredByDefault && !nextRequired.includes(field.key)) {
        nextRequired.push(field.key);
      }
    }

    onUpdateConfig({
      enabledFields: getOrderedStudentFields(nextEnabled, config.customFields),
      requiredFields: getOrderedStudentFields(nextRequired, config.customFields),
    });
  };

  // Toggle required vs optional for an enabled field
  const handleToggleRequired = (field: StudentFieldDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (field.lockedRequired) return;
    if (!enabledFields.includes(field.key)) return;

    const isReq = requiredFields.includes(field.key);
    const nextRequired = isReq
      ? requiredFields.filter((k) => k !== field.key)
      : [...requiredFields, field.key];

    onUpdateConfig({ requiredFields: getOrderedStudentFields(nextRequired, config.customFields) });
  };

  // Select all fields in a category
  const handleSelectAllCategory = (catId: StudentFieldCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const catFields = getFieldsByCategory(catId, config.customFields);
    const newKeys = catFields.map((f) => f.key);
    const combined = Array.from(new Set([...enabledFields, ...newKeys]));
    onUpdateConfig({ enabledFields: getOrderedStudentFields(combined, config.customFields) });
  };

  // Clear all optional fields in a category
  const handleClearCategory = (catId: StudentFieldCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const catFields = getFieldsByCategory(catId, config.customFields);
    const catKeys = catFields.map((f) => f.key);
    const filtered = enabledFields.filter((k) => {
      const def = STUDENT_FIELD_DEFINITIONS.find((d) => d.key === k);
      return def?.lockedRequired || !catKeys.includes(k);
    });
    const filteredReq = requiredFields.filter((k) => filtered.includes(k));
    onUpdateConfig({
      enabledFields: getOrderedStudentFields(filtered, config.customFields),
      requiredFields: getOrderedStudentFields(filteredReq, config.customFields),
    });
  };

  // Quick Presets
  const handleSelectStandard25 = () => {
    const standardKeys = STUDENT_FIELD_DEFINITIONS.filter((d) => d.templateOrder <= 25).map((d) => d.key);
    const lockedKeys = ['admission_number', 'student_name'];
    const newEnabled = getOrderedStudentFields(
      Array.from(new Set([...standardKeys, ...lockedKeys])),
      config.customFields
    );
    const newRequired = getOrderedStudentFields(
      requiredFields.filter((k) => newEnabled.includes(k)),
      config.customFields
    );
    onUpdateConfig({
      enabledFields: newEnabled,
      requiredFields: newRequired,
    });
  };

  const handleSelectAll51 = () => {
    const canonicalKeys = STUDENT_FIELD_DEFINITIONS.map((d) => d.key);
    const newEnabled = getOrderedStudentFields(canonicalKeys, config.customFields);
    const newRequired = getOrderedStudentFields(
      requiredFields.filter((k) => newEnabled.includes(k)),
      config.customFields
    );
    onUpdateConfig({
      enabledFields: newEnabled,
      requiredFields: newRequired,
    });
  };

  const handleSelectAllActive = () => {
    const canonicalKeys = STUDENT_FIELD_DEFINITIONS.map((d) => d.key);
    const activeCustomKeys = (config.customFields || [])
      .filter((cf) => cf.is_active !== false)
      .map((cf) => cf.field_key);
    const allKeys = Array.from(new Set([...canonicalKeys, ...activeCustomKeys]));
    const newEnabled = getOrderedStudentFields(allKeys, config.customFields);
    const newRequired = getOrderedStudentFields(
      requiredFields.filter((k) => newEnabled.includes(k)),
      config.customFields
    );
    onUpdateConfig({
      enabledFields: newEnabled,
      requiredFields: newRequired,
    });
  };

  const handleClearAllOptional = () => {
    const lockedKeys = ['admission_number', 'student_name'];
    onUpdateConfig({
      enabledFields: lockedKeys,
      requiredFields: lockedKeys,
    });
  };

  // Custom Field CRUD handlers
  const handleSaveCustomField = async (
    fieldData: Partial<StudentCustomFieldDefinition>,
    newSection?: Partial<StudentCustomSection>
  ) => {
    let savedField: StudentCustomFieldDefinition | undefined;
    if (token) {
      const res = await createOrUpdateCustomFieldAction(token, fieldData);
      if (!res.success) {
        alert(res.error || 'Failed to save custom field');
        return;
      }
      savedField = res.field;
    }

    const currentList = config.customFields || [];
    let updatedList: StudentCustomFieldDefinition[];

    if (fieldData.id) {
      updatedList = currentList.map((f) =>
        f.id === fieldData.id ? ({ ...f, ...fieldData } as StudentCustomFieldDefinition) : f
      );
    } else if (savedField) {
      updatedList = [...currentList, savedField];
    } else {
      const newDef: StudentCustomFieldDefinition = {
        id: fieldData.id || `temp-${Date.now()}`,
        school_id: schoolId || '',
        field_key: fieldData.field_key!,
        field_name: fieldData.field_name || '',
        field_type: fieldData.field_type || 'text',
        section_key: fieldData.section_key || 'additional',
        section_name: fieldData.section_name,
        help_text: fieldData.help_text,
        placeholder: fieldData.placeholder,
        options: fieldData.options,
        is_required: fieldData.is_required ?? false,
        is_active: fieldData.is_active ?? true,
        display_order: fieldData.display_order ?? 52 + currentList.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedList = [...currentList, newDef];
    }

    const fieldKey = savedField ? savedField.field_key : fieldData.field_key!;
    const nextEnabled = Array.from(new Set([...enabledFields, fieldKey]));
    const nextRequired = fieldData.is_required
      ? Array.from(new Set([...requiredFields, fieldKey]))
      : requiredFields;

    let updatedSections = config.customSections;
    if (newSection && newSection.section_key) {
      const currentSections = config.customSections || [];
      if (!currentSections.some((s) => s.section_key === newSection.section_key)) {
        updatedSections = [
          ...currentSections,
          {
            id: newSection.id || `sec-${Date.now()}`,
            section_key: newSection.section_key,
            section_name: newSection.section_name || newSection.section_key,
            display_order: newSection.display_order || 8 + currentSections.length,
            is_active: true,
          },
        ];
      }
    }

    onUpdateConfig({
      customFields: updatedList,
      customSections: updatedSections,
      enabledFields: getOrderedStudentFields(nextEnabled, updatedList),
      requiredFields: getOrderedStudentFields(nextRequired, updatedList),
    });

    setIsCustomModalOpen(false);
    setEditingCustomField(null);
  };

  const handleToggleCustomFieldActive = async (fieldId: string, isActive: boolean) => {
    if (token) {
      const res = await toggleCustomFieldStatusAction(token, fieldId, isActive);
      if (!res.success) {
        alert(res.error || 'Failed to update field status');
        return;
      }
    }

    const targetField = (config.customFields || []).find((f) => f.id === fieldId);
    const updatedList = (config.customFields || []).map((f) =>
      f.id === fieldId ? { ...f, is_active: isActive } : f
    );

    let nextEnabled = [...enabledFields];
    let nextRequired = [...requiredFields];

    if (!isActive && targetField) {
      nextEnabled = nextEnabled.filter((k) => k !== targetField.field_key);
      nextRequired = nextRequired.filter((k) => k !== targetField.field_key);
    } else if (isActive && targetField) {
      nextEnabled.push(targetField.field_key);
      if (targetField.is_required) {
        nextRequired.push(targetField.field_key);
      }
    }

    onUpdateConfig({
      customFields: updatedList,
      enabledFields: getOrderedStudentFields(nextEnabled, updatedList),
      requiredFields: getOrderedStudentFields(nextRequired, updatedList),
    });
  };

  const handleDeleteCustomField = async (fieldId: string) => {
    if (token) {
      const res = await deleteCustomFieldAction(token, fieldId);
      if (!res.success) {
        alert(res.error || 'Failed to delete custom field.');
        return;
      }
    }

    const targetField = (config.customFields || []).find((f) => f.id === fieldId);
    const updatedList = (config.customFields || []).filter((f) => f.id !== fieldId);

    const nextEnabled = targetField
      ? enabledFields.filter((k) => k !== targetField.field_key)
      : enabledFields;
    const nextRequired = targetField
      ? requiredFields.filter((k) => k !== targetField.field_key)
      : requiredFields;

    onUpdateConfig({
      customFields: updatedList,
      enabledFields: getOrderedStudentFields(nextEnabled, updatedList),
      requiredFields: getOrderedStudentFields(nextRequired, updatedList),
    });
  };

  const handleReorderCustomFields = async (fieldIds: string[]) => {
    if (token) {
      await reorderCustomFieldsAction(token, fieldIds);
    }

    const currentMap = new Map((config.customFields || []).map((f) => [f.id, f]));
    const reordered: StudentCustomFieldDefinition[] = [];
    fieldIds.forEach((id, idx) => {
      const field = currentMap.get(id);
      if (field) {
        reordered.push({ ...field, display_order: 52 + idx });
      }
    });

    onUpdateConfig({
      customFields: reordered,
      enabledFields: getOrderedStudentFields(enabledFields, reordered),
      requiredFields: getOrderedStudentFields(requiredFields, reordered),
    });
  };

  const totalEnabled = enabledFields.length;
  const totalRequired = requiredFields.length;
  const totalOptional = Math.max(0, totalEnabled - totalRequired);

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start space-x-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-[#131B2E]">
            What student information would your school like to maintain?
          </h3>
          <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
            Select the information fields you need for your school's student directory. The system will dynamically
            tailor your import spreadsheet, validation rules, and ERP profile cards to your selection. You can adjust
            these fields anytime.
          </p>
        </div>
      </div>

      {/* Main Grid: Field Selection on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Grouped Field Selector (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Actions & Preset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={handleSelectStandard25}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Select Standard 25
              </button>
              <button
                type="button"
                onClick={handleSelectAll51}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Enable All 51
              </button>
              <button
                type="button"
                onClick={handleSelectAllActive}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                Enable All Active Fields
              </button>
              <button
                type="button"
                onClick={handleClearAllOptional}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
              >
                Clear All Optional
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsManageDrawerOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Custom ({config.customFields?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomField(null);
                  setIsCustomModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Field</span>
              </button>
            </div>
          </div>

          {allCategories.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.id] || Sparkles;
            const fields = getFieldsByCategory(cat.id, config.customFields);
            const isExpanded = expandedCategories[cat.id] ?? false;
            const selectedInCat = fields.filter((f) => enabledFields.includes(f.key)).length;
            const isCustomSection = cat.order > 7;

            return (
              <div
                key={cat.id}
                className={`bg-white border rounded-2xl overflow-hidden transition shadow-2xs hover:border-[#CBD5E1] ${
                  isCustomSection ? 'border-purple-200/80 bg-purple-50/20' : 'border-[#E2E8F0]'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCustomSection ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-[#4338CA]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-[#131B2E]">{cat.title}</h4>
                        {isCustomSection && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-800 uppercase">
                            Custom Section
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#475569]">
                          {selectedInCat} / {fields.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => handleSelectAllCategory(cat.id, e)}
                      className="text-[11px] font-bold text-indigo-700 hover:underline px-1.5 py-0.5 rounded-sm"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleClearCategory(cat.id, e)}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded-sm"
                    >
                      Clear
                    </button>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Field List */}
                {isExpanded && (
                  <div className="border-t border-[#E2E8F0] p-4 bg-slate-50/40 divide-y divide-slate-200/60">
                    {fields.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        No fields in this section yet.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomField(null);
                            setIsCustomModalOpen(true);
                          }}
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          Add a custom field
                        </button>
                      </div>
                    ) : (
                      fields.map((field) => {
                        const isEnabled = enabledFields.includes(field.key);
                        const isRequired = requiredFields.includes(field.key) || field.lockedRequired;

                        return (
                          <div
                            key={field.key}
                            onClick={() => handleToggleField(field)}
                            className={`py-2.5 px-3 flex items-center justify-between rounded-xl transition cursor-pointer select-none ${
                              isEnabled ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-100/60'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="text-indigo-600 shrink-0">
                                {isEnabled ? (
                                  <CheckSquare className="w-4 h-4" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span
                                    className={`text-xs font-bold ${
                                      isEnabled ? 'text-[#131B2E]' : 'text-[#64748B]'
                                    }`}
                                  >
                                    {field.label}
                                  </span>
                                  {field.isCustom && (
                                    <span className="flex items-center text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm uppercase">
                                      Custom #{field.templateOrder}
                                    </span>
                                  )}
                                  {field.lockedRequired && (
                                    <span className="flex items-center text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-sm uppercase">
                                      <Lock className="w-2.5 h-2.5 mr-0.5" />
                                      ★ Locked Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#64748B] truncate max-w-[280px]">
                                  {field.description}
                                </p>
                              </div>
                            </div>

                            {/* Required vs Optional Switch */}
                            {isEnabled && (
                              <div className="shrink-0 ml-2">
                                {field.lockedRequired ? (
                                  <span
                                    title="Permanently mandatory institutional identifier"
                                    className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-md flex items-center shadow-2xs"
                                  >
                                    <Lock className="w-3 h-3 mr-1 text-rose-600" />
                                    ★ Required
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleRequired(field, e)}
                                    aria-label={`Toggle requirement for ${field.label}`}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                      isRequired
                                        ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isRequired ? '★ Required' : 'Optional'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Student Numbering Subsection */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
              <Hash className="w-4 h-4 text-indigo-700" />
              <div>
                <h4 className="font-bold text-sm text-[#131B2E]">Student Numbering & Identification Rules</h4>
                <p className="text-[11px] text-[#64748B]">
                  Patterns for automated admission numbers and roll codes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-xs text-[#334155] mb-1">
                  Admission Number Pattern *
                </label>
                <input
                  type="text"
                  value={config.admissionNumberFormat || 'ADM-{{YEAR}}-{{NUM}}'}
                  onChange={(e) => onUpdateConfig({ admissionNumberFormat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] font-mono hover:border-[#CBD5E1] focus:border-indigo-600 focus:outline-hidden"
                  placeholder="ADM-{{YEAR}}-{{NUM}}"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Sequential admission code used for incoming students.
                </p>
              </div>

              <div>
                <label className="block font-bold text-xs text-[#334155] mb-1">
                  Roll Number Convention
                </label>
                <select
                  value={config.rollNumberSystem || 'section_wise'}
                  onChange={(e) => onUpdateConfig({ rollNumberSystem: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-indigo-600 focus:outline-hidden"
                >
                  <option value="section_wise">Section-wise (e.g. 1 to 40 per section)</option>
                  <option value="class_wise">Class-wise (Continuous across sections)</option>
                  <option value="alphabetical">Alphabetical sorting by student name</option>
                  <option value="manual">Manual / Pre-assigned in spreadsheet</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  How student roll numbers are sequenced within grades.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Record Preview Card (5 Cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <StudentRecordPreviewCard
            enabledFields={enabledFields}
            schoolName={schoolName}
            admissionNumberFormat={config.admissionNumberFormat}
            studentIdFormat={config.studentIdFormat}
            customFields={config.customFields}
            customSections={config.customSections}
          />

          {/* Quick Action Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#131B2E]">
              <span>Configuration Summary</span>
              <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px]">
                {totalEnabled} Fields Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                <span className="text-[10px] text-[#64748B] block">Mandatory</span>
                <span className="font-bold text-rose-700 text-sm">{totalRequired} fields</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                <span className="text-[10px] text-[#64748B] block">Optional</span>
                <span className="font-bold text-slate-700 text-sm">{totalOptional} fields</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onContinueToTemplate}
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
            >
              <span>Continue to Import Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Field Modal */}
      <CustomFieldModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setEditingCustomField(null);
        }}
        onSave={handleSaveCustomField}
        editingField={editingCustomField}
        existingFields={config.customFields}
        customSections={config.customSections}
        students={config.students}
      />

      {/* Manage Custom Fields Drawer */}
      <ManageCustomFieldsDrawer
        isOpen={isManageDrawerOpen}
        onClose={() => setIsManageDrawerOpen(false)}
        customFields={config.customFields || []}
        students={config.students}
        onOpenCreateModal={() => {
          setIsManageDrawerOpen(false);
          setEditingCustomField(null);
          setIsCustomModalOpen(true);
        }}
        onOpenEditModal={(field: StudentCustomFieldDefinition) => {
          setIsManageDrawerOpen(false);
          setEditingCustomField(field);
          setIsCustomModalOpen(true);
        }}
        onToggleStatus={handleToggleCustomFieldActive}
        onDeleteField={handleDeleteCustomField}
        onReorderFields={handleReorderCustomFields}
      />
    </div>
  );
}
