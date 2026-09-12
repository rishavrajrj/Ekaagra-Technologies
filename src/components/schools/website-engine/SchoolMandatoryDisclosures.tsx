'use client';

import React from 'react';
import { ShieldCheck, FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolMandatoryDisclosuresProps {
  data: SchoolWebsiteData;
}

export default function SchoolMandatoryDisclosures({ data }: SchoolMandatoryDisclosuresProps) {
  const { compliance, school, branding } = data;

  return (
    <section id="disclosures" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Statutory Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mandatory Public Disclosures (Appendix IX)
          </h2>
          <p className="text-xs text-slate-500">
            In compliance with statutory regulatory norms and {school.board} guidelines.
          </p>
        </div>

        {/* Institutional Affiliation Metadata Box */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Affiliation Board</span>
            <div className="font-extrabold text-slate-900 mt-0.5">{school.board}</div>
          </div>
          {school.affiliationNumber && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Affiliation Number</span>
              <div className="font-mono font-extrabold text-slate-900 mt-0.5">{school.affiliationNumber}</div>
            </div>
          )}
          {school.udiseCode && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">UDISE+ School Code</span>
              <div className="font-mono font-extrabold text-slate-900 mt-0.5">{school.udiseCode}</div>
            </div>
          )}
          {school.schoolCode && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">School Code</span>
              <div className="font-mono font-extrabold text-slate-900 mt-0.5">{school.schoolCode}</div>
            </div>
          )}
        </div>

        {/* Documents Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-extrabold">
                <th className="py-3.5 px-4">Statutory Document / Disclosure</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Compliance Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compliance.mandatoryDisclosures.length > 0 ? (
                compliance.mandatoryDisclosures.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{doc.title}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{doc.documentType}</td>
                    <td className="py-3 px-4">
                      {doc.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : doc.isNotApplicable ? (
                        <span className="text-[11px] font-medium text-slate-400">
                          Not Applicable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" /> Under Institutional Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition text-[11px]"
                        >
                          <Download className="w-3 h-3" />
                          <span>View PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Official disclosure documentation is under verification for institutional records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
