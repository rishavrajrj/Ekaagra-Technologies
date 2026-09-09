'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  Phone,
  Mail,
  Link2,
  ListFilter,
  CheckSquare,
  ToggleLeft,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import type {
  StudentCustomFieldDefinition,
  StudentCustomSection,
  StudentCustomFieldType,
  Student,
} from '@/lib/types';
import {
  STUDENT_FIELD_CATEGORIES,
  generateCustomFieldKey,
} from '@/lib/studentFieldDefinitions';
import {
  validateCustomFieldName,
  canChangeCustomFieldType,
} from '@/lib/studentCustomFieldService';

export interface CustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: Partial<StudentCustomFieldDefinition>, newSection?: Partial<StudentCustomSection>) => Promise<boolean | void>;
  editingField?: StudentCustomFieldDefinition | null;
  existingFields?: StudentCustomFieldDefinition[];
  customSections?: StudentCustomSection[];
  students?: Student[];
  isSaving?: boolean;
}

const FIELD_TYPES: Array<{
  type: StudentCustomFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'text', label: 'Single-line Text', description: 'Names, codes, short text', icon: Type },
  { type: 'long_text', label: 'Long Text', description: 'Paragraphs, notes, comments', icon: AlignLeft },
  { type: 'number', label: 'Number', description: 'Numeric values, scores, counts', icon: Hash },
  { type: 'date', label: 'Date', description: 'Calendar date (DD/MM/YYYY)', icon: Calendar },
  { type: 'phone', label: 'Phone Number', description: '10-digit mobile number', icon: Phone },
  { type: 'email', label: 'Email Address', description: 'Valid email address', icon: Mail },
  { type: 'url', label: 'Website / URL', description: 'Web link with validation', icon: Link2 },
  { type: 'dropdown', label: 'Dropdown List', description: 'Single select option from list', icon: ListFilter },
  { type: 'multi_select', label: 'Multi-select List', description: 'Multiple selectable options', icon: CheckSquare },
  { type: 'yes_no', label: 'Yes / No', description: 'Binary boolean switch', icon: ToggleLeft },
  { type: 'image', label: 'Student Image', description: 'Student portrait or photo upload', icon: ImageIcon },
  { type: 'file', label: 'File / Document', description: 'PDF or document attachment', icon: FileText },
];

export default function CustomFieldModal({
  isOpen,
  onClose,
  onSave,
  editingField,
  existingFields = [],
  customSections = [],
  students = [],
  isSaving = false,
}: CustomFieldModalProps) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<StudentCustomFieldType>('text');
  const [sectionKey, setSectionKey] = useState<string>('personal');
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [minLength, setMinLength] = useState<string>('');
  const [maxLength, setMaxLength] = useState<string>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingField);

  // Initialize form state
  useEffect(() => {
    if (editingField) {
      setFieldName(editingField.field_name);
      setFieldType(editingField.field_type);
      setSectionKey(editingField.section_key || 'personal');
      setIsRequired(editingField.is_required);
      setOptions(editingField.options && editingField.options.length > 0 ? [...editingField.options] : ['Option 1', 'Option 2']);
      setDefaultValue(editingField.default_value ? String(editingField.default_value) : '');
      setPlaceholder(editingField.placeholder || '');
      setHelpText(editingField.help_text || '');
      setMinLength(editingField.validation_rules?.min_length !== undefined ? String(editingField.validation_rules.min_length) : '');
      setMaxLength(editingField.validation_rules?.max_length !== undefined ? String(editingField.validation_rules.max_length) : '');
      setMinValue(editingField.validation_rules?.min_value !== undefined ? String(editingField.validation_rules.min_value) : '');
      setMaxValue(editingField.validation_rules?.max_value !== undefined ? String(editingField.validation_rules.max_value) : '');
      setIsCreatingNewSection(false);
      setNewSectionName('');
      setError(null);
    } else {
      setFieldName('');
      setFieldType('text');
      setSectionKey('personal');
      setIsRequired(false);
      setOptions(['Option 1', 'Option 2']);
      setDefaultValue('');
      setPlaceholder('');
      setHelpText('');
      setMinLength('');
      setMaxLength('');
      setMinValue('');
      setMaxValue('');
      setIsCreatingNewSection(false);
      setNewSectionName('');
      setError(null);
    }
  }, [editingField, isOpen]);

  // Live generated key preview
  const generatedKey = useMemo(() => {
    if (editingField) return editingField.field_key;
    if (!fieldName.trim()) return 'custom_field_key';
    return generateCustomFieldKey(
      fieldName,
      existingFields.map((f) => f.field_key)
    );
  }, [fieldName, editingField, existingFields]);

  // Check if type change is blocked due to existing student records
  const typeChangeCheck = useMemo(() => {
    if (!editingField) return { canChange: true };
    return canChangeCustomFieldType(editingField.field_key, editingField.field_type, fieldType, students);
  }, [editingField, fieldType, students]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Option "${trimmed}" already exists.`);
      return;
    }
    setOptions([...options, trimmed]);
    setNewOptionInput('');
    setError(null);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      setError('Dropdown fields require at least one option.');
      return;
    }
    setOptions(options.filter((_, idx) => idx !== index));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Name
    const nameVal = validateCustomFieldName(
      fieldName,
      isEditing ? existingFields.filter((f) => f.id !== editingField!.id) : existingFields
    );
    if (!nameVal.valid) {
      setError(nameVal.error || 'Invalid field name.');
      return;
    }

    // Validate type change
    if (!typeChangeCheck.canChange) {
      setError(typeChangeCheck.message || 'Cannot change field type.');
      return;
    }

    // Validate dropdown / multi_select options
    if ((fieldType === 'dropdown' || fieldType === 'multi_select') && options.length === 0) {
      setError('Dropdown fields require at least one option.');
      return;
    }

    // Handle section
    let resolvedSectionKey = sectionKey;
    let resolvedSectionName = '';
    let newSectionData: Partial<StudentCustomSection> | undefined;

    if (isCreatingNewSection) {
      const trimmedSection = newSectionName.trim();
      if (!trimmedSection) {
        setError('Custom section name is required.');
        return;
      }
      resolvedSectionKey = `custom_${trimmedSection.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
      resolvedSectionName = trimmedSection;
      newSectionData = {
        section_key: resolvedSectionKey,
        section_name: resolvedSectionName,
        display_order: 8 + customSections.length,
        is_active: true,
      };
    } else {
      const canonical = STUDENT_FIELD_CATEGORIES.find((c) => c.id === sectionKey);
      if (canonical) {
        resolvedSectionName = canonical.title;
      } else {
        const customSec = customSections.find((s) => s.section_key === sectionKey);
        resolvedSectionName = customSec?.section_name || 'Additional Information';
      }
    }

    // Validation rules
    const validation_rules: Record<string, any> = {};
    if (minLength) validation_rules.min_length = parseInt(minLength, 10);
    if (maxLength) validation_rules.max_length = parseInt(maxLength, 10);
    if (minValue) validation_rules.min_value = parseFloat(minValue);
    if (maxValue) validation_rules.max_value = parseFloat(maxValue);

    const payload: Partial<StudentCustomFieldDefinition> = {
      ...(editingField ? { id: editingField.id } : {}),
      field_name: fieldName.trim(),
      field_type: fieldType,
      section_key: resolvedSectionKey,
      section_name: resolvedSectionName,
      is_required: isRequired,
      is_active: true,
      options: fieldType === 'dropdown' || fieldType === 'multi_select' ? options : [],
      default_value: defaultValue.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      help_text: helpText.trim() || undefined,
      validation_rules,
    };

    const res = await onSave(payload, newSectionData);
    if (res !== false) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131B2E]">
                {isEditing ? 'Edit Custom Student Field' : 'Add Custom Student Field'}
              </h2>
              <p className="text-xs text-[#64748B]">
                Extend student records while preserving the canonical 51 system fields.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* 1. Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Basic Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#131B2E] mb-1">
                Field Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. Sibling Name, Scholarship ID, House Name"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                The human-readable label displayed across student forms, templates, and profile views.
              </p>
            </div>

            {/* Auto-generated Field Key Preview */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Database Identifier (Auto-generated)
                </span>
                <code className="text-xs font-mono font-bold text-indigo-700">{generatedKey}</code>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Permanent snake_case
              </span>
            </div>
          </div>

          {/* 2. Field Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Field Type
              </h3>
              {!typeChangeCheck.canChange && (
                <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Lock className="w-3 h-3" />
                  <span>Type Locked (Contains Data)</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FIELD_TYPES.map((ft) => {
                const Icon = ft.icon;
                const isSelected = fieldType === ft.type;
                const isBlocked = !typeChangeCheck.canChange && isEditing && ft.type !== editingField?.field_type;

                return (
                  <button
                    key={ft.type}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => {
                      if (!isBlocked) setFieldType(ft.type);
                    }}
                    className={`flex items-start space-x-2.5 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-600/10'
                        : isBlocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-[#131B2E]'}`}>
                        {ft.label}
                      </div>
                      <div className="text-[10px] text-[#64748B] truncate mt-0.5">{ft.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown Options Builder (if type === dropdown or multi_select) */}
          {(fieldType === 'dropdown' || fieldType === 'multi_select') && (
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950">
                  Dropdown Options <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-indigo-700">
                  {options.length} options defined (will appear in Excel dropdowns)
                </span>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Type an option and press Enter..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {options.map((opt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-900 shadow-2xs"
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Section Assignment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Section Assignment
            </h3>

            {!isCreatingNewSection ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#131B2E]">
                  Assign to Section
                </label>
                <select
                  value={sectionKey}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setIsCreatingNewSection(true);
                    } else {
                      setSectionKey(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <optgroup label="Canonical System Sections (1–7)">
                    {STUDENT_FIELD_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.order}. {cat.title}
                      </option>
                    ))}
                  </optgroup>
                  {customSections.length > 0 && (
                    <optgroup label="Custom School Sections (8+)">
                      {customSections.map((sec) => (
                        <option key={sec.section_key} value={sec.section_key}>
                          {sec.display_order}. {sec.section_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__new__">+ Create New Section...</option>
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#131B2E]">
                    New Custom Section Name <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewSection(false)}
                    className="text-xs text-indigo-700 hover:underline font-semibold"
                  >
                    Cancel / Pick Existing
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Scholarship Information, Hosteler Details"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <p className="text-[11px] text-[#64748B]">
                  Will appear as Section {8 + customSections.length} following the 7 canonical sections.
                </p>
              </div>
            )}
          </div>

          {/* 4. Requirement & Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Validation & Configuration
            </h3>

            {/* Required Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-[#131B2E] block">Mandatory Field</span>
                <span className="text-[11px] text-[#64748B]">
                  Require this field during manual entry and flag missing cells during Excel import.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRequired(!isRequired)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isRequired ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isRequired ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Placeholder & Help Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#131B2E] mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="e.g. Enter sibling full name"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#131B2E] mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder="Optional default value"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#131B2E] mb-1">
                Help Text / Tooltip
              </label>
              <input
                type="text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="Explain the purpose of this field to school staff..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            {/* Validation Constraints for numbers and text */}
            {fieldType === 'number' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Minimum Number</label>
                  <input
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Maximum Number</label>
                  <input
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {(fieldType === 'text' || fieldType === 'long_text') && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Length</label>
                  <input
                    type="number"
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Length</label>
                  <input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Field' : 'Create Custom Field'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
