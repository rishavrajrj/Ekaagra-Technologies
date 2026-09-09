'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  X,
  ShieldCheck,
  Zap,
  GraduationCap,
  User,
  Users,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import type { StudentConfigData, AcademicStructureData } from '@/lib/types';
import {
  StudentFieldDefinition,
  StudentFieldCategory,
  STUDENT_FIELD_CATEGORIES,
  getSelectedFieldDefinitions,
} from '@/lib/studentFieldDefinitions';
import {
  generateStudentExcelBuffer,
  generateStudentCsvTemplate,
  generateSampleStudentCsv,
  extractListsOptions,
} from '@/lib/studentTemplateGenerator';

export interface StudentTemplateStageProps {
  config: StudentConfigData;
  schoolName?: string;
  academicStructure?: AcademicStructureData | null;
  onBackToFields: () => void;
  onProceedToUpload: () => void;
}

const CATEGORY_SECTION_NAMES: Record<StudentFieldCategory, string> = {
  academic: 'ACADEMIC & ADMISSION',
  personal: 'PERSONAL INFORMATION',
  basic: 'PERSONAL INFORMATION',
  parent: 'PARENT / GUARDIAN',
  address: 'RESIDENTIAL ADDRESS',
  emergency: 'EMERGENCY INFORMATION',
  additional: 'ADDITIONAL INFORMATION',
  documents: 'CERTIFICATES & DOCUMENTS',
};

export default function StudentTemplateStage({
  config,
  schoolName = 'Demo Public School',
  academicStructure,
  onBackToFields,
  onProceedToUpload,
}: StudentTemplateStageProps) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const enabledFields = config.enabledFields || [];
  const requiredFields = config.requiredFields || [];
  const requiredSet = useMemo(() => new Set(requiredFields), [requiredFields]);

  // Selected definitions strictly ordered by canonical templateOrder
  const selectedDefs: StudentFieldDefinition[] = useMemo(
    () => getSelectedFieldDefinitions(enabledFields, config.customFields),
    [enabledFields, config.customFields]
  );

  // Group selected fields by canonical category + custom sections
  const groupedFields = useMemo(() => {
    const groups: { categoryId: string; title: string; fields: StudentFieldDefinition[] }[] = [];
    const catMap = new Map<string, StudentFieldDefinition[]>();

    selectedDefs.forEach((def) => {
      const catKey = def.category === 'basic' ? 'personal' : def.category;
      if (!catMap.has(catKey)) {
        catMap.set(catKey, []);
      }
      catMap.get(catKey)!.push(def);
    });

    STUDENT_FIELD_CATEGORIES.forEach((cat) => {
      const fields = catMap.get(cat.id);
      if (fields && fields.length > 0) {
        groups.push({
          categoryId: cat.id,
          title: CATEGORY_SECTION_NAMES[cat.id] || cat.title.toUpperCase(),
          fields,
        });
      }
    });

    // Custom sections
    if (config.customSections) {
      config.customSections.forEach((cs) => {
        const fields = catMap.get(cs.section_key);
        if (fields && fields.length > 0) {
          groups.push({
            categoryId: cs.section_key,
            title: cs.section_name.toUpperCase(),
            fields,
          });
        }
      });
    }

    // Any remaining custom categories
    catMap.forEach((fields, key) => {
      const isAlreadyGrouped = groups.some((g) => g.categoryId === key);
      if (!isAlreadyGrouped && fields.length > 0) {
        groups.push({
          categoryId: key,
          title: (key.replace(/_/g, ' ')).toUpperCase(),
          fields,
        });
      }
    });

    return groups;
  }, [selectedDefs, config.customSections]);

  // Trigger Excel download
  const handleDownloadExcel = () => {
    setDownloadingFormat('xlsx');
    try {
      const buffer = generateStudentExcelBuffer({
        enabledFields,
        requiredFields,
        academicStructure,
        schoolName,
        admissionNumberFormat: config.admissionNumberFormat,
        customFields: config.customFields,
      });

      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Student_Import_Template_${(schoolName || 'School').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Excel template:', err);
      alert('Failed to generate Excel template.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Trigger CSV download
  const handleDownloadCsv = (sample: boolean = false) => {
    setDownloadingFormat(sample ? 'sample-csv' : 'csv');
    try {
      const csvContent = sample
        ? generateSampleStudentCsv({
            enabledFields,
            requiredFields,
            academicStructure,
            customFields: config.customFields,
          })
        : generateStudentCsvTemplate({
            enabledFields,
            requiredFields,
            customFields: config.customFields,
          });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sample
        ? `Sample_Student_Roster_${(schoolName || 'School').replace(/[^a-zA-Z0-9]/g, '_')}.csv`
        : `Student_Import_Template_${(schoolName || 'School').replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate CSV template:', err);
      alert('Failed to generate CSV template.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Standardized Master Order Ready</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">Structured Student Import Workbook</h3>
          <p className="text-xs text-indigo-100/80 max-w-2xl leading-relaxed">
            We generated custom spreadsheet templates configured specifically for your school's {selectedDefs.length}{' '}
            selected fields, arranged in canonical logical order. Download your preferred format, fill in your student roster,
            and upload it in the next step.
          </p>
        </div>
      </div>

      {/* Structured Template Structure Preview Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Excel Template Structure Preview</h4>
              <p className="text-[11px] text-[#64748B]">
                Logical ordering of columns in your generated workbook ({selectedDefs.length} selected fields across {groupedFields.length} sections)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-800 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>Full Specifications Table</span>
          </button>
        </div>

        {/* Section Columns Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupedFields.map((group) => (
            <div
              key={group.categoryId}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-[10px] font-black tracking-wider text-indigo-800 uppercase">
                  {group.title}
                </span>
                <span className="text-[10px] font-bold text-[#64748B] bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                  {group.fields.length}
                </span>
              </div>
              <ul className="space-y-1">
                {group.fields.map((f) => {
                  const isReq = requiredSet.has(f.key) || f.lockedRequired;
                  return (
                    <li
                      key={f.key}
                      className="text-xs flex items-center justify-between py-0.5 text-[#334155]"
                    >
                      <span className="truncate pr-2 font-medium">{f.label}</span>
                      {f.lockedRequired ? (
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded-xs shrink-0">
                          ★ Locked
                        </span>
                      ) : isReq ? (
                        <span className="text-[9px] font-bold text-rose-600 shrink-0">★ Req</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Download Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Multi-Sheet Excel */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-[#131B2E]">Excel Workbook (.xlsx)</h4>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Professional 4-sheet workbook: <strong>Student Data</strong> (with freeze panes & dropdowns),{' '}
              <strong>Instructions & Rules</strong>, <strong>Sample Data</strong>, and <strong>Lists & Options</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>

        {/* Card 2: Clean CSV */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#131B2E]">CSV Template (.csv)</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Standard UTF-8 CSV strictly matching the same canonical field ordering for spreadsheet software or database exports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadCsv(false)}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV (.csv)</span>
          </button>
        </div>

        {/* Card 3: Sample Student Data */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#131B2E]">Sample Student Data</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Pre-filled spreadsheet with 3 realistic fictional Indian students following configured Academic Setup classes and sections.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadCsv(true)}
            disabled={downloadingFormat !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Student Photo Import & Optimization Guidance Box */}
      {enabledFields.includes('photo') && (
        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#131B2E]">Student Photo Import & Smart Optimization</h4>
              <p className="text-[11px] text-[#64748B]">Automated WebP compression and dimension standardization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-900 block">Recommended Format</span>
              <p className="text-[#64748B]">Clear passport-style JPG, PNG or WebP image. Maximum original size: 5 MB.</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-900 block">Filename Matching</span>
              <p className="text-[#64748B]">
                Name image files matching the admission number (e.g. <code>ADM-2026-0101.jpg</code>) or the photo name in your spreadsheet.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-1">
              <span className="font-bold text-indigo-900 block flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Automatic WebP Pipeline
              </span>
              <p className="text-[#64748B]">
                The system automatically corrects orientation, fits within 600×800px, compresses to WebP, and links to the student.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions Stepper */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBackToFields}
          className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-2 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Field Selection</span>
        </button>

        <button
          type="button"
          onClick={onProceedToUpload}
          className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-xs cursor-pointer"
        >
          <span>Proceed to Upload Students</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Template Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-sm text-[#131B2E]">Master Template Column Specifications</h4>
                  <p className="text-[11px] text-[#64748B]">Sorted by canonical logical order (1 to {selectedDefs.length})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-[#334155]">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Col</th>
                      <th className="p-2.5">Column Header</th>
                      <th className="p-2.5">Section Group</th>
                      <th className="p-2.5">Required Status</th>
                      <th className="p-2.5">Expected Format</th>
                      <th className="p-2.5">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDefs.map((def, idx) => {
                      const isReq = requiredSet.has(def.key) || def.lockedRequired;
                      const sectionLabel = CATEGORY_SECTION_NAMES[def.category] || def.category;

                      return (
                        <tr key={def.key} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center font-mono text-[11px] text-[#64748B]">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-[#131B2E]">
                            <div className="flex items-center space-x-1.5">
                              <span>{def.label}</span>
                              {def.isCustom && (
                                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-sm uppercase">
                                  Custom #{def.templateOrder}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-[11px] font-semibold text-indigo-900">
                            {sectionLabel}
                          </td>
                          <td className="p-2.5">
                            {def.lockedRequired ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                ★ Locked Required
                              </span>
                            ) : isReq ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                ★ Mandatory
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-[#475569]">{def.formatInstructions}</td>
                          <td className="p-2.5 font-mono text-[11px] text-indigo-900">{def.sampleValue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-[#64748B]">
                {selectedDefs.length} total columns generated in exact canonical sequence
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
