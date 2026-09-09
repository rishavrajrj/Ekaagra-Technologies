'use client';

import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  Apple,
  Globe,
  Shield,
  Bell,
  BookOpen,
  MessageSquare,
  CreditCard,
  Bus,
  FileText,
  Palette,
  Download,
  Languages,
  WifiOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Check,
  RotateCcw,
  Users,
  Layers,
  Lock,
  Radio,
  MapPin,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  QrCode,
  Compass,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  MobileAppData,
  MobileAppAudienceId,
  MobileAppPlatformId,
  MobileAppAuthMethod,
  MobileAppDistributionId,
  SchoolProject,
} from '@/lib/types';
import {
  MOBILE_APP_AUDIENCES,
  MOBILE_APP_PLATFORMS,
  MOBILE_APP_AUTH_METHODS,
  MOBILE_APP_NOTIFICATION_CATEGORIES,
  MOBILE_APP_ACADEMIC_FEATURES,
  MOBILE_APP_COMMUNICATION_FEATURES,
  MOBILE_APP_FEE_FEATURES,
  MOBILE_APP_TRANSPORT_FEATURES,
  MOBILE_APP_DOCUMENT_SERVICES,
  MOBILE_APP_DISTRIBUTION_OPTIONS,
  MOBILE_APP_OFFLINE_FEATURES,
  normalizeMobileAppData,
  validateMobileAppSection,
  type IntakeSectionKey,
} from '@/lib/schoolIntake';

interface MobileApplicationRequirementsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: IntakeSectionKey) => void;
  showValidationErrors?: boolean;
}

export default function MobileApplicationRequirementsSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  onNavigateToSection,
  showValidationErrors = false,
}: MobileApplicationRequirementsSectionProps) {
  const schoolName = intakeData.schoolProfile?.schoolName || project?.school_name || '';

  // Get current normalized mobile config
  const mobileConfig: MobileAppData = useMemo(() => {
    return normalizeMobileAppData(intakeData.mobileAppConfig, schoolName);
  }, [intakeData.mobileAppConfig, schoolName]);

  // Validation report
  const validation = useMemo(() => {
    return validateMobileAppSection(mobileConfig, schoolName);
  }, [mobileConfig, schoolName]);

  const { fieldErrors, score } = validation;

  // Generic updater that maintains both structured & legacy properties
  const updateMobile = (mutator: (prev: MobileAppData) => MobileAppData) => {
    const updated = mutator(mobileConfig);
    const normalized = normalizeMobileAppData(updated, schoolName);
    if (updateSectionDirect) {
      updateSectionDirect('mobileAppConfig', normalized);
    } else {
      Object.entries(normalized).forEach(([k, v]) => {
        updateSectionField('mobileAppConfig', k, v);
      });
    }
  };

  // Audience helper
  const toggleAudience = (id: MobileAppAudienceId) => {
    updateMobile((prev) => {
      const current = prev.requiredApps || [];
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return { ...prev, requiredApps: next };
    });
  };

  // Platform helper
  const togglePlatform = (id: MobileAppPlatformId) => {
    updateMobile((prev) => {
      const current = prev.supportedPlatforms || [];
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return { ...prev, supportedPlatforms: next };
    });
  };

  // Notification category helper
  const toggleNotificationCategory = (cat: string) => {
    updateMobile((prev) => {
      const current = prev.pushNotifications?.categories || [];
      const next = current.includes(cat)
        ? current.filter((item) => item !== cat)
        : [...current, cat];
      return {
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications!,
          categories: next,
        },
      };
    });
  };

  // Feature toggle helper
  const toggleFeature = (
    fieldKey: 'academicFeatures' | 'communicationFeatures' | 'feeFeatures' | 'documentFeatures',
    featureId: string
  ) => {
    updateMobile((prev) => {
      const current = prev[fieldKey] || [];
      const next = current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId];
      return { ...prev, [fieldKey]: next };
    });
  };

  // Transport features helper
  const toggleTransportFeature = (featureId: string) => {
    updateMobile((prev) => {
      const current = prev.transport?.features || [];
      const next = current.includes(featureId)
        ? current.filter((item) => item !== featureId)
        : [...current, featureId];
      return {
        ...prev,
        transport: {
          ...prev.transport!,
          features: next,
        },
      };
    });
  };

  // Distribution helper
  const toggleDistribution = (distId: MobileAppDistributionId) => {
    updateMobile((prev) => {
      const current = prev.distribution || [];
      const next = current.includes(distId)
        ? current.filter((item) => item !== distId)
        : [...current, distId];
      return { ...prev, distribution: next };
    });
  };

  // Language helper
  const toggleLanguage = (lang: string) => {
    updateMobile((prev) => {
      const current = prev.languages || [];
      const next = current.includes(lang)
        ? current.filter((item) => item !== lang)
        : [...current, lang];
      return { ...prev, languages: next };
    });
  };

  // Offline feature helper
  const toggleOfflineFeature = (featId: string) => {
    updateMobile((prev) => {
      const current = prev.offline?.features || [];
      const next = current.includes(featId)
        ? current.filter((item) => item !== featId)
        : [...current, featId];
      return {
        ...prev,
        offline: {
          ...prev.offline!,
          features: next,
        },
      };
    });
  };

  const isAndroidSelected = mobileConfig.supportedPlatforms?.includes('android');
  const isIosSelected = mobileConfig.supportedPlatforms?.includes('ios');
  const isPushEnabled = mobileConfig.pushNotifications?.enabled ?? true;
  const isBusTrackingActive = mobileConfig.transport?.features?.includes('bus_tracking');
  const isOnlineFeePaymentActive = mobileConfig.feeFeatures?.includes('online_fee_payment');

  const schoolLogoUrl =
    intakeData.brandingDesign?.logoUrl ||
    intakeData.brandingDesign?.crestUrl ||
    (intakeData.assetChecklist?.items?.find((i) => i.id === 'school_logo')?.fileUrl);

  return (
    <div className="space-y-8 text-xs text-[#131B2E]">
      {/* SECTION SUMMARY & COMPLETION OVERVIEW */}
      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4338CA] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[#131B2E]">Mobile Requirements Readiness</span>
              {validation.isValid ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Requirements Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {score.filled} of {score.total} mandatory requirements configured.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="text-right">
            <span className="block font-mono font-bold text-xs text-[#131B2E]">
              {Math.round((score.filled / Math.max(1, score.total)) * 100)}%
            </span>
            <span className="text-[10px] text-[#64748B]">Coverage</span>
          </div>
          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                validation.isValid ? 'bg-emerald-600' : 'bg-[#4338CA]'
              }`}
              style={{ width: `${Math.round((score.filled / Math.max(1, score.total)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CARD A: APP AUDIENCE / APPLICATIONS */}
      <section
        id="section-required-apps"
        aria-labelledby="card-a-title"
        className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition ${
          fieldErrors['requiredApps'] && showValidationErrors
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-a-title" className="font-bold text-sm text-[#131B2E]">
              A. Required Mobile Applications <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
            {(mobileConfig.requiredApps || []).length} Selected
          </span>
        </div>

        <p className="text-xs text-[#64748B]">
          Select every dedicated user role for which your school requires a standalone or role-switched mobile app experience.
        </p>

        {fieldErrors['requiredApps'] && showValidationErrors && (
          <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldErrors['requiredApps']}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {MOBILE_APP_AUDIENCES.map((app) => {
            const isSelected = mobileConfig.requiredApps?.includes(app.id) ?? false;
            return (
              <label
                key={app.id}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleAudience(app.id)}
                  className="mt-1 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                  aria-label={app.label}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                      {app.label}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {app.roleBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {app.shortDesc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* CARD B: PLATFORM REQUIREMENTS */}
      <section
        id="section-platforms"
        aria-labelledby="card-b-title"
        className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition ${
          fieldErrors['supportedPlatforms'] && showValidationErrors
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-b-title" className="font-bold text-sm text-[#131B2E]">
              B. Platform Requirements <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Multi-platform distribution</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Select every platform the school expects to support for its students, parents, faculty, and administrative staff.
        </p>

        {fieldErrors['supportedPlatforms'] && showValidationErrors && (
          <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldErrors['supportedPlatforms']}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {MOBILE_APP_PLATFORMS.map((platform) => {
            const isSelected = mobileConfig.supportedPlatforms?.includes(platform.id) ?? false;
            return (
              <label
                key={platform.id}
                className={`p-4 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-2xs ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {platform.id === 'android' ? (
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                    ) : platform.id === 'ios' ? (
                      <Apple className="w-4 h-4 text-slate-800" />
                    ) : (
                      <Globe className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="font-bold text-xs text-[#131B2E]">{platform.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlatform(platform.id)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    aria-label={platform.label}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {platform.description}
                </p>
              </label>
            );
          })}
        </div>
      </section>

      {/* CARD C: LOGIN & AUTHENTICATION */}
      <section
        id="section-auth"
        aria-labelledby="card-c-title"
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-c-title" className="font-bold text-sm text-[#131B2E]">
              C. Login &amp; Authentication Architecture <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            Zero-Trust Access
          </span>
        </div>

        <div>
          <label className="block font-bold text-[#334155] mb-1.5">
            Primary Authentication Method <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MOBILE_APP_AUTH_METHODS.map((method) => {
              const isSelected = mobileConfig.authentication?.authMethod === method.id;
              return (
                <label
                  key={method.id}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                      : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="authMethod"
                    value={method.id}
                    aria-label={method.label}
                    checked={isSelected}
                    onChange={() =>
                      updateMobile((prev) => ({
                        ...prev,
                        authentication: {
                          ...prev.authentication!,
                          authMethod: method.id,
                        },
                      }))
                    }
                    className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <div>
                    <span className="block font-semibold text-xs text-[#131B2E]">{method.label}</span>
                    <span className="block text-[10px] text-[#64748B] mt-0.5">{method.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Security and Session Preferences */}
        <div className="pt-2 border-t border-[#E2E8F0]/70 space-y-3">
          <label className="block font-bold text-[#334155]">
            Account Management &amp; Mobile Security Controls
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                key: 'rememberDevice',
                title: 'Remember Device',
                desc: 'Keep signed in with secure token refresh on trusted device',
              },
              {
                key: 'biometricLogin',
                title: 'Biometric Login',
                desc: 'Fast Face ID / Fingerprint unlock on compatible handsets',
              },
              {
                key: 'forgotPasswordEnabled',
                title: 'Self-Service Recovery',
                desc: 'Instant forgot password OTP recovery via SMS or email',
              },
              {
                key: 'accountSwitching',
                title: 'Profile Switching',
                desc: 'Instant profile switcher for parents with multiple roles',
              },
              {
                key: 'multiChildSupport',
                title: 'Multi-Child Account Support',
                desc: 'Link multiple enrolled children under a single parent login',
              },
              {
                key: 'roleBasedAccess',
                title: 'Role-Based Access Control',
                desc: 'Strict role segregation between parent, teacher & admin views',
              },
              {
                key: 'multipleGuardians',
                title: 'Multiple Guardians Support',
                desc: 'Independent logins for Father, Mother & authorized guardian',
              },
            ].map((opt) => {
              const isChecked = Boolean(
                mobileConfig.authentication?.[opt.key as keyof typeof mobileConfig.authentication]
              );
              return (
                <label
                  key={opt.key}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                    isChecked
                      ? 'bg-slate-50 border-[#CBD5E1]'
                      : 'bg-white border-[#E2E8F0] hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      updateMobile((prev) => ({
                        ...prev,
                        authentication: {
                          ...prev.authentication!,
                          [opt.key]: e.target.checked,
                        },
                      }))
                    }
                    className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <div>
                    <span className="block font-semibold text-xs text-[#131B2E]">{opt.title}</span>
                    <span className="block text-[10px] text-[#64748B] mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start space-x-2 text-[11px] text-indigo-950">
            <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
            <p>
              <strong>Multi-Child Architecture:</strong> When a guardian has two or more children in different classes (e.g. Class II and Class IX), the parent dashboard allows instant switching without relogging, while maintaining isolated academic and fee ledgers.
            </p>
          </div>
        </div>
      </section>

      {/* CARD D: PUSH NOTIFICATIONS */}
      <section
        id="section-push-notifications"
        aria-labelledby="card-d-title"
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-d-title" className="font-bold text-sm text-[#131B2E]">
              D. Push Notifications &amp; Alert Engine <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Real-Time Notifications</span>
        </div>

        <div>
          <label className="block font-bold text-[#334155] mb-1.5">
            Does the school require mobile push notifications? <span className="text-rose-600">*</span>
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="pushNotificationEnabled"
                checked={isPushEnabled}
                onChange={() =>
                  updateMobile((prev) => ({
                    ...prev,
                    pushNotifications: {
                      ...prev.pushNotifications!,
                      enabled: true,
                    },
                  }))
                }
                className="text-[#4338CA] focus:ring-[#4338CA]/20"
              />
              <span className="font-semibold text-xs text-[#131B2E]">Yes, enabled</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="pushNotificationEnabled"
                checked={!isPushEnabled}
                onChange={() =>
                  updateMobile((prev) => ({
                    ...prev,
                    pushNotifications: {
                      ...prev.pushNotifications!,
                      enabled: false,
                    },
                  }))
                }
                className="text-[#4338CA] focus:ring-[#4338CA]/20"
              />
              <span className="font-semibold text-xs text-[#131B2E]">No, disabled</span>
            </label>
          </div>
        </div>

        {/* Conditional Push Notification Details */}
        {isPushEnabled && (
          <div className="space-y-4 pt-3 border-t border-[#E2E8F0]/80">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-[#334155]">
                  Select Notification Categories <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-[#64748B]">
                  {(mobileConfig.pushNotifications?.categories || []).length} Categories Active
                </span>
              </div>

              {fieldErrors['pushCategories'] && showValidationErrors && (
                <p role="alert" className="text-xs text-rose-600 mb-2 font-medium">
                  {fieldErrors['pushCategories']}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {MOBILE_APP_NOTIFICATION_CATEGORIES.map((cat) => {
                  const isChecked = mobileConfig.pushNotifications?.categories?.includes(cat) ?? false;
                  return (
                    <label
                      key={cat}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA] font-semibold'
                          : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleNotificationCategory(cat)}
                        className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                      />
                      <span className="text-xs truncate">{cat}</span>
                    </label>
                  );
                })}
              </div>

              {mobileConfig.pushNotifications?.categories?.includes('Other') && (
                <div className="mt-2.5 max-w-md">
                  <label htmlFor="mobile-push-other-category" className="block text-[11px] font-bold text-[#334155] mb-1">
                    Specify other notification categories:
                  </label>
                  <input
                    id="mobile-push-other-category"
                    type="text"
                    value={mobileConfig.pushNotifications?.otherCategoryText || ''}
                    onChange={(e) =>
                      updateMobile((prev) => ({
                        ...prev,
                        pushNotifications: {
                          ...prev.pushNotifications!,
                          otherCategoryText: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Co-curricular achievements, hostel alerts"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#131B2E] text-xs focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
                  />
                </div>
              )}
            </div>

            {/* Notification Priority and Emergency Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="mobile-push-priority-select" className="block font-bold text-[#334155] mb-1">
                  Default Notification Priority
                </label>
                <select
                  id="mobile-push-priority-select"
                  value={mobileConfig.pushNotifications?.priority || 'high'}
                  onChange={(e) =>
                    updateMobile((prev) => ({
                      ...prev,
                      pushNotifications: {
                        ...prev.pushNotifications!,
                        priority: e.target.value as 'normal' | 'high' | 'critical',
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
                >
                  <option value="normal">Normal Priority (Standard batched delivery)</option>
                  <option value="high">High Priority (Immediate push dispatch)</option>
                  <option value="critical">Critical / Emergency (Urgent sound &amp; vibration)</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Controls device notification wake locks and battery optimization handling.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mobileConfig.pushNotifications?.emergencyMandatory ?? true}
                    onChange={(e) =>
                      updateMobile((prev) => ({
                        ...prev,
                        pushNotifications: {
                          ...prev.pushNotifications!,
                          emergencyMandatory: e.target.checked,
                        },
                      }))
                    }
                    className="mt-0.5 rounded border-amber-400 text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <div>
                    <span className="block font-bold text-xs text-amber-950">
                      Emergency Alerts Mandatory
                    </span>
                    <span className="block text-[10px] text-amber-800 leading-snug mt-0.5">
                      Emergency broadcasts bypass silent user preference filters to guarantee campus safety awareness.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748B] flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p>
                <strong>Delivery Notice:</strong> Emergency notifications are scheduled at priority level. Delivery depends on handset connectivity, battery-saver policies, and user device permissions.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* CARD E: ACADEMIC FEATURES */}
      <section aria-labelledby="card-e-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-e-title" className="font-bold text-sm text-[#131B2E]">
              E. Academic Features &amp; Student Portals
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">
            {(mobileConfig.academicFeatures || []).length} / {MOBILE_APP_ACADEMIC_FEATURES.length} Selected
          </span>
        </div>

        <p className="text-xs text-[#64748B]">
          Select the core academic and classroom modules to make accessible via student and parent mobile apps.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {MOBILE_APP_ACADEMIC_FEATURES.map((item) => {
            const isChecked = mobileConfig.academicFeatures?.includes(item.id) ?? false;
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFeature('academicFeatures', item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div>
                  <span className={`block font-semibold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* CARD F: COMMUNICATION FEATURES */}
      <section aria-labelledby="card-f-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-f-title" className="font-bold text-sm text-[#131B2E]">
              F. Communication &amp; Messaging Features
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Parent &amp; Faculty Broadcasts</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Configure direct communications between school administrative desks, classroom teachers, and parent guardians.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {MOBILE_APP_COMMUNICATION_FEATURES.map((item) => {
            const isChecked = mobileConfig.communicationFeatures?.includes(item.id) ?? false;
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFeature('communicationFeatures', item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div>
                  <span className={`block font-semibold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Gateway Security Standard:</strong> WhatsApp Cloud API, SMS gateway, and custom SMTP keys are securely stored in third-party integrations and encrypted admin settings. They are never collected during onboarding.
          </p>
        </div>
      </section>

      {/* CARD G: FEES & PAYMENTS */}
      <section
        id="section-fees-payments"
        aria-labelledby="card-g-title"
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-g-title" className="font-bold text-sm text-[#131B2E]">
              G. Fees, Dues &amp; Digital Invoicing
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Digital Fee Desk</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Enable self-service fee receipts, outstanding balance tracking, and optional online fee payments in the parent app.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {MOBILE_APP_FEE_FEATURES.map((item) => {
            const isChecked = mobileConfig.feeFeatures?.includes(item.id) ?? false;
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFeature('feeFeatures', item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div>
                  <span className={`block font-semibold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Conditional Online Fee Payment Gateway Selector */}
        {isOnlineFeePaymentActive && (
          <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
            <label className="block font-bold text-[#334155]">
              Preferred Online Payment Gateway <span className="text-rose-600">*</span>
            </label>

            {fieldErrors['preferredPaymentGateway'] && showValidationErrors && (
              <p role="alert" className="text-xs text-rose-600 font-medium">
                {fieldErrors['preferredPaymentGateway']}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'razorpay', label: 'Razorpay', helper: 'UPI, RuPay, Credit/Debit cards & Net Banking (Recommended)' },
                { id: 'other', label: 'Other Gateway', helper: 'Custom payment gateway partner' },
                { id: 'not_decided', label: 'Not Decided', helper: 'Finalize gateway selection during deployment phase' },
              ].map((gw) => {
                const isSelected = mobileConfig.preferredPaymentGateway === gw.id;
                return (
                  <label
                    key={gw.id}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentGateway"
                      value={gw.id}
                      aria-label={gw.label}
                      checked={isSelected}
                      onChange={() =>
                        updateMobile((prev) => ({
                          ...prev,
                          preferredPaymentGateway: gw.id as 'razorpay' | 'other' | 'not_decided',
                        }))
                      }
                      className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <div>
                      <span className="block font-bold text-xs text-[#131B2E]">{gw.label}</span>
                      <span className="block text-[10px] text-[#64748B] mt-0.5">{gw.helper}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {mobileConfig.preferredPaymentGateway === 'other' && (
              <div className="max-w-md pt-1">
                <label htmlFor="mobile-fee-gateway-other" className="block text-[11px] font-bold text-[#334155] mb-1">
                  Specify Payment Gateway Provider Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="mobile-fee-gateway-other"
                  type="text"
                  aria-invalid={Boolean(fieldErrors['paymentGatewayOther'] && showValidationErrors)}
                  value={mobileConfig.paymentGatewayOther || ''}
                  onChange={(e) =>
                    updateMobile((prev) => ({
                      ...prev,
                      paymentGatewayOther: e.target.value,
                    }))
                  }
                  placeholder="e.g. Easebuzz, PayU, PhonePe Payment Gateway"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
                />
                {fieldErrors['paymentGatewayOther'] && showValidationErrors && (
                  <p role="alert" className="text-xs text-rose-600 font-medium mt-1">
                    {fieldErrors['paymentGatewayOther']}
                  </p>
                )}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748B] flex items-start space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Security Guard:</strong> Payment gateway API Key ID and Key Secret are configured securely in your administrative settings. No sensitive credentials or merchant secrets are requested here.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* CARD H: TRANSPORT FEATURES */}
      <section
        id="section-transport-features"
        aria-labelledby="card-h-title"
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Bus className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-h-title" className="font-bold text-sm text-[#131B2E]">
              H. School Bus Fleet &amp; Transit Telemetry
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Real-Time GPS</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Equip parents with bus arrival proximity alerts, assigned driver profiles, and live route tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {MOBILE_APP_TRANSPORT_FEATURES.map((item) => {
            const isChecked = mobileConfig.transport?.features?.includes(item.id) ?? false;
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleTransportFeature(item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div>
                  <span className={`block font-semibold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Conditional Bus Tracking Configuration */}
        {isBusTrackingActive && (
          <div className="pt-3 border-t border-[#E2E8F0] space-y-4">
            <div>
              <label className="block font-bold text-[#334155] mb-1.5">
                Bus GPS Tracking Method <span className="text-rose-600">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { id: 'driver_phone', label: 'Driver Phone GPS', desc: 'Driver handset acts as GPS beacon via Driver App' },
                  { id: 'dedicated_gps', label: 'Dedicated GPS Device', desc: 'Hardware GPS unit installed in bus dashboard' },
                  { id: 'hybrid', label: 'Both / Hybrid', desc: 'Dedicated GPS primary with driver handset fallback' },
                  { id: 'not_decided', label: 'Not Decided', desc: 'Choose tracking hardware during fleet configuration' },
                ].map((m) => {
                  const isSelected = mobileConfig.transport?.trackingMethod === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                        isSelected
                          ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                          : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trackingMethod"
                        value={m.id}
                        aria-label={m.label}
                        checked={isSelected}
                        onChange={() =>
                          updateMobile((prev) => ({
                            ...prev,
                            transport: {
                              ...prev.transport!,
                              trackingMethod: m.id as 'dedicated_gps' | 'driver_phone' | 'hybrid' | 'not_decided',
                            },
                          }))
                        }
                        className="mt-0.5 text-[#4338CA] focus:ring-[#4338CA]/20"
                      />
                      <div>
                        <span className="block font-bold text-xs text-[#131B2E]">{m.label}</span>
                        <span className="block text-[10px] text-[#64748B] mt-0.5 leading-snug">{m.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Explanatory notes & Dedicated GPS field */}
            {(mobileConfig.transport?.trackingMethod === 'driver_phone' ||
              mobileConfig.transport?.trackingMethod === 'hybrid') && (
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start space-x-2 text-[11px] text-blue-950">
                <Compass className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Driver Phone Telemetry Protocol:</p>
                  <p className="leading-relaxed text-blue-900">
                    The driver's mobile device securely streams GPS coordinates only while assigned trips are actively marked in progress. Driver personal phone IMEI is never collected or required.
                  </p>
                </div>
              </div>
            )}

            {(mobileConfig.transport?.trackingMethod === 'dedicated_gps' ||
              mobileConfig.transport?.trackingMethod === 'hybrid') && (
              <div className="space-y-1.5 max-w-md">
                <label htmlFor="mobile-dedicated-gps-id" className="block font-bold text-[#334155]">
                  Dedicated GPS Device ID / IMEI <span className="text-rose-600">*</span>
                </label>
                <input
                  id="mobile-dedicated-gps-id"
                  type="text"
                  aria-invalid={Boolean(fieldErrors['dedicatedGpsDeviceId'] && showValidationErrors)}
                  value={mobileConfig.transport?.dedicatedGpsDeviceId || ''}
                  onChange={(e) =>
                    updateMobile((prev) => ({
                      ...prev,
                      transport: {
                        ...prev.transport!,
                        dedicatedGpsDeviceId: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. 864293041234567 or AIS-140 unit ID"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs font-mono focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
                />
                {fieldErrors['dedicatedGpsDeviceId'] && showValidationErrors && (
                  <p role="alert" className="text-xs text-rose-600 font-medium">
                    {fieldErrors['dedicatedGpsDeviceId']}
                  </p>
                )}
                <p className="text-[10px] text-[#64748B]">
                  Hardware device IMEI supplied by your vehicle GPS hardware provider (AIS-140 certified).
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* CARD I: DOCUMENTS & SERVICES */}
      <section aria-labelledby="card-i-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-i-title" className="font-bold text-sm text-[#131B2E]">
              I. Documents, Certificates &amp; Digital ID
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Self-Service Credentials</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Allow students and parents to download report cards, bonafide certificates, fee receipts, and digital ID cards directly on mobile handsets.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {MOBILE_APP_DOCUMENT_SERVICES.map((item) => {
            const isChecked = mobileConfig.documentFeatures?.includes(item.id) ?? false;
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition select-none flex items-start space-x-2.5 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFeature('documentFeatures', item.id)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div>
                  <span className={`block font-semibold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{item.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* CARD J: APP BRANDING */}
      <section
        id="section-branding"
        aria-labelledby="card-j-title"
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-j-title" className="font-bold text-sm text-[#131B2E]">
              J. App Identity &amp; Branding <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">White-Label Customization</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="mobile-app-display-name" className="block font-bold text-[#334155]">
                App Display Name <span className="text-rose-600">*</span>
              </label>
              {schoolName && mobileConfig.branding?.appDisplayName !== schoolName && (
                <button
                  type="button"
                  aria-label="Reset app display name to school name"
                  onClick={() =>
                    updateMobile((prev) => ({
                      ...prev,
                      branding: { ...prev.branding!, appDisplayName: schoolName },
                    }))
                  }
                  className="text-[10px] font-bold text-[#4338CA] hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Use School Name
                </button>
              )}
            </div>
            <input
              id="mobile-app-display-name"
              type="text"
              aria-invalid={Boolean(fieldErrors['appDisplayName'] && showValidationErrors)}
              value={mobileConfig.branding?.appDisplayName || ''}
              onChange={(e) =>
                updateMobile((prev) => ({
                  ...prev,
                  branding: { ...prev.branding!, appDisplayName: e.target.value },
                }))
              }
              placeholder="e.g. St. Xavier Public School"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs font-semibold focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            />
            {fieldErrors['appDisplayName'] && showValidationErrors && (
              <p role="alert" className="text-xs text-rose-600 font-medium mt-1">
                {fieldErrors['appDisplayName']}
              </p>
            )}
            <p className="text-[10px] text-[#64748B] mt-1">
              Name displayed beneath the app icon on phone home screens and store listings.
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#334155] mb-1">App Icon Source</label>
            <div className="flex items-center space-x-3 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="appIconChoice"
                  checked={mobileConfig.branding?.iconPreference === 'school_logo'}
                  onChange={() =>
                    updateMobile((prev) => ({
                      ...prev,
                      branding: { ...prev.branding!, iconPreference: 'school_logo' },
                    }))
                  }
                  className="text-[#4338CA] focus:ring-[#4338CA]/20"
                />
                <span className="text-xs font-semibold text-[#131B2E]">Use School Logo</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="appIconChoice"
                  checked={mobileConfig.branding?.iconPreference === 'custom_icon'}
                  onChange={() =>
                    updateMobile((prev) => ({
                      ...prev,
                      branding: { ...prev.branding!, iconPreference: 'custom_icon' },
                    }))
                  }
                  className="text-[#4338CA] focus:ring-[#4338CA]/20"
                />
                <span className="text-xs font-semibold text-[#131B2E]">Custom App Icon</span>
              </label>
            </div>

            {schoolLogoUrl && mobileConfig.branding?.iconPreference === 'school_logo' && (
              <div className="mt-2.5 flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={schoolLogoUrl}
                  alt="School Logo Preview"
                  className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                />
                <span className="text-[11px] text-[#64748B]">
                  Inherited from Section 4 (Branding &amp; Design).
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748B] flex items-center justify-between">
          <span>
            <strong>Theme Colors:</strong> Inherited dynamically from Section 4 (Branding) for unified institutional styling across web &amp; mobile.
          </span>
          {onNavigateToSection && (
            <button
              type="button"
              onClick={() => onNavigateToSection('brandingDesign')}
              className="font-bold text-[#4338CA] hover:underline text-[11px] shrink-0"
            >
              Review Colors
            </button>
          )}
        </div>
      </section>

      {/* CARD K: APP STORE / DISTRIBUTION */}
      <section
        id="section-distribution"
        aria-labelledby="card-k-title"
        className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition ${
          fieldErrors['distribution'] && showValidationErrors
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-k-title" className="font-bold text-sm text-[#131B2E]">
              K. App Store &amp; Distribution Strategy <span className="text-rose-600">*</span>
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Target Marketplaces</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Choose how the school will distribute mobile applications to users.
        </p>

        {fieldErrors['distribution'] && showValidationErrors && (
          <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldErrors['distribution']}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {MOBILE_APP_DISTRIBUTION_OPTIONS.map((dist) => {
            const isChecked = mobileConfig.distribution?.includes(dist.id) ?? false;
            const isHighlighted =
              (dist.id === 'play_store' && isAndroidSelected) ||
              (dist.id === 'app_store' && isIosSelected);

            return (
              <label
                key={dist.id}
                className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start space-x-3 ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] ring-1 ring-[#4338CA]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleDistribution(dist.id)}
                  className="mt-1 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`font-bold text-xs ${isChecked ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                      {dist.label}
                    </span>
                    {isHighlighted && (
                      <span className="text-[9px] font-extrabold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-snug">
                    {dist.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#64748B] flex items-start space-x-2">
          <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <strong>Developer Credentials Protocol:</strong> Apple Developer and Google Play Console passwords or API secrets are never requested during onboarding. Ekaagra guides your IT administrator through inviting our build pipeline to your developer team securely.
          </p>
        </div>
      </section>

      {/* CARD L: APP LANGUAGE */}
      <section aria-labelledby="card-l-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-l-title" className="font-bold text-sm text-[#131B2E]">
              L. App Language &amp; Multilingual Support
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Localization</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Choose the languages required for parent and student app interfaces.
        </p>

        <div className="flex flex-wrap gap-2.5">
          {['English', 'Hindi', 'Other Indian Language(s)'].map((lang) => {
            const isChecked = mobileConfig.languages?.includes(lang) ?? false;
            return (
              <label
                key={lang}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border cursor-pointer transition select-none ${
                  isChecked
                    ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA] font-semibold shadow-2xs'
                    : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleLanguage(lang)}
                  className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                />
                <span className="text-xs">{lang}</span>
              </label>
            );
          })}
        </div>

        {mobileConfig.languages?.includes('Other Indian Language(s)') && (
          <div className="max-w-md pt-1">
            <label htmlFor="mobile-other-language-text" className="block text-[11px] font-bold text-[#334155] mb-1">
              Specify regional language(s):
            </label>
            <input
              id="mobile-other-language-text"
              type="text"
              value={mobileConfig.otherLanguageText || ''}
              onChange={(e) =>
                updateMobile((prev) => ({
                  ...prev,
                  otherLanguageText: e.target.value,
                }))
              }
              placeholder="e.g. Marathi, Tamil, Bengali, Telugu, Gujarati"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10"
            />
          </div>
        )}
      </section>

      {/* CARD M: OFFLINE / CONNECTIVITY */}
      <section aria-labelledby="card-m-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-m-title" className="font-bold text-sm text-[#131B2E]">
              M. Offline Capability &amp; Local Caching
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Low-Connectivity Support</span>
        </div>

        <div>
          <label className="block font-bold text-[#334155] mb-1.5">
            Is offline viewing capability required?
          </label>
          <div className="flex items-center space-x-4">
            {[
              { id: 'yes', label: 'Yes' },
              { id: 'no', label: 'No' },
              { id: 'not_decided', label: 'Not Decided' },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="offlineEnabled"
                  checked={mobileConfig.offline?.enabled === opt.id}
                  onChange={() =>
                    updateMobile((prev) => ({
                      ...prev,
                      offline: {
                        ...prev.offline!,
                        enabled: opt.id as 'yes' | 'no' | 'not_decided',
                      },
                    }))
                  }
                  className="text-[#4338CA] focus:ring-[#4338CA]/20"
                />
                <span className="text-xs font-semibold text-[#131B2E]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {mobileConfig.offline?.enabled === 'yes' && (
          <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
            <label className="block text-[11px] font-bold text-[#334155]">
              Select cached offline features:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MOBILE_APP_OFFLINE_FEATURES.map((feat) => {
                const isChecked = mobileConfig.offline?.features?.includes(feat.id) ?? false;
                return (
                  <label
                    key={feat.id}
                    className={`p-2.5 rounded-xl border cursor-pointer transition select-none flex items-center space-x-2.5 ${
                      isChecked
                        ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA] font-semibold'
                        : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOfflineFeature(feat.id)}
                      className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 shrink-0"
                    />
                    <span className="text-xs">{feat.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-[#64748B]">
              Offline caching stores read-only data locally on device storage. Live data syncs upon internet restoration.
            </p>
          </div>
        )}
      </section>

      {/* CARD N: SPECIAL REQUIREMENTS */}
      <section aria-labelledby="card-n-title" className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#4338CA]" />
            <h3 id="card-n-title" className="font-bold text-sm text-[#131B2E]">
              N. Additional Mobile App Requirements
            </h3>
          </div>
          <span className="text-[10px] text-[#64748B]">Custom Scopes</span>
        </div>

        <div>
          <label htmlFor="mobile-special-requirements" className="block text-xs font-bold text-[#334155] mb-1">
            Special workflows, integrations, custom screens or institutional behavior:
          </label>
          <textarea
            id="mobile-special-requirements"
            rows={4}
            maxLength={1000}
            value={mobileConfig.additionalRequirements || ''}
            onChange={(e) =>
              updateMobile((prev) => ({
                ...prev,
                additionalRequirements: e.target.value,
              }))
            }
            placeholder="Describe any special workflows, custom integrations, biometric sync hardware, or unique screens the school requires..."
            className="w-full p-3 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 resize-y"
          />
          <div className="flex justify-end mt-1 text-[10px] text-[#64748B]">
            <span>{(mobileConfig.additionalRequirements || '').length} / 1000 characters</span>
          </div>
        </div>
      </section>
    </div>
  );
}
