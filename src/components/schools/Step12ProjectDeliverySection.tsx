'use client';

import React, { useMemo } from 'react';
import {
  Clock,
  Zap,
  Calendar,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  Layers,
  ArrowRight,
  CreditCard,
  FileText,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  TargetLaunchTimelineOption,
  DeliveryPriorityOption,
  ProjectDeliveryData,
} from '@/lib/types';
import {
  TARGET_TIMELINE_OPTIONS,
  DEADLINE_TYPE_OPTIONS,
  PHASE1_PRIORITY_CATALOG,
  PHASE2_PRIORITY_CATALOG,
  PRINCIPAL_DESIGNATIONS,
} from '@/lib/schoolIntake';
import {
  DELIVERY_OPTIONS,
  calculateExpeditedDeliveryFee,
  getDeliveryPricingForPlan,
  schoolPlans,
  type SchoolProductId,
} from '@/lib/schoolPricing';

interface Step12ProjectDeliverySectionProps {
  project: SchoolProject;
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
}

export default function Step12ProjectDeliverySection({
  project,
  intakeData,
  updateSectionField,
  updateSectionDirect,
}: Step12ProjectDeliverySectionProps) {
  const deliveryData: ProjectDeliveryData = useMemo(() => {
    return intakeData.projectDelivery || {};
  }, [intakeData.projectDelivery]);

  const productId = (project.product_id || 'school-website') as SchoolProductId;
  const currentPlan = schoolPlans.find((p) => p.id === productId) || schoolPlans[0];
  const planDeliveryPricing = getDeliveryPricingForPlan(productId);
  const canonicalExpeditedFee = calculateExpeditedDeliveryFee(productId);

  const activeTimeline = deliveryData.targetLaunchTimeline || 'within-3-4-weeks';
  const activePriority: DeliveryPriorityOption = deliveryData.deliveryPriority || 'standard';
  const isUrgent = activePriority === 'urgent';
  const isUrgentConfirmed = Boolean(deliveryData.urgentConfirmed);

  const phase1Selected = deliveryData.phase1Priorities || [
    'home_page',
    'about_school',
    'admissions_contact',
    'contact_locations',
    'mandatory_disclosures',
  ];

  const phase2Selected = deliveryData.phase2Priorities || ['events_calendar', 'extended_gallery'];

  // Handle timeline change
  const handleTimelineSelect = (timelineId: TargetLaunchTimelineOption) => {
    const updated: ProjectDeliveryData = {
      ...deliveryData,
      targetLaunchTimeline: timelineId,
      targetLaunchDate: timelineId === 'specific-date' ? deliveryData.targetLaunchDate || '' : timelineId,
    };
    updateSectionDirect('projectDelivery', updated);
  };

  // Handle priority change
  const handlePrioritySelect = (priority: DeliveryPriorityOption) => {
    const isNowUrgent = priority === 'urgent';
    const updated: ProjectDeliveryData = {
      ...deliveryData,
      deliveryPriority: priority,
      priority: priority === 'urgent' ? 'Critical' : priority === 'priority' ? 'High' : 'Medium',
      isUrgentRequested: isNowUrgent,
      urgentConfirmed: isNowUrgent ? deliveryData.urgentConfirmed ?? false : false,
      expeditedFeeINR: isNowUrgent ? canonicalExpeditedFee : 0,
      paymentStatus: isNowUrgent
        ? deliveryData.paymentStatus && deliveryData.paymentStatus !== 'not_requested'
          ? deliveryData.paymentStatus
          : 'requested'
        : 'not_requested',
    };
    updateSectionDirect('projectDelivery', updated);
  };

  // Handle urgent confirmation toggle
  const handleUrgentConfirmationToggle = (confirmed: boolean) => {
    const updated: ProjectDeliveryData = {
      ...deliveryData,
      urgentConfirmed: confirmed,
      expeditedFeeINR: canonicalExpeditedFee,
      isUrgentRequested: true,
      paymentStatus: confirmed ? 'requested' : 'not_requested',
    };
    updateSectionDirect('projectDelivery', updated);
  };

  // Toggle Phase 1 item
  const togglePhase1Item = (itemId: string) => {
    const current = new Set(phase1Selected);
    if (current.has(itemId)) {
      current.delete(itemId);
    } else {
      current.add(itemId);
    }
    const arr = Array.from(current);
    const updated: ProjectDeliveryData = {
      ...deliveryData,
      phase1Priorities: arr,
      phase1Requirements: arr.join(', '),
    };
    updateSectionDirect('projectDelivery', updated);
  };

  // Toggle Phase 2 item
  const togglePhase2Item = (itemId: string) => {
    const current = new Set(phase2Selected);
    if (current.has(itemId)) {
      current.delete(itemId);
    } else {
      current.add(itemId);
    }
    const arr = Array.from(current);
    const updated: ProjectDeliveryData = {
      ...deliveryData,
      phase2Priorities: arr,
      phase2Requirements: arr.join(', '),
    };
    updateSectionDirect('projectDelivery', updated);
  };

  // Fast pre-fill decision maker
  const handleSelectPreFillContact = (type: 'primary_contact' | 'principal' | 'super_admin' | 'custom') => {
    let name = '';
    let role = '';
    let email = '';
    let phone = '';

    if (type === 'primary_contact') {
      name = project.primary_contact_name || '';
      role = 'Primary Institutional Contact';
      email = project.primary_contact_email || '';
      phone = project.primary_contact_phone || '';
    } else if (type === 'principal') {
      name = intakeData.leadership?.principalName || project.primary_contact_name || '';
      role = intakeData.leadership?.principalDesignation || 'Principal';
      email = intakeData.leadership?.principalEmail || project.primary_contact_email || '';
      phone = intakeData.leadership?.principalPhone || project.primary_contact_phone || '';
    } else if (type === 'super_admin') {
      name = intakeData.usersAccess?.superAdminFullName || project.primary_contact_name || '';
      role = intakeData.usersAccess?.superAdminDesignation || 'Super Administrator';
      email = intakeData.usersAccess?.superAdminEmail || project.primary_contact_email || '';
      phone = intakeData.usersAccess?.superAdminPhone || project.primary_contact_phone || '';
    } else {
      name = deliveryData.decisionMakerName || '';
      role = deliveryData.decisionMakerRole || 'Authorized Decision Maker';
      email = deliveryData.decisionMakerEmail || '';
      phone = deliveryData.decisionMakerPhone || '';
    }

    const updated: ProjectDeliveryData = {
      ...deliveryData,
      decisionMakerType: type,
      decisionMakerName: name,
      decisionMakerRole: role,
      decisionMakerEmail: email,
      decisionMakerPhone: phone,
      decisionMakers: `${name} (${role})`,
      approvalAuthority: name,
    };
    updateSectionDirect('projectDelivery', updated);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* ── Top Notice: Non-promissory Capacity Disclaimer ────────── */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-4 flex items-start space-x-3 text-[#334155] shadow-2xs">
        <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-[#131B2E] block">Preferred Delivery Timeline &amp; Scoping Policy</span>
          <p className="leading-relaxed text-[11px] text-[#475569]">
            This is your preferred launch timeline. Ekaagra will confirm the final delivery schedule after reviewing the onboarding information and project scope.
          </p>
        </div>
      </div>

      {/* ── CARD 1: Target Launch Timeline ────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">1. Target Launch Timeline *</h3>
          </div>
          <span className="text-[10px] font-bold text-[#4338CA] bg-white border border-[#C7D2FE] px-2 py-0.5 rounded-md">
            Required
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Select your desired time horizon for public staging preview and initial deployment:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {TARGET_TIMELINE_OPTIONS.map((opt) => {
            const isSelected = activeTimeline === opt.id;
            return (
              <label
                key={opt.id}
                htmlFor={`timeline-opt-${opt.id}`}
                className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  id={`timeline-opt-${opt.id}`}
                  name="targetLaunchTimeline"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => handleTimelineSelect(opt.id)}
                  className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div className="truncate">
                  <span className={`block font-semibold text-xs leading-snug truncate ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {opt.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5 line-clamp-1">
                    {opt.helper}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Specific Date Picker (Conditional) */}
        {activeTimeline === 'specific-date' && (
          <div className="mt-4 p-4 bg-white border border-[#C7D2FE] rounded-xl space-y-2 animate-in fade-in-50 duration-200">
            <label htmlFor="targetLaunchDatePicker" className="block font-bold text-[#131B2E] text-xs">
              Target Launch Date *
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                id="targetLaunchDatePicker"
                type="date"
                value={deliveryData.targetLaunchDate && deliveryData.targetLaunchDate !== 'specific-date' ? deliveryData.targetLaunchDate : ''}
                onChange={(e) => updateSectionField('projectDelivery', 'targetLaunchDate', e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-[#131B2E] font-medium hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition text-xs"
                required
              />
              <p className="text-[11px] text-[#64748B]">
                Specify the milestone deadline (e.g. school reopening, board inspection, admissions start).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 2: Delivery Priority ─────────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">2. Delivery Priority</h3>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md">
            Queue Priority
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Choose standard project staging or request fast-tracked engineering queue scheduling:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {DELIVERY_OPTIONS.map((opt) => {
            const isSelected = activePriority === opt.id;
            const isUrgentCard = opt.id === 'urgent';
            return (
              <div
                key={opt.id}
                onClick={() => handlePrioritySelect(opt.id)}
                className={`relative rounded-2xl border p-4 cursor-pointer transition flex flex-col justify-between space-y-3 select-none ${
                  isSelected
                    ? isUrgentCard
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400 shadow-sm'
                      : 'bg-[#EEF2FF] border-[#C7D2FE] ring-2 ring-[#4338CA] shadow-sm'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/50'
                }`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handlePrioritySelect(opt.id);
                  }
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUrgentCard
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isSelected
                          ? 'bg-[#4338CA] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.badge}
                    </span>
                    <input
                      type="radio"
                      name="deliveryPriorityGroup"
                      id={`priority-${opt.id}`}
                      checked={isSelected}
                      onChange={() => handlePrioritySelect(opt.id)}
                      className="text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0 cursor-pointer"
                      aria-label={opt.label}
                    />
                  </div>

                  <div>
                    <h4 className={`font-bold text-sm ${isSelected ? 'text-[#131B2E]' : 'text-[#334155]'}`}>
                      {opt.label}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">Schedule:</span>
                  <span className="font-semibold text-[#131B2E]">
                    {opt.id === 'standard'
                      ? planDeliveryPricing.standardTurnaround
                      : opt.id === 'priority'
                      ? planDeliveryPricing.priorityTurnaround
                      : planDeliveryPricing.urgentTurnaround}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Capacity disclaimer for Priority & Urgent */}
        {(activePriority === 'priority' || activePriority === 'urgent') && (
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center gap-2 text-[11px] text-[#64748B]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Expedited delivery is subject to Ekaagra&apos;s current project capacity and final confirmation.
            </span>
          </div>
        )}
      </div>

      {/* ── CARD 3: Urgent / Expedited Delivery Surcharge Panel ───── */}
      {isUrgent && (
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 border border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  Optional Paid Service
                </span>
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">
                  Expedited Delivery &amp; Priority Fast-Track Surcharge
                </h3>
              </div>
            </div>
            <span className="text-sm font-extrabold text-amber-900 font-mono bg-white px-3 py-1 rounded-xl border border-amber-200">
              +{planDeliveryPricing.expeditedFeeDisplay}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-white/80 p-4 rounded-xl border border-amber-200/70">
              <span className="text-[11px] font-bold text-[#64748B] block uppercase tracking-wider">
                Cost Breakdown
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Selected Plan:</span>
                  <span className="font-bold text-[#131B2E]">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Standard Delivery:</span>
                  <span className="text-emerald-700 font-bold">Included (₹0)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-[#64748B]">Expedited Delivery Surcharge:</span>
                  <span className="text-amber-800 font-bold">+{planDeliveryPricing.expeditedFeeDisplay}</span>
                </div>
                <div className="flex justify-between pt-1 text-xs font-bold">
                  <span className="text-[#131B2E]">Total Additional Charge:</span>
                  <span className="text-amber-900">₹{canonicalExpeditedFee.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-white/80 p-4 rounded-xl border border-amber-200/70 text-[11px] text-[#475569] leading-relaxed">
              <span className="font-bold text-[#131B2E] block text-xs">What this fee covers:</span>
              <ul className="space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span>Dedicated full-time frontend &amp; CMS engineering sprint allocation.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span>Prioritized institutional asset review &amp; DNS propagation clearance.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span>Daily staging review sync with your designated school decision maker.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mandatory Active Opt-In Confirmation Checkbox */}
          <div className="pt-2 border-t border-amber-200">
            <label
              htmlFor="urgentConfirmationCheckbox"
              className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer select-none transition ${
                isUrgentConfirmed
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-white border-amber-300 hover:border-amber-400'
              }`}
            >
              <input
                id="urgentConfirmationCheckbox"
                type="checkbox"
                checked={isUrgentConfirmed}
                onChange={(e) => handleUrgentConfirmationToggle(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0 cursor-pointer"
                required
              />
              <div className="space-y-0.5">
                <span className="block font-bold text-xs text-[#131B2E]">
                  I understand that expedited delivery adds ₹{canonicalExpeditedFee.toLocaleString('en-IN')} to my order and I want to request it. *
                </span>
                <span className="block text-[11px] text-[#64748B]">
                  Selecting this option records your expedited delivery request. Ekaagra will confirm availability and provide payment instructions prior to kickoff.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ── CARD 4: Phase 1 — Launch Essentials ───────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">3. Phase 1 — Launch Essentials *</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-white border border-[#C7D2FE] px-2 py-0.5 rounded-md">
            {phase1Selected.length} Selected
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Identify features and institutional content that MUST be complete and published for initial public go-live:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {PHASE1_PRIORITY_CATALOG.map((item) => {
            const isSupported = item.applicableProducts.includes(productId);
            const isSelected = phase1Selected.includes(item.id);

            return (
              <label
                key={item.id}
                htmlFor={`phase1-${item.id}`}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition select-none ${
                  !isSupported
                    ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20 cursor-pointer'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/60 cursor-pointer'
                }`}
              >
                <input
                  id={`phase1-${item.id}`}
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSupported}
                  onChange={() => isSupported && togglePhase1Item(item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div className="truncate">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`block font-semibold text-xs leading-snug truncate ${
                        isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5 line-clamp-2">
                    {item.description}
                  </span>
                  {!isSupported && item.requiresUpgradeText && (
                    <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {item.requiresUpgradeText}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── CARD 5: Phase 2 — Later Enhancements ──────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">4. Phase 2 — Later Enhancements</h3>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md">
            {phase2Selected.length} Enhancements
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Select secondary modules or extended content that can be phased in following initial launch:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {PHASE2_PRIORITY_CATALOG.map((item) => {
            const isSupported = item.applicableProducts.includes(productId);
            const isSelected = phase2Selected.includes(item.id);

            return (
              <label
                key={item.id}
                htmlFor={`phase2-${item.id}`}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition select-none ${
                  !isSupported
                    ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20 cursor-pointer'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/60 cursor-pointer'
                }`}
              >
                <input
                  id={`phase2-${item.id}`}
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSupported}
                  onChange={() => isSupported && togglePhase2Item(item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div className="truncate">
                  <span
                    className={`block font-semibold text-xs leading-snug truncate ${
                      isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5 line-clamp-2">
                    {item.description}
                  </span>
                  {!isSupported && item.requiresUpgradeText && (
                    <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {item.requiresUpgradeText}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── CARD 6: Important Deadlines (Optional) ────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">5. Important Institutional Deadlines</h3>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md">
            Optional
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Record specific institutional dates that the engineering team should accommodate in the staging schedule:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="deadlineTypeSelect" className="block font-bold text-[#334155] mb-1">
              Deadline Type
            </label>
            <select
              id="deadlineTypeSelect"
              value={deliveryData.importantDeadlineType || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'importantDeadlineType', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
            >
              <option value="">-- Select Milestone Event --</option>
              {DEADLINE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deadlineDatePicker" className="block font-bold text-[#334155] mb-1">
              Milestone Date
            </label>
            <input
              id="deadlineDatePicker"
              type="date"
              value={deliveryData.importantDeadlineDate || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'importantDeadlineDate', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
            />
          </div>

          <div>
            <label htmlFor="deadlineNotesInput" className="block font-bold text-[#334155] mb-1">
              Milestone Context / Note
            </label>
            <input
              id="deadlineNotesInput"
              type="text"
              placeholder="e.g. Website should be ready before open house"
              value={deliveryData.importantDeadlineNotes || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'importantDeadlineNotes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
            />
          </div>
        </div>
      </div>

      {/* ── CARD 7: Designated Project Decision Maker ─────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E]">6. Project Decision Maker *</h3>
          </div>
          <span className="text-[10px] font-bold text-[#4338CA] bg-white border border-[#C7D2FE] px-2 py-0.5 rounded-md">
            Required
          </span>
        </div>

        <p className="text-[#64748B] text-xs">
          Designate the authorized school official with final sign-off authority for staging approvals and delivery milestones:
        </p>

        {/* Quick Contact Pre-Fill Selector */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-[11px] font-semibold text-[#64748B]">Use Existing Contact:</span>
          {project.primary_contact_name && (
            <button
              type="button"
              onClick={() => handleSelectPreFillContact('primary_contact')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                deliveryData.decisionMakerType === 'primary_contact'
                  ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] font-bold'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              Primary Contact ({project.primary_contact_name})
            </button>
          )}

          {intakeData.leadership?.principalName && (
            <button
              type="button"
              onClick={() => handleSelectPreFillContact('principal')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                deliveryData.decisionMakerType === 'principal'
                  ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] font-bold'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              Principal ({intakeData.leadership.principalName})
            </button>
          )}

          {intakeData.usersAccess?.superAdminFullName && (
            <button
              type="button"
              onClick={() => handleSelectPreFillContact('super_admin')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                deliveryData.decisionMakerType === 'super_admin'
                  ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] font-bold'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              Super Admin ({intakeData.usersAccess.superAdminFullName})
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectPreFillContact('custom')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
              deliveryData.decisionMakerType === 'custom'
                ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE] font-bold'
                : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-slate-50'
            }`}
          >
            Custom Contact
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label htmlFor="decisionMakerNameInput" className="block font-bold text-[#334155] mb-1">
              Full Name *
            </label>
            <input
              id="decisionMakerNameInput"
              type="text"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={deliveryData.decisionMakerName || ''}
              onChange={(e) => {
                const name = e.target.value;
                const updated: ProjectDeliveryData = {
                  ...deliveryData,
                  decisionMakerName: name,
                  decisionMakers: `${name} (${deliveryData.decisionMakerRole || 'Representative'})`,
                  approvalAuthority: name,
                };
                updateSectionDirect('projectDelivery', updated);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
              required
            />
          </div>

          <div>
            <label htmlFor="decisionMakerRoleInput" className="block font-bold text-[#334155] mb-1">
              Designation / Role *
            </label>
            <input
              id="decisionMakerRoleInput"
              type="text"
              placeholder="e.g. Principal / Secretary"
              list="principalRolesList"
              value={deliveryData.decisionMakerRole || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'decisionMakerRole', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
              required
            />
            <datalist id="principalRolesList">
              {PRINCIPAL_DESIGNATIONS.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="decisionMakerEmailInput" className="block font-bold text-[#334155] mb-1">
              Email Address *
            </label>
            <input
              id="decisionMakerEmailInput"
              type="email"
              placeholder="principal@school.edu.in"
              value={deliveryData.decisionMakerEmail || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'decisionMakerEmail', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
              required
            />
          </div>

          <div>
            <label htmlFor="decisionMakerPhoneInput" className="block font-bold text-[#334155] mb-1">
              Mobile Phone *
            </label>
            <input
              id="decisionMakerPhoneInput"
              type="tel"
              placeholder="10-digit mobile"
              value={deliveryData.decisionMakerPhone || ''}
              onChange={(e) => updateSectionField('projectDelivery', 'decisionMakerPhone', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs"
              required
            />
          </div>
        </div>
      </div>

      {/* ── CARD 8: Additional Delivery Notes ─────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-2xs">
        <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2">
          <FileText className="w-4 h-4 text-[#4338CA]" />
          <h3 className="font-bold text-sm text-[#131B2E]">7. Additional Delivery Notes</h3>
        </div>
        <textarea
          rows={3}
          value={deliveryData.deliveryNotes || ''}
          onChange={(e) => updateSectionField('projectDelivery', 'deliveryNotes', e.target.value)}
          placeholder="Tell us about important deadlines, dependencies, launch events, approvals, or anything else that may affect delivery."
          className="w-full p-3 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs leading-relaxed"
          aria-label="Additional Delivery Notes"
        />
      </div>

      {/* ── CARD 9: Delivery Plan Summary Panel ────────────────────── */}
      <div className="bg-gradient-to-br from-white to-[#FAF7F2] border border-[#CBD5E1] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-sm text-[#131B2E] uppercase tracking-wider">
              Project Delivery Plan Snapshot
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">Ready for Provisioning Review</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <span className="text-[10px] text-[#64748B] block font-bold uppercase tracking-wider">Target Timeframe</span>
            <span className="font-bold text-[#131B2E] mt-0.5 block truncate">
              {activeTimeline === 'specific-date' && deliveryData.targetLaunchDate
                ? deliveryData.targetLaunchDate
                : TARGET_TIMELINE_OPTIONS.find((t) => t.id === activeTimeline)?.label || 'Within 3–4 weeks'}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <span className="text-[10px] text-[#64748B] block font-bold uppercase tracking-wider">Priority</span>
            <span
              className={`font-bold mt-0.5 block truncate ${
                isUrgent ? 'text-amber-800' : activePriority === 'priority' ? 'text-[#4338CA]' : 'text-slate-800'
              }`}
            >
              {activePriority === 'urgent'
                ? 'Urgent / Expedited'
                : activePriority === 'priority'
                ? 'Priority Delivery'
                : 'Standard Delivery'}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <span className="text-[10px] text-[#64748B] block font-bold uppercase tracking-wider">Phase 1 Essentials</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">
              {phase1Selected.length} Components
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <span className="text-[10px] text-[#64748B] block font-bold uppercase tracking-wider">Decision Maker</span>
            <span className="font-bold text-[#131B2E] mt-0.5 block truncate">
              {deliveryData.decisionMakerName || 'Not designated'}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl">
            <span className="text-[10px] text-[#64748B] block font-bold uppercase tracking-wider">Expedited Status</span>
            <span
              className={`font-bold mt-0.5 block truncate ${
                isUrgent
                  ? isUrgentConfirmed
                    ? 'text-emerald-700'
                    : 'text-amber-800'
                  : 'text-slate-500'
              }`}
            >
              {isUrgent
                ? isUrgentConfirmed
                  ? `Requested (+₹${canonicalExpeditedFee.toLocaleString('en-IN')})`
                  : 'Awaiting Confirmation'
                : 'Not Requested'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
