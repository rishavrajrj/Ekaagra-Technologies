'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  GraduationCap,
  Users,
  MapPin,
  ShieldAlert,
  Sparkles,
  FileText,
  Save,
  AlertCircle,
  Upload,
  Calendar,
} from 'lucide-react';
import type {
  Student,
  StudentConfigData,
  AcademicStructureData,
  StudentCustomFieldDefinition,
} from '@/lib/types';
import {
  STUDENT_FIELD_CATEGORIES,
  getAllStudentCategories,
  getSelectedFieldDefinitions,
  getStudentFieldDefinitions,
  StudentFieldDefinition,
} from '@/lib/studentFieldDefinitions';
import { extractListsOptions } from '@/lib/studentTemplateGenerator';

export interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Partial<Student>) => void;
  initialStudent?: Partial<Student> | null;
  config: StudentConfigData;
  academicStructure?: AcademicStructureData | null;
}

export default function StudentFormModal({
  isOpen,
  onClose,
  onSave,
  initialStudent,
  config,
  academicStructure,
}: StudentFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const listsData = extractListsOptions(academicStructure);
  const customFields: StudentCustomFieldDefinition[] = config.customFields || [];
  const enabledFieldKeys = config.enabledFields || [];
  const requiredFieldKeys = config.requiredFields || [];

  const allCategories = getAllStudentCategories(config.customSections);
  const activeDefinitions = getSelectedFieldDefinitions(enabledFieldKeys, customFields);

  useEffect(() => {
    if (initialStudent) {
      setFormData({
        admission_number: initialStudent.admission_number || '',
        student_name: initialStudent.first_name
          ? `${initialStudent.first_name} ${initialStudent.last_name || ''}`.trim()
          : '',
        dob: initialStudent.dob || '',
        gender: initialStudent.gender || 'Male',
        class_grade: (initialStudent as any).class_grade || listsData.classes[0] || '',
        section: (initialStudent as any).section || listsData.sections[0] || '',
        roll_number: initialStudent.roll_number || '',
        father_name: initialStudent.father_name || '',
        father_phone: initialStudent.father_phone || '',
        mother_name: initialStudent.mother_name || '',
        mother_phone: initialStudent.mother_phone || '',
        address: initialStudent.address || '',
        city: initialStudent.city || '',
        state: initialStudent.state || '',
        pincode: initialStudent.postal_code || '',
        blood_group: initialStudent.blood_group || '',
        religion: initialStudent.religion || '',
        nationality: initialStudent.nationality || 'Indian',
        emergency_contact_name: initialStudent.emergency_contact_name || '',
        emergency_contact_number: initialStudent.emergency_contact_phone || '',
        transport_required: initialStudent.transport_required ? 'Yes' : 'No',
        transport_route: initialStudent.transport_route || '',
      });
      setCustomFieldValues(initialStudent.custom_fields || (initialStudent.metadata as any)?.custom_fields || {});
    } else {
      setFormData({
        admission_number: '',
        student_name: '',
        dob: '',
        gender: 'Male',
        class_grade: listsData.classes[0] || 'Class 1',
        section: listsData.sections[0] || 'A',
        roll_number: '',
        nationality: 'Indian',
        transport_required: 'No',
      });
      setCustomFieldValues({});
    }
    setError(null);
  }, [initialStudent, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, value: any, isCustomField = false) => {
    if (isCustomField) {
      setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Required checks
    if (!formData['admission_number']?.trim()) {
      setError('Admission Number is mandatory.');
      return;
    }
    if (!formData['student_name']?.trim()) {
      setError('Student Name is mandatory.');
      return;
    }

    // Required custom fields check
    for (const cf of customFields) {
      if (cf.is_active && cf.is_required) {
        const val = customFieldValues[cf.field_key];
        if (val === undefined || val === null || String(val).trim().length === 0) {
          setError(`${cf.field_name} is required.`);
          return;
        }
      }
    }

    // Split name
    const nameParts = (formData['student_name'] || '').trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    const studentRecord: Partial<Student> = {
      ...(initialStudent?.id ? { id: initialStudent.id } : {}),
      admission_number: formData['admission_number'].trim(),
      first_name: firstName,
      last_name: lastName,
      dob: formData['dob'] || null,
      gender: (formData['gender'] || 'other').toLowerCase() as any,
      blood_group: formData['blood_group'] || null,
      nationality: formData['nationality'] || 'Indian',
      religion: formData['religion'] || null,
      address: formData['address'] || null,
      city: formData['city'] || null,
      state: formData['state'] || null,
      postal_code: formData['pincode'] || null,
      roll_number: formData['roll_number'] || null,
      father_name: formData['father_name'] || null,
      father_phone: formData['father_phone'] || null,
      mother_name: formData['mother_name'] || null,
      mother_phone: formData['mother_phone'] || null,
      emergency_contact_name: formData['emergency_contact_name'] || null,
      emergency_contact_phone: formData['emergency_contact_number'] || null,
      transport_required: formData['transport_required'] === 'Yes',
      transport_route: formData['transport_route'] || null,
      custom_fields: customFieldValues,
      metadata: {
        custom_fields: customFieldValues,
      },
    };

    onSave(studentRecord);
    onClose();
  };

  // Render individual control based on field definition and type
  const renderFieldInput = (def: StudentFieldDefinition) => {
    const isCustom = def.isCustom === true;
    const value = isCustom ? (customFieldValues[def.key] ?? '') : (formData[def.key] ?? '');
    const isRequired = requiredFieldKeys.includes(def.key) || def.lockedRequired;

    // Custom Dropdown / Options
    if (def.allowedOptions && def.allowedOptions.length > 0) {
      return (
        <select
          value={value}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        >
          <option value="">— Select {def.label} —</option>
          {def.allowedOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (def.dataType === 'boolean') {
      return (
        <select
          value={value || 'No'}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (def.dataType === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        />
      );
    }

    if (def.dataType === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          placeholder={def.formatInstructions || 'Enter number'}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        />
      );
    }

    if (def.dataType === 'phone') {
      return (
        <input
          type="tel"
          value={value}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          placeholder="10-digit mobile number"
          maxLength={10}
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        />
      );
    }

    if (def.dataType === 'email') {
      return (
        <input
          type="email"
          value={value}
          onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
          placeholder="email@domain.com"
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
        />
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(def.key, e.target.value, isCustom)}
        placeholder={def.formatInstructions || `Enter ${def.label.toLowerCase()}`}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131B2E]">
                {initialStudent ? 'Edit Student Record' : 'Add New Student Record'}
              </h2>
              <p className="text-xs text-[#64748B]">
                Dynamic form reflecting your school's configured system and custom fields.
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

        {/* Form Body grouped by Section */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {allCategories.map((category) => {
            const categoryFields = activeDefinitions.filter((def) => {
              if (category.id === 'personal' && def.category === 'basic') return true;
              return def.category === category.id;
            });

            if (categoryFields.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-200/80">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center space-x-1.5">
                    <span>{category.order}. {category.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {categoryFields.length} active fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {categoryFields.map((def) => {
                    const isRequired = requiredFieldKeys.includes(def.key) || def.lockedRequired;

                    return (
                      <div key={def.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#131B2E] flex items-center space-x-1">
                            <span>{def.label}</span>
                            {isRequired && <span className="text-rose-600">*</span>}
                          </label>
                          {def.isCustom && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              Custom
                            </span>
                          )}
                        </div>
                        {renderFieldInput(def)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Student Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
