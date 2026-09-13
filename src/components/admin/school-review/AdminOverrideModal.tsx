'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, ShieldAlert, History } from 'lucide-react';

interface AdminOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  originalValue: any;
  currentValue: any;
  onSave: (fieldKey: string, newValue: any, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function AdminOverrideModal({
  isOpen,
  onClose,
  fieldKey,
  fieldLabel,
  originalValue,
  currentValue,
  onSave,
  isLoading = false,
}: AdminOverrideModalProps) {
  const isComplex = typeof originalValue === 'object' && originalValue !== null;

  const [overrideValueText, setOverrideValueText] = useState<string>('');
  const [reason, setReason] = useState<string>('Standardized for website design & clarity');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (isComplex) {
      setOverrideValueText(JSON.stringify(currentValue ?? originalValue ?? {}, null, 2));
    } else {
      setOverrideValueText(String(currentValue ?? originalValue ?? ''));
    }
    setJsonError(null);
  }, [fieldKey, originalValue, currentValue, isComplex]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    let parsedValue: any = overrideValueText;
    if (isComplex) {
      try {
        parsedValue = JSON.parse(overrideValueText);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(`Invalid JSON: ${err?.message || 'Syntax error'}`);
        return;
      }
    }

    await onSave(fieldKey, parsedValue, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Admin Value Override</h3>
              <p className="text-[11px] font-mono text-slate-500">{fieldKey}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Audit Notice */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Non-destructive override:</strong> The customer&apos;s original submission remains preserved. This override sets the authoritative value used for website generation and export.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Original Customer Value (Read-Only) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Original Customer Submitted Value
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono max-h-28 overflow-y-auto whitespace-pre-wrap">
              {typeof originalValue === 'object' && originalValue !== null
                ? JSON.stringify(originalValue, null, 2)
                : String(originalValue || 'Not provided')}
            </div>
          </div>

          {/* New Value Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                New Approved Value for {fieldLabel}
              </label>
              {isComplex && (
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  JSON format
                </span>
              )}
            </div>

            {isComplex ? (
              <textarea
                rows={6}
                required
                value={overrideValueText}
                onChange={(e) => setOverrideValueText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : overrideValueText.length > 80 ? (
              <textarea
                rows={3}
                required
                value={overrideValueText}
                onChange={(e) => setOverrideValueText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <input
                type="text"
                required
                value={overrideValueText}
                onChange={(e) => setOverrideValueText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            )}

            {jsonError && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1">{jsonError}</p>
            )}
          </div>

          {/* Reason / Audit Note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Audit Reason / Justification</label>
            <input
              type="text"
              required
              placeholder="e.g. Corrected spelling; formatted according to CBSE standard"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Apply Approved Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
