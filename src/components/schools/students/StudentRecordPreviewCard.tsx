'use client';

import React from 'react';
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Bus,
  Sparkles,
  FileCheck,
  Eye,
  FileText,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import { getStudentFieldDefinition, getSelectedFieldDefinitions } from '@/lib/studentFieldDefinitions';
import type { StudentCustomFieldDefinition, StudentCustomSection } from '@/lib/types';

export interface StudentRecordPreviewCardProps {
  enabledFields: string[];
  schoolName?: string;
  admissionNumberFormat?: string;
  studentIdFormat?: string;
  customFields?: StudentCustomFieldDefinition[];
  customSections?: StudentCustomSection[];
}

export default function StudentRecordPreviewCard({
  enabledFields,
  schoolName = 'Demo Public School',
  admissionNumberFormat = 'ADM-2026-0101',
  studentIdFormat = 'STD-2026-0101',
  customFields,
  customSections,
}: StudentRecordPreviewCardProps) {
  const isEnabled = (key: string) => enabledFields.includes(key);
  const selectedDefs = getSelectedFieldDefinitions(enabledFields, customFields);

  const docCount = selectedDefs.filter((d) => d.category === 'documents').length;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs transition-all hover:shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#131B2E]">Student Record Preview</h4>
            <p className="text-[11px] text-[#64748B]">Follows canonical Excel import logical order</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
          {enabledFields.length} Fields Configured
        </span>
      </div>

      {/* Main Student Card Container */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-linear-to-b from-indigo-50/40 via-white to-slate-50/60 p-4 space-y-3.5">
        {/* School Header */}
        <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2.5">
          <div>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#64748B] block">
              INSTITUTIONAL MASTER RECORD
            </span>
            <span className="text-xs font-black text-[#131B2E] truncate max-w-[200px] block">
              {schoolName}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Active Roster
          </span>
        </div>

        {/* ===================================================================
            1. SECTION 1 — ACADEMIC & ADMISSION INFORMATION
            =================================================================== */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center space-x-1.5 text-indigo-700 border-b border-slate-100 pb-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase">
              1. Academic & Admission
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {isEnabled('admission_number') && (
              <div className="p-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                <span className="text-[9px] font-bold text-indigo-800 block">Admission Number</span>
                <span className="font-mono font-bold text-indigo-950 text-xs">
                  {admissionNumberFormat || 'ADM-2026-0101'}
                </span>
              </div>
            )}

            {isEnabled('admission_date') && (
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] text-[#64748B] block">Admission Date</span>
                <span className="font-medium text-[#131B2E] text-xs">02/04/2026</span>
              </div>
            )}

            {isEnabled('academic_year') && (
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] text-[#64748B] block">Academic Session</span>
                <span className="font-medium text-[#131B2E] text-xs">2026-2027</span>
              </div>
            )}

            {(isEnabled('class_grade') || isEnabled('section')) && (
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] text-[#64748B] block">Class & Section</span>
                <span className="font-bold text-[#131B2E] text-xs">
                  {isEnabled('class_grade') ? 'Class 5' : ''}
                  {isEnabled('section') ? ' — Sec A' : ''}
                </span>
              </div>
            )}

            {isEnabled('roll_number') && (
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] text-[#64748B] block">Roll Number</span>
                <span className="font-mono font-bold text-[#131B2E] text-xs">01</span>
              </div>
            )}

            {isEnabled('previous_school') && (
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 col-span-2">
                <span className="text-[9px] text-[#64748B] block">Previous School</span>
                <span className="font-medium text-[#131B2E] text-xs truncate block">
                  St. Xavier High School (Class 4)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================
            2. SECTION 2 — PERSONAL INFORMATION
            =================================================================== */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center space-x-1.5 text-indigo-700 border-b border-slate-100 pb-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase">
              2. Personal Information
            </span>
          </div>

          <div className="flex items-start space-x-3">
            {/* Photo slot */}
            {isEnabled('photo') ? (
              <div className="w-14 h-16 rounded-lg bg-indigo-50 border border-indigo-200 shrink-0 flex flex-col items-center justify-center text-indigo-600 overflow-hidden shadow-2xs relative">
                <User className="w-7 h-7 opacity-75" />
                <span className="text-[7px] font-bold uppercase tracking-wider text-indigo-700 bg-white/90 px-1 py-0.2 rounded-xs mt-0.5">
                  PHOTO
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                <User className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1">
              <h5 className="text-sm font-black text-[#131B2E] truncate">
                {isEnabled('student_name') ? 'Aarav Kumar' : 'Student Name'}
              </h5>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {isEnabled('dob') && (
                  <div className="flex items-center space-x-1 text-[#475569]">
                    <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>15/04/2015</span>
                  </div>
                )}
                {isEnabled('gender') && (
                  <div className="flex items-center space-x-1 text-[#475569]">
                    <span className="font-semibold">Gender:</span>
                    <span>Male</span>
                  </div>
                )}
                {isEnabled('blood_group') && (
                  <div className="flex items-center space-x-1 text-rose-700 font-bold">
                    <Shield className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>O+</span>
                  </div>
                )}
                {isEnabled('nationality') && (
                  <div className="text-[#475569] truncate">
                    <span className="font-semibold">Nationality:</span> Indian
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3. SECTION 3 — PARENT / GUARDIAN INFORMATION
            =================================================================== */}
        {(isEnabled('father_name') ||
          isEnabled('father_phone') ||
          isEnabled('mother_name') ||
          isEnabled('guardian_name')) && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center space-x-1.5 text-indigo-700 border-b border-slate-100 pb-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">
                3. Parent / Guardian
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {isEnabled('father_name') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">Father</span>
                  <span className="font-bold text-[#131B2E] truncate block">Rajesh Kumar</span>
                </div>
              )}
              {isEnabled('father_phone') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">Contact</span>
                  <span className="font-mono font-bold text-[#131B2E]">9876543210</span>
                </div>
              )}
              {isEnabled('mother_name') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">Mother</span>
                  <span className="font-medium text-[#131B2E] truncate block">Sunita Kumar</span>
                </div>
              )}
              {isEnabled('mother_phone') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">Mother Contact</span>
                  <span className="font-mono text-[#131B2E]">9876543211</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            4. SECTION 4 — RESIDENTIAL ADDRESS
            =================================================================== */}
        {isEnabled('address') && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-indigo-700 border-b border-slate-100 pb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">
                4. Residential Address
              </span>
            </div>
            <p className="text-xs font-medium text-[#131B2E] leading-relaxed">
              14/B Gandhi Chowk, Station Road
              {isEnabled('city') ? ', Motihari' : ''}
              {isEnabled('state') ? ', Bihar' : ''}
              {isEnabled('pincode') ? ' — 845401' : ''}
            </p>
          </div>
        )}

        {/* ===================================================================
            5. SECTION 5 — EMERGENCY INFORMATION
            =================================================================== */}
        {isEnabled('emergency_contact_name') && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-rose-700 border-b border-slate-100 pb-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">
                5. Emergency Contact
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#131B2E]">Dr. S. K. Verma</span>
              {isEnabled('emergency_contact_number') && (
                <span className="font-mono font-bold text-rose-800">9431234567</span>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            6. SECTION 6 — ADDITIONAL INFORMATION
            =================================================================== */}
        {(isEnabled('house') || isEnabled('transport_required') || isEnabled('identification_number')) && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center space-x-1.5 text-indigo-700 border-b border-slate-100 pb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">
                6. Additional Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {isEnabled('house') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">House</span>
                  <span className="font-bold text-[#131B2E]">Tagore (Red)</span>
                </div>
              )}
              {isEnabled('transport_required') && (
                <div>
                  <span className="text-[9px] text-[#64748B] block">Transport</span>
                  <span className="font-bold text-[#131B2E]">Bus Route 3</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            7. SECTION 7 — CERTIFICATES & DOCUMENTS
            =================================================================== */}
        {docCount > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-[10px] uppercase">
              <FileText className="w-3.5 h-3.5" />
              <span>7. Documents ({docCount} enabled)</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-sm">
              Attached separately
            </span>
          </div>
        )}

        {/* ===================================================================
            8. CUSTOM FIELDS (Orders 52+)
            =================================================================== */}
        {selectedDefs.some((d) => d.isCustom) && (
          <div className="bg-slate-50 border border-purple-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom & School Specific Fields ({selectedDefs.filter((d) => d.isCustom).length})</span>
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                Orders 52+
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              {selectedDefs
                .filter((d) => d.isCustom)
                .map((field) => (
                  <div key={field.key} className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#64748B] block truncate" title={field.label}>
                        {field.label}
                      </span>
                      <span className="text-[8px] font-mono text-purple-600 bg-purple-50 px-1 rounded">
                        #{field.templateOrder}
                      </span>
                    </div>
                    <span className="font-bold text-[#131B2E] text-[11px] truncate block">
                      {field.sampleValue || (field.dataType === 'select' ? (field.options?.[0] || 'Option') : field.dataType === 'boolean' ? 'Yes' : 'Sample Value')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Verification Footer */}
        <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[10px] text-[#64748B]">
          <span className="flex items-center">
            <FileCheck className="w-3 h-3 text-emerald-600 mr-1" />
            Verified Schema Order
          </span>
          <span className="font-mono text-[9px] text-[#94A3B8]">
            CANONICAL-1..51 {selectedDefs.some((d) => d.isCustom) ? `+ CUSTOM-${selectedDefs.filter((d) => d.isCustom).length}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
