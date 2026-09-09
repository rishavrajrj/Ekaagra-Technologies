'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Image as ImageIcon,
  FolderArchive,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  FileText,
  Video,
  Palette,
  Type,
  Users,
  Building,
  School,
  Sparkles,
  Link2,
  Lock,
  Search,
  Filter,
  Eye,
  Check,
  HelpCircle,
  Info,
  Layers,
  FileCheck,
  Calendar,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  MediaAssetsData,
  MediaAssetItem,
  MediaAssetCategory,
  MediaAssetReadinessStatus,
  MediaAssetOwnership,
  MediaGovernanceData,
} from '@/lib/types';
import {
  MEDIA_ASSET_CATEGORIES,
  READINESS_STATUS_OPTIONS,
  OWNERSHIP_STATUS_OPTIONS,
  DEFAULT_MEDIA_ASSETS,
  resolveMediaAssetsApplicability,
  normalizeMediaAssetsData,
  validateMediaAssetsData,
  generateMediaAssetsSummary,
  getMediaAssetsBaselineRecommendations,
} from '@/lib/mediaAssetsUtils';

interface MediaAssetsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  onNavigateToSection?: (sectionKey: any) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  stepNumber?: number;
  totalSteps?: number;
}

export default function MediaAssetsSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  onNextStep,
  onPrevStep,
  stepNumber = 28,
  totalSteps = 29,
}: MediaAssetsSectionProps) {
  // Normalize incoming data safely with intelligent defaults
  const config: MediaAssetsData = useMemo(() => {
    return normalizeMediaAssetsData(intakeData.mediaAssets, intakeData);
  }, [intakeData.mediaAssets, intakeData]);

  // Applicability of conditional media assets
  const applicability = useMemo(() => {
    return resolveMediaAssetsApplicability(intakeData);
  }, [intakeData]);

  // Real-time validation & completion score
  const validation = useMemo(() => {
    return validateMediaAssetsData(config, intakeData);
  }, [config, intakeData]);

  // Dynamic configuration summary
  const summaryBullets = useMemo(() => {
    return generateMediaAssetsSummary(config);
  }, [config]);

  // Baseline recommendations
  const baselineRecs = useMemo(() => {
    return getMediaAssetsBaselineRecommendations(config);
  }, [config]);

  // Card Accordion Collapsed / Expanded state
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    branding: true,
    campus_facilities: true,
    people_community: false,
    academic_promotional: false,
    digital_channels: false,
    legal_governance: true,
    summary: true,
  });

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Filter state (All / Mandatory Only / Needs Attention / Ready)
  const [filterMode, setFilterMode] = useState<'all' | 'mandatory' | 'attention' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Master updater with legacy mirror synchronization
  const commitUpdate = useCallback(
    (updater: (prev: MediaAssetsData) => MediaAssetsData) => {
      const updated = updater(config);
      const committed = normalizeMediaAssetsData(updated, intakeData);
      if (updateSectionDirect) {
        updateSectionDirect('mediaAssets', committed);
      } else {
        Object.entries(committed).forEach(([k, v]) => {
          updateSectionField('mediaAssets', k, v);
        });
      }
    },
    [config, intakeData, updateSectionDirect, updateSectionField]
  );

  // Helper to update a specific asset
  const updateAsset = (assetId: string, partial: Partial<MediaAssetItem>) => {
    commitUpdate((prev) => ({
      ...prev,
      assets: {
        ...(prev.assets || {}),
        [assetId]: {
          ...((prev.assets || {})[assetId] as MediaAssetItem),
          ...partial,
        },
      },
    }));
  };

  // Helper to update governance fields
  const updateGovernance = (field: keyof MediaGovernanceData, value: any) => {
    commitUpdate((prev) => ({
      ...prev,
      governance: {
        ...(prev.governance || ({} as MediaGovernanceData)),
        [field]: value,
      },
    }));
  };

  // Helper icon selector
  const getCategoryIcon = (catId: MediaAssetCategory) => {
    switch (catId) {
      case 'branding':
        return <Palette className="w-4 h-4" />;
      case 'campus_facilities':
        return <Building className="w-4 h-4" />;
      case 'people_community':
        return <Users className="w-4 h-4" />;
      case 'academic_promotional':
        return <Sparkles className="w-4 h-4" />;
      case 'digital_channels':
        return <Layers className="w-4 h-4" />;
      case 'legal_governance':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <FolderArchive className="w-4 h-4" />;
    }
  };

  // Helper to get asset type badge icon
  const getAssetTypeBadge = (type: string) => {
    switch (type) {
      case 'vector':
        return 'Vector (SVG/AI)';
      case 'image':
        return 'High-Res Photo';
      case 'video':
        return 'Video / Virtual Tour';
      case 'document':
        return 'PDF Document';
      case 'copy_text':
        return 'Narrative / Copy';
      case 'color_palette':
        return 'Color Codes';
      case 'typography':
        return 'Fonts Guide';
      default:
        return type;
    }
  };

  // Filter asset items according to filter mode & search
  const filterAssets = (items: MediaAssetItem[]) => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesFormat = item.expectedFormats.some((f) => f.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesFormat) return false;
      }

      // Mode filter
      if (filterMode === 'mandatory') {
        return item.requirementLevel === 'mandatory' && item.isApplicable;
      }
      if (filterMode === 'attention') {
        return (
          item.isApplicable &&
          (item.readinessStatus === 'not_started' ||
            item.readinessStatus === 'needs_review' ||
            item.readinessStatus === 'in_progress')
        );
      }
      if (filterMode === 'ready') {
        return item.readinessStatus === 'ready' || item.readinessStatus === 'provided';
      }
      return true;
    });
  };

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── 1. SECTION ARCHITECTURE & READINESS CARD ─── */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Content Kit Architecture
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  6 Asset Categories
                </span>
              </div>
              <h3 className="text-base font-bold text-[#131B2E] mt-1">
                Media Assets &amp; Content Kit Readiness
              </h3>
              <p className="text-xs text-[#64748B]">
                Organize school branding, campus photography, leadership portraits, brochures, and usage authorizations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-center">
            <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold bg-white border-[#E2E8F0] text-slate-700 shadow-2xs">
              {validation.readinessCounts.ready + validation.readinessCounts.provided} of {validation.readinessCounts.total - validation.readinessCounts.notApplicable} Ready
            </span>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          The implementation team uses these assets to brand and populate your website, portals, mobile applications, and automated communication templates. Use this kit to track which files are ready in your institutional archives or shared via cloud storage.
        </p>

        {/* Readiness Counters Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-2xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-emerald-800">
                {validation.readinessCounts.ready + validation.readinessCounts.provided}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">Ready / Shared</span>
            </div>
          </div>

          <div className="bg-white border border-amber-200 p-3 rounded-xl shadow-2xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-amber-800">
                {validation.readinessCounts.inProgress}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">In Progress</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-2xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-700">
                {validation.readinessCounts.notStarted + validation.readinessCounts.needsReview}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">Needs Attention</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-2xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-600">
                {validation.readinessCounts.notApplicable}
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">Not Applicable</span>
            </div>
          </div>
        </div>

        {/* Global Shared Cloud Folder Link Input */}
        <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-xs text-[#131B2E] flex items-center space-x-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>School Cloud Drive / Shared Folder Link (Recommended)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Google Drive, OneDrive, or Dropbox</span>
          </div>
          <input
            type="url"
            value={config.sharedDriveUrl || ''}
            onChange={(e) => commitUpdate((prev) => ({ ...prev, sharedDriveUrl: e.target.value }))}
            placeholder="https://drive.google.com/drive/folders/... or shared OneDrive link"
            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#131B2E] focus:bg-white focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 focus:outline-hidden transition"
          />
          <p className="text-[11px] text-[#64748B]">
            Provide a shared cloud folder containing high-resolution source photos and documents to simplify bulk handover.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'mandatory', label: 'Mandatory Only' },
                { id: 'attention', label: 'Needs Attention' },
                { id: 'ready', label: 'Ready / Shared' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-[#131B2E] text-white shadow-2xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Pending requirements alert if incomplete */}
        {!validation.isValid && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-xs text-amber-900 block">
                {validation.missingFields.length} Mandatory Asset Requirement{validation.missingFields.length > 1 ? 's' : ''} Still Pending
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {validation.missingFields[0]}
                {validation.missingFields.length > 1 && ` (+${validation.missingFields.length - 1} more items)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. RECOMMENDED BASELINE AUDIT BANNER ─── */}
      {baselineRecs.length > 0 && (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-950 font-bold text-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Recommended Asset Quality Advice</span>
          </div>
          <p className="text-[11px] text-blue-900 leading-relaxed">
            High-resolution source assets produce the best visual quality on modern high-DPI displays and Retina screens. Consider these tips:
          </p>
          <ul className="space-y-1.5 pt-1">
            {baselineRecs.map((rec) => (
              <li key={rec.id} className="text-[11px] text-blue-950 flex items-start space-x-2">
                <span className="font-bold text-blue-600">&bull;</span>
                <span>{rec.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── 3. ASSET CATEGORY CARDS ─── */}
      {MEDIA_ASSET_CATEGORIES.map((cat) => {
        const isExpanded = Boolean(expandedCards[cat.id]);
        const allCategoryAssets = Object.values(config.assets || {}).filter((a) => a.category === cat.id);
        const filteredCategoryAssets = filterAssets(allCategoryAssets);

        // Calculate category ready count
        const readyInCategory = allCategoryAssets.filter(
          (a) => a.readinessStatus === 'ready' || a.readinessStatus === 'provided'
        ).length;
        const applicableInCategory = allCategoryAssets.filter((a) => a.isApplicable).length;

        // Skip category rendering if search active and no items match
        if (cat.id !== 'legal_governance' && filteredCategoryAssets.length === 0 && (searchQuery || filterMode !== 'all')) {
          return null;
        }

        return (
          <div key={cat.id} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => toggleCard(cat.id)}
              className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
                  {getCategoryIcon(cat.id)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-[#131B2E] uppercase">{cat.label}</h3>
                    {cat.id !== 'legal_governance' && (
                      <span className="text-[9px] font-bold text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {readyInCategory} of {applicableInCategory} Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B]">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-5 space-y-4">
                {/* LEGAL GOVERNANCE SPECIAL BODY */}
                {cat.id === 'legal_governance' ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-purple-950 text-[11px] leading-relaxed">
                      Confirming institutional ownership and student photo consent policies ensures compliant publishing on your public website, portals, and mobile app stores without legal exposure.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* School Ownership Confirmation */}
                      <label className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-white flex items-start space-x-3 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={config.governance?.schoolOwnershipConfirmed ?? true}
                          onChange={(e) => updateGovernance('schoolOwnershipConfirmed', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-[#131B2E] block">
                            Institutional Copyright &amp; Ownership Confirmation *
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            The school confirms it possesses lawful ownership or explicit commissioned rights to all provided logos, slogans, and campus photography.
                          </span>
                        </div>
                      </label>

                      {/* Third Party Licensing */}
                      <label className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-white flex items-start space-x-3 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={config.governance?.thirdPartyLicensingCleared ?? true}
                          onChange={(e) => updateGovernance('thirdPartyLicensingCleared', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-[#131B2E] block">
                            Third-Party &amp; Agency Rights Cleared
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Any stock photographs, commercial fonts, or external promotional videos are licensed for digital public distribution.
                          </span>
                        </div>
                      </label>

                      {/* Student Photo Consent */}
                      <label className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-white flex items-start space-x-3 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={config.governance?.studentPhotoConsentPolicyConfirmed ?? true}
                          onChange={(e) => updateGovernance('studentPhotoConsentPolicyConfirmed', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-[#131B2E] block">
                            Student Photo Consent Policy Confirmed *
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Parental photo consent is recorded on file in accordance with the school&apos;s admission guidelines and child protection policy.
                          </span>
                        </div>
                      </label>

                      {/* Staff Photo Consent */}
                      <label className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-slate-300 bg-white flex items-start space-x-3 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={config.governance?.staffPhotoConsentPolicyConfirmed ?? true}
                          onChange={(e) => updateGovernance('staffPhotoConsentPolicyConfirmed', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-[#131B2E] block">
                            Faculty &amp; Staff Directory Consent
                          </span>
                          <span className="text-[11px] text-[#64748B] leading-tight block">
                            Faculty and staff portraits are authorized for display in the institutional staff directory.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Publication & Geographic Restrictions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-[#334155] block">
                          Special Publication / Privacy Restrictions
                        </label>
                        <input
                          type="text"
                          value={config.governance?.publicationRestrictions || ''}
                          onChange={(e) => updateGovernance('publicationRestrictions', e.target.value)}
                          placeholder="e.g. Do not show student names alongside photos, pre-primary photos restricted"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-[11px] text-[#334155] block">
                          Authorized Signatory &amp; Designation
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={config.governance?.authorizedSignatoryName || ''}
                            onChange={(e) => updateGovernance('authorizedSignatoryName', e.target.value)}
                            placeholder="Signatory Name"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                          />
                          <input
                            type="text"
                            value={config.governance?.authorizedSignatoryDesignation || ''}
                            onChange={(e) => updateGovernance('authorizedSignatoryDesignation', e.target.value)}
                            placeholder="Designation"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STANDARD ASSET LIST CARDS */
                  <div className="space-y-3.5">
                    {filteredCategoryAssets.map((asset) => {
                      const isMandatory = asset.requirementLevel === 'mandatory';
                      const isNA = !asset.isApplicable || asset.readinessStatus === 'not_applicable';
                      const isComplete = asset.readinessStatus === 'ready' || asset.readinessStatus === 'provided';

                      return (
                        <div
                          key={asset.id}
                          className={`p-4 rounded-xl border transition space-y-3 ${
                            isNA
                              ? 'bg-slate-50 border-slate-200 opacity-70'
                              : isComplete
                              ? 'bg-emerald-50/20 border-emerald-200'
                              : isMandatory
                              ? 'bg-white border-amber-200/80 shadow-2xs'
                              : 'bg-white border-[#E2E8F0]'
                          }`}
                        >
                          {/* Item Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-bold text-xs text-[#131B2E]">{asset.name}</span>

                                {/* Requirement Level Badge */}
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    isNA
                                      ? 'bg-slate-200 text-slate-600'
                                      : isMandatory
                                      ? 'bg-rose-100 text-rose-800'
                                      : asset.requirementLevel === 'recommended'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isNA ? 'Not Applicable' : asset.requirementLevel}
                                </span>

                                {/* Asset Type Badge */}
                                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {getAssetTypeBadge(asset.assetType)}
                                </span>

                                {asset.consentRequired && (
                                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Consent Policy</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-relaxed">{asset.description}</p>
                            </div>

                            {/* Status Selector */}
                            <div className="shrink-0 self-start sm:self-center">
                              <select
                                value={asset.readinessStatus}
                                onChange={(e) =>
                                  updateAsset(asset.id, {
                                    readinessStatus: e.target.value as MediaAssetReadinessStatus,
                                  })
                                }
                                aria-label={`Readiness status for ${asset.name}`}
                                className="text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#4338CA] focus:outline-hidden cursor-pointer"
                              >
                                {READINESS_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Inapplicability Reason Note */}
                          {asset.inapplicabilityReason && isNA && (
                            <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600">
                              <span className="font-semibold">Auto-Applicability Rule: </span>
                              {asset.inapplicabilityReason}
                            </div>
                          )}

                          {/* Format Guidance & Usage Locations */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-400 font-medium block">Expected Formats &amp; Resolution:</span>
                              <span className="font-semibold text-[#334155]">
                                {asset.expectedFormats.join(', ')} &bull; {asset.recommendedResolution}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-medium block">Intended Usage Locations:</span>
                              <span className="text-slate-600">{asset.usageLocations.join(', ')}</span>
                            </div>
                          </div>

                          {/* Reference Location / Drive Link Input (If Applicable) */}
                          {!isNA && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Reference Link / Filename in Shared Drive
                                </label>
                                <input
                                  type="text"
                                  value={asset.referenceLocation || ''}
                                  onChange={(e) => updateAsset(asset.id, { referenceLocation: e.target.value })}
                                  placeholder="e.g. Logos/school_crest_vector.svg or Drive folder URL"
                                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#131B2E] focus:bg-white focus:border-[#4338CA] focus:outline-hidden"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Ownership Status
                                </label>
                                <select
                                  value={asset.ownershipStatus || 'institution_owned'}
                                  onChange={(e) =>
                                    updateAsset(asset.id, {
                                      ownershipStatus: e.target.value as MediaAssetOwnership,
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-[#131B2E] focus:bg-white focus:border-[#4338CA] focus:outline-hidden cursor-pointer"
                                >
                                  {OWNERSHIP_STATUS_OPTIONS.map((own) => (
                                    <option key={own.id} value={own.id}>
                                      {own.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ─── 4. SUMMARY & CONTENT KIT CHECKLIST ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <button
          type="button"
          aria-expanded={Boolean(expandedCards.summary)}
          onClick={() => toggleCard('summary')}
          className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition cursor-pointer text-left border-b border-[#E2E8F0]"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#131B2E]">CONFIGURATION SUMMARY &amp; CONTENT KIT METRICS</h3>
              <p className="text-[11px] text-[#64748B]">
                Active readiness indicators and media package compliance status.
              </p>
            </div>
          </div>
          {expandedCards.summary ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
        </button>

        {expandedCards.summary && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {summaryBullets.map((bullet, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-900"
                >
                  &bull; {bullet}
                </span>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800 block">Implementation Next Steps:</span>
              <p>
                Once submitted, Ekaagra Technologies will review your media asset inventory and coordinate directly with your designated administrative contact to collect any outstanding high-resolution source vector files or photographic assets prior to portal production launch.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
