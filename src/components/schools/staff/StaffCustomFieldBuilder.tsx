'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  X,
  Layers,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Tag,
  AlertCircle,
} from 'lucide-react';
import type {
  StaffCustomField,
  StaffCustomFieldType,
  StaffCustomFieldCategory,
} from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import {
  STAFF_FIELD_CATEGORIES,
  generateSafeCustomFieldKey,
} from '@/lib/staffFieldDefinitions';
import {
  createStaffCustomFieldAction,
  updateStaffCustomFieldAction,
  deleteStaffCustomFieldAction,
  toggleStaffCustomFieldAction,
  reorderStaffCustomFieldsAction,
} from '@/app/staffActions';

export interface StaffCustomFieldBuilderProps {
  token?: string;
  customFields?: StaffCustomField[];
  onUpdateCustomFields: (fields: StaffCustomField[]) => void;
  disabled?: boolean;
}

const FIELD_TYPES: { type: StaffCustomFieldType; label: string; desc: string }[] = [
  { type: 'TEXT', label: 'Short Text', desc: 'Single line text (e.g. Employee Tag, Room #)' },
  { type: 'LONG_TEXT', label: 'Long Text', desc: 'Multi-line notes or remarks' },
  { type: 'NUMBER', label: 'Whole Number', desc: 'Integer values (e.g. Token number)' },
  { type: 'DECIMAL', label: 'Decimal Number', desc: 'Floating numbers (e.g. Metric score)' },
  { type: 'DATE', label: 'Date', desc: 'Calendar date (DD/MM/YYYY or YYYY-MM-DD)' },
  { type: 'BOOLEAN', label: 'Yes / No (Boolean)', desc: 'Toggle flag (e.g. CPR Certified)' },
  { type: 'PHONE', label: 'Phone Number', desc: 'Phone or contact number with validation' },
  { type: 'EMAIL', label: 'Email Address', desc: 'Email address with format validation' },
  { type: 'DROPDOWN', label: 'Single Select Dropdown', desc: 'Choose exactly one option from predefined choices' },
  { type: 'MULTI_SELECT', label: 'Multiple Select', desc: 'Select multiple options from a predefined list' },
  { type: 'DOCUMENT', label: 'Document File', desc: 'Certificate or credential document attachment' },
];

export default function StaffCustomFieldBuilder({
  token,
  customFields = [],
  onUpdateCustomFields,
  disabled = false,
}: StaffCustomFieldBuilderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<StaffCustomField | null>(null);

  // Form State
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [fieldType, setFieldType] = useState<StaffCustomFieldType>('TEXT');
  const [category, setCategory] = useState<StaffCustomFieldCategory>('custom');
  const [staffScope, setStaffScope] = useState<'TEACHING' | 'NON_TEACHING' | 'BOTH'>('BOTH');
  const [isRequired, setIsRequired] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [minVal, setMinVal] = useState<string>('');
  const [maxVal, setMaxVal] = useState<string>('');
  const [maxLength, setMaxLength] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Open modal for new field
  const handleOpenAdd = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldKey('');
    setIsKeyManuallyEdited(false);
    setFieldType('TEXT');
    setCategory('custom');
    setStaffScope('BOTH');
    setIsRequired(false);
    setIsActive(true);
    setDescription('');
    setOptions([]);
    setNewOptionInput('');
    setMinVal('');
    setMaxVal('');
    setMaxLength('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing field
  const handleOpenEdit = (field: StaffCustomField) => {
    setEditingField(field);
    setFieldLabel(field.field_label);
    setFieldKey(field.field_key);
    setIsKeyManuallyEdited(true);
    setFieldType(field.field_type);
    setCategory(field.category || 'custom');
    setStaffScope(field.staff_scope || 'BOTH');
    setIsRequired(Boolean(field.is_required));
    setIsActive(field.is_active !== false);
    setDescription(field.description || '');
    setOptions(
      Array.isArray(field.options)
        ? [...field.options]
        : Array.isArray(field.options_json)
        ? [...field.options_json]
        : []
    );
    setNewOptionInput('');
    const valObj = field.validation || field.validation_json || {};
    setMinVal(valObj.min !== undefined ? String(valObj.min) : '');
    setMaxVal(valObj.max !== undefined ? String(valObj.max) : '');
    setMaxLength(valObj.maxLength !== undefined ? String(valObj.maxLength) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Auto-generate key when label changes unless user manually edited key
  const handleLabelChange = (val: string) => {
    setFieldLabel(val);
    if (!isKeyManuallyEdited && !editingField) {
      const existingKeys = customFields.map((c) => c.field_key);
      setFieldKey(generateSafeCustomFieldKey(val, existingKeys));
    }
  };

  // Add option tag for dropdown
  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;

    const splitted = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...options, ...splitted]));
    setOptions(updated);
    setNewOptionInput('');
  };

  const handleRemoveOption = (optToRemove: string) => {
    setOptions(options.filter((o) => o !== optToRemove));
  };

  // Save Field Modal Submission
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) {
      setFormError('Field label is required.');
      return;
    }

    const safeKey = fieldKey.trim() || generateSafeCustomFieldKey(fieldLabel);

    // Validate unique key among other fields
    const duplicate = customFields.find(
      (c) => c.field_key === safeKey && (!editingField || c.id !== editingField.id)
    );
    if (duplicate) {
      setFormError(`Field key "${safeKey}" is already used by another custom field.`);
      return;
    }

    if ((fieldType === 'DROPDOWN' || fieldType === 'MULTI_SELECT') && options.length === 0) {
      setFormError('Please add at least one choice option for dropdown/multi-select.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const validation: any = {};
    if (minVal !== '') validation.min = parseFloat(minVal);
    if (maxVal !== '') validation.max = parseFloat(maxVal);
    if (maxLength !== '') validation.maxLength = parseInt(maxLength, 10);

    const payload: Partial<StaffCustomField> = {
      field_key: safeKey,
      field_label: fieldLabel.trim(),
      description: description.trim() || undefined,
      field_type: fieldType,
      category,
      staff_scope: staffScope,
      is_required: isRequired,
      is_active: isActive,
      options: options.length > 0 ? options : undefined,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
      display_order: editingField ? editingField.display_order : customFields.length + 1,
    };

    if (editingField) {
      // Update
      const updatedList = customFields.map((c) =>
        c.id === editingField.id ? ({ ...c, ...payload } as StaffCustomField) : c
      );
      onUpdateCustomFields(updatedList);

      if (token) {
        try {
          await updateStaffCustomFieldAction(token, editingField.id, payload);
        } catch (err) {
          console.warn('Custom field update action warning:', err);
        }
      }
    } else {
      // Create
      const newFieldId = `cf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newCustomField: StaffCustomField = {
        id: newFieldId,
        ...(payload as any),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedList = [...customFields, newCustomField];
      onUpdateCustomFields(updatedList);

      if (token) {
        try {
          const res = await createStaffCustomFieldAction(token, payload as any);
          if (res.field) {
            // update with real DB ID if returned
            const synchronized = updatedList.map((f) =>
              f.id === newFieldId ? res.field! : f
            );
            onUpdateCustomFields(synchronized);
          }
        } catch (err) {
          console.warn('Custom field create action warning:', err);
        }
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Delete Custom Field
  const handleDeleteField = async (field: StaffCustomField) => {
    if (!confirm(`Delete custom field "${field.field_label}"? Existing stored data for this field will remain in the database.`)) {
      return;
    }

    const updatedList = customFields.filter((c) => c.id !== field.id);
    onUpdateCustomFields(updatedList);

    if (token) {
      try {
        await deleteStaffCustomFieldAction(token, field.id);
      } catch (err) {
        console.warn('Delete field error:', err);
      }
    }
  };

  // Toggle Active
  const handleToggleActive = async (field: StaffCustomField) => {
    const newActive = !field.is_active;
    const updatedList = customFields.map((c) =>
      c.id === field.id ? { ...c, is_active: newActive } : c
    );
    onUpdateCustomFields(updatedList);

    if (token) {
      try {
        await toggleStaffCustomFieldAction(token, field.id, newActive);
      } catch (err) {
        console.warn('Toggle field error:', err);
      }
    }
  };

  // Move Field Up / Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= customFields.length) return;

    const list = [...customFields];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign display_order
    const reordered = list.map((f, idx) => ({ ...f, display_order: idx + 1 }));
    onUpdateCustomFields(reordered);

    if (token) {
      try {
        await reorderStaffCustomFieldsAction(
          token,
          reordered.map((f) => f.id)
        );
      } catch (err) {
        console.warn('Reorder fields error:', err);
      }
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Extensibility</span>
            </span>
            <span className="text-xs font-black text-[#131B2E]">
              Custom Staff Fields ({customFields.length})
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Create school-specific fields. Custom fields automatically adapt to Excel templates, bulk imports, profiles, and staff forms in canonical sequence.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={handleOpenAdd}
          className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Field List or Empty State */}
      {customFields.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-purple-200 bg-purple-50/30 space-y-2">
          <Layers className="w-8 h-8 text-purple-400 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">No Custom Fields Defined Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Does your school track specialized staff information like Bus Route, RFID Tag, Biometric ID, or CPR Certification? Click "Add Custom Field" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {customFields.map((field, index) => {
            const catInfo = STAFF_FIELD_CATEGORIES.find((c) => c.id === field.category);

            return (
              <div
                key={field.id}
                className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  field.is_active !== false
                    ? 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Left: Reorder & Info */}
                <div className="flex items-start space-x-3">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col space-y-0.5 mt-0.5">
                    <button
                      type="button"
                      disabled={index === 0 || disabled}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === customFields.length - 1 || disabled}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Field Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold text-[#131B2E]">
                        {field.field_label}
                      </span>
                      <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {field.field_key}
                      </code>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                        {field.field_type}
                      </span>
                      {field.is_required && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          Required
                        </span>
                      )}
                      {field.staff_scope && field.staff_scope !== 'BOTH' && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            field.staff_scope === 'TEACHING'
                              ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}
                        >
                          {field.staff_scope === 'TEACHING' ? 'Teaching Only' : 'Non-Teaching Only'}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#64748B]">
                      {field.description || `Mapped to category: ${catInfo?.title || 'Custom Information'}`}
                    </p>

                    {/* Show options badges for DROPDOWN / MULTI_SELECT */}
                    {(field.field_type === 'DROPDOWN' || field.field_type === 'MULTI_SELECT') && (
                      <div className="flex items-center space-x-1 flex-wrap pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400">Options:</span>
                        {(field.options || field.options_json || []).map((opt: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                  {/* Toggle Active */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggleActive(field)}
                    className={`flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      field.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {field.is_active !== false ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleOpenEdit(field)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Edit custom field"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDeleteField(field)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 transition cursor-pointer"
                    title="Delete custom field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <ModalPortal isOpen={isModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-[#131B2E]">
                  {editingField ? 'Edit Custom Staff Field' : 'Create Custom Staff Field'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveField} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Field Label */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Field Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fieldLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g. Bus Route Number, Blood Donor, PF UAN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Field Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    System Key (Database & Excel column key)
                  </label>
                  <span className="text-[10px] text-slate-400">Must be lowercase letters & underscores</span>
                </div>
                <input
                  type="text"
                  required
                  value={fieldKey}
                  onChange={(e) => {
                    setIsKeyManuallyEdited(true);
                    setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  }}
                  placeholder="e.g. cf_bus_route_number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Field Type & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as StaffCustomFieldType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.type} value={ft.type}>
                        {ft.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Section</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StaffCustomFieldCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {STAFF_FIELD_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Scope Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Scope</label>
                  <select
                    value={staffScope}
                    onChange={(e) => setStaffScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="BOTH">All Staff (Teaching & Non-Teaching)</option>
                    <option value="TEACHING">Teaching Staff Only</option>
                    <option value="NON_TEACHING">Non-Teaching Staff Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Help Text</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief guide for staff or admin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Options Input for Dropdown / Multi-Select */}
              {(fieldType === 'DROPDOWN' || fieldType === 'MULTI_SELECT') && (
                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <label className="block font-bold text-purple-900">
                    Predefined Options <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
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
                      placeholder="Type option and press Add or comma"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {options.map((opt) => (
                        <span
                          key={opt}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-white border border-purple-200 text-purple-900 text-xs font-semibold"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt)}
                            className="text-purple-400 hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Number Validation */}
              {(fieldType === 'NUMBER' || fieldType === 'DECIMAL') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Minimum Value (Optional)</label>
                    <input
                      type="number"
                      value={minVal}
                      onChange={(e) => setMinVal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Maximum Value (Optional)</label>
                    <input
                      type="number"
                      value={maxVal}
                      onChange={(e) => setMaxVal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* Checkboxes: Required & Active */}
              <div className="flex items-center space-x-6 pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-700">Mandatory / Required Field</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-700">Field is Active</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingField ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
