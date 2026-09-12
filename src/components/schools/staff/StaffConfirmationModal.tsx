'use client';

import React from 'react';
import { AlertTriangle, Archive, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type { StaffMember } from '@/lib/types';

export type ConfirmationType = 'archive' | 'delete' | 'restore';

export interface StaffConfirmationModalProps {
  isOpen: boolean;
  type: ConfirmationType;
  member: StaffMember | null;
  hasDependencies?: boolean;
  dependencies?: string[];
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSwitchToArchive?: () => void;
}

export default function StaffConfirmationModal({
  isOpen,
  type,
  member,
  hasDependencies = false,
  dependencies = [],
  isLoading = false,
  onClose,
  onConfirm,
  onSwitchToArchive,
}: StaffConfirmationModalProps) {
  if (!isOpen || !member) return null;

  // Variant 1: Deletion blocked due to existing historical dependencies
  if (type === 'delete' && hasDependencies) {
    return (
      <ModalPortal isOpen={isOpen}>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-amber-200 w-full max-w-md overflow-hidden animate-scale-up my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with warning icon */}
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">Permanent Deletion Blocked</h3>
                  <p className="text-[11px] text-amber-700 font-medium">Relational dependencies detected</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-amber-200/50 text-amber-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 leading-relaxed">
                Cannot permanently delete this staff member because historical or related records exist. Archive the staff member instead.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Target Member: <span className="font-black text-indigo-700">{member.name}</span> ({member.employeeCode || member.facultyId})
                </p>
                {dependencies.length > 0 && (
                  <div className="pt-1 border-t border-slate-200 space-y-1 text-[11px] text-slate-600">
                    <p className="font-semibold text-slate-500">Active dependencies:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {dependencies.map((dep, idx) => (
                        <li key={idx}>{dep}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Archiving will safely remove them from the active directory and public website while keeping historical timetables and records intact.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              {onSwitchToArchive && (
                <button
                  type="button"
                  onClick={onSwitchToArchive}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Staff Member</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  // Variant 2: Permanent Delete Confirmation (no dependencies)
  if (type === 'delete') {
    return (
      <ModalPortal isOpen={isOpen}>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-scale-up my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950">Delete Staff Member?</h3>
                  <p className="text-[11px] text-rose-700 font-medium">Permanent removal</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-rose-200/50 text-rose-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 text-xs text-slate-600">
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                This action permanently removes this staff record and cannot be undone.
              </p>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                <p className="font-bold text-slate-800">
                  {member.name}
                </p>
                <p className="text-[11px] font-mono text-rose-700 font-bold">
                  {member.employeeCode || member.facultyId} • {member.designation || 'Staff'}
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                Dependency inspection verified: zero active relational dependencies or timetable allocations were detected.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  // Variant 3: Restore Confirmation
  if (type === 'restore') {
    return (
      <ModalPortal isOpen={isOpen}>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-emerald-200 w-full max-w-md overflow-hidden animate-scale-up my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Restore Staff Member?</h3>
                  <p className="text-[11px] text-emerald-700 font-medium">Reactivate profile</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-emerald-200/50 text-emerald-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600">
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                This will restore this staff member back to the active directory. Their website visibility will remain Private until explicitly published.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="font-bold text-slate-800">{member.name}</p>
                <p className="text-[11px] font-mono text-indigo-700 font-bold">
                  {member.employeeCode || member.facultyId} • {member.designation}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Restoring...' : 'Restore Staff Member'}</span>
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  // Variant 4: Archive Confirmation (default)
  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-indigo-200 w-full max-w-md overflow-hidden animate-scale-up my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-950">Archive Staff Member?</h3>
                <p className="text-[11px] text-indigo-700 font-medium">Safe archival</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-indigo-200/50 text-indigo-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3 text-xs text-slate-600">
            <p className="text-slate-800 font-medium text-sm leading-relaxed">
              This will remove the staff member from active records and the public website while preserving historical records.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-800">{member.name}</p>
              <p className="text-[11px] font-mono text-indigo-700 font-bold">
                {member.employeeCode || member.facultyId} • {member.designation}
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              Archived staff disappear from active lists by default and can be viewed or restored at any time via the Archived Staff filter.
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Archiving...' : 'Archive Staff Member'}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
