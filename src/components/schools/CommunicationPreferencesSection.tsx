'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Bell,
  Users,
  GraduationCap,
  Globe,
  Layers,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Building2,
  BookOpen,
  DollarSign,
  Bus,
  Award,
  Sparkles,
  Sliders,
  Settings,
  RefreshCw,
  Lock,
  ExternalLink,
  Shield,
  HelpCircle,
  CheckSquare,
  Square,
  UserCheck,
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type {
  UniversalIntakeData,
  SchoolProject,
  CommunicationData,
  CommunicationChannelKey,
  AudienceGroupKey,
  NotificationCategoryGroupKey,
  NotificationTypeKey,
  NotificationPriority,
  ProviderIntegrationStatus,
} from '@/lib/types';
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_AUDIENCES,
  NOTIFICATION_CATEGORY_GROUPS,
  normalizeCommunicationData,
  syncCommunicationLegacyMirrors,
  validateCommunicationData,
  getCommunicationSectionScore,
  getCommunicationSummary,
  createDefaultAudienceChannelMatrix,
  createDefaultSenderIdentity,
} from '@/lib/communicationUtils';

interface CommunicationPreferencesSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: any) => void;
}

export default function CommunicationPreferencesSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  onNavigateToSection,
}: CommunicationPreferencesSectionProps) {
  // Normalize incoming data safely
  const config = useMemo(() => {
    return normalizeCommunicationData(intakeData.communicationConfig, intakeData.schoolProfile);
  }, [intakeData.communicationConfig, intakeData.schoolProfile]);

  // Card expansion state (1 to 12)
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({
    1: true,  // Channels (Expanded by default)
    2: true,  // Audiences
    3: false, // Notification Types
    4: false, // Delivery Fallback
    5: true,  // Emergency Broadcast (Prominent)
    6: false, // Schedule & Quiet Hours
    7: false, // Consent
    8: true,  // Sender Identity
    9: false, // Providers
    10: false, // Templates
    11: false, // Governance
    12: true, // Summary (Always visible)
  });

  const toggleCard = useCallback((cardIndex: number) => {
    setOpenCards((prev) => ({ ...prev, [cardIndex]: !prev[cardIndex] }));
  }, []);

  const expandAllCards = useCallback(() => {
    const allOpen: Record<number, boolean> = {};
    for (let i = 1; i <= 12; i++) allOpen[i] = true;
    setOpenCards(allOpen);
  }, []);

  const collapseAllCards = useCallback(() => {
    const allClosed: Record<number, boolean> = { 12: true }; // Keep summary open
    for (let i = 1; i <= 11; i++) allClosed[i] = false;
    setOpenCards(allClosed);
  }, []);

  // Update helper that syncs legacy mirrors and persists directly to parent intake
  const updateConfig = useCallback(
    (updater: (prev: CommunicationData) => CommunicationData) => {
      const updated = updater(config);
      const synced = syncCommunicationLegacyMirrors(updated);
      if (updateSectionDirect) {
        updateSectionDirect('communicationConfig', synced);
      } else {
        updateSectionField('communicationConfig', 'enabledChannels', synced.enabledChannels);
      }
    },
    [config, updateSectionDirect, updateSectionField]
  );

  // Active Category filter in Section 3
  const [activeNotificationCategory, setActiveNotificationCategory] =
    useState<NotificationCategoryGroupKey>('academic');

  // Integration Modal state for Section 9
  const [integrationModalProvider, setIntegrationModalProvider] = useState<string | null>(null);

  // Validation errors
  const validationErrors = useMemo(() => validateCommunicationData(config), [config]);

  // Dynamic summary
  const summaryItems = useMemo(() => getCommunicationSummary(config), [config]);

  // Score
  const score = useMemo(() => getCommunicationSectionScore(config), [config]);

  // Channel helper
  const isChannelEnabled = useCallback(
    (channelKey: CommunicationChannelKey) => {
      return (config.enabledChannels || []).includes(channelKey);
    },
    [config.enabledChannels]
  );

  const toggleChannel = useCallback(
    (channelKey: CommunicationChannelKey) => {
      updateConfig((prev) => {
        const current = prev.enabledChannels || [];
        const nextChannels = current.includes(channelKey)
          ? current.filter((k) => k !== channelKey)
          : [...current, channelKey];

        const nextChannelConfigs = { ...(prev.channelConfigs || {}) };
        if (nextChannelConfigs[channelKey]) {
          nextChannelConfigs[channelKey] = {
            ...nextChannelConfigs[channelKey]!,
            enabled: nextChannels.includes(channelKey),
          };
        }

        return {
          ...prev,
          enabledChannels: nextChannels,
          channelConfigs: nextChannelConfigs,
        };
      });
    },
    [updateConfig]
  );

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── QUICK STATUS & CONTROL BAR ────────────────────────────────────────── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#131B2E]">
                Institutional Communication Preferences
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  score.isComplete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {score.percentage}% Configured
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              WhatsApp API, SMS Gateway, Email circulars, Push notifications &amp; Emergency broadcast policy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={expandAllCards}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#4338CA] bg-white border border-[#CBD5E1] rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAllCards}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#64748B] bg-white border border-[#CBD5E1] rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 1: COMMUNICATION CHANNELS
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(1)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              1
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Channels</h3>
              <p className="text-[11px] text-[#64748B]">
                Choose the communication channels your institution will use for routine, transactional and emergency communication.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              {config.enabledChannels?.length || 0} Enabled
            </span>
            {openCards[1] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[1] && (
          <div className="p-5 space-y-4">
            {validationErrors['enabledChannels'] && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors['enabledChannels']}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMMUNICATION_CHANNELS.map((channel) => {
                const enabled = isChannelEnabled(channel.key);
                return (
                  <div
                    key={channel.key}
                    onClick={() => toggleChannel(channel.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      enabled
                        ? 'bg-[#EEF2FF]/60 border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              enabled ? 'bg-[#4338CA] text-white' : 'bg-slate-100 text-[#64748B]'
                            }`}
                          >
                            {renderChannelIcon(channel.iconName)}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#131B2E] block">{channel.name}</span>
                            <span className="text-[10px] text-[#64748B] block">{channel.badge}</span>
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => {}} // Handled by container onClick
                            className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                        {channel.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-[#64748B] font-mono">
                        {channel.isPortalOrInternal ? 'Native System' : channel.defaultProvider}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        {enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-Card: Specific Channel Settings for Active Channels */}
            {isChannelEnabled('whatsapp') && (
              <div className="p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-[#131B2E]">WhatsApp Business Configuration</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Meta Cloud API
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">WhatsApp Business Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={config.providers?.whatsapp?.senderNumber || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            whatsapp: {
                              ...prev.providers?.whatsapp,
                              provider: 'meta_cloud_api',
                              status: 'pending_configuration',
                              senderNumber: val,
                            },
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">Template Approval Status</label>
                    <select
                      value={config.providers?.whatsapp?.templateStatus || 'not_submitted'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        updateConfig((prev) => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            whatsapp: {
                              ...prev.providers?.whatsapp,
                              provider: 'meta_cloud_api',
                              status: 'pending_configuration',
                              templateStatus: val,
                            },
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs"
                    >
                      <option value="approved">Pre-Approved Official Templates</option>
                      <option value="pending">Pending Meta Verification</option>
                      <option value="not_submitted">Provision via Ekaagra Post-Intake</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 2: AUDIENCE / RECIPIENT GROUPS MATRIX
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(2)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              2
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Audiences</h3>
              <p className="text-[11px] text-[#64748B]">
                Configure permitted communication channels for each institutional recipient group.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              9 Groups Defined
            </span>
            {openCards[2] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[2] && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#64748B]">
                Audience-to-Channel Mapping Matrix: Select permitted channels for each stakeholder group.
              </span>
              <button
                type="button"
                onClick={() => {
                  updateConfig((prev) => ({
                    ...prev,
                    audienceChannelMatrix: createDefaultAudienceChannelMatrix(),
                  }));
                }}
                className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Recommended Matrix</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#FAF7F2]">
                    <th className="py-2.5 px-3 font-bold text-[#334155] text-xs">Recipient Group</th>
                    {COMMUNICATION_CHANNELS.filter((c) => isChannelEnabled(c.key)).map((c) => (
                      <th key={c.key} className="py-2.5 px-2 font-semibold text-center text-[#334155] text-[11px]">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMMUNICATION_AUDIENCES.map((aud) => {
                    const assignedChannels = config.audienceChannelMatrix?.[aud.key] || [];
                    return (
                      <tr key={aud.key} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#131B2E]">{aud.name}</span>
                            <span className="text-[10px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                              {aud.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#64748B] block mt-0.5">{aud.description}</span>
                        </td>

                        {COMMUNICATION_CHANNELS.filter((c) => isChannelEnabled(c.key)).map((c) => {
                          const isAssigned = assignedChannels.includes(c.key);
                          return (
                            <td key={c.key} className="py-3 px-2 text-center align-middle">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  updateConfig((prev) => {
                                    const m = { ...(prev.audienceChannelMatrix || {}) };
                                    const currentList = m[aud.key] || [];
                                    const nextList = checked
                                      ? [...currentList, c.key]
                                      : currentList.filter((k) => k !== c.key);
                                    m[aud.key] = nextList;
                                    return { ...prev, audienceChannelMatrix: m };
                                  });
                                }}
                                className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 3: NOTIFICATION TYPES & CATEGORIES
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(3)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              3
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Notification Categories</h3>
              <p className="text-[11px] text-[#64748B]">
                Configure delivery channels, priority, and fallback rules for each notification category.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              6 Categories
            </span>
            {openCards[3] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[3] && (
          <div className="p-5 space-y-5">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E2E8F0]">
              {NOTIFICATION_CATEGORY_GROUPS.map((grp) => {
                const isActive = activeNotificationCategory === grp.groupKey;
                return (
                  <button
                    key={grp.groupKey}
                    type="button"
                    onClick={() => setActiveNotificationCategory(grp.groupKey)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#4338CA] text-white shadow-2xs'
                        : 'bg-[#FAF7F2] text-[#64748B] hover:bg-slate-100 hover:text-[#131B2E]'
                    }`}
                  >
                    <span>{grp.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#334155]'
                      }`}
                    >
                      {grp.types.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Category Item List */}
            {(() => {
              const activeGroup = NOTIFICATION_CATEGORY_GROUPS.find(
                (g) => g.groupKey === activeNotificationCategory
              );
              if (!activeGroup) return null;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#131B2E]">{activeGroup.title}</h4>
                      <p className="text-[11px] text-[#64748B]">{activeGroup.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeGroup.types.map((typeDef) => {
                      const policy = config.notificationPolicies?.[typeDef.key] || {
                        key: typeDef.key,
                        name: typeDef.name,
                        category: activeGroup.groupKey,
                        enabled: true,
                        defaultChannels: typeDef.defaultChannels,
                        priority: typeDef.defaultPriority,
                        audiences: typeDef.audiences,
                        requiresImmediateDelivery: typeDef.defaultImmediate,
                        allowFallback: typeDef.defaultFallback,
                      };

                      return (
                        <div
                          key={typeDef.key}
                          className={`p-3.5 rounded-xl border transition ${
                            policy.enabled
                              ? 'bg-white border-[#E2E8F0] shadow-2xs'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={policy.enabled}
                                onChange={(e) => {
                                  const en = e.target.checked;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    notificationPolicies: {
                                      ...prev.notificationPolicies,
                                      [typeDef.key]: {
                                        ...policy,
                                        enabled: en,
                                      },
                                    },
                                  }));
                                }}
                                className="mt-1 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                              />
                              <div>
                                <span className="font-bold text-xs text-[#131B2E] block">
                                  {typeDef.name}
                                </span>
                                <span className="text-[11px] text-[#64748B] block mt-0.5">
                                  {typeDef.description}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                              <select
                                value={policy.priority}
                                onChange={(e) => {
                                  const pr = e.target.value as NotificationPriority;
                                  updateConfig((prev) => ({
                                    ...prev,
                                    notificationPolicies: {
                                      ...prev.notificationPolicies,
                                      [typeDef.key]: {
                                        ...policy,
                                        priority: pr,
                                      },
                                    },
                                  }));
                                }}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border bg-white ${
                                  policy.priority === 'critical'
                                    ? 'text-red-700 border-red-300'
                                    : policy.priority === 'high'
                                    ? 'text-amber-700 border-amber-300'
                                    : 'text-[#4338CA] border-[#C7D2FE]'
                                }`}
                              >
                                <option value="critical">Critical Priority</option>
                                <option value="high">High Priority</option>
                                <option value="normal">Normal Priority</option>
                                <option value="low">Low Priority</option>
                              </select>

                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={policy.requiresImmediateDelivery}
                                  onChange={(e) => {
                                    const imm = e.target.checked;
                                    updateConfig((prev) => ({
                                      ...prev,
                                      notificationPolicies: {
                                        ...prev.notificationPolicies,
                                        [typeDef.key]: {
                                          ...policy,
                                          requiresImmediateDelivery: imm,
                                        },
                                      },
                                    }));
                                  }}
                                  className="rounded border-[#CBD5E1] text-[#4338CA]"
                                />
                                <span>Immediate</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={policy.allowFallback}
                                  onChange={(e) => {
                                    const fb = e.target.checked;
                                    updateConfig((prev) => ({
                                      ...prev,
                                      notificationPolicies: {
                                        ...prev.notificationPolicies,
                                        [typeDef.key]: {
                                          ...policy,
                                          allowFallback: fb,
                                        },
                                      },
                                    }));
                                  }}
                                  className="rounded border-[#CBD5E1] text-[#4338CA]"
                                />
                                <span>Fallback</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 4: CHANNEL PRIORITY & FALLBACK STRATEGY
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(4)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              4
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Notification Delivery Strategy</h3>
              <p className="text-[11px] text-[#64748B]">
                Allow the institution to define primary and fallback communication channels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              WhatsApp → SMS → Push
            </span>
            {openCards[4] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[4] && (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Delivery Policy:</strong> Fallback channels are automatically attempted when the primary delivery channel is unavailable, throttled, or receipt timeout is exceeded.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Primary Channel *</label>
                <select
                  value={config.deliveryStrategy?.primaryChannel || 'whatsapp'}
                  onChange={(e) => {
                    const ch = e.target.value as CommunicationChannelKey;
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        primaryChannel: ch,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                >
                  <option value="whatsapp">WhatsApp (Instant Messaging)</option>
                  <option value="sms">SMS Gateway (DLT Transactional)</option>
                  <option value="push">Mobile App Push</option>
                  <option value="email">Official Email</option>
                  <option value="parent_portal">Parent Portal</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">First delivery route attempted.</p>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Fallback Channel *</label>
                <select
                  value={config.deliveryStrategy?.fallbackChannel || 'sms'}
                  onChange={(e) => {
                    const ch = e.target.value as CommunicationChannelKey;
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        fallbackChannel: ch,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                >
                  <option value="sms">SMS Gateway (DLT Transactional)</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="push">Mobile App Push</option>
                  <option value="email">Official Email</option>
                  <option value="voice_ivr">Voice / IVR Call</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">Dispatched if primary channel fails.</p>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Secondary Fallback</label>
                <select
                  value={config.deliveryStrategy?.secondaryFallbackChannel || 'push'}
                  onChange={(e) => {
                    const ch = e.target.value as CommunicationChannelKey;
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        secondaryFallbackChannel: ch,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                >
                  <option value="push">Mobile App Push</option>
                  <option value="email">Official Email</option>
                  <option value="sms">SMS</option>
                  <option value="voice_ivr">Voice / IVR</option>
                  <option value="parent_portal">Parent Portal Inbox</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">Final escalation channel.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Fallback Timeout (Seconds)</label>
                <input
                  type="number"
                  min={10}
                  max={1800}
                  value={config.deliveryStrategy?.fallbackTimeoutSeconds ?? 120}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 120;
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        fallbackTimeoutSeconds: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Seconds to wait for delivery receipt before triggering fallback.
                </p>
                {validationErrors['deliveryStrategy.fallbackTimeoutSeconds'] && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    {validationErrors['deliveryStrategy.fallbackTimeoutSeconds']}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Maximum Retry Attempts</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={config.deliveryStrategy?.retryAttempts ?? 2}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        retryAttempts: isNaN(val) ? 2 : val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Number of retries per failed attempt (0 to 5).</p>
                {validationErrors['deliveryStrategy.retryAttempts'] && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    {validationErrors['deliveryStrategy.retryAttempts']}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Deduplication Window (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={config.deliveryStrategy?.deduplicationWindowMinutes ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 15;
                    updateConfig((prev) => ({
                      ...prev,
                      deliveryStrategy: {
                        ...prev.deliveryStrategy!,
                        deduplicationWindowMinutes: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Sliding window to suppress duplicate dispatches.</p>
                {validationErrors['deliveryStrategy.deduplicationWindowMinutes'] && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    {validationErrors['deliveryStrategy.deduplicationWindowMinutes']}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 5: EMERGENCY COMMUNICATION & BROADCAST POLICY
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-2 border-red-200 rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(5)}
          className="p-4 bg-red-50/50 flex items-center justify-between cursor-pointer select-none hover:bg-red-50/80 border-b border-red-200"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#131B2E]">Emergency Communication &amp; Broadcast</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-md bg-red-100 text-red-800 border border-red-300">
                  Critical Policy
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                High-priority multi-channel broadcast for campus emergencies, severe weather, and acute security alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
              {config.emergency?.enabled ? 'Broadcast Active' : 'Disabled'}
            </span>
            {openCards[5] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[5] && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50/60 border border-red-200 rounded-xl">
              <div>
                <span className="font-bold text-xs text-red-950 block">Emergency Broadcast System Status</span>
                <span className="text-[11px] text-red-800 block mt-0.5">
                  When enabled, campus administrators can broadcast urgent alerts to all stakeholders simultaneously.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emergency?.enabled ?? true}
                  onChange={(e) => {
                    const en = e.target.checked;
                    updateConfig((prev) => ({
                      ...prev,
                      emergency: {
                        ...prev.emergency!,
                        enabled: en,
                      },
                    }));
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {config.emergency?.enabled && (
              <div className="space-y-4 pt-1">
                {/* Emergency Channels Multi-Select */}
                <div>
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Emergency Dispatch Channels * (Simultaneous multi-channel broadcast)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { key: 'sms', label: 'SMS Gateway', desc: 'Instant DLT flash' },
                      { key: 'whatsapp', label: 'WhatsApp', desc: 'Direct message' },
                      { key: 'push', label: 'Push Alert', desc: 'Native popup' },
                      { key: 'voice_ivr', label: 'Voice / IVR', desc: 'Automated call' },
                      { key: 'parent_portal', label: 'Parent Portal', desc: 'Banner overlay' },
                      { key: 'email', label: 'Urgent Email', desc: 'Broadcast mail' },
                    ].map((ch) => {
                      const selected = (config.emergency?.emergencyChannels || []).includes(
                        ch.key as CommunicationChannelKey
                      );
                      return (
                        <label
                          key={ch.key}
                          className={`p-2.5 rounded-xl border cursor-pointer select-none transition ${
                            selected
                              ? 'bg-red-50 border-red-300 text-red-950 font-bold shadow-2xs'
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs">{ch.label}</span>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateConfig((prev) => {
                                  const current = prev.emergency?.emergencyChannels || [];
                                  const next = checked
                                    ? [...current, ch.key as CommunicationChannelKey]
                                    : current.filter((k) => k !== ch.key);
                                  return {
                                    ...prev,
                                    emergency: {
                                      ...prev.emergency!,
                                      emergencyChannels: next,
                                    },
                                  };
                                });
                              }}
                              className="rounded border-red-300 text-red-600 focus:ring-red-500"
                            />
                          </div>
                          <span className="text-[10px] text-[#64748B] block font-normal">{ch.desc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Emergency Audiences */}
                <div>
                  <label className="block font-bold text-[#334155] mb-1.5">
                    Emergency Recipient Groups *
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { key: 'parents', label: 'Parents / Guardians' },
                      { key: 'faculty', label: 'Faculty & Teachers' },
                      { key: 'non_teaching_staff', label: 'Staff & Security' },
                      { key: 'administrators', label: 'Administrators' },
                      { key: 'emergency_contacts', label: 'Emergency Contacts' },
                      { key: 'transport_staff', label: 'Bus Drivers' },
                    ].map((aud) => {
                      const selected = (config.emergency?.emergencyAudiences || []).includes(
                        aud.key as AudienceGroupKey
                      );
                      return (
                        <button
                          key={aud.key}
                          type="button"
                          onClick={() => {
                            updateConfig((prev) => {
                              const current = prev.emergency?.emergencyAudiences || [];
                              const next = selected
                                ? current.filter((k) => k !== aud.key)
                                : [...current, aud.key as AudienceGroupKey];
                              return {
                                ...prev,
                                emergency: {
                                  ...prev.emergency!,
                                  emergencyAudiences: next,
                                },
                              };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                            selected
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-slate-50'
                          }`}
                        >
                          {selected ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{aud.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Emergency Settings Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#131B2E] block">
                        Require Confirmation Dialog
                      </span>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">
                        Forces a two-step confirm before triggering broadcast.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.emergency?.requireConfirmationBeforeBroadcast ?? true}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateConfig((prev) => ({
                          ...prev,
                          emergency: {
                            ...prev.emergency!,
                            requireConfirmationBeforeBroadcast: val,
                          },
                        }));
                      }}
                      className="rounded border-[#CBD5E1] text-red-600 focus:ring-red-500"
                    />
                  </div>

                  <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-[#131B2E] block">
                        Override Quiet Hours &amp; Curfews
                      </span>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">
                        Emergency alerts dispatch immediately regardless of time.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.emergency?.overrideQuietHours ?? true}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateConfig((prev) => ({
                          ...prev,
                          emergency: {
                            ...prev.emergency!,
                            overrideQuietHours: val,
                          },
                        }));
                      }}
                      className="rounded border-[#CBD5E1] text-red-600 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 6: COMMUNICATION TIMING & QUIET HOURS
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(6)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              6
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Schedule &amp; Quiet Hours</h3>
              <p className="text-[11px] text-[#64748B]">
                Establish allowed time windows for routine notices and protect parents and faculty with enforced quiet hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              {config.schedule?.quietHoursEnabled
                ? `${config.schedule.quietHoursStart} – ${config.schedule.quietHoursEnd}`
                : '24/7 Delivery'}
            </span>
            {openCards[6] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[6] && (
          <div className="p-5 space-y-4">
            {validationErrors['schedule.quietHours'] && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors['schedule.quietHours']}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Routine window */}
              <div className="p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                  <Clock className="w-4 h-4 text-[#4338CA]" />
                  <span className="font-bold text-xs text-[#131B2E]">Allowed Routine Communication Hours</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">Allowed From</label>
                    <input
                      type="time"
                      value={config.schedule?.routineAllowedFrom || '08:00'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule!,
                            routineAllowedFrom: val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">Allowed Until</label>
                    <input
                      type="time"
                      value={config.schedule?.routineAllowedUntil || '20:00'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule!,
                            routineAllowedUntil: val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B]">Non-emergency circulars and homework are restricted to this window.</p>
              </div>

              {/* Quiet hours */}
              <div className="p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-xs text-[#131B2E]">Night Enforced Quiet Hours</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.schedule?.quietHoursEnabled ?? true}
                      onChange={(e) => {
                        const en = e.target.checked;
                        updateConfig((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule!,
                            quietHoursEnabled: en,
                          },
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4338CA]"></div>
                  </label>
                </div>

                {config.schedule?.quietHoursEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Quiet Hours Start</label>
                      <input
                        type="time"
                        value={config.schedule?.quietHoursStart || '21:30'}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateConfig((prev) => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule!,
                              quietHoursStart: val,
                            },
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] mb-1">Quiet Hours End</label>
                      <input
                        type="time"
                        value={config.schedule?.quietHoursEnd || '06:30'}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateConfig((prev) => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule!,
                              quietHoursEnd: val,
                            },
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-[#64748B]">All routine dispatch queue holds until quiet hours expire.</p>
              </div>
            </div>

            {/* Weekend & Holiday Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-[#334155] mb-1">Weekend Communication Policy</label>
                <select
                  value={config.schedule?.weekendCommunication || 'restricted'}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateConfig((prev) => ({
                      ...prev,
                      schedule: {
                        ...prev.schedule!,
                        weekendCommunication: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs"
                >
                  <option value="restricted">Restricted (Essential / Urgent Only)</option>
                  <option value="allowed">Allowed as Normal Routine</option>
                  <option value="emergency_only">Strictly Emergency Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Holiday &amp; Vacation Policy</label>
                <select
                  value={config.schedule?.holidayCommunication || 'restricted'}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateConfig((prev) => ({
                      ...prev,
                      schedule: {
                        ...prev.schedule!,
                        holidayCommunication: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs"
                >
                  <option value="restricted">Restricted (Important Circulars Only)</option>
                  <option value="allowed">Allowed as Normal Routine</option>
                  <option value="emergency_only">Strictly Emergency Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 7: CONSENT & COMPLIANCE
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(7)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              7
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Consent &amp; Preferences</h3>
              <p className="text-[11px] text-[#64748B]">
                Maintain strict compliance with regulatory telecom mandates (DLT), student privacy, and parent consent.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              DLT Compliant
            </span>
            {openCards[7] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[7] && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Transactional Consent */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950">
                    Transactional &amp; Service Communication
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-md">
                    Mandatory / Operational
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                  Fee receipts, attendance alerts, exam schedules, transport live tracking, and emergency safety notifications. Parents cannot opt out of operational transit or safety records.
                </p>
              </div>

              {/* Promotional Consent */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#131B2E]">
                    Promotional &amp; Marketing Campaigns
                  </span>
                  <input
                    type="checkbox"
                    checked={config.consent?.marketingPromotionalOptIn ?? false}
                    onChange={(e) => {
                      const en = e.target.checked;
                      updateConfig((prev) => ({
                        ...prev,
                        consent: {
                          ...prev.consent!,
                          marketingPromotionalOptIn: en,
                        },
                      }));
                    }}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  External admission drives, referral programs, and institutional promotional materials. Strictly opt-in only.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.consent?.allowParentChannelPreferences ?? true}
                  onChange={(e) => {
                    const en = e.target.checked;
                    updateConfig((prev) => ({
                      ...prev,
                      consent: {
                        ...prev.consent!,
                        allowParentChannelPreferences: en,
                      },
                    }));
                  }}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA]"
                />
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">
                    Allow Parents to Manage Channel Preferences in Mobile App / Portal
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">
                    Parents can toggle WhatsApp vs SMS vs Push preference for daily non-emergency updates.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.consent?.parentConsentRequired ?? true}
                  onChange={(e) => {
                    const en = e.target.checked;
                    updateConfig((prev) => ({
                      ...prev,
                      consent: {
                        ...prev.consent!,
                        parentConsentRequired: en,
                      },
                    }));
                  }}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#4338CA]"
                />
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">
                    Capture Parent Consent Declaration During Admission Intake
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">
                    Records digital signature timestamp on enrollment for telecom DLT audit compliance.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 8: SCHOOL SENDER IDENTITY
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(8)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              8
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#131B2E]">School Sender Identity</h3>
                {config.senderIdentity?.isInheritedFromProfile && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                    ✓ Inherited from School Profile
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B]">
                The official institutional identity displayed to parents and staff on SMS, WhatsApp, and email circulars.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              {config.senderIdentity?.smsSenderId || 'DLT Header'}
            </span>
            {openCards[8] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[8] && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Pre-filled from institutional onboarding records. You can customize communication-specific headers below.
              </span>
              <button
                type="button"
                onClick={() => {
                  updateConfig((prev) => ({
                    ...prev,
                    senderIdentity: createDefaultSenderIdentity(intakeData.schoolProfile),
                  }));
                }}
                className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-sync from School Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  School Display Name *
                </label>
                <input
                  type="text"
                  value={config.senderIdentity?.schoolDisplayName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        schoolDisplayName: val,
                        isInheritedFromProfile: false,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                  placeholder="e.g. St. Xavier's High School"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Displayed at the beginning of all messages.</p>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  SMS Sender ID (DLT Header) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={config.senderIdentity?.smsSenderId || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        smsSenderId: val,
                        isInheritedFromProfile: false,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono font-bold uppercase tracking-wider"
                  placeholder="e.g. STXAVR"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Exact 6-character alphanumeric registered DLT header in India (e.g. EKAAGR).
                </p>
                {validationErrors['senderIdentity.smsSenderId'] && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    {validationErrors['senderIdentity.smsSenderId']}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">WhatsApp Business Display Name</label>
                <input
                  type="text"
                  value={config.senderIdentity?.whatsappDisplayName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        whatsappDisplayName: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs"
                  placeholder="e.g. St. Xavier's Official Desk"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Email Sender Name</label>
                <input
                  type="text"
                  value={config.senderIdentity?.emailSenderName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        emailSenderName: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs"
                  placeholder="e.g. St. Xavier's Administration"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Official Communication Email *
                </label>
                <input
                  type="email"
                  value={config.senderIdentity?.officialEmail || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        officialEmail: val,
                        isInheritedFromProfile: false,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                  placeholder="e.g. communications@school.edu.in"
                />
                {validationErrors['senderIdentity.officialEmail'] && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    {validationErrors['senderIdentity.officialEmail']}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Official Helpline Phone *</label>
                <input
                  type="tel"
                  value={config.senderIdentity?.officialPhone || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        officialPhone: val,
                        isInheritedFromProfile: false,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Emergency Contact Number</label>
                <input
                  type="tel"
                  value={config.senderIdentity?.emergencyContactPhone || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        emergencyContactPhone: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                  placeholder="e.g. +91 98765 43299"
                />
                <p className="text-[10px] text-[#64748B] mt-1">Direct escalation desk for urgent calls.</p>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Reply-To Email Address</label>
                <input
                  type="email"
                  value={config.senderIdentity?.replyToEmail || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      senderIdentity: {
                        ...prev.senderIdentity!,
                        replyToEmail: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono"
                  placeholder="e.g. principal@school.edu.in"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 9: COMMUNICATION PROVIDERS / INTEGRATIONS STATUS
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(9)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              9
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Providers &amp; Integrations</h3>
              <p className="text-[11px] text-[#64748B]">
                Status of third-party telecom and email delivery gateways. For security, API secrets and credentials are never stored in client state.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#64748B] border border-[#CBD5E1]">
              Zero Plaintext Secrets
            </span>
            {openCards[9] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[9] && (
          <div className="p-5 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#64748B] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#4338CA] shrink-0" />
              <span>
                <strong>Zero Client Secrets:</strong> Gateway credentials (API tokens, DLT auth keys, SMTP passwords) are handled securely via isolated server-side vaulting post-onboarding.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'whatsapp',
                  name: 'WhatsApp Business API',
                  provider: config.providers?.whatsapp?.provider || 'Meta Cloud API',
                  status: config.providers?.whatsapp?.status || 'pending_configuration',
                  icon: MessageSquare,
                },
                {
                  id: 'sms',
                  name: 'DLT SMS Gateway',
                  provider: config.providers?.sms?.provider || 'MSG91',
                  status: config.providers?.sms?.status || 'pending_configuration',
                  icon: Smartphone,
                },
                {
                  id: 'email',
                  name: 'Official Email Gateway',
                  provider: config.providers?.email?.provider || 'Resend / SMTP',
                  status: config.providers?.email?.status || 'pending_configuration',
                  icon: Mail,
                },
                {
                  id: 'push',
                  name: 'Mobile Push Notifications',
                  provider: config.providers?.push?.provider || 'Firebase Cloud Messaging',
                  status: config.providers?.push?.status || 'pending_configuration',
                  icon: Bell,
                },
                {
                  id: 'voice',
                  name: 'Voice / IVR Dialing',
                  provider: config.providers?.voice?.provider || 'Exotel / Twilio',
                  status: config.providers?.voice?.status || 'not_required',
                  icon: Phone,
                },
              ].map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-[#4338CA]" />
                      <span className="font-bold text-xs text-[#131B2E]">{item.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                        item.status === 'configured'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'not_required'
                          ? 'bg-slate-100 text-[#64748B]'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.status === 'configured'
                        ? 'Configured'
                        : item.status === 'not_required'
                        ? 'Not Required'
                        : 'Pending Setup'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                    <span>Default Gateway:</span>
                    <span className="font-mono font-semibold text-[#131B2E]">{item.provider}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIntegrationModalProvider(item.name)}
                    className="w-full py-1.5 px-3 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#4338CA] hover:bg-[#EEF2FF]/50 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Integration Details</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 10: TEMPLATE & MESSAGE POLICIES
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(10)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              10
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Message Templates &amp; Policies</h3>
              <p className="text-[11px] text-[#64748B]">
                Configure whether system-generated messages use standard system templates or custom templates requiring DLT approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
              {config.templates?.templatePolicy === 'school_customized'
                ? 'Custom Templates'
                : config.templates?.templatePolicy === 'approval_required'
                ? 'Approval Required'
                : 'System Standard'}
            </span>
            {openCards[10] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[10] && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: 'standard_system',
                  title: 'Standard System Templates',
                  desc: 'Pre-registered with telecom operators. Instant launch with zero DLT delays.',
                  badge: 'Recommended',
                },
                {
                  value: 'school_customized',
                  title: 'School Customized Templates',
                  desc: 'Institution-specific wording. Ekaagra assists with registering your custom DLT templates.',
                  badge: 'Custom Branding',
                },
                {
                  value: 'approval_required',
                  title: 'Two-Step Signoff Workflow',
                  desc: 'Drafted notices require Principal or Head signoff before dispatching to parents.',
                  badge: 'Strict Governance',
                },
              ].map((opt) => {
                const isSelected = (config.templates?.templatePolicy || 'standard_system') === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        templates: {
                          ...prev.templates!,
                          templatePolicy: opt.value as any,
                        },
                      }));
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition ${
                      isSelected
                        ? 'bg-[#EEF2FF]/70 border-[#4338CA] shadow-2xs ring-1 ring-[#4338CA]/20'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-[#131B2E]">{opt.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#4338CA]">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{opt.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
              ℹ Full template wording, variable placeholders ({`{{student_name}}, {{amount}}, {{route_name}}`}) and DLT approval IDs can be refined in your Ekaagra Communications Center dashboard after onboarding.
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 11: COMMUNICATION GOVERNANCE & APPROVAL ROLES
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(11)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              11
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Governance &amp; Access Roles</h3>
              <p className="text-[11px] text-[#64748B]">
                Define permissions and approval checkpoints for general circulars and emergency broadcasts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              Audited
            </span>
            {openCards[11] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[11] && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Who Can Send General Announcements?
                </label>
                <select
                  value={config.governance?.whoCanSendGeneralAnnouncements || 'administrators_only'}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateConfig((prev) => ({
                      ...prev,
                      governance: {
                        ...prev.governance!,
                        whoCanSendGeneralAnnouncements: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                >
                  <option value="administrators_only">School Administrators &amp; Principal Only</option>
                  <option value="principal_only">Principal / Head of School Only</option>
                  <option value="authorized_staff">Authorized Administrative Staff</option>
                  <option value="department_heads">Department Heads &amp; Coordinators</option>
                  <option value="teachers">Class Teachers (For their assigned sections)</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">Controls broadcast rights across school ERP.</p>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Who Can Trigger Emergency Broadcasts?
                </label>
                <select
                  value={config.governance?.whoCanSendEmergencyBroadcasts || 'principal_only'}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    updateConfig((prev) => ({
                      ...prev,
                      governance: {
                        ...prev.governance!,
                        whoCanSendEmergencyBroadcasts: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold"
                >
                  <option value="principal_only">Principal / Head of Institution Only</option>
                  <option value="administrators">Designated Campus Administrators</option>
                  <option value="authorized_emergency_operators">Authorized Emergency Incident Response Team</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">Restricted authorization for high-priority dispatches.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">Approval for Bulk Dispatches</span>
                  <span className="text-[10px] text-[#64748B] block">Messages to &gt;100 recipients</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.governance?.requireApprovalForBulkMessages ?? true}
                  onChange={(e) => {
                    const val = e.target.checked;
                    updateConfig((prev) => ({
                      ...prev,
                      governance: {
                        ...prev.governance!,
                        requireApprovalForBulkMessages: val,
                      },
                    }));
                  }}
                  className="rounded border-[#CBD5E1] text-[#4338CA]"
                />
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">Tamper-Proof Audit Logging</span>
                  <span className="text-[10px] text-[#64748B] block">Log operator ID &amp; timestamps</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.governance?.maintainAuditLogging ?? true}
                  onChange={(e) => {
                    const val = e.target.checked;
                    updateConfig((prev) => ({
                      ...prev,
                      governance: {
                        ...prev.governance!,
                        maintainAuditLogging: val,
                      },
                    }));
                  }}
                  className="rounded border-[#CBD5E1] text-[#4338CA]"
                />
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#131B2E] block">Cross-Module Transit Sync</span>
                  <span className="text-[10px] text-[#64748B] block">Transport alert route sync</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         CARD 12: DYNAMIC CONFIGURATION SUMMARY
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        <div
          onClick={() => toggleCard(12)}
          className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold text-xs">
              12
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">Communication Configuration Summary</h3>
              <p className="text-[11px] text-[#64748B]">
                Real-time derived metrics across all institutional communication configurations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              Live Synchronized
            </span>
            {openCards[12] ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </div>
        </div>

        {openCards[12] && (
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              {summaryItems.map((item, idx) => (
                <div key={idx} className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-1">
                  <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-semibold truncate">
                    {item.label}
                  </span>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold text-[#131B2E] truncate">{item.value}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                          item.tone === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.tone === 'amber'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── INTEGRATION DETAILS MODAL ────────────────────────────────────────── */}
      {integrationModalProvider && (
        <ModalPortal isOpen={!!integrationModalProvider}>
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4338CA]" />
                <h4 className="font-bold text-sm text-[#131B2E]">
                  {integrationModalProvider} Integration
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIntegrationModalProvider(null)}
                className="text-[#64748B] hover:text-[#131B2E] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#64748B] leading-relaxed">
              <p>
                <strong>Security Architecture:</strong> Production credentials (API keys, DLT Entity IDs, webhook secrets, SMTP passwords) are never entered into client onboarding forms.
              </p>
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0] space-y-1">
                <span className="font-bold text-[#131B2E] block">Post-Intake Provisioning:</span>
                <p className="text-[11px]">
                  1. Ekaagra onboarding engineers set up your dedicated enterprise instance.<br />
                  2. You will receive an encrypted invite to securely submit your gateway credentials or authorize Meta / MSG91 permissions via OAuth.<br />
                  3. DLT templates and Sender IDs are verified directly with Indian telecom registries.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setIntegrationModalProvider(null)}
                className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold hover:bg-[#3730A3] cursor-pointer text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

// ─── HELPER: ICON RENDERER ───────────────────────────────────────────────────

function renderChannelIcon(iconName: string) {
  switch (iconName) {
    case 'MessageSquare':
      return <MessageSquare className="w-4 h-4" />;
    case 'Smartphone':
      return <Smartphone className="w-4 h-4" />;
    case 'Mail':
      return <Mail className="w-4 h-4" />;
    case 'Bell':
      return <Bell className="w-4 h-4" />;
    case 'Users':
      return <Users className="w-4 h-4" />;
    case 'GraduationCap':
      return <GraduationCap className="w-4 h-4" />;
    case 'Globe':
      return <Globe className="w-4 h-4" />;
    case 'Layers':
      return <Layers className="w-4 h-4" />;
    case 'Phone':
      return <Phone className="w-4 h-4" />;
    case 'ShieldAlert':
      return <ShieldAlert className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
}
