'use client';

import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { formatFeeCurrency } from '@/lib/feeCalculationEngine';

interface DeleteFeeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeName: string;
  feeAmount: number;
  frequency: string;
  inheritedClassesCount: number;
  overriddenClassesCount: number;
  onConfirmDelete: () => void;
}

export default function DeleteFeeConfirmModal({
  isOpen,
  onClose,
  feeName,
  feeAmount,
  frequency,
  inheritedClassesCount,
  overriddenClassesCount,
  onConfirmDelete,
}: DeleteFeeConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-950">Delete Fee Component?</h3>
                <p className="text-xs text-rose-700">This action will cascade to all inheriting classes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-xs text-slate-700">
            <p className="text-sm font-semibold text-slate-900">
              Are you sure you want to delete <strong>&quot;{feeName}&quot;</strong> (
              <span className="font-mono text-emerald-600">{formatFeeCurrency(feeAmount)}</span> / {frequency})?
            </p>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Impact Assessment:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs">
                <li>
                  Deleting this common fee will remove it from all{' '}
                  <strong>{inheritedClassesCount} classes</strong> that currently inherit it.
                </li>
                {overriddenClassesCount > 0 && (
                  <li>
                    <strong>{overriddenClassesCount} classes</strong> have custom override values and will not be deleted automatically.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Fee</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
