'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Layers,
  Sparkles,
  BookOpen,
  Settings,
  Users,
} from 'lucide-react';
import type { StaffFacultyConfigData, StaffCustomField } from '@/lib/types';
import {
  getApplicableStaffFields,
  generateStaffExcelBuffer,
  generateStaffCsvString,
} from '@/lib/staffTemplateGenerator';
import { DEFAULT_ENABLED_STAFF_FIELDS, DEFAULT_REQUIRED_STAFF_FIELDS } from '@/lib/staffFieldDefinitions';

export interface StaffTemplateStageProps {
  config: StaffFacultyConfigData;
  schoolName?: string;
  customFields?: StaffCustomField[];
  onBackToFields: () => void;
  onContinueToImport: () => void;
}

export default function StaffTemplateStage({
  config,
  schoolName,
  customFields = [],
  onBackToFields,
  onContinueToImport,
}: StaffTemplateStageProps) {
  const [scope, setScope] = useState<'ALL' | 'TEACHING' | 'NON_TEACHING'>('ALL');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [includeSamples, setIncludeSamples] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const enabledFields = config.enabledFields || DEFAULT_ENABLED_STAFF_FIELDS;
  const requiredFields = config.requiredFields || DEFAULT_REQUIRED_STAFF_FIELDS;
  const activeCustomFields = customFields.length > 0 ? customFields : config.customFields || [];

  const applicableFields = useMemo(() => {
    return getApplicableStaffFields({
      enabledFields,
      requiredFields,
      customFields: activeCustomFields,
      staffTypeScope: scope,
      schoolName,
    });
  }, [enabledFields, requiredFields, activeCustomFields, scope, schoolName]);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const cleanSchool = (schoolName || 'School').replace(/[^a-zA-Z0-9]/g, '_');
      const timeStamp = new Date().toISOString().slice(0, 10);
      const scopeTag = scope.toLowerCase();

      if (format === 'xlsx') {
        const buffer = generateStaffExcelBuffer(
          {
            enabledFields,
            requiredFields,
            customFields: activeCustomFields,
            staffTypeScope: scope,
            schoolName,
          },
          includeSamples
        );
        const blob = new Blob([buffer as any], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanSchool}_Staff_Template_${scopeTag}_${timeStamp}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const csvString = generateStaffCsvString(
          {
            enabledFields,
            requiredFields,
            customFields: activeCustomFields,
            staffTypeScope: scope,
            schoolName,
          },
          includeSamples
        );
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanSchool}_Staff_Template_${scopeTag}_${timeStamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert('Error generating template: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const customFieldsInTemplate = applicableFields.filter((f) => f.isCustom);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Step 2 of 3
              </span>
              <span className="text-xs text-[#64748B]">Configured Data Downloader</span>
            </div>
            <h2 className="text-lg font-black text-[#131B2E] mt-1">Download Staff Roster Template</h2>
            <p className="text-xs text-[#64748B]">
              This template is customized to your school's selected canonical fields, custom fields, and scope. Fill it out and proceed to import.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToFields}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Modify Fields</span>
            </button>
            <button
              type="button"
              onClick={onContinueToImport}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Skip to Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Template Customizer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          {/* 1. Scope Selector */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">1. Staff Category Scope</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  scope === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff
              </button>
              <button
                type="button"
                onClick={() => setScope('TEACHING')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  scope === 'TEACHING' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teachers Only
              </button>
              <button
                type="button"
                onClick={() => setScope('NON_TEACHING')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  scope === 'NON_TEACHING' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Non-Teaching
              </button>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {scope === 'ALL'
                ? 'Includes teaching & administrative columns.'
                : scope === 'TEACHING'
                ? 'Only includes academic fields (classes, subjects).'
                : 'Only includes operational & facility roles.'}
            </p>
          </div>

          {/* 2. File Format */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">2. File Format</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs transition flex items-center justify-center space-x-1 cursor-pointer ${
                  format === 'xlsx' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  format === 'csv' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>CSV (.csv)</span>
              </button>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Excel (.xlsx) includes interactive styling, instructions, and dropdown formatting.
            </p>
          </div>

          {/* 3. Sample Rows Option */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">3. Sample Demonstration Data</label>
            <label className="flex items-center space-x-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={includeSamples}
                onChange={(e) => setIncludeSamples(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Include Sample Profiles</span>
                <span className="text-[11px] text-slate-500 block">
                  Includes 3 realistic prefilled example rows illustrating formatting.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Download Button Callout */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-[#64748B]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>{applicableFields.length} total columns</strong> ({applicableFields.filter((f) => f.isRequired).length} mandatory
              {customFieldsInTemplate.length > 0 && `, ${customFieldsInTemplate.length} custom`})
            </span>
          </div>

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isDownloading
                ? 'Generating Template...'
                : `Download ${format === 'xlsx' ? 'Excel Workbook' : 'CSV File'}`}
            </span>
          </button>
        </div>
      </div>

      {/* Live Preview of Columns */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-black text-[#131B2E] uppercase tracking-wider">
              Template Columns Preview ({applicableFields.length})
            </h3>
            {customFieldsInTemplate.length > 0 && (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full">
                {customFieldsInTemplate.length} Custom Fields
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Canonical order enforced automatically</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold text-slate-600">Order</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Column Header</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Category</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Type</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Required?</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Sample Value</th>
                <th className="py-2.5 px-3 font-bold text-slate-600">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicableFields.map((field) => {
                const isFieldRequired = Boolean(field.isRequired || field.isLocked || requiredFields.includes(field.key));
                return (
                  <tr key={field.key} className={`hover:bg-slate-50/80 ${field.isCustom ? 'bg-purple-50/20' : ''}`}>
                    <td className="py-2 px-3 font-mono text-slate-500">{field.templateOrder}</td>
                    <td className="py-2 px-3 font-bold text-[#131B2E]">
                      <span>{field.label}</span>
                      {isFieldRequired && <span className="text-rose-500 font-bold ml-1">*</span>}
                      {field.isCustom && (
                        <span className="ml-1.5 text-[9px] font-bold text-purple-700 bg-purple-100 px-1 py-0.1 rounded">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 capitalize text-slate-600">{field.category.replace('_', ' ')}</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{field.dataType}</td>
                    <td className="py-2 px-3">
                      {isFieldRequired ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{field.sampleValue || '—'}</td>
                    <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{field.formatInstructions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
