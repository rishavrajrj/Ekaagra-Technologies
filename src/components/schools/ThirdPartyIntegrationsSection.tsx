'use client';

import React, { useState, useId, useMemo } from 'react';
import {
  CreditCard,
  MessageSquare,
  Smartphone,
  MessageCircle,
  UserCheck,
  Award,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  IntegrationsData,
  IntegrationRequirementStatus,
  PaymentGatewayProvider,
  PaymentEnvironment,
  PaymentIntendedUse,
  SmsGatewayProvider,
  SmsIntendedUse,
  WhatsAppProvider,
  WhatsAppBusinessAccountStatus,
  WhatsAppNumberStatus,
  WhatsAppIntendedUse,
  BiometricRequirementStatus,
  BiometricDeviceType,
  BiometricApiAvailability,
  DigiLockerRequirementStatus,
  DigiLockerIntendedUse,
  AdditionalIntegrationItem,
  SchoolProject,
} from '@/lib/types';
import type { IntakeSectionKey } from '@/lib/schoolIntake';
import {
  INTEGRATION_REQUIREMENT_STATUSES,
  PAYMENT_GATEWAY_PROVIDERS,
  PAYMENT_ENVIRONMENTS,
  PAYMENT_INTENDED_USES,
  SMS_GATEWAY_PROVIDERS,
  SMS_INTENDED_USES,
  WHATSAPP_PROVIDERS,
  WHATSAPP_ACCOUNT_STATUSES,
  WHATSAPP_NUMBER_STATUSES,
  WHATSAPP_INTENDED_USES,
  BIOMETRIC_STATUSES,
  BIOMETRIC_DEVICE_TYPES,
  BIOMETRIC_API_AVAILABILITIES,
  DIGILOCKER_STATUSES,
  DIGILOCKER_INTENDED_USES,
  PRESET_ADDITIONAL_INTEGRATIONS,
  normalizeIntegrationsData,
  syncIntegrationsLegacyMirrors,
  validateIntegrationsData,
  getIntegrationsSectionScore,
  getIntegrationsSummary,
} from '@/lib/integrationsUtils';

interface ThirdPartyIntegrationsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: <K extends keyof UniversalIntakeData>(
    section: K,
    field: string,
    value: unknown
  ) => void;
  updateSectionDirect?: <K extends keyof UniversalIntakeData>(
    section: K,
    value: UniversalIntakeData[K]
  ) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: IntakeSectionKey) => void;
}

export default function ThirdPartyIntegrationsSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
}: ThirdPartyIntegrationsSectionProps) {
  const baseId = useId();

  // Normalize data with safe defaults and legacy preservation
  const config = useMemo(() => {
    return normalizeIntegrationsData(intakeData.integrationsConfig);
  }, [intakeData.integrationsConfig]);

  // Validation
  const validation = useMemo(() => {
    return validateIntegrationsData(config);
  }, [config]);

  // Completion score
  const score = useMemo(() => {
    return getIntegrationsSectionScore(config);
  }, [config]);

  // Summary badges
  const summaryItems = useMemo(() => {
    return getIntegrationsSummary(config);
  }, [config]);

  // Accordion state for additional integrations
  const [showCustomIntegrations, setShowCustomIntegrations] = useState(false);

  // Helper to commit state updates safely
  const commitConfig = (updated: IntegrationsData) => {
    const synced = syncIntegrationsLegacyMirrors(updated);
    if (updateSectionDirect) {
      updateSectionDirect('integrationsConfig', synced);
    } else {
      updateSectionField('integrationsConfig', 'payment', synced.payment);
      updateSectionField('integrationsConfig', 'sms', synced.sms);
      updateSectionField('integrationsConfig', 'whatsapp', synced.whatsapp);
      updateSectionField('integrationsConfig', 'biometrics', synced.biometrics);
      updateSectionField('integrationsConfig', 'digilocker', synced.digilocker);
      updateSectionField('integrationsConfig', 'additionalIntegrations', synced.additionalIntegrations);
      updateSectionField('integrationsConfig', 'paymentGateway', synced.paymentGateway);
      updateSectionField('integrationsConfig', 'smsGateway', synced.smsGateway);
      updateSectionField('integrationsConfig', 'whatsappProvider', synced.whatsappProvider);
      updateSectionField('integrationsConfig', 'biometricAttendanceSync', synced.biometricAttendanceSync);
      updateSectionField('integrationsConfig', 'selectedIntegrations', synced.selectedIntegrations);
    }
  };

  // Handlers for Category A: Payment Gateway
  const handlePaymentStatusChange = (status: IntegrationRequirementStatus) => {
    const payment = { ...config.payment!, status };
    if (status === 'not_required') {
      payment.provider = 'none';
    } else if (payment.provider === 'none') {
      payment.provider = 'razorpay';
    }
    commitConfig({ ...config, payment });
  };

  const handlePaymentProviderChange = (provider: PaymentGatewayProvider) => {
    const payment = { ...config.payment!, provider };
    commitConfig({ ...config, payment });
  };

  const togglePaymentUse = (useKey: PaymentIntendedUse) => {
    const current = config.payment?.intendedUses || [];
    const next = current.includes(useKey)
      ? current.filter((u) => u !== useKey)
      : [...current, useKey];
    commitConfig({ ...config, payment: { ...config.payment!, intendedUses: next } });
  };

  // Handlers for Category B: SMS Gateway
  const handleSmsStatusChange = (status: IntegrationRequirementStatus) => {
    const sms = { ...config.sms!, status };
    if (status === 'not_required') {
      sms.provider = 'none';
    } else if (sms.provider === 'none') {
      sms.provider = 'msg91';
    }
    commitConfig({ ...config, sms });
  };

  const handleSmsProviderChange = (provider: SmsGatewayProvider) => {
    const sms = { ...config.sms!, provider };
    commitConfig({ ...config, sms });
  };

  const toggleSmsUse = (useKey: SmsIntendedUse) => {
    const current = config.sms?.intendedUses || [];
    const next = current.includes(useKey)
      ? current.filter((u) => u !== useKey)
      : [...current, useKey];
    commitConfig({ ...config, sms: { ...config.sms!, intendedUses: next } });
  };

  // Handlers for Category C: WhatsApp
  const handleWhatsAppStatusChange = (status: IntegrationRequirementStatus) => {
    const whatsapp = { ...config.whatsapp!, status };
    if (status === 'not_required') {
      whatsapp.provider = 'none';
    } else if (whatsapp.provider === 'none') {
      whatsapp.provider = 'meta_cloud_api';
    }
    commitConfig({ ...config, whatsapp });
  };

  const handleWhatsAppProviderChange = (provider: WhatsAppProvider) => {
    const whatsapp = { ...config.whatsapp!, provider };
    commitConfig({ ...config, whatsapp });
  };

  const toggleWhatsAppUse = (useKey: WhatsAppIntendedUse) => {
    const current = config.whatsapp?.intendedUses || [];
    const next = current.includes(useKey)
      ? current.filter((u) => u !== useKey)
      : [...current, useKey];
    commitConfig({ ...config, whatsapp: { ...config.whatsapp!, intendedUses: next } });
  };

  // Handlers for Category D: Biometrics
  const handleBiometricStatusChange = (status: BiometricRequirementStatus) => {
    const biometrics = { ...config.biometrics!, status };
    commitConfig({ ...config, biometrics });
  };

  // Handlers for Category E: DigiLocker
  const handleDigiLockerStatusChange = (status: DigiLockerRequirementStatus) => {
    const digilocker = { ...config.digilocker!, status };
    commitConfig({ ...config, digilocker });
  };

  const toggleDigiLockerUse = (useKey: DigiLockerIntendedUse) => {
    const current = config.digilocker?.intendedUses || [];
    const next = current.includes(useKey)
      ? current.filter((u) => u !== useKey)
      : [...current, useKey];
    commitConfig({ ...config, digilocker: { ...config.digilocker!, intendedUses: next } });
  };

  // Handlers for Category F: Additional Integrations
  const togglePresetIntegration = (presetId: string) => {
    const items = [...(config.additionalIntegrations || [])];
    const idx = items.findIndex((i) => i.id === presetId);
    if (idx !== -1) {
      const currentStatus = items[idx].requirementStatus;
      items[idx].requirementStatus = currentStatus === 'required' ? 'not_required' : 'required';
    } else {
      const preset = PRESET_ADDITIONAL_INTEGRATIONS.find((p) => p.id === presetId);
      if (preset) {
        items.push({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          requirementStatus: 'required',
        });
      }
    }
    commitConfig({ ...config, additionalIntegrations: items });
  };

  const addCustomIntegration = () => {
    const items = [...(config.additionalIntegrations || [])];
    const newId = `custom-int-${Date.now()}`;
    items.push({
      id: newId,
      name: '',
      description: '',
      requirementStatus: 'required',
    });
    commitConfig({ ...config, additionalIntegrations: items });
    setShowCustomIntegrations(true);
  };

  const removeCustomIntegration = (id: string) => {
    const items = (config.additionalIntegrations || []).filter((i) => i.id !== id);
    commitConfig({ ...config, additionalIntegrations: items });
  };

  const updateCustomIntegration = (id: string, field: 'name' | 'description' | 'requirementStatus', val: string) => {
    const items = (config.additionalIntegrations || []).map((i) => {
      if (i.id === id) {
        return { ...i, [field]: val };
      }
      return i;
    });
    commitConfig({ ...config, additionalIntegrations: items });
  };

  return (
    <div className="space-y-6">

      {/* ─── SECURITY NOTICE BANNER ────────────────────────────────────────── */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-amber-950">Security Notice — Planning Requirements Only</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                No Secrets
              </span>
            </div>
            <p className="leading-relaxed text-[#78350F] text-xs">
              Do not enter API keys, passwords, access tokens, secret keys, private keys, or credentials here.
              This section is solely for declaring technical requirements and vendor preferences.
              Production gateway credentials and access tokens will be configured securely through your authenticated administrator dashboard after onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* ─── CARD 1: PAYMENT GATEWAY ───────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">1. Payment Gateway Integration</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full">
                  Fees &amp; Billing
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enable secure online fee collection, admission fees, and payments directly into your institution's bank account.
              </p>
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <label htmlFor={`${baseId}-pg-status`} className="sr-only">Payment Gateway Status</label>
            <select
              id={`${baseId}-pg-status`}
              value={config.payment?.status || 'required'}
              onChange={(e) => handlePaymentStatusChange(e.target.value as IntegrationRequirementStatus)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
            >
              {INTEGRATION_REQUIREMENT_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conditional Configuration when Required / Optional */}
        {config.payment?.status !== 'not_required' && config.payment?.status !== 'not_decided' ? (
          <div className="space-y-5">
            {/* Gateway Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Preferred Payment Gateway Provider *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PAYMENT_GATEWAY_PROVIDERS.map((provider) => {
                  const isSelected = config.payment?.provider === provider.value;
                  return (
                    <button
                      key={provider.value}
                      type="button"
                      onClick={() => handlePaymentProviderChange(provider.value)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#EEF2FF]/60 ring-2 ring-[#4338CA]/20 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                            {provider.label}
                          </span>
                          {provider.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                provider.recommended
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-[#475569]'
                              }`}
                            >
                              {provider.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {provider.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 flex items-center space-x-1 text-[11px] font-bold text-[#4338CA]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Provider Name Input when 'other' is selected */}
            {config.payment?.provider === 'other' && (
              <div>
                <label htmlFor={`${baseId}-pg-other`} className="block text-xs font-bold text-[#334155] mb-1">
                  Payment Gateway / Provider Name *
                </label>
                <input
                  id={`${baseId}-pg-other`}
                  type="text"
                  value={config.payment?.otherProvider || ''}
                  onChange={(e) => {
                    const payment = { ...config.payment!, otherProvider: e.target.value };
                    commitConfig({ ...config, payment });
                  }}
                  placeholder="e.g. HDFC SmartHub, ICICI EasyPay, BillDesk, Cashfree"
                  className={`w-full max-w-md px-3.5 py-2.5 rounded-xl text-xs bg-white border text-[#131B2E] focus:outline-hidden transition shadow-2xs ${
                    validation.errors['payment.otherProvider']
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10'
                  }`}
                />
                {validation.errors['payment.otherProvider'] && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {validation.errors['payment.otherProvider']}
                  </p>
                )}
              </div>
            )}

            {/* Razorpay specific helper note */}
            {config.payment?.provider === 'razorpay' && (
              <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#64748B] flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-[#131B2E] block">Razorpay Native Integration</span>
                  <p>
                    Ekaagra provides native Razorpay checkout integration with instant UPI QR, split settlements, and automatic payment reconciliation against student fee ledgers.
                    Your Key ID and Secret will be connected securely during production deployment.
                  </p>
                </div>
              </div>
            )}

            {/* Target Environment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Deployment Environment
                </label>
                <div className="flex gap-2">
                  {PAYMENT_ENVIRONMENTS.map((env) => {
                    const isSelected = config.payment?.environment === env.value;
                    return (
                      <button
                        key={env.value}
                        type="button"
                        onClick={() => {
                          commitConfig({
                            ...config,
                            payment: { ...config.payment!, environment: env.value },
                          });
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                          isSelected
                            ? 'border-[#4338CA] bg-[#EEF2FF] text-[#4338CA] font-bold shadow-2xs'
                            : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-slate-50'
                        }`}
                      >
                        {env.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intended Uses Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Intended Payment Categories
                </label>
                <div className="space-y-1.5">
                  {PAYMENT_INTENDED_USES.map((use) => {
                    const isChecked = (config.payment?.intendedUses || []).includes(use.key);
                    return (
                      <label
                        key={use.key}
                        className="flex items-center space-x-2.5 text-xs text-[#334155] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePaymentUse(use.key)}
                          className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                        />
                        <span>{use.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#64748B]">
            {config.payment?.status === 'not_required' ? (
              <span>Online payment gateway is marked as <strong>Not Required</strong>. School fee collection will operate in offline mode (cash/cheque/DD).</span>
            ) : (
              <span>Payment gateway selection is <strong>Not Decided</strong>. Gateway options will be reviewed during technical consultation.</span>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 2: SMS & DLT GATEWAY ─────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">2. SMS / OTP &amp; Bulk Messaging</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  DLT Routing
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Send DLT-compliant transaction SMS for one-time passwords (OTPs), attendance absentee alerts, and fee due notices.
              </p>
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <label htmlFor={`${baseId}-sms-status`} className="sr-only">SMS Gateway Status</label>
            <select
              id={`${baseId}-sms-status`}
              value={config.sms?.status || 'required'}
              onChange={(e) => handleSmsStatusChange(e.target.value as IntegrationRequirementStatus)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
            >
              {INTEGRATION_REQUIREMENT_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.sms?.status !== 'not_required' && config.sms?.status !== 'not_decided' ? (
          <div className="space-y-5">
            {/* SMS Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Preferred SMS Gateway Provider *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SMS_GATEWAY_PROVIDERS.map((provider) => {
                  const isSelected = config.sms?.provider === provider.value;
                  return (
                    <button
                      key={provider.value}
                      type="button"
                      onClick={() => handleSmsProviderChange(provider.value)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#EEF2FF]/60 ring-2 ring-[#4338CA]/20 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                            {provider.label}
                          </span>
                          {provider.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                provider.recommended
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-[#475569]'
                              }`}
                            >
                              {provider.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {provider.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 flex items-center space-x-1 text-[11px] font-bold text-[#4338CA]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Provider Name Input when 'other' is selected */}
            {config.sms?.provider === 'other' && (
              <div>
                <label htmlFor={`${baseId}-sms-other`} className="block text-xs font-bold text-[#334155] mb-1">
                  SMS Gateway / Aggregator Name *
                </label>
                <input
                  id={`${baseId}-sms-other`}
                  type="text"
                  value={config.sms?.otherProvider || ''}
                  onChange={(e) => {
                    const sms = { ...config.sms!, otherProvider: e.target.value };
                    commitConfig({ ...config, sms });
                  }}
                  placeholder="e.g. Karix, Gupshup SMS, Jio DLT Route, ValueFirst"
                  className={`w-full max-w-md px-3.5 py-2.5 rounded-xl text-xs bg-white border text-[#131B2E] focus:outline-hidden transition shadow-2xs ${
                    validation.errors['sms.otherProvider']
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10'
                  }`}
                />
                {validation.errors['sms.otherProvider'] && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {validation.errors['sms.otherProvider']}
                  </p>
                )}
              </div>
            )}

            {/* Intended Use Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Select Intended SMS Use Cases
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SMS_INTENDED_USES.map((use) => {
                  const isChecked = (config.sms?.intendedUses || []).includes(use.key);
                  return (
                    <label
                      key={use.key}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-blue-200 bg-blue-50/50 text-[#131B2E]'
                          : 'border-[#E2E8F0] bg-white hover:bg-slate-50/60 text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSmsUse(use.key)}
                        className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                      >
                      </input>
                      <div>
                        <span className="block font-semibold text-xs leading-snug">{use.label}</span>
                        <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5">{use.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#64748B]">
            {config.sms?.status === 'not_required' ? (
              <span>SMS gateway is marked as <strong>Not Required</strong>. School communication will rely on Mobile App Push and WhatsApp.</span>
            ) : (
              <span>SMS gateway is <strong>Not Decided</strong>. DLT registration and gateway routes will be evaluated later.</span>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 3: WHATSAPP BUSINESS MESSAGING ───────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">3. WhatsApp Business API</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  High Open-Rate
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Send fee payment links, digital receipt PDFs, daily attendance alerts, and event photos over verified WhatsApp.
              </p>
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <label htmlFor={`${baseId}-wa-status`} className="sr-only">WhatsApp Status</label>
            <select
              id={`${baseId}-wa-status`}
              value={config.whatsapp?.status || 'required'}
              onChange={(e) => handleWhatsAppStatusChange(e.target.value as IntegrationRequirementStatus)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
            >
              {INTEGRATION_REQUIREMENT_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.whatsapp?.status !== 'not_required' && config.whatsapp?.status !== 'not_decided' ? (
          <div className="space-y-5">
            {/* WhatsApp Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                WhatsApp API Provider *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WHATSAPP_PROVIDERS.map((provider) => {
                  const isSelected = config.whatsapp?.provider === provider.value;
                  return (
                    <button
                      key={provider.value}
                      type="button"
                      onClick={() => handleWhatsAppProviderChange(provider.value)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#EEF2FF]/60 ring-2 ring-[#4338CA]/20 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                            {provider.label}
                          </span>
                          {provider.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                provider.recommended
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-[#475569]'
                              }`}
                            >
                              {provider.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {provider.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 flex items-center space-x-1 text-[11px] font-bold text-[#4338CA]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Provider Name Input when 'other' is selected */}
            {config.whatsapp?.provider === 'other' && (
              <div>
                <label htmlFor={`${baseId}-wa-other`} className="block text-xs font-bold text-[#334155] mb-1">
                  WhatsApp BSP / Partner Name *
                </label>
                <input
                  id={`${baseId}-wa-other`}
                  type="text"
                  value={config.whatsapp?.otherProvider || ''}
                  onChange={(e) => {
                    const whatsapp = { ...config.whatsapp!, otherProvider: e.target.value };
                    commitConfig({ ...config, whatsapp });
                  }}
                  placeholder="e.g. Wati, AiSensy, Interakt, Twilio, MessageBird"
                  className={`w-full max-w-md px-3.5 py-2.5 rounded-xl text-xs bg-white border text-[#131B2E] focus:outline-hidden transition shadow-2xs ${
                    validation.errors['whatsapp.otherProvider']
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10'
                  }`}
                />
                {validation.errors['whatsapp.otherProvider'] && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {validation.errors['whatsapp.otherProvider']}
                  </p>
                )}
              </div>
            )}

            {/* Meta Cloud API Readiness Planning Fields */}
            {config.whatsapp?.provider === 'meta_cloud_api' && (
              <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-4 space-y-4">
                <div className="border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#131B2E]">Meta WhatsApp Cloud API Readiness (Non-Secret Planning)</span>
                  <span className="text-[10px] text-[#64748B]">Zero per-message broker fees</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor={`${baseId}-wa-acct`} className="block font-semibold text-[#334155] mb-1">
                      Meta Business Account Available?
                    </label>
                    <select
                      id={`${baseId}-wa-acct`}
                      value={config.whatsapp?.businessAccountStatus || 'need_setup'}
                      onChange={(e) => {
                        const whatsapp = {
                          ...config.whatsapp!,
                          businessAccountStatus: e.target.value as WhatsAppBusinessAccountStatus,
                        };
                        commitConfig({ ...config, whatsapp });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
                    >
                      {WHATSAPP_ACCOUNT_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`${baseId}-wa-phone`} className="block font-semibold text-[#334155] mb-1">
                      WhatsApp Business Dedicated Number
                    </label>
                    <select
                      id={`${baseId}-wa-phone`}
                      value={config.whatsapp?.phoneNumberStatus || 'need_configuration'}
                      onChange={(e) => {
                        const whatsapp = {
                          ...config.whatsapp!,
                          phoneNumberStatus: e.target.value as WhatsAppNumberStatus,
                        };
                        commitConfig({ ...config, whatsapp });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
                    >
                      {WHATSAPP_NUMBER_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[10px] text-[#64748B]">
                  Do not enter Access Tokens, System User Keys, or Phone Number IDs here. The Ekaagra engineering team will guide you through Meta Business Manager verification during staging.
                </p>
              </div>
            )}

            {/* Intended Use Checkboxes */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Select WhatsApp Use Cases
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {WHATSAPP_INTENDED_USES.map((use) => {
                  const isChecked = (config.whatsapp?.intendedUses || []).includes(use.key);
                  return (
                    <label
                      key={use.key}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/50 text-[#131B2E]'
                          : 'border-[#E2E8F0] bg-white hover:bg-slate-50/60 text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWhatsAppUse(use.key)}
                        className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                      >
                      </input>
                      <div>
                        <span className="block font-semibold text-xs leading-snug">{use.label}</span>
                        <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5">{use.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#64748B]">
            {config.whatsapp?.status === 'not_required' ? (
              <span>WhatsApp integration is marked as <strong>Not Required</strong>. School will not utilize automated WhatsApp messaging.</span>
            ) : (
              <span>WhatsApp integration is <strong>Not Decided</strong>. Options will be discussed during project setup.</span>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 4: BIOMETRICS & ATTENDANCE DEVICES ────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">4. Biometrics &amp; Attendance Hardware</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Campus Hardware
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Integrate campus biometric thumb scanners, facial recognition kiosks, or RFID tap gates with cloud attendance records.
              </p>
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <label htmlFor={`${baseId}-bio-status`} className="sr-only">Biometrics Status</label>
            <select
              id={`${baseId}-bio-status`}
              value={config.biometrics?.status || 'required'}
              onChange={(e) => handleBiometricStatusChange(e.target.value as BiometricRequirementStatus)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
            >
              {BIOMETRIC_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.biometrics?.status === 'required' ||
        config.biometrics?.status === 'existing' ||
        config.biometrics?.status === 'planning_to_install' ? (
          <div className="space-y-5">
            {/* Device Type Selection */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Primary Hardware Device Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BIOMETRIC_DEVICE_TYPES.map((type) => {
                  const isSelected = config.biometrics?.deviceType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        const biometrics = { ...config.biometrics!, deviceType: type.value };
                        commitConfig({ ...config, biometrics });
                      }}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#EEF2FF]/60 ring-2 ring-[#4338CA]/20 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                            {type.label}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-[#475569]">
                            {type.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] leading-snug">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-2.5 flex items-center space-x-1 text-[11px] font-bold text-[#4338CA]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Device Type Input */}
            {config.biometrics?.deviceType === 'other' && (
              <div>
                <label htmlFor={`${baseId}-bio-other`} className="block text-xs font-bold text-[#334155] mb-1">
                  Custom Hardware Specification *
                </label>
                <input
                  id={`${baseId}-bio-other`}
                  type="text"
                  value={config.biometrics?.otherDeviceType || ''}
                  onChange={(e) => {
                    const biometrics = { ...config.biometrics!, otherDeviceType: e.target.value };
                    commitConfig({ ...config, biometrics });
                  }}
                  placeholder="e.g. Iris Scanner, Handheld Barcode Scanner, Turnstile Gate"
                  className="w-full max-w-md px-3.5 py-2.5 rounded-xl text-xs bg-white border border-[#E2E8F0] text-[#131B2E] focus:outline-hidden transition shadow-2xs"
                />
              </div>
            )}

            {/* Planning Details: Count, Vendor, API */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
              <div>
                <label htmlFor={`${baseId}-bio-count`} className="block font-bold text-[#334155] mb-1">
                  Total Campus Devices Count
                </label>
                <input
                  id={`${baseId}-bio-count`}
                  type="number"
                  min={0}
                  value={config.biometrics?.deviceCount ?? 2}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const biometrics = {
                      ...config.biometrics!,
                      deviceCount: isNaN(parsed) ? 0 : parsed,
                    };
                    commitConfig({ ...config, biometrics });
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl bg-white border text-[#131B2E] transition shadow-2xs ${
                    validation.errors['biometrics.deviceCount']
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#4338CA]'
                  }`}
                />
                {validation.errors['biometrics.deviceCount'] && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {validation.errors['biometrics.deviceCount']}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${baseId}-bio-vendor`} className="block font-bold text-[#334155] mb-1">
                  Hardware Vendor / Model (if known)
                </label>
                <input
                  id={`${baseId}-bio-vendor`}
                  type="text"
                  value={config.biometrics?.vendor || ''}
                  onChange={(e) => {
                    const biometrics = { ...config.biometrics!, vendor: e.target.value };
                    commitConfig({ ...config, biometrics });
                  }}
                  placeholder="e.g. eSSL K90 Pro, Realtime T502, Matrix"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] focus:border-[#4338CA] transition shadow-2xs"
                />
              </div>

              <div>
                <label htmlFor={`${baseId}-bio-api`} className="block font-bold text-[#334155] mb-1">
                  Integration Protocol Available?
                </label>
                <select
                  id={`${baseId}-bio-api`}
                  value={config.biometrics?.apiAvailability || 'not_sure'}
                  onChange={(e) => {
                    const biometrics = {
                      ...config.biometrics!,
                      apiAvailability: e.target.value as BiometricApiAvailability,
                    };
                    commitConfig({ ...config, biometrics });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] focus:border-[#4338CA] transition shadow-2xs"
                >
                  {BIOMETRIC_API_AVAILABILITIES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#64748B]">
            {config.biometrics?.status === 'not_required' ? (
              <span>Biometric hardware integration is marked as <strong>Not Required</strong>. Staff &amp; student attendance will be taken digitally via app/web portals.</span>
            ) : (
              <span>Hardware biometric selection is <strong>Not Decided</strong>. Can be added at any point during or after deployment.</span>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 5: DIGILOCKER INTEGRATION ────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">5. DigiLocker National Academic Depository</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                  Govt. of India
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Issue digitally signed marksheets, transfer certificates (TC), and academic transcripts to students' official DigiLocker repository.
              </p>
            </div>
          </div>

          {/* Status selector */}
          <div className="shrink-0">
            <label htmlFor={`${baseId}-digi-status`} className="sr-only">DigiLocker Status</label>
            <select
              id={`${baseId}-digi-status`}
              value={config.digilocker?.status || 'future'}
              onChange={(e) => handleDigiLockerStatusChange(e.target.value as DigiLockerRequirementStatus)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs font-semibold text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition"
            >
              {DIGILOCKER_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Status: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.digilocker?.status === 'required' || config.digilocker?.status === 'future' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">
                Intended DigiLocker Document Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DIGILOCKER_INTENDED_USES.map((use) => {
                  const isChecked = (config.digilocker?.intendedUses || []).includes(use.key);
                  return (
                    <label
                      key={use.key}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'border-cyan-300 bg-cyan-50/50 text-[#131B2E]'
                          : 'border-[#E2E8F0] bg-white hover:bg-slate-50/60 text-[#475569]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDigiLockerUse(use.key)}
                        className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                      >
                      </input>
                      <div>
                        <span className="block font-semibold text-xs leading-snug">{use.label}</span>
                        <span className="block text-[10px] text-[#64748B] leading-tight mt-0.5">{use.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#64748B] flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                DigiLocker Issuer authorization requires your official board affiliation certificate (CBSE / ICSE / State Board) and school registration documents.
                Our legal compliance desk will assist in filing the institutional API request post-onboarding.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#64748B]">
            {config.digilocker?.status === 'not_required' ? (
              <span>DigiLocker issuance is marked as <strong>Not Required</strong>. School will issue print &amp; PDF portal certificates only.</span>
            ) : (
              <span>DigiLocker selection is <strong>Not Decided</strong>. Can be activated at a later stage.</span>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD 6: ADDITIONAL INTEGRATIONS ───────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#334155] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">6. Additional &amp; Enterprise Integrations</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Productivity
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Declare requirements for Google Workspace, Microsoft 365, Tally ERP, and GPS fleet telematics.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addCustomIntegration}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Integration</span>
          </button>
        </div>

        {/* Preset integrations grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_ADDITIONAL_INTEGRATIONS.map((preset) => {
            const currentItem = (config.additionalIntegrations || []).find((i) => i.id === preset.id);
            const isRequired = currentItem?.requirementStatus === 'required' || currentItem?.requirementStatus === 'optional';
            return (
              <div
                key={preset.id}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                  isRequired
                    ? 'border-[#4338CA]/30 bg-[#EEF2FF]/40 ring-1 ring-[#4338CA]/20'
                    : 'border-[#E2E8F0] bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#131B2E]">{preset.name}</span>
                    <button
                      type="button"
                      onClick={() => togglePresetIntegration(preset.id)}
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full transition cursor-pointer ${
                        isRequired
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isRequired ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-snug">
                    {preset.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom additions list */}
        {(config.additionalIntegrations || []).filter((i) => !PRESET_ADDITIONAL_INTEGRATIONS.some((p) => p.id === i.id)).length > 0 && (
          <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131B2E]">Custom Integration Requirements</span>
              <span className="text-[11px] text-[#64748B]">
                {(config.additionalIntegrations || []).filter((i) => !PRESET_ADDITIONAL_INTEGRATIONS.some((p) => p.id === i.id)).length} added
              </span>
            </div>

            <div className="space-y-2.5">
              {(config.additionalIntegrations || [])
                .filter((i) => !PRESET_ADDITIONAL_INTEGRATIONS.some((p) => p.id === i.id))
                .map((customItem, idx) => (
                  <div
                    key={customItem.id}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label htmlFor={`${baseId}-custom-${customItem.id}-name`} className="sr-only">Integration Name</label>
                        <input
                          id={`${baseId}-custom-${customItem.id}-name`}
                          type="text"
                          value={customItem.name}
                          onChange={(e) => updateCustomIntegration(customItem.id, 'name', e.target.value)}
                          placeholder="Integration / Service Name (e.g. Turnitin, Moodle LMS, Custom Library API) *"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                        />
                      </div>

                      <div className="w-36 shrink-0">
                        <label htmlFor={`${baseId}-custom-${customItem.id}-status`} className="sr-only">Requirement Status</label>
                        <select
                          id={`${baseId}-custom-${customItem.id}-status`}
                          value={customItem.requirementStatus}
                          onChange={(e) => updateCustomIntegration(customItem.id, 'requirementStatus', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E]"
                        >
                          <option value="required">Required</option>
                          <option value="optional">Optional</option>
                          <option value="future">Future</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCustomIntegration(customItem.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        aria-label="Remove custom integration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label htmlFor={`${baseId}-custom-${customItem.id}-desc`} className="sr-only">Short Description</label>
                      <input
                        id={`${baseId}-custom-${customItem.id}-desc`}
                        type="text"
                        value={customItem.description}
                        onChange={(e) => updateCustomIntegration(customItem.id, 'description', e.target.value)}
                        placeholder="Brief intended use or technical notes..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#64748B] focus:border-[#4338CA] focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── DYNAMIC CONFIGURATION SUMMARY BAR ─────────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs text-[#131B2E]">Section 19 Configuration Summary</span>
          </div>
          <span className="text-[11px] font-semibold text-[#64748B]">
            {score.filled} of {score.total} Categories Configured ({score.percentage}%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl p-2.5 shadow-2xs space-y-0.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                {item.category}
              </span>
              <span className="font-bold text-xs text-[#131B2E] block truncate">
                {item.provider}
              </span>
              <span className="text-[10px] text-indigo-700 font-medium block">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
