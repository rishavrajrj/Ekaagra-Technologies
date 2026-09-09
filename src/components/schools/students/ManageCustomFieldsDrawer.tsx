'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Power,
  Lock,
} from 'lucide-react';
import type {
  StudentCustomFieldDefinition,
  Student,
} from '@/lib/types';
import {
  canDeleteCustomField,
  customFieldHasData,
} from '@/lib/studentCustomFieldService';

export interface ManageCustomFieldsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customFields: StudentCustomFieldDefinition[];
  students?: Student[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (field: StudentCustomFieldDefinition) => void;
  onToggleStatus: (fieldId: string, nextActive: boolean) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
  onReorderFields: (orderedIds: string[]) => Promise<void>;
  isProcessing?: boolean;
}

export default function ManageCustomFieldsDrawer({
  isOpen,
  onClose,
  customFields,
  students = [],
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onDeleteField,
  onReorderFields,
  isProcessing = false,
}: ManageCustomFieldsDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [blockedDeleteMsg, setBlockedDeleteMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sortedFields = [...customFields].sort((a, b) => (a.display_order || 52) - (b.display_order || 52));

  const filteredFields = sortedFields.filter((f) => {
    if (filter === 'active') return f.is_active;
    if (filter === 'inactive') return !f.is_active;
    return true;
  });

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const nextList = [...sortedFields];
    const temp = nextList[index - 1];
    nextList[index - 1] = nextList[index];
    nextList[index] = temp;
    await onReorderFields(nextList.map((f) => f.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === sortedFields.length - 1) return;
    const nextList = [...sortedFields];
    const temp = nextList[index + 1];
    nextList[index + 1] = nextList[index];
    nextList[index] = temp;
    await onReorderFields(nextList.map((f) => f.id));
  };

  const initiateDelete = (field: StudentCustomFieldDefinition) => {
    const check = canDeleteCustomField(field.field_key, students);
    if (!check.canDelete) {
      setBlockedDeleteMsg(check.message || 'Cannot delete field containing student data.');
      return;
    }
    setConfirmDeleteId(field.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-fadeIn">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#131B2E]">Manage Custom Student Fields</h2>
              <p className="text-[11px] text-[#64748B]">
                Organize, activate, deactivate, or reorder school-specific fields.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Filters */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  filter === f ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f} ({sortedFields.filter((cf) => (f === 'all' ? true : f === 'active' ? cf.is_active : !cf.is_active)).length})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Field</span>
          </button>
        </div>

        {/* Blocked Delete Notice Dialog */}
        {blockedDeleteMsg && (
          <div className="m-4 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-950">Deletion Restricted</h4>
                <p className="text-xs text-amber-800 mt-0.5">{blockedDeleteMsg}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedDeleteMsg(null)}
                className="px-3 py-1 text-xs font-bold bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-lg transition"
              >
                Understood
              </button>
            </div>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        {confirmDeleteId && (
          <div className="m-4 p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-950">Permanently Delete Custom Field?</h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  This field has never stored student data and will be removed permanently.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  await onDeleteField(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
              >
                {isProcessing ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Deactivate Dialog */}
        {confirmDeactivateId && (
          <div className="m-4 p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Deactivate Custom Field?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Deactivating this field will remove it from new student forms and templates. Existing student data will be preserved.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmDeactivateId(null)}
                className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  await onToggleStatus(confirmDeactivateId, false);
                  setConfirmDeactivateId(null);
                }}
                className="px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition"
              >
                {isProcessing ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        )}

        {/* Custom Fields List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredFields.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#131B2E]">No custom fields found</h3>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto mt-1">
                {filter === 'all'
                  ? 'Your school has not configured any custom fields yet. Click "+ Add Custom Field" to create one.'
                  : `No ${filter} custom fields found.`}
              </p>
            </div>
          ) : (
            filteredFields.map((field, idx) => {
              const hasData = customFieldHasData(field.field_key, students);

              return (
                <div
                  key={field.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    field.is_active
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  {/* Left Column: Reorder + Details */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex flex-col space-y-0.5">
                      <button
                        type="button"
                        disabled={idx === 0 || isProcessing}
                        onClick={() => handleMoveUp(idx)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filteredFields.length - 1 || isProcessing}
                        onClick={() => handleMoveDown(idx)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#131B2E] truncate">
                          {field.field_name}
                        </span>
                        {field.is_required ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            ★ Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Custom
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-[#64748B]">
                        <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">
                          {field.field_key}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{field.field_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Order #{field.display_order}</span>
                        {hasData && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Has Data</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Toggle Active / Inactive */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        if (field.is_active) {
                          setConfirmDeactivateId(field.id);
                        } else {
                          onToggleStatus(field.id, true);
                        }
                      }}
                      className={`p-1.5 rounded-lg border transition ${
                        field.is_active
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={field.is_active ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Field */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        onClose();
                        onOpenEditModal(field);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                      title="Edit Custom Field"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Field */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => initiateDelete(field)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Custom Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-[#64748B]">
          <span>
            {sortedFields.filter((f) => f.is_active).length} of {sortedFields.length} custom fields active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-[#131B2E] hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
