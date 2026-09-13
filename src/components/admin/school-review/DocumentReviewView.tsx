'use client';

import React, { useState, useMemo } from 'react';
import type { DocumentReviewItem } from '@/lib/adminReviewEngine';
import { formatBytes } from '@/lib/imageUtils';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Building,
} from 'lucide-react';

interface DocumentReviewViewProps {
  documents: DocumentReviewItem[];
  onPreviewDocument: (doc: DocumentReviewItem) => void;
  onApproveDocument: (docId: string) => void;
  onFlagIssue: (docId: string, docName: string) => void;
}

export default function DocumentReviewView({
  documents,
  onPreviewDocument,
  onApproveDocument,
  onFlagIssue,
}: DocumentReviewViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const docTypes = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => set.add(d.documentType));
    return Array.from(set);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (filterType !== 'all' && doc.documentType !== filterType) return false;
      if (filterStatus !== 'all' && doc.verificationStatus !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.documentType.toLowerCase().includes(q) ||
          doc.sourceField.toLowerCase().includes(q) ||
          doc.boardApplicability.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, filterType, filterStatus, search]);

  const mandatoryCount = documents.filter((d) => d.isMandatory).length;
  const verifiedCount = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const missingMandatory = documents.filter((d) => d.isMandatory && d.verificationStatus === 'MISSING').length;
  const blockersCount = documents.filter((d) => d.isMandatory && d.verificationStatus !== 'VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* ─── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statutory Audit</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{mandatoryCount}</span>
            <span className="text-xs font-semibold text-slate-500">Mandatory</span>
          </div>
          <p className="text-[11px] text-slate-500">CBSE Affiliation &amp; State NOCs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified &amp; Valid</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{verifiedCount}</span>
            <span className="text-xs font-semibold text-emerald-600">
              {Math.round((verifiedCount / (documents.length || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Inspected and cleared</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Documents</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${missingMandatory > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {missingMandatory}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pending upload</span>
          </div>
          <p className="text-[11px] text-slate-500">Required before publishing</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Publication Blockers</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${blockersCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {blockersCount}
            </span>
            <span className={`text-xs font-bold ${blockersCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {blockersCount === 0 ? 'Clear to launch' : 'Blocking Approval'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Crucial safety &amp; legal files</p>
        </div>
      </div>

      {/* ─── FILTERS AND SEARCH ───────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search certificate, authority, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Document Types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="MISSING">Missing</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* ─── DOCUMENTS TABLE ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Document / Certificate</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Submitted File</th>
                <th className="py-3 px-4">Regulatory Applicability</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No documents matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isVerified = doc.verificationStatus === 'VERIFIED';
                  const isMissing = doc.verificationStatus === 'MISSING';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Document Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 min-w-[220px]">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold block">{doc.title}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {doc.isMandatory && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Mandatory Statutory
                                </span>
                              )}
                              {doc.isPdf && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                                  PDF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block text-xs">
                          {doc.documentType}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">{doc.sourceField}</span>
                      </td>

                      {/* Submitted File */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        {doc.fileUrl ? (
                          <div className="space-y-1">
                            <span className="font-mono text-xs text-slate-800 block truncate max-w-[180px]">
                              {doc.fileName || 'document.pdf'}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not uploaded</span>
                        )}
                      </td>

                      {/* Board Applicability */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <span className="text-[11px] text-slate-700 block">{doc.boardApplicability}</span>
                        {doc.relatedRequirement && (
                          <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[160px]">
                            {doc.relatedRequirement}
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isMissing
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isVerified ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isMissing ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{doc.verificationStatus.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.fileUrl && (
                            <button
                              type="button"
                              onClick={() => onPreviewDocument(doc)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Inspect Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onFlagIssue(doc.id, doc.title)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Flag Issue / Request Re-upload"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {!isVerified && doc.fileUrl && (
                            <button
                              type="button"
                              onClick={() => onApproveDocument(doc.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Verify &amp; Approve"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
