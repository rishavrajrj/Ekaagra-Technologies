'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Eye,
  Edit3,
  Check,
  RotateCcw,
  ExternalLink,
  Trash2,
  Lock,
  Download,
  X,
  FileCheck,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  InstitutionalPolicyItem,
  InstitutionalPolicyStatus,
  LegalPolicyData,
  SchoolIntakeChangeRequest,
} from '@/lib/types';
import {
  CANONICAL_POLICY_METADATA,
  type CanonicalPolicyKey,
  generateDefaultPolicyTemplate,
  initializeLegalPolicies,
  calculateLegalPoliciesCompleteness,
  syncPoliciesToAssetChecklist,
} from '@/lib/legalPolicyUtils';
import { validateSchoolDocumentFile } from '@/lib/schoolAssetChecklist';
import { formatBytes } from '@/lib/imageUtils';
import ModalPortal from '@/components/ui/ModalPortal';
import { resolveChangeRequestType } from '@/lib/canonicalFieldRegistry';

export interface LegalPoliciesSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  token: string;
  schoolName?: string;
  changeRequests?: SchoolIntakeChangeRequest[];
  onRespondToCR?: (cr: SchoolIntakeChangeRequest) => void;
  isFieldEditable?: (sectionKey: string, fieldKey?: string, assetId?: string) => boolean;
}

export default function LegalPoliciesSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  token,
  schoolName,
  changeRequests,
  onRespondToCR,
  isFieldEditable = () => true,
}: LegalPoliciesSectionProps) {
  // Ensure legal policies are canonically initialized
  const legalData: LegalPolicyData = useMemo(() => {
    return initializeLegalPolicies(intakeData.legalPolicies, intakeData);
  }, [intakeData.legalPolicies, intakeData]);

  const policies = legalData.policies || {};

  // Completeness score
  const completeness = useMemo(() => {
    return calculateLegalPoliciesCompleteness(legalData);
  }, [legalData]);

  // Local UI state
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [previewPolicy, setPreviewPolicy] = useState<InstitutionalPolicyItem | null>(null);
  const [uploadingPolicyId, setUploadingPolicyId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ id: string; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to commit policy changes and sync with canonical assetChecklist
  const savePolicyUpdate = useCallback(
    (policyKey: CanonicalPolicyKey, updates: Partial<InstitutionalPolicyItem>) => {
      const current = policies[policyKey];
      if (!current) return;

      const updatedPolicy: InstitutionalPolicyItem = {
        ...current,
        ...updates,
        lastEditedAt: new Date().toISOString(),
      };

      const updatedPolicies = {
        ...policies,
        [policyKey]: updatedPolicy,
      };

      const updatedLegal: LegalPolicyData = {
        ...legalData,
        policies: updatedPolicies,
      };

      // 1. Update legalPolicies in intakeData
      updateSectionField('legalPolicies', 'policies', updatedPolicies);

      // 2. Mirror into canonical assetChecklist items (pol-privacy, pol-terms, etc.)
      const updatedChecklistItems = syncPoliciesToAssetChecklist(
        updatedLegal,
        intakeData.assetChecklist?.items
      );
      if (updatedChecklistItems) {
        updateSectionField('assetChecklist', 'items', updatedChecklistItems);
      }

      // 3. Mirror privacyPolicyConfig if updating privacy policy text
      if (policyKey === 'privacy-policy' && updates.textContent) {
        updateSectionField('websiteRequirements', 'privacyPolicyConfig', {
          ...(intakeData.websiteRequirements?.privacyPolicyConfig || {}),
          autoGenerateStandardPolicy: false,
          policyContent: updates.textContent,
          isCustomized: true,
          lastEditedAt: new Date().toISOString(),
          schoolName: intakeData.schoolProfile?.schoolName || '',
          schoolContactEmail: intakeData.schoolProfile?.officialEmail || '',
        });
      }
    },
    [policies, legalData, intakeData, updateSectionField]
  );

  // Handle file upload for Mode 2 (Official PDF document)
  const handlePdfUpload = async (policyKey: CanonicalPolicyKey, file: File) => {
    setUploadError(null);
    setUploadingPolicyId(policyKey);

    const validation = validateSchoolDocumentFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.isValid) {
      setUploadError({
        id: policyKey,
        message: validation.error || 'Invalid file. Please select a valid PDF under 2 MB.',
      });
      setUploadingPolicyId(null);
      return;
    }

    try {
      const meta = CANONICAL_POLICY_METADATA.find((m) => m.id === policyKey);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);
      formData.append('itemId', meta?.checklistId || policyKey);
      formData.append('itemType', 'document');
      formData.append('section', 'legalPolicies');
      formData.append('category', 'policies');
      formData.append('isPrivate', 'false');

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Upload failed');
      }

      const fileUrl = json.asset?.url || json.asset?.fileUrl || json.fileUrl || json.url;
      const storageKey = json.asset?.storageKey || json.storageKey;

      savePolicyUpdate(policyKey, {
        officialDocumentUrl: fileUrl,
        officialDocumentName: file.name,
        officialDocumentSize: file.size,
        officialDocumentStorageKey: storageKey,
        officialDocumentUploadedAt: new Date().toISOString(),
        status: 'document_uploaded',
      });
    } catch (err: any) {
      setUploadError({
        id: policyKey,
        message: err.message || 'Could not upload PDF document. Please try again.',
      });
    } finally {
      setUploadingPolicyId(null);
    }
  };

  // Remove official PDF document
  const handleRemoveOfficialDoc = (policyKey: CanonicalPolicyKey) => {
    savePolicyUpdate(policyKey, {
      officialDocumentUrl: undefined,
      officialDocumentName: undefined,
      officialDocumentSize: undefined,
      officialDocumentStorageKey: undefined,
      officialDocumentUploadedAt: undefined,
      status: policies[policyKey]?.approvedAt
        ? 'approved'
        : policies[policyKey]?.textContent
        ? 'customized'
        : 'template',
    });
    setDeleteConfirmId(null);
  };

  // Reset policy text to recommended template
  const handleResetToTemplate = (policyKey: CanonicalPolicyKey) => {
    const template = generateDefaultPolicyTemplate(
      policyKey,
      intakeData.schoolProfile?.schoolName,
      intakeData.schoolProfile?.officialEmail,
      intakeData.schoolProfile?.officialPhone
    );
    savePolicyUpdate(policyKey, {
      textContent: template,
      status: 'template',
    });
  };

  // Mark policy text as school-approved
  const handleApprovePolicy = (policyKey: CanonicalPolicyKey) => {
    savePolicyUpdate(policyKey, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy:
        intakeData.clientConfirmation?.confirmedByName ||
        intakeData.leadership?.principalName ||
        'Authorized School Administrator',
    });
    setEditingPolicyId(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Section Header & Overview ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Legal Policies &amp; Digital Governance
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    completeness.isComplete
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {completeness.readyCount} of {completeness.total} Policies Ready
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Review and approve the mandatory published policies for your website and parent portal.
                Each policy supports either standard approved text, an official institutional PDF, or both.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-700">
                {completeness.percentage}% Ready
              </div>
              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mental Model Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">Clear Separation of Records:</strong> Legal &amp; Policies contains
            rules and policies published to website visitors and parents. Institutional compliance certificates
            (Affiliation Letters, Fire Safety NOC, Trust Registration, Appendix IX) are managed under{' '}
            <strong className="text-indigo-700">Assets &amp; Documents</strong>.
          </div>
        </div>
      </div>

      {/* ── Policy Cards Grid ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {CANONICAL_POLICY_METADATA.map((meta, index) => {
          const policyKey = meta.id;
          const policy = policies[policyKey] || {
            id: policyKey,
            title: meta.title,
            shortTitle: meta.shortTitle,
            description: meta.description,
            status: 'template' as InstitutionalPolicyStatus,
            textContent: generateDefaultPolicyTemplate(
              policyKey,
              intakeData.schoolProfile?.schoolName,
              intakeData.schoolProfile?.officialEmail,
              intakeData.schoolProfile?.officialPhone
            ),
          };

          const isEditing = editingPolicyId === policyKey;
          const isUploading = uploadingPolicyId === policyKey;
          const hasOfficialDoc = Boolean(policy.officialDocumentUrl);
          const hasText = Boolean(policy.textContent && policy.textContent.trim().length > 0);
          const isApproved = policy.status === 'approved';
          const isDocumentUploaded = policy.status === 'document_uploaded' || hasOfficialDoc;
          const isReady = isApproved || isDocumentUploaded || (policy.status === 'customized' && hasText);

          // Change Request inspection
          const matchingCR = changeRequests?.find(
            (cr) =>
              (cr.status === 'open' || cr.status === 'waiting_for_school') &&
              (cr.field_key === policyKey ||
                cr.field_key === meta.checklistId ||
                cr.asset_id === meta.checklistId ||
                cr.field_key?.includes(policyKey))
          );

          const crType = matchingCR ? resolveChangeRequestType(matchingCR) : null;
          const isPdfRequest = matchingCR ? (crType === 'PDF' || crType === 'DOCUMENT') : false;
          const isTextRequest = matchingCR ? crType === 'TEXT' : false;

          const fieldEditable = isFieldEditable('legalPolicies', policyKey, meta.checklistId);

          return (
            <div
              key={policyKey}
              id={`field-legal-${policyKey}`}
              className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                matchingCR
                  ? 'border-2 border-amber-500 ring-4 ring-amber-400/20'
                  : isReady
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-amber-200'
              }`}
            >
              {/* Reviewer Change Request Banner */}
              {matchingCR && (
                <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {isPdfRequest ? (
                        <>Reviewer Requested: <span className="underline decoration-white/60">Upload Official Signed PDF</span> &bull; {matchingCR.request_comment || matchingCR.reason}</>
                      ) : isTextRequest ? (
                        <>Reviewer Requested: <span className="underline decoration-white/60">Policy Text Revision</span> &bull; {matchingCR.request_comment || matchingCR.reason}</>
                      ) : (
                        <>Reviewer Requested Revisions: {matchingCR.request_comment || matchingCR.reason}</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPdfRequest && hasOfficialDoc && onRespondToCR && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRespondToCR(matchingCR);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-black uppercase tracking-wider shadow-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Submit for Re-Review</span>
                      </button>
                    )}
                    {onRespondToCR && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRespondToCR(matchingCR);
                        }}
                        className="px-2.5 py-1 bg-white text-amber-900 rounded-md text-[11px] font-black uppercase tracking-wider hover:bg-amber-50 transition cursor-pointer"
                      >
                        Respond to Reviewer
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-4">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {meta.title}
                        </h3>
                        {isDocumentUploaded && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Official PDF Uploaded
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> School Approved
                          </span>
                        )}
                        {!isApproved && !isDocumentUploaded && policy.status === 'customized' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Custom Draft
                          </span>
                        )}
                        {!isApproved && !isDocumentUploaded && policy.status === 'template' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Info className="w-3 h-3" /> Recommended Template
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {meta.description}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Destination:</span>
                        <span>{meta.intendedUse}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => setPreviewPolicy(policy)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      title="Preview full formatted policy text"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    {fieldEditable && !isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprovePolicy(policyKey)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Accept this policy for public website publication"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Policy</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Error Banner */}
                {uploadError?.id === policyKey && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError.message}</span>
                  </div>
                )}

                {/* ── Mode 1 & Mode 2 Panels ─────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  {/* MODE 1: Website Policy Content */}
                  <div className={`rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                    isTextRequest
                      ? 'bg-amber-50/40 border-2 border-amber-500 ring-4 ring-amber-400/20'
                      : 'bg-slate-50/80 border border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Mode 1 — Website Policy Content</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {policy.textContent ? `${policy.textContent.split(/\s+/).filter(Boolean).length} words` : 'Empty'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Text rendered directly on the public web page for fast accessibility and indexing.
                      </p>

                      {/* Callout if Reviewer Requested Text Correction */}
                      {isTextRequest && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Reviewer requested: <strong>Revise Policy Text</strong></span>
                          </div>
                          {!isEditing && fieldEditable && (
                            <button
                              type="button"
                              onClick={() => setEditingPolicyId(policyKey)}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-black uppercase tracking-wider shadow-xs transition cursor-pointer"
                            >
                              Edit Text
                            </button>
                          )}
                        </div>
                      )}

                      {/* Content Preview Box */}
                      <div className="mt-2.5 p-3 rounded-lg bg-white border border-slate-200 max-h-36 overflow-y-auto text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed shadow-2xs">
                        {policy.textContent || 'No text configured.'}
                      </div>
                    </div>

                    {/* Action Bar for Text */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        {fieldEditable && (
                          <button
                            type="button"
                            onClick={() => setEditingPolicyId(isEditing ? null : policyKey)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditing ? 'Close Editor' : 'Edit Text'}</span>
                          </button>
                        )}
                        {fieldEditable && policy.status === 'customized' && (
                          <button
                            type="button"
                            onClick={() => handleResetToTemplate(policyKey)}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                            title="Revert back to standard Ekaagra educational template"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset to Template</span>
                          </button>
                        )}
                      </div>

                      {policy.approvedAt && (
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Approved {new Date(policy.approvedAt).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MODE 2: Official Institutional PDF Document */}
                  <div className={`rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                    isPdfRequest
                      ? 'bg-amber-50/40 border-2 border-amber-500 ring-4 ring-amber-400/20'
                      : 'bg-slate-50/80 border border-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>Mode 2 — Official Uploaded Document</span>
                        </div>
                        {hasOfficialDoc && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            PDF Attached
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Upload an official signed PDF or institutional handbook if available (max 2 MB).
                      </p>

                      {/* Callout if Reviewer Requested PDF Upload */}
                      {isPdfRequest && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Reviewer requested: <strong>Upload PDF</strong></span>
                          </div>
                          {hasOfficialDoc && onRespondToCR && matchingCR && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRespondToCR(matchingCR);
                              }}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-black uppercase tracking-wider shadow-xs transition cursor-pointer"
                            >
                              Submit for Re-Review
                            </button>
                          )}
                        </div>
                      )}

                      {/* Document Status Box */}
                      <div className="mt-2.5 p-3 rounded-lg bg-white border border-slate-200 min-h-[90px] flex items-center justify-between gap-3 shadow-2xs">
                        {hasOfficialDoc ? (
                          <div className="flex items-start space-x-3 truncate">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {policy.officialDocumentName || `${meta.shortTitle}.pdf`}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {policy.officialDocumentSize ? formatBytes(policy.officialDocumentSize) : 'PDF Document'}
                                {policy.officialDocumentUploadedAt && (
                                  <span> &bull; Uploaded {new Date(policy.officialDocumentUploadedAt).toLocaleDateString('en-GB')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            No official institutional document uploaded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar for Official PDF */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      {hasOfficialDoc ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={policy.officialDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download / View PDF</span>
                          </a>

                          {fieldEditable && (
                            <>
                              {deleteConfirmId === policyKey ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOfficialDoc(policyKey)}
                                    className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold"
                                  >
                                    Confirm Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-[11px] text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(policyKey)}
                                  className="text-xs font-medium text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">PDF upload optional</span>
                      )}

                      {fieldEditable && (
                        <label className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isPdfRequest
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-2 ring-amber-400'
                            : 'bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 shadow-2xs'
                        }`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : hasOfficialDoc ? 'Replace PDF' : 'Upload Official PDF'}</span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePdfUpload(policyKey, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Full-Text Editor */}
                {isEditing && (
                  <div className="mt-4 p-4 rounded-xl bg-white border-2 border-indigo-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                        <span>Edit Policy Text — {meta.title}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingPolicyId(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={12}
                      value={policy.textContent || ''}
                      onChange={(e) => {
                        savePolicyUpdate(policyKey, {
                          textContent: e.target.value,
                          status: 'customized',
                        });
                      }}
                      placeholder="Enter policy markdown text..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500">
                        Supports standard Markdown formatting (headings, lists, bold).
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetToTemplate(policyKey)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                        >
                          Reset Template
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovePolicy(policyKey)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                          Save &amp; Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Policy Preview Modal ─────────────────────────────────────────────── */}
      {previewPolicy && (
        <ModalPortal isOpen={Boolean(previewPolicy)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                      {previewPolicy.title}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Authoritative Website Policy Specification Preview
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPolicy(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {previewPolicy.officialDocumentUrl && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Official PDF Attached: {previewPolicy.officialDocumentName || 'Document.pdf'}</span>
                    </div>
                    <a
                      href={previewPolicy.officialDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs hover:bg-emerald-100 transition inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download PDF
                    </a>
                  </div>
                )}

                <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {previewPolicy.textContent}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewPolicy(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
