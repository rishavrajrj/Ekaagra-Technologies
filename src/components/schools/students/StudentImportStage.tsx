'use client';

import React, { useState, useRef, useMemo } from 'react';
import ModalPortal from '@/components/ui/ModalPortal';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Camera,
  RefreshCw,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Filter,
  Eye,
  Check,
  User,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import type { Student, StudentConfigData, AcademicStructureData } from '@/lib/types';
import {
  parseUploadedFileBuffer,
  matchHeadersWithFields,
  validateStudentRecords,
  generateErrorReportBuffer,
  FileValidationResult,
  StudentImportRow,
  HeaderMatchResult,
} from '@/lib/studentValidationService';
import { importStudentsAction } from '@/app/studentActions';
import {
  getStudentFieldDefinition,
  getSelectedFieldDefinitions,
} from '@/lib/studentFieldDefinitions';

export interface StudentImportStageProps {
  config: StudentConfigData;
  token: string;
  schoolName?: string;
  academicStructure?: AcademicStructureData | null;
  onBackToTemplate: () => void;
  onImportComplete: (students: Student[]) => void;
}

export default function StudentImportStage({
  config,
  token,
  schoolName,
  academicStructure,
  onBackToTemplate,
  onImportComplete,
}: StudentImportStageProps) {
  // Wizard flow states
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [isHeaderMappingOpen, setIsHeaderMappingOpen] = useState(false);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'update'>('skip');

  // Preview Filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'warning' | 'error'>('all');

  // Photo batch upload state
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{
    uploading: boolean;
    total: number;
    completed: number;
    currentName?: string;
  }>({ uploading: false, total: 0, completed: 0 });

  // Photo association map: admissionNumber (lowercase) -> { url, fileName, storageKey }
  const [associatedPhotos, setAssociatedPhotos] = useState<
    Record<string, { url: string; fileName: string; storageKey: string }>
  >({});

  // Final confirmation modal & import status
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const existingStudents = config.students || [];
  const existingAdmissionNumbers = useMemo(
    () => new Set(existingStudents.map((s) => (s.admission_number || '').toLowerCase()).filter(Boolean)),
    [existingStudents]
  );

  const selectedDefs = useMemo(
    () => getSelectedFieldDefinitions(config.enabledFields || [], config.customFields),
    [config.enabledFields, config.customFields]
  );

  // 1. Process Spreadsheet File
  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setCurrentFile(file);
    setValidationResult(null);
    setImportSummary(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { headers, rawRows } = parseUploadedFileBuffer(arrayBuffer, file.name);

      const enabledFields = config.enabledFields || [];
      const headerMatches = matchHeadersWithFields(headers, enabledFields, config.customFields);

      // Create initial mapping: fileHeader -> matchedFieldKey
      const initialMapping: Record<string, string> = {};
      headerMatches.forEach((m) => {
        if (m.matchedFieldKey) {
          initialMapping[m.fileHeader] = m.matchedFieldKey;
        }
      });
      setHeaderMapping(initialMapping);

      // Perform validation
      const result = validateStudentRecords(rawRows, initialMapping, {
        enabledFields,
        requiredFields: config.requiredFields || [],
        academicStructure,
        existingAdmissionNumbers,
        customFields: config.customFields,
      });

      result.fileName = file.name;
      result.headerMatches = headerMatches;
      setValidationResult(result);
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert(`Error reading file: ${err.message || 'Unsupported format or corrupted file.'}`);
      setCurrentFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Re-run validation when manual header mapping changes
  const handleHeaderMappingChange = (fileHeader: string, newFieldKey: string) => {
    if (!validationResult || !currentFile) return;

    const updatedMapping = { ...headerMapping, [fileHeader]: newFieldKey };
    setHeaderMapping(updatedMapping);

    const reValidated = validateStudentRecords(
      validationResult.rows.map((r) => r.rawValues),
      updatedMapping,
      {
        enabledFields: config.enabledFields || [],
        requiredFields: config.requiredFields || [],
        academicStructure,
        existingAdmissionNumbers,
        customFields: config.customFields,
      }
    );

    reValidated.fileName = currentFile.name;
    reValidated.headerMatches = validationResult.headerMatches;
    setValidationResult(reValidated);
  };

  // 2. Download Error Report
  const handleDownloadErrorReport = () => {
    if (!validationResult) return;
    const errorRows = validationResult.rows.filter((r) => r.status === 'error' || r.status === 'warning');
    if (errorRows.length === 0) return;

    const buffer = generateErrorReportBuffer(errorRows);
    const blob = new Blob([buffer as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Import_Errors_${currentFile?.name || 'report'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. Batch Photo Upload & Optimization
  const handleBatchPhotoUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setPhotoUploadProgress({
      uploading: true,
      total: fileList.length,
      completed: 0,
      currentName: fileList[0].name,
    });

    const newPhotoMap = { ...associatedPhotos };

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setPhotoUploadProgress((prev) => ({
        ...prev,
        completed: i,
        currentName: file.name,
      }));

      try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('file', file);
        formData.append('fileName', file.name);

        const res = await fetch('/api/school-assets/student-photo', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (json.success && json.asset) {
          const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
          // Store under cleaned base name and original filename for flexible matching
          newPhotoMap[baseName] = {
            url: json.asset.url,
            fileName: json.asset.fileName,
            storageKey: json.asset.storageKey,
          };
          newPhotoMap[file.name.toLowerCase()] = {
            url: json.asset.url,
            fileName: json.asset.fileName,
            storageKey: json.asset.storageKey,
          };
        }
      } catch (uploadErr) {
        console.warn(`Failed to upload photo ${file.name}:`, uploadErr);
      }
    }

    setAssociatedPhotos(newPhotoMap);
    setPhotoUploadProgress({
      uploading: false,
      total: fileList.length,
      completed: fileList.length,
    });
  };

  // 4. Final Import Action
  const handleExecuteImport = async () => {
    if (!validationResult) return;
    setIsImporting(true);

    try {
      // Filter out rows with hard errors
      const validRows = validationResult.rows.filter((r) => r.status !== 'error');

      // Attach any optimized photos by admission number or photo filename
      const finalStudents: Partial<Student>[] = validRows.map((row) => {
        const student = { ...row.studentData };
        const adm = (student.admission_number || '').toLowerCase();
        const photoRef = (row.photoFileName || '').toLowerCase();

        // Check matching photos
        const matchedPhoto = associatedPhotos[adm] || (photoRef ? associatedPhotos[photoRef] : undefined);
        if (matchedPhoto) {
          student.photo_url = matchedPhoto.url;
          student.photo_storage_path = matchedPhoto.storageKey;
        }

        return student;
      });

      const res = await importStudentsAction(token, finalStudents, duplicatePolicy);

      if (res.success) {
        setImportSummary({
          addedCount: res.addedCount,
          updatedCount: res.updatedCount,
          skippedCount: res.skippedCount,
          failedCount: res.failedCount,
        });
        setIsConfirmModalOpen(false);
      } else {
        alert(res.error || 'Failed to complete import.');
      }
    } catch (err: any) {
      console.error('Import action error:', err);
      alert(err.message || 'Error occurred during student import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for preview table
  const displayedRows = useMemo(() => {
    if (!validationResult) return [];
    if (activeFilter === 'all') return validationResult.rows;
    return validationResult.rows.filter((r) => r.status === activeFilter);
  }, [validationResult, activeFilter]);

  // If import completed successfully, show congratulatory master data view
  if (importSummary) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl font-black text-[#131B2E]">Student Master Data Imported Successfully</h3>
          <p className="text-xs text-[#64748B]">
            Your school's student roster has been validated, optimized, and securely recorded in the ERP system.
          </p>
        </div>

        {/* Results Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span className="text-[10px] uppercase font-bold block text-emerald-700">New Students Added</span>
            <span className="text-xl font-black">{importSummary.addedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
            <span className="text-[10px] uppercase font-bold block text-indigo-700">Records Updated</span>
            <span className="text-xl font-black">{importSummary.updatedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-[10px] uppercase font-bold block text-slate-500">Duplicates Skipped</span>
            <span className="text-xl font-black">{importSummary.skippedCount}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <span className="text-[10px] uppercase font-bold block text-rose-700">Failed Records</span>
            <span className="text-xl font-black">{importSummary.failedCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => {
              setValidationResult(null);
              setCurrentFile(null);
              setImportSummary(null);
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] cursor-pointer"
          >
            Import Another Roster File
          </button>

          <button
            type="button"
            onClick={() => onImportComplete(config.students || [])}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-2"
          >
            <span>Finish Student Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Upload Dropzone Area */}
      {!validationResult && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-10 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 shadow-2xs group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center transition group-hover:scale-105 shadow-xs">
              {isProcessingFile ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#131B2E]">
                {isProcessingFile ? 'Reading & Validating Student Records...' : 'Upload Student Information File'}
              </h4>
              <p className="text-xs text-[#64748B] max-w-sm">
                Drag and drop your completed <strong>.xlsx</strong> or <strong>.csv</strong> student spreadsheet, or
                click to browse files.
              </p>
            </div>

            <span className="text-[10px] font-mono text-indigo-700 bg-white border border-indigo-100 px-3 py-1 rounded-full font-bold shadow-2xs">
              Supports Excel (.xlsx) and CSV (UTF-8)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBackToTemplate}
              className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Template Download</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Validation Results & Review View */}
      {validationResult && (
        <div className="space-y-6">
          {/* Status Header Bar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-[#131B2E]">{validationResult.fileName}</h4>
                  <span className="text-[10px] font-mono text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                    {validationResult.totalDetected} Rows Detected
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Headers matched with your school's configured fields.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setValidationResult(null);
                  setCurrentFile(null);
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Choose Another File</span>
              </button>

              {validationResult.errorCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download Error Report</span>
                </button>
              )}
            </div>
          </div>

          {/* Header Mapping Review Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsHeaderMappingOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#131B2E] flex items-center space-x-2">
                    <span>Column Header Mapping</span>
                    <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {Object.keys(headerMapping).length} / {validationResult.headerMatches?.length || Object.keys(headerMapping).length} Mapped
                    </span>
                  </h5>
                  <p className="text-xs text-[#64748B]">
                    Verify or adjust how spreadsheet columns match your school's configured fields.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700">
                <span>{isHeaderMappingOpen ? 'Hide Mapping' : 'Review & Adjust'}</span>
                {isHeaderMappingOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isHeaderMappingOpen && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {/* Warning if mandatory fields missing */}
                {(!Object.values(headerMapping).includes('student_name') ||
                  !Object.values(headerMapping).includes('admission_number')) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Warning:</strong> Both <strong>Student Name</strong> and <strong>Admission Number</strong> must be mapped for records to import.
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[#64748B] font-bold">
                        <th className="py-2 px-3">Spreadsheet Column Header</th>
                        <th className="py-2 px-3">Match Confidence</th>
                        <th className="py-2 px-3">ERP Field Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(validationResult.headerMatches || []).map((m) => {
                        const currentMappedKey = headerMapping[m.fileHeader] || '';
                        return (
                          <tr key={m.fileHeader} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-semibold text-[#131B2E]">
                              {m.fileHeader}
                            </td>
                            <td className="py-2 px-3">
                              {m.confidence === 'exact' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Exact Match
                                </span>
                              )}
                              {m.confidence === 'high' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  High Match
                                </span>
                              )}
                              {m.confidence === 'fuzzy' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Fuzzy Match
                                </span>
                              )}
                              {m.confidence === 'unmatched' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Unmapped
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={currentMappedKey}
                                onChange={(e) => handleHeaderMappingChange(m.fileHeader, e.target.value)}
                                className="w-full max-w-xs py-1 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-[#131B2E] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                              >
                                <option value="">— Skip Column (Do Not Import) —</option>
                                {selectedDefs.map((def) => {
                                  const isRequired = (config.requiredFields || []).includes(def.key) || def.lockedRequired;
                                  return (
                                    <option key={def.key} value={def.key}>
                                      {def.label} {isRequired ? ' *' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Validation Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setActiveFilter('all')}
              className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                activeFilter === 'all'
                  ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-600/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Students</span>
              <span className="text-xl font-black text-[#131B2E]">{validationResult.totalDetected}</span>
            </div>

            <div
              onClick={() => setActiveFilter('ready')}
              className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                activeFilter === 'ready'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-1 text-emerald-700 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Ready to Import</span>
              </div>
              <span className="text-xl font-black text-emerald-800">{validationResult.readyCount}</span>
            </div>

            <div
              onClick={() => setActiveFilter('warning')}
              className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                activeFilter === 'warning'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-1 text-amber-700 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Warnings</span>
              </div>
              <span className="text-xl font-black text-amber-800">{validationResult.warningCount}</span>
            </div>

            <div
              onClick={() => setActiveFilter('error')}
              className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                activeFilter === 'error'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-1 text-rose-700 mb-0.5">
                <XCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Errors</span>
              </div>
              <span className="text-xl font-black text-rose-800">{validationResult.errorCount}</span>
            </div>
          </div>

          {/* Photo Batch Upload Section (if photo column enabled) */}
          {config.enabledFields?.includes('photo') && (
            <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#131B2E]">Upload Student Photographs</h4>
                    <p className="text-[11px] text-[#64748B]">
                      Drop multiple photos named after admission number or photo filename (e.g. ADM-2026-0101.jpg).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploadProgress.uploading}
                  className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos (Batch)</span>
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files) handleBatchPhotoUpload(e.target.files);
                  }}
                  className="hidden"
                />
              </div>

              {photoUploadProgress.uploading && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                    <span>
                      Optimizing & Converting photos ({photoUploadProgress.completed} / {photoUploadProgress.total})...
                    </span>
                    <span className="text-[11px] font-mono">{photoUploadProgress.currentName}</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-200"
                      style={{
                        width: `${(photoUploadProgress.completed / photoUploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {Object.keys(associatedPhotos).length > 0 && (
                <div className="text-xs text-emerald-800 font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>
                    {Object.keys(associatedPhotos).length} photos optimized to WebP and ready for association.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Student Records Preview Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#131B2E]">Showing {displayedRows.length} Students</span>
                <span className="text-[10px] text-[#64748B]">
                  (Filtered by: {activeFilter.toUpperCase()})
                </span>
              </div>

              {/* Duplicate Handling Policy */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#64748B] font-medium">Duplicate Policy:</span>
                <select
                  value={duplicatePolicy}
                  onChange={(e) => setDuplicatePolicy(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-xs text-[#131B2E] focus:outline-hidden"
                >
                  <option value="skip">Skip Existing Students</option>
                  <option value="update">Update Existing Student Records</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-[#334155] sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-12 text-center sticky left-0 bg-slate-50 z-20">Row</th>
                    <th className="p-2.5 w-24 sticky left-12 bg-slate-50 z-20">Status</th>
                    {selectedDefs.map((def) => (
                      <th key={def.key} className="p-2.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span>{def.label}</span>
                          {def.isCustom && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 py-0.5 rounded-sm uppercase">
                              Custom #{def.templateOrder}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-2.5 min-w-[200px]">Issues / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={selectedDefs.length + 3} className="p-8 text-center text-[#64748B] text-xs">
                        No student records match the selected filter ({activeFilter}).
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => {
                      const st = row.studentData;
                      const admLower = (st.admission_number || '').toLowerCase();
                      const photoRefLower = (row.photoFileName || '').toLowerCase();
                      const photoAsset =
                        associatedPhotos[admLower] || (photoRefLower ? associatedPhotos[photoRefLower] : undefined);

                      return (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-slate-50/70 transition ${
                            row.status === 'error'
                              ? 'bg-rose-50/30'
                              : row.status === 'warning'
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-[11px] text-[#64748B] sticky left-0 bg-white/95 z-10">
                            {row.rowNumber}
                          </td>
                          <td className="p-2.5 sticky left-12 bg-white/95 z-10">
                            {row.status === 'ready' && (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Ready
                              </span>
                            )}
                            {row.status === 'warning' && (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Warning
                              </span>
                            )}
                            {row.status === 'error' && (
                              <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                Error
                              </span>
                            )}
                          </td>

                          {/* Dynamic Columns in Canonical Master Order */}
                          {selectedDefs.map((def) => {
                            if (def.key === 'admission_number') {
                              return (
                                <td key={def.key} className="p-2.5 font-mono text-indigo-950 font-bold whitespace-nowrap">
                                  {st.admission_number || '—'}
                                </td>
                              );
                            }
                            if (def.key === 'student_name') {
                              return (
                                <td key={def.key} className="p-2.5 font-bold text-[#131B2E] whitespace-nowrap">
                                  {st.first_name ? `${st.first_name} ${st.last_name || ''}`.trim() : '—'}
                                </td>
                              );
                            }
                            if (def.key === 'photo') {
                              return (
                                <td key={def.key} className="p-2.5">
                                  {photoAsset ? (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-300 shadow-2xs">
                                      <img
                                        src={photoAsset.url}
                                        alt="Student"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : row.photoFileName ? (
                                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-xs">
                                      {row.photoFileName}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">—</span>
                                  )}
                                </td>
                              );
                            }

                            // General field resolution: check mappedRow / rawValues / studentData / custom_fields
                            const displayVal =
                              st.custom_fields?.[def.key] ??
                              (st as any)[def.key] ??
                              row.rawValues[def.label] ??
                              row.rawValues[def.key] ??
                              '';

                            return (
                              <td key={def.key} className="p-2.5 text-[#334155] whitespace-nowrap max-w-xs truncate">
                                {displayVal !== '' && displayVal !== null && displayVal !== undefined
                                  ? String(displayVal)
                                  : '—'}
                              </td>
                            );
                          })}
                          <td className="p-2.5 max-w-xs">
                            {row.issues.length === 0 ? (
                              <span className="text-[11px] text-emerald-700 flex items-center">
                                <Check className="w-3 h-3 mr-1" />
                                Valid
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {row.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                                      issue.severity === 'error'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    <strong>{issue.fieldLabel}:</strong> {issue.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onBackToTemplate}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155] flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Template</span>
            </button>

            <button
              type="button"
              disabled={validationResult.readyCount === 0 && validationResult.warningCount === 0}
              onClick={() => setIsConfirmModalOpen(true)}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 transition shadow-xs cursor-pointer"
            >
              <span>
                Import {validationResult.readyCount + validationResult.warningCount} Valid Students
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      <ModalPortal isOpen={isConfirmModalOpen && Boolean(validationResult)}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#131B2E]">Confirm Student Import</h4>
                <p className="text-xs text-[#64748B]">
                  {((validationResult?.readyCount ?? 0) + (validationResult?.warningCount ?? 0))} students ready for insertion
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-[#334155]">
                <span>Ready to Import:</span>
                <span className="font-bold text-emerald-700">{validationResult?.readyCount}</span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Records with Warnings:</span>
                <span className="font-bold text-amber-700">{validationResult?.warningCount}</span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Duplicate Resolution:</span>
                <span className="font-bold capitalize">{duplicatePolicy} Existing</span>
              </div>
              {validationResult && validationResult.errorCount > 0 && (
                <div className="flex justify-between text-rose-700 pt-1 border-t border-slate-200">
                  <span>Invalid Rows Skipped:</span>
                  <span className="font-bold">{validationResult.errorCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#334155]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-xs"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isImporting ? 'Importing...' : 'Confirm & Save to ERP'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
