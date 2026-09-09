'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Plus,
  Layers,
} from 'lucide-react';
import type { StaffFacultyConfigData, StaffMember, StaffCustomField } from '@/lib/types';
import {
  parseAndValidateStaffFile,
  generateStaffErrorWorkbook,
  StaffValidationResult,
} from '@/lib/staffValidationService';
import { importStaffMembersAction, createStaffCustomFieldAction } from '@/app/staffActions';
import { generateSafeCustomFieldKey } from '@/lib/staffFieldDefinitions';

export interface StaffImportStageProps {
  token: string;
  config: StaffFacultyConfigData;
  customFields?: StaffCustomField[];
  onUpdateCustomFields?: (fields: StaffCustomField[]) => void;
  onBackToTemplate: () => void;
  onImportCompleted: (imported: StaffMember[]) => void;
}

export default function StaffImportStage({
  token,
  config,
  customFields = [],
  onUpdateCustomFields,
  onBackToTemplate,
  onImportCompleted,
}: StaffImportStageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cachedArrayBuffer, setCachedArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isAutoCreatingFields, setIsAutoCreatingFields] = useState(false);
  const [validationResult, setValidationResult] = useState<StaffValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCustomFieldsPool = customFields.length > 0 ? customFields : config.customFields || [];

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setValidationResult(null);
    setImportStatus(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setCachedArrayBuffer(arrayBuffer);

      const result = parseAndValidateStaffFile(arrayBuffer, {
        enabledFields: config.enabledFields,
        requiredFields: config.requiredFields,
        customFields: activeCustomFieldsPool,
        existingStaffMembers: config.staffMembers,
      });

      setValidationResult(result);
      if (result.errorCount > 0 && result.validCount === 0) {
        setActiveTab('errors');
      } else {
        setActiveTab('valid');
      }
    } catch (err: any) {
      alert('Error parsing uploaded file: ' + (err.message || 'Invalid format'));
      setSelectedFile(null);
      setCachedArrayBuffer(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAutoCreateUnknownColumns = async () => {
    if (!validationResult?.unknownColumns || validationResult.unknownColumns.length === 0 || !cachedArrayBuffer) return;
    setIsAutoCreatingFields(true);

    try {
      const newlyCreated: StaffCustomField[] = [];
      const currentList = [...activeCustomFieldsPool];

      for (const colName of validationResult.unknownColumns) {
        const safeKey = generateSafeCustomFieldKey(colName, currentList.map((c) => c.field_key));
        const res = await createStaffCustomFieldAction(token, {
          field_label: colName,
          field_key: safeKey,
          field_type: 'TEXT',
          category: 'custom',
          staff_scope: 'BOTH',
          is_required: false,
          is_active: true,
          display_order: currentList.length + newlyCreated.length + 1,
        });

        if (res.field) {
          newlyCreated.push(res.field);
          currentList.push(res.field);
        }
      }

      if (onUpdateCustomFields) {
        onUpdateCustomFields(currentList);
      }

      // Re-validate with the newly created custom fields
      const revalidated = parseAndValidateStaffFile(cachedArrayBuffer, {
        enabledFields: config.enabledFields,
        requiredFields: config.requiredFields,
        customFields: currentList,
        existingStaffMembers: config.staffMembers,
      });

      setValidationResult(revalidated);
    } catch (err: any) {
      alert('Error creating custom fields: ' + err.message);
    } finally {
      setIsAutoCreatingFields(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!validationResult || validationResult.errorRecords.length === 0) return;
    const buffer = generateStaffErrorWorkbook(validationResult.errorRecords);
    const blob = new Blob([buffer as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Staff_Import_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCommitImport = async () => {
    if (!validationResult || validationResult.validRecords.length === 0) return;
    setIsCommitting(true);
    setImportStatus(null);

    try {
      const res = await importStaffMembersAction(token, validationResult.validRecords, {
        updateExisting: true,
      });

      if (res.success) {
        onImportCompleted(validationResult.validRecords);
      } else {
        setImportStatus(res.error || 'Import failed.');
      }
    } catch (err: any) {
      setImportStatus(err.message || 'Commit error.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Step 3 of 3
              </span>
              <span className="text-xs text-[#64748B]">Bulk Staff Ingestion & Audit</span>
            </div>
            <h2 className="text-lg font-black text-[#131B2E] mt-1">Import Staff & Faculty Roster</h2>
            <p className="text-xs text-[#64748B]">
              Upload your completed Excel or CSV template. Our parser validates canonical definitions, custom fields, and highlights any unknown columns.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToTemplate}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Template</span>
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 text-center cursor-pointer transition space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#131B2E]">
                {isParsing ? 'Parsing & validating staff records...' : 'Drop your Excel (.xlsx) or CSV file here'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Supports up to 2,000 staff records per batch with automated fuzzy header matching.
              </p>
            </div>

            <div className="pt-2">
              <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition inline-block">
                Browse File from Computer
              </span>
            </div>
          </div>
        ) : (
          /* File Selected Summary Card */
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#131B2E]">{selectedFile.name}</p>
                <p className="text-[11px] text-[#64748B]">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Uploaded & parsed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setCachedArrayBuffer(null);
                setValidationResult(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Choose Another File</span>
            </button>
          </div>
        )}

        {/* UNKNOWN COLUMNS DETECTION WIZARD */}
        {validationResult && validationResult.unknownColumns && validationResult.unknownColumns.length > 0 && (
          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-3 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-purple-950">
                    {validationResult.unknownColumns.length} Unrecognized Column{validationResult.unknownColumns.length > 1 ? 's' : ''} Detected
                  </h4>
                  <p className="text-[11px] text-purple-800">
                    The following headers in your spreadsheet do not match any standard fields:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {validationResult.unknownColumns.map((col, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-purple-300 text-purple-900 font-mono text-[11px] font-bold shadow-2xs"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-purple-700 pt-0.5">
                    Would you like to automatically convert them into Custom Staff Fields so their data is preserved?
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isAutoCreatingFields}
                onClick={handleAutoCreateUnknownColumns}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAutoCreatingFields ? 'Creating & Re-validating...' : 'Convert to Custom Fields (1-Click)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Validation Overview Metrics Card */}
        {validationResult && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Detected</span>
                <p className="text-xl font-black text-[#131B2E]">{validationResult.totalDetected}</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Valid & Ready</span>
                <p className="text-xl font-black text-emerald-800">{validationResult.validCount}</p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Rows with Errors</span>
                <p className="text-xl font-black text-rose-800">{validationResult.errorCount}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Duplicate IDs</span>
                <p className="text-xl font-black text-amber-900">{validationResult.duplicateEmployeeCodes.length}</p>
              </div>
            </div>

            {/* Error Actions if errors exist */}
            {validationResult.errorCount > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>{validationResult.errorCount} rows</strong> contain invalid entries. You can fix them or proceed to import only the {validationResult.validCount} valid records.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadErrors}
                  className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report (.xlsx)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Valid Records vs Errors */}
      {validationResult && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('valid')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'valid'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Valid Records ({validationResult.validCount})</span>
            </button>

            {validationResult.errorCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('errors')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'errors'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Rows with Issues ({validationResult.errorCount})</span>
              </button>
            )}
          </div>

          {/* Valid Records Preview Table */}
          {activeTab === 'valid' && (
            <div className="space-y-3">
              {validationResult.validRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No valid records ready for import in this batch. Please review errors.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Employee ID</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Full Name</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Type</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Department</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Designation</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Phone</th>
                        <th className="py-2.5 px-3 font-bold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.validRecords.slice(0, 50).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">{rec.employeeCode}</td>
                          <td className="py-2 px-3 font-semibold text-[#131B2E]">{rec.name}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                rec.staffType === 'TEACHING'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {rec.staffType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{rec.department}</td>
                          <td className="py-2 px-3 text-slate-700">{rec.designation}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{rec.officialPhone || rec.phone || '—'}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {validationResult.validRecords.length > 50 && (
                <p className="text-[11px] text-slate-500 italic">
                  Showing first 50 of {validationResult.validRecords.length} records. All records will be imported upon commit.
                </p>
              )}
            </div>
          )}

          {/* Errors Table */}
          {activeTab === 'errors' && (
            <div className="space-y-3">
              <div className="border border-rose-200 rounded-xl overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-50 border-b border-rose-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-rose-900">Row</th>
                      <th className="py-2.5 px-3 font-bold text-rose-900">ID / Name</th>
                      <th className="py-2.5 px-3 font-bold text-rose-900">Failed Field</th>
                      <th className="py-2.5 px-3 font-bold text-rose-900">Issue Description</th>
                      <th className="py-2.5 px-3 font-bold text-rose-900">Input Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {validationResult.errorRecords.slice(0, 50).map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {row.errors.map((err, eIdx) => (
                          <tr key={`${rIdx}-${eIdx}`} className="hover:bg-rose-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">{row.rowNumber}</td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-[#131B2E]">{row.staffName}</span>
                              <span className="block text-[10px] font-mono text-slate-500">{row.employeeCode}</span>
                            </td>
                            <td className="py-2 px-3 font-bold text-rose-700">{err.fieldLabel}</td>
                            <td className="py-2 px-3 text-rose-800">{err.message}</td>
                            <td className="py-2 px-3 font-mono text-slate-600 bg-slate-50">{err.rawValue || '—'}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Sticky Import Commitment Bar */}
      {validationResult && validationResult.validCount > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-emerald-800">
              {validationResult.validCount} staff records ready to commit to database
            </span>
            {validationResult.errorCount > 0 && (
              <span className="text-[11px] text-slate-500 block">
                ({validationResult.errorCount} invalid rows will be skipped)
              </span>
            )}
            {importStatus && <p className="text-xs font-bold text-rose-600 mt-1">{importStatus}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToTemplate}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isCommitting}
              onClick={handleCommitImport}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isCommitting ? 'Importing Staff...' : `Commit ${validationResult.validCount} Staff Records`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
