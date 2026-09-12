'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, Check, ShieldCheck, DollarSign } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type { CommonFeeItem, FeeCategoryType, FeeBillingFrequency, StudentTypeEligibility, AcademicClassConfig } from '@/lib/types';
import { DEFAULT_FEE_CATEGORIES, formatFeeCurrency } from '@/lib/feeCalculationEngine';

interface AddEditFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fee: CommonFeeItem, forceUpdateAll?: boolean) => void;
  feeToEdit?: CommonFeeItem | null;
  existingFees: CommonFeeItem[];
  classes: AcademicClassConfig[];
  isAdmissionOnlyMode?: boolean;
  overriddenClassesCount?: number;
  inheritedClassesCount?: number;
}

export default function AddEditFeeModal({
  isOpen,
  onClose,
  onSave,
  feeToEdit,
  existingFees,
  classes,
  isAdmissionOnlyMode = false,
  overriddenClassesCount = 0,
  inheritedClassesCount = 0,
}: AddEditFeeModalProps) {
  const isEditing = Boolean(feeToEdit);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FeeCategoryType | string>('Tuition');
  const [amount, setAmount] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<FeeBillingFrequency>('monthly');
  const [studentType, setStudentType] = useState<StudentTypeEligibility>('both');
  const [applicableType, setApplicableType] = useState<'all' | 'selected'>('all');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isRefundable, setIsRefundable] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState('');
  const [isVisibleOnWebsite, setIsVisibleOnWebsite] = useState(true);
  const [description, setDescription] = useState('');
  const [paymentTiming, setPaymentTiming] = useState('at_admission');

  // Confirmation step when editing an existing fee used by multiple classes
  const [showInheritanceConfirmation, setShowInheritanceConfirmation] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize values when opened or feeToEdit changes
  useEffect(() => {
    if (!isOpen) {
      setShowInheritanceConfirmation(false);
      setValidationError(null);
      return;
    }

    if (feeToEdit) {
      setName(feeToEdit.name || '');
      setCategory(feeToEdit.category || (isAdmissionOnlyMode ? 'Other' : 'Tuition'));
      setAmount(typeof feeToEdit.amount === 'number' ? feeToEdit.amount : '');
      setFrequency(feeToEdit.frequency || (isAdmissionOnlyMode ? 'one_time' : 'monthly'));
      setStudentType(isAdmissionOnlyMode ? 'new_only' : (feeToEdit.studentType || 'both'));
      if (feeToEdit.applicableClasses === 'all' || !Array.isArray(feeToEdit.applicableClasses)) {
        setApplicableType('all');
        setSelectedClasses([]);
      } else {
        setApplicableType('selected');
        setSelectedClasses(feeToEdit.applicableClasses);
      }
      setIsRefundable(Boolean(feeToEdit.isRefundable));
      setRefundPolicy(feeToEdit.refundPolicy || '');
      setIsVisibleOnWebsite(feeToEdit.isVisibleOnWebsite ?? true);
      setDescription(feeToEdit.description || '');
      setPaymentTiming(feeToEdit.paymentTiming || 'at_admission');
    } else {
      // New fee creation defaults
      setName('');
      setCategory(isAdmissionOnlyMode ? 'Other' : 'Tuition');
      setAmount('');
      setFrequency(isAdmissionOnlyMode ? 'one_time' : 'monthly');
      setStudentType(isAdmissionOnlyMode ? 'new_only' : 'both');
      setApplicableType('all');
      setSelectedClasses([]);
      setIsRefundable(false);
      setRefundPolicy('');
      setIsVisibleOnWebsite(true);
      setDescription('');
      setPaymentTiming('at_admission');
    }
  }, [isOpen, feeToEdit, isAdmissionOnlyMode]);

  if (!isOpen) return null;

  // Toggle class selection for 'selected' mode
  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleValidateAndSubmit = () => {
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter a valid fee name.');
      return;
    }

    if (amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
      setValidationError('Fee amount cannot be negative or empty.');
      return;
    }

    if (applicableType === 'selected' && selectedClasses.length === 0) {
      setValidationError('Please select at least one applicable class, or choose "All Classes".');
      return;
    }

    // Duplicate detection (Rule 54)
    if (!isEditing) {
      const duplicate = existingFees.find(
        (f) => f.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        setValidationError(`A fee named "${duplicate.name}" already exists. Please use a unique name or edit the existing common fee.`);
        return;
      }
    }

    // Rule 45: Show inheritance confirmation if editing an existing fee used by classes
    if (isEditing && inheritedClassesCount > 0 && !showInheritanceConfirmation) {
      setShowInheritanceConfirmation(true);
      return;
    }

    finalizeSave();
  };

  const finalizeSave = (forceUpdateAll = false) => {
    const feeItem: CommonFeeItem = {
      id: feeToEdit?.id || `fee-${Date.now()}`,
      name: name.trim(),
      category,
      amount: Number(amount),
      frequency,
      studentType: isAdmissionOnlyMode ? 'new_only' : studentType,
      applicableClasses: applicableType === 'all' ? 'all' : selectedClasses,
      isRefundable,
      refundPolicy: isRefundable ? refundPolicy.trim() : undefined,
      isVisibleOnWebsite,
      description: description.trim() || undefined,
      isAdmissionOnly: isAdmissionOnlyMode,
      paymentTiming: isAdmissionOnlyMode ? paymentTiming : undefined,
    };

    onSave(feeItem, forceUpdateAll);
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {showInheritanceConfirmation
                    ? 'Confirm Inheritance Update'
                    : isEditing
                    ? `Edit ${isAdmissionOnlyMode ? 'Admission Fee' : 'Common Fee'}`
                    : `Add ${isAdmissionOnlyMode ? 'Admission Fee' : 'Common Fee'}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {showInheritanceConfirmation
                    ? 'Review how this change cascades to classes'
                    : isAdmissionOnlyMode
                    ? 'Configure one-time charges for newly admitted students'
                    : 'Values configured here automatically appear across all applicable classes'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Inheritance Warning Modal View (Rule 45) */}
            {showInheritanceConfirmation ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-amber-900">This fee is used by multiple classes</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Changing <strong>&quot;{name}&quot;</strong> will update all{' '}
                      <strong>{inheritedClassesCount} classes</strong> that currently inherit this fee.
                    </p>
                    {overriddenClassesCount > 0 && (
                      <p className="text-xs text-amber-900/80 font-medium pt-1">
                        ℹ️ <strong>{overriddenClassesCount} classes</strong> have custom overrides and will not change.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Fee Component:</span>
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">New Amount:</span>
                    <span className="font-bold text-emerald-600 font-mono">{formatFeeCurrency(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Frequency:</span>
                    <span className="font-medium capitalize text-slate-700">{frequency}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Error Banner */}
                {validationError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-medium text-xs">{validationError}</span>
                  </div>
                )}

                {/* Name and Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Fee Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAdmissionOnlyMode ? 'e.g. Admission Fee' : 'e.g. Annual Charges'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Fee Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    >
                      {DEFAULT_FEE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount and Frequency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Amount (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Frequency *</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as FeeBillingFrequency)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    >
                      <option value="one_time">One-Time (Admission / Registration)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half-Yearly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>

                {/* Student Type (Hidden / forced for admission fees) */}
                {!isAdmissionOnlyMode ? (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Student Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'both', label: 'Both Students' },
                        { id: 'new_only', label: 'New Students Only' },
                        { id: 'existing_only', label: 'Existing Students Only' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStudentType(st.id as StudentTypeEligibility)}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                            studentType === st.id
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs ring-1 ring-indigo-500/20'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Payment Timing</label>
                    <select
                      value={paymentTiming}
                      onChange={(e) => setPaymentTiming(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    >
                      <option value="at_admission">Payable at Time of Admission</option>
                      <option value="before_session">Payable Before Session Starts</option>
                      <option value="installments">Payable in Scheduled Installments</option>
                    </select>
                  </div>
                )}

                {/* Applicable Classes (Rule 5) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">Applicable Classes *</label>
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setApplicableType('all')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          applicableType === 'all'
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        All Classes
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplicableType('selected')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                          applicableType === 'selected'
                            ? 'bg-white text-indigo-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Selected Classes
                      </button>
                    </div>
                  </div>

                  {applicableType === 'all' ? (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-800 flex items-center space-x-2 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Applies automatically to every active class in your academic structure ({classes.length} classes).
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <p className="text-[11px] text-slate-500">Select which classes this fee applies to:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {classes.map((cls) => {
                          const isSelected = selectedClasses.includes(cls.name);
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => toggleClass(cls.name)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isSelected ? '✓ ' : ''}
                              {cls.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Refundable Policy (Rule 28) */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Refundable Fee Component?</span>
                      <span className="text-[11px] text-slate-500">
                        Mark if this amount is returned when the student leaves the school (e.g. Caution Money).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRefundable(!isRefundable)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isRefundable ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isRefundable ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isRefundable && (
                    <div className="space-y-1 animate-in fade-in">
                      <label className="block font-bold text-slate-800 text-[11px]">Refund Policy Description</label>
                      <textarea
                        rows={2}
                        value={refundPolicy}
                        onChange={(e) => setRefundPolicy(e.target.value)}
                        placeholder="e.g. Caution Money is 100% refundable at the time of leaving the school, subject to school clearance."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Website Visibility & Description */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Display on Public Website</span>
                      <span className="text-[11px] text-slate-500">
                        Include this fee in parent-facing public website tables and admissions pages.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVisibleOnWebsite(!isVisibleOnWebsite)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isVisibleOnWebsite ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isVisibleOnWebsite ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 text-[11px] mb-1">Description / Notes (Optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Covers library access, computer labs, and digital portal membership"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={showInheritanceConfirmation ? () => setShowInheritanceConfirmation(false) : onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {showInheritanceConfirmation ? 'Back to Edit' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleValidateAndSubmit}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                {showInheritanceConfirmation
                  ? 'Update Inherited Classes'
                  : isEditing
                  ? 'Save Changes'
                  : 'Add Fee'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
