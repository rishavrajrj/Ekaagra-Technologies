'use client';

import React, { useState } from 'react';
import type { DeveloperHandoffSpecification } from '@/lib/adminReviewEngine';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  Search,
} from 'lucide-react';

interface DeveloperHandoffViewProps {
  handoffSpec: DeveloperHandoffSpecification;
}

export default function DeveloperHandoffView({ handoffSpec }: DeveloperHandoffViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'markdown' | 'json'>('checklist');

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(handoffSpec.markdownDocument || handoffSpec.markdownExport || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(handoffSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-handoff-${handoffSpec.projectId || handoffSpec.projectNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([handoffSpec.markdownDocument || handoffSpec.markdownExport || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DEVELOPER-HANDOFF-${handoffSpec.projectId || handoffSpec.projectNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ─── TOP ACTION BANNER ────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              handoffSpec.summary.readyForBuild
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">Developer Handoff Specification</h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  handoffSpec.summary.readyForBuild
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {handoffSpec.summary.readyForBuild ? 'Ready for Build' : `${handoffSpec.summary.openBlockers} Blockers Active`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive architectural blueprint, approved content tokens, page routes, and media embed targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Specification!' : 'Copy Markdown Spec'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download MD"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download JSON Contract"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>.JSON</span>
          </button>
        </div>
      </div>

      {/* ─── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pages to Build</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{handoffSpec.pagesToBuild.length}</span>
            <span className="text-xs font-semibold text-slate-500">Distinct routes</span>
          </div>
          <p className="text-[11px] text-slate-500">Home, About, Academics, Contact...</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Components</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">
              {handoffSpec.customComponentsRequired.length}
            </span>
            <span className="text-xs font-semibold text-indigo-600">Interactive</span>
          </div>
          <p className="text-[11px] text-slate-500">Admission forms, fee calculator, tours</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assets to Embed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{handoffSpec.assetsToEmbed.length}</span>
            <span className="text-xs font-semibold text-slate-500">Approved</span>
          </div>
          <p className="text-[11px] text-slate-500">Header, Hero, Desk, Campus Gallery</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Overrides</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{handoffSpec.summary.overridesApplied}</span>
            <span className="text-xs font-semibold text-slate-500">Applied</span>
          </div>
          <p className="text-[11px] text-slate-500">Sanitized customer submission</p>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Checklist &amp; Architecture
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('markdown')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'markdown'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Raw Markdown Spec
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'json'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          JSON Contract
        </button>
      </div>

      {/* ─── TAB 1: CHECKLIST & ARCHITECTURE ──────────────────────────────── */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Pages To Build */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Page Directory &amp; Routes ({handoffSpec.pagesToBuild.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handoffSpec.pagesToBuild.map((page) => (
                <div key={page.pageKey} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{page.pageTitle}</span>
                    <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      {page.route}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Required Sections:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {page.sections.map((sec, idx) => (
                        <span key={idx} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {page.specialInstructions.length > 0 && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="font-bold text-slate-700">Notes: </span>
                      <span>{page.specialInstructions.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Components & Integrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>Custom Components Required</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {handoffSpec.customComponentsRequired.map((comp, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono font-medium">{comp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>SEO &amp; Third-Party Services</span>
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Meta Title</span>
                  <span className="font-bold text-slate-800">{handoffSpec.seoAndMetadata?.metaTitle || `${handoffSpec.projectName} | Official Website`}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Meta Description</span>
                  <p className="text-slate-600">{handoffSpec.seoAndMetadata?.metaDescription || 'Official institutional website.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Integrations</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(handoffSpec.thirdPartyIntegrations || []).map((integ: any, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {typeof integ === 'string' ? integ : integ.name || 'Integration'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MARKDOWN SPEC ─────────────────────────────────────────── */}
      {activeTab === 'markdown' && (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
            <span className="text-slate-400">DEVELOPER-HANDOFF-SPECIFICATION.md</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {handoffSpec.markdownDocument || handoffSpec.markdownExport}
          </pre>
        </div>
      )}

      {/* ─── TAB 3: JSON CONTRACT ─────────────────────────────────────────── */}
      {activeTab === 'json' && (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
            <span className="text-slate-400">developer-handoff.json</span>
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {JSON.stringify(handoffSpec, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
