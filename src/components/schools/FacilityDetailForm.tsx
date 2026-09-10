'use client';

import React, { useRef } from 'react';
import {
  Sparkles,
  Laptop,
  FlaskConical,
  BookOpen,
  Trophy,
  Theater,
  HeartPulse,
  Utensils,
  ShieldCheck,
  Home,
  Building2,
  CheckCircle2,
  AlertCircle,
  Camera,
  UploadCloud,
  Trash2,
  Star,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  Loader2,
  Check,
  ImageIcon,
} from 'lucide-react';
import type {
  WebsiteFacilityConfig,
  CampusImageData,
  SharedMediaAsset,
} from '@/lib/types';
import {
  SCIENCE_LAB_TYPES,
  SPORTS_CHECKLIST,
  type FacilityDefinition,
} from '@/lib/facilitiesUtils';
import SchoolMediaPickerModal from './SchoolMediaPickerModal';
import {
  filterAssetsForSection,
  formatMediaSource,
  formatAssetCategories,
  sharedAssetToCampusImage,
} from '@/lib/mediaRegistryUtils';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-amber-500" />,
  Laptop: <Laptop className="w-5 h-5 text-indigo-500" />,
  FlaskConical: <FlaskConical className="w-5 h-5 text-emerald-500" />,
  BookOpen: <BookOpen className="w-5 h-5 text-blue-500" />,
  Trophy: <Trophy className="w-5 h-5 text-orange-500" />,
  Theater: <Theater className="w-5 h-5 text-purple-500" />,
  HeartPulse: <HeartPulse className="w-5 h-5 text-rose-500" />,
  Utensils: <Utensils className="w-5 h-5 text-yellow-600" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-teal-600" />,
  Home: <Home className="w-5 h-5 text-cyan-600" />,
  Building2: <Building2 className="w-5 h-5 text-slate-500" />,
};

interface FacilityDetailFormProps {
  def: FacilityDefinition;
  config: WebsiteFacilityConfig;
  isReadOnly?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateField: (field: keyof WebsiteFacilityConfig, value: any) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onRemovePhoto: (photoId: string) => void;
  onSetHeroPhoto: (photoId: string) => void;
  onUpdatePhotoCaption: (photoId: string, caption: string) => void;
  uploadingTaskMessage?: string;
  mediaRegistry?: SharedMediaAsset[];
  onSelectExistingPhotos?: (selectedAssets: SharedMediaAsset[]) => void;
  onDeleteAsset?: (asset: SharedMediaAsset) => void | Promise<void>;
}

export default function FacilityDetailForm({
  def,
  config,
  isReadOnly = false,
  isExpanded,
  onToggleExpand,
  onUpdateField,
  onPhotoUpload,
  onRemovePhoto,
  onSetHeroPhoto,
  onUpdatePhotoCaption,
  uploadingTaskMessage,
  mediaRegistry = [],
  onSelectExistingPhotos,
  onDeleteAsset,
}: FacilityDetailFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const validation = def.validate(config);
  const photos = config.photos || [];

  return (
    <div
      id={`facility-detail-${def.id}`}
      className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs transition"
    >
      {/* ─── EXPANDABLE HEADER ────────────────────────────────────────── */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 select-none border-b border-[#E2E8F0]"
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center shrink-0">
            {ICON_MAP[def.iconName] || <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-[#131B2E]">{def.title}</h4>
              {validation.isValid ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Complete</span>
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Missing required details ({validation.missingRequired.length})
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Tell us about this facility so we can showcase it on your website.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
            {photos.length} photo{photos.length === 1 ? '' : 's'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* ─── EXPANDED FORM BODY ───────────────────────────────────────── */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 text-xs text-[#131B2E]">
          {/* Validation Notice if incomplete */}
          {!validation.isValid && validation.missingRequired.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] space-y-0.5">
                <strong className="block">Required to showcase this facility:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {validation.missingRequired.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* FACILITY SPECIFIC CONTROLS                                   */}
          {/* ──────────────────────────────────────────────────────────── */}

          {/* 1. SMART CLASSROOMS */}
          {def.id === 'smart_classrooms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Number of Smart Classrooms <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.count || ''}
                    onChange={(e) => onUpdateField('count', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 12"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Total rooms equipped with interactive digital displays.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Interactive Technology <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.interactiveTechnology || 'Interactive Flat Panels (IFPs)'}
                    onChange={(e) => onUpdateField('interactiveTechnology', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="Interactive Flat Panels (IFPs)">Interactive Flat Panels (IFPs)</option>
                    <option value="Smart Interactive Boards">Smart Interactive Boards</option>
                    <option value="Digital Projector Screens">Digital Projector Screens</option>
                    <option value="Touchscreen Multimedia Consoles">Touchscreen Multimedia Consoles</option>
                    <option value="Other Technology">Other Technology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <span className="font-semibold text-xs text-[#131B2E]">Air Conditioned Classrooms</span>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.airConditioned)}
                    onChange={(e) => onUpdateField('airConditioned', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <span className="font-semibold text-xs text-[#131B2E]">Dedicated Audio System</span>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.audioSystem)}
                    onChange={(e) => onUpdateField('audioSystem', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 2. COMPUTER LABORATORY */}
          {def.id === 'computer_lab' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Number of Computer Labs <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.count || ''}
                    onChange={(e) => onUpdateField('count', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Total Number of Computers <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.computersCount || ''}
                    onChange={(e) => onUpdateField('computersCount', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 60"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Internet Connectivity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.internetConnectivity || 'High-speed Fiber Broadband with Wi-Fi & LAN'}
                    onChange={(e) => onUpdateField('internetConnectivity', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="High-speed Fiber Broadband with Wi-Fi & LAN">High-speed Fiber Broadband with Wi-Fi & LAN</option>
                    <option value="Dedicated Leased Line Fiber">Dedicated Leased Line Fiber</option>
                    <option value="Gigabit Local Area Network (LAN)">Gigabit Local Area Network (LAN)</option>
                    <option value="Standard Broadband">Standard Broadband</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4 pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(config.airConditioned)}
                      onChange={(e) => onUpdateField('airConditioned', e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="font-semibold text-xs text-[#131B2E]">Air-Conditioned Lab</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(config.lanWifi ?? true)}
                      onChange={(e) => onUpdateField('lanWifi', e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                    />
                    <span className="font-semibold text-xs text-[#131B2E]">LAN & Wi-Fi Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 3. SCIENCE LABORATORIES */}
          {def.id === 'science_lab' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-xs text-[#131B2E] mb-1.5">
                  Laboratory Types <span className="text-rose-500">* (Select at least one)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SCIENCE_LAB_TYPES.map((type) => {
                    const currentTypes = config.types || [];
                    const isChecked = currentTypes.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer select-none transition text-xs ${
                          isChecked
                            ? 'bg-[#EEF2FF] border-[#4338CA] text-[#4338CA] font-bold shadow-2xs ring-1 ring-[#4338CA]/20'
                            : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked ? currentTypes.filter((t) => t !== type.id) : [...currentTypes, type.id];
                            onUpdateField('types', next);
                          }}
                          className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                        />
                        <span className="truncate">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Number of Laboratories <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.count || ''}
                    onChange={(e) => onUpdateField('count', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Major Equipment Highlights (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={config.majorEquipment || ''}
                    onChange={(e) => onUpdateField('majorEquipment', e.target.value)}
                    placeholder="e.g. Optical microscopes, digital sensors, fume hoods"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. LIBRARY */}
          {def.id === 'library' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Approximate Book Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.bookCount || ''}
                    onChange={(e) => onUpdateField('bookCount', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 6500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Showcased as "{Number(config.bookCount || 0).toLocaleString()}+ curated books" on website.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Reading Capacity (Seats) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.capacity || ''}
                    onChange={(e) => onUpdateField('capacity', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 80"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Showcased as "Reading capacity for {config.capacity || 0} students" on website.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <span className="font-semibold text-xs text-[#131B2E]">Digital Library / E-Books Available</span>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.digitalLibrary)}
                    onChange={(e) => onUpdateField('digitalLibrary', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <span className="font-semibold text-xs text-[#131B2E]">Newspapers, Periodicals & Journals</span>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.newspapersJournals)}
                    onChange={(e) => onUpdateField('newspapersJournals', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 5. PLAYGROUND & SPORTS */}
          {def.id === 'sports' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-xs text-[#131B2E] mb-1.5">
                  Sports Offered <span className="text-rose-500">* (Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPORTS_CHECKLIST.map((sp) => {
                    const currentSports = config.sports || [];
                    const isChecked = currentSports.includes(sp.id);
                    return (
                      <label
                        key={sp.id}
                        className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer select-none transition text-xs ${
                          isChecked
                            ? 'bg-[#EEF2FF] border-[#4338CA] text-[#4338CA] font-bold shadow-2xs ring-1 ring-[#4338CA]/20'
                            : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked ? currentSports.filter((s) => s !== sp.id) : [...currentSports, sp.id];
                            onUpdateField('sports', next);
                          }}
                          className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                        />
                        <span className="truncate">{sp.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Number of Playgrounds / Sports Fields (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.count || ''}
                    onChange={(e) => onUpdateField('count', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Courts & Facilities Highlights (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={config.majorEquipment || ''}
                    onChange={(e) => onUpdateField('majorEquipment', e.target.value)}
                    placeholder="e.g. 200m track, football turf, synthetic basketball court"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. AUDITORIUM / MULTIPURPOSE HALL */}
          {def.id === 'auditorium' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Seating Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.capacity || ''}
                    onChange={(e) => onUpdateField('capacity', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Hall Type
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.hallType || 'Multipurpose Auditorium'}
                    onChange={(e) => onUpdateField('hallType', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="Multipurpose Auditorium">Multipurpose Auditorium</option>
                    <option value="Open-Air Amphitheater">Open-Air Amphitheater</option>
                    <option value="Cultural Stage Hall">Cultural Stage Hall</option>
                    <option value="Mini-Auditorium">Mini-Auditorium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.stageAvailable ?? true)}
                    onChange={(e) => onUpdateField('stageAvailable', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Stage Available</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.soundSystem ?? true)}
                    onChange={(e) => onUpdateField('soundSystem', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Sound System</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.projectorDisplay ?? true)}
                    onChange={(e) => onUpdateField('projectorDisplay', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Projector / Display</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.airConditioned)}
                    onChange={(e) => onUpdateField('airConditioned', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Air Conditioned</span>
                </label>
              </div>
            </div>
          )}

          {/* 7. MEDICAL / INFIRMARY */}
          {def.id === 'medical_room' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Number of Observation Beds
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.bedsCount || ''}
                    onChange={(e) => onUpdateField('bedsCount', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Nurse / Medical Attendant
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.nurseAvailable ? 'Full-Time Registered Campus Nurse' : 'Trained Staff Member'}
                    onChange={(e) => onUpdateField('nurseAvailable', e.target.value.includes('Nurse'))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="Full-Time Registered Campus Nurse">Full-Time Registered Campus Nurse</option>
                    <option value="Visiting Nurse">Visiting Nurse</option>
                    <option value="Trained Staff Member">Trained First-Aid Staff Member</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.firstAidAvailable ?? true)}
                    onChange={(e) => onUpdateField('firstAidAvailable', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">First Aid & Emergency Equipment Available</span>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.dedicatedRoom ?? true)}
                    onChange={(e) => onUpdateField('dedicatedRoom', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Dedicated Medical Room / Infirmary Bay</span>
                </label>
              </div>
            </div>
          )}

          {/* 8. CAFETERIA / CANTEEN */}
          {def.id === 'cafeteria' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.capacity || ''}
                    onChange={(e) => onUpdateField('capacity', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Meal Service Type
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.mealServiceType || 'Full Nutritious Meal Mess'}
                    onChange={(e) => onUpdateField('mealServiceType', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="Full Nutritious Meal Mess">Full Nutritious Meal Mess</option>
                    <option value="Canteen & Snack Bar">Canteen & Snack Bar</option>
                    <option value="Both Hot Meals & Snacks">Both Hot Meals & Snacks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.drinkingWater ?? true)}
                    onChange={(e) => onUpdateField('drinkingWater', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">RO Purified Water</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.kitchenFacility ?? true)}
                    onChange={(e) => onUpdateField('kitchenFacility', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Hygienic Kitchen</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.diningArea ?? true)}
                    onChange={(e) => onUpdateField('diningArea', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Spacious Dining Hall</span>
                </label>
              </div>
            </div>
          )}

          {/* 9. CCTV & SECURITY */}
          {def.id === 'cctv_security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Approximate Camera Count (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.cctvCount || ''}
                    onChange={(e) => onUpdateField('cctvCount', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 64"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Security Personnel
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.securityStaff ? '24/7 Trained Security Staff' : 'Gated Perimeter Security'}
                    onChange={(e) => onUpdateField('securityStaff', e.target.value.includes('24/7'))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="24/7 Trained Security Staff">24/7 Trained Security Staff</option>
                    <option value="Day-Shift Security Guards">Day-Shift Security Guards Only</option>
                    <option value="Gated Perimeter Security">Gated Perimeter Security</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.is24x7Monitored ?? true)}
                    onChange={(e) => onUpdateField('is24x7Monitored', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">24x7 Continuous Surveillance Monitoring</span>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.visitorManagement ?? true)}
                    onChange={(e) => onUpdateField('visitorManagement', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Digital Visitor Registration & Gatepass Log</span>
                </label>
              </div>
            </div>
          )}

          {/* 10. HOSTEL */}
          {def.id === 'hostel' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-xs text-[#131B2E] mb-1">
                  Hostel Accommodation Type <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={isReadOnly}
                  value={config.hostelType || 'both'}
                  onChange={(e) => onUpdateField('hostelType', e.target.value as any)}
                  className="w-full sm:w-1/2 px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                >
                  <option value="both">Boys & Girls (Separate Wings / Blocks)</option>
                  <option value="boys">Boys Hostel Only</option>
                  <option value="girls">Girls Hostel Only</option>
                </select>
              </div>

              {/* Conditional Capacity Inputs */}
              {config.hostelType === 'both' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-xs text-[#131B2E] mb-1">
                      Boys Hostel Student Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      value={config.boysCapacity || ''}
                      onChange={(e) => onUpdateField('boysCapacity', parseInt(e.target.value) || 0)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-xs text-[#131B2E] mb-1">
                      Girls Hostel Student Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      value={config.girlsCapacity || ''}
                      onChange={(e) => onUpdateField('girlsCapacity', parseInt(e.target.value) || 0)}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Total Student Boarding Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isReadOnly}
                    value={config.capacity || ''}
                    onChange={(e) => onUpdateField('capacity', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 120"
                    className="w-full sm:w-1/2 px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.wardenAvailable ?? true)}
                    onChange={(e) => onUpdateField('wardenAvailable', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Resident Wardens</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.cctvSecured ?? true)}
                    onChange={(e) => onUpdateField('cctvSecured', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">CCTV Secured</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.studyRoom ?? true)}
                    onChange={(e) => onUpdateField('studyRoom', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Supervised Study</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={Boolean(config.diningMess ?? true)}
                    onChange={(e) => onUpdateField('diningMess', e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20"
                  />
                  <span className="font-semibold text-xs text-[#131B2E]">Hostel Mess Included</span>
                </label>
              </div>
            </div>
          )}

          {/* 11. OTHER FACILITIES */}
          {def.id === 'other' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={config.customName || ''}
                    onChange={(e) => onUpdateField('customName', e.target.value)}
                    placeholder="e.g. Atal Tinkering Lab / Robotics Studio"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-xs text-[#131B2E] mb-1">
                    Category (Optional)
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={config.category || 'STEM & Innovation'}
                    onChange={(e) => onUpdateField('category', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                  >
                    <option value="STEM & Innovation">STEM & Innovation</option>
                    <option value="Arts, Dance & Music">Arts, Dance & Music</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Special Education & Wellness">Special Education & Wellness</option>
                    <option value="Other Campus Amenity">Other Campus Amenity</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Short Website Description for all active facilities */}
          <div>
            <label className="block font-bold text-xs text-[#131B2E] mb-1">
              Short Website Description (Optional)
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={config.description || ''}
              onChange={(e) => onUpdateField('description', e.target.value)}
              placeholder={`Custom headline or brief description for ${def.title} on your website...`}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
            />
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* FACILITY-SPECIFIC PHOTO UPLOADER (SECTION 14)               */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-xs text-[#131B2E]">
                  <Camera className="w-4 h-4 text-[#4338CA]" />
                  <span>{def.title.toUpperCase()} PHOTOS</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {def.photoRecommendation.label} • Automatically converted to optimized WebP
                </p>
              </div>
              <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-full text-slate-700 self-start sm:self-auto">
                {photos.length} selected for this facility
              </span>
            </div>

            {/* Hidden file input for direct uploads */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              disabled={isReadOnly}
              onChange={(e) => onPhotoUpload(e.target.files)}
              className="hidden"
            />

            {/* ─── INTELLIGENT MEDIA REUSE OR EMPTY STATE ─────────────── */}
            {mediaRegistry.length > 0 ? (
              <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#131B2E]">Existing School Photos</div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        We found {mediaRegistry.length} photo{mediaRegistry.length === 1 ? '' : 's'} already uploaded for this school. Select the photos you want to use here.
                      </p>
                    </div>
                  </div>

                  {photos.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{photos.length} active in {def.title}</span>
                    </span>
                  )}
                </div>

                {/* Quick Selection Strip: Recommended photos for this facility */}
                {(() => {
                  const { recommended: recs } = filterAssetsForSection(mediaRegistry, def.id);
                  const alreadyUsedUrls = new Set(photos.map((p) => (p.url || '').toLowerCase()));
                  const availableRecs = recs.filter((r) => !alreadyUsedUrls.has((r.url || '').toLowerCase()));

                  if (availableRecs.length === 0) return null;

                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                        <span>Recommended from Campus ({availableRecs.length} available):</span>
                        <span className="text-[10px] text-slate-400">Click photo to select directly</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableRecs.slice(0, 4).map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              if (isReadOnly || !onSelectExistingPhotos) return;
                              onSelectExistingPhotos([asset]);
                            }}
                            className="group border border-slate-200 hover:border-[#4338CA] rounded-lg p-1.5 bg-slate-50/60 hover:bg-[#EEF2FF]/30 transition cursor-pointer flex items-center space-x-2"
                          >
                            <img
                              src={asset.url}
                              alt={asset.fileName}
                              className="w-10 h-10 rounded-md object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold text-[#131B2E] truncate">
                                {asset.fileName}
                              </span>
                              <span className="block text-[9px] text-[#4338CA] font-medium truncate">
                                + Use in {def.shortTitle}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Primary & Secondary Action CTAs */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setIsPickerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Existing Photos</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New Photos</span>
                  </button>
                </div>
              </div>
            ) : (
              /* No existing photos anywhere in the school */
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#131B2E]">{def.title} Photos</h5>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    No existing photos found. Upload photos for this facility to showcase it on your website.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload {def.title} Photos</span>
                </button>
              </div>
            )}

            {/* Upload progress indicator */}
            {uploadingTaskMessage && (
              <div className="bg-white border border-indigo-200 rounded-lg p-2.5 flex items-center space-x-2 text-[11px] text-[#4338CA]">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{uploadingTaskMessage}</span>
              </div>
            )}

            {/* ─── PHOTOS THUMBNAIL GRID ───────────────────────────────── */}
            {photos.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-[#131B2E]">
                  <span>Selected Photos ({photos.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Drag to reorder • Mark a hero photo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs group relative flex flex-col"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption || def.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />

                        {/* Hero Badge */}
                        {photo.isHero && (
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center space-x-1 z-10">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Hero</span>
                          </span>
                        )}

                        {/* Source Tag Badge */}
                        <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded shadow-xs backdrop-blur-xs max-w-[85%] truncate">
                          {photo.sourceSection ? formatMediaSource(photo.sourceSection) : 'Campus Photo'}
                        </span>

                        {/* Action Overlay */}
                        {!isReadOnly && (
                          <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition z-10">
                            <button
                              type="button"
                              title={photo.isHero ? 'Primary Hero Photo' : 'Make Hero Photo'}
                              onClick={() => onSetHeroPhoto(photo.id)}
                              className={`p-1 rounded-md text-xs cursor-pointer shadow-xs ${
                                photo.isHero
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white/90 text-slate-700 hover:text-amber-500'
                              }`}
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              type="button"
                              title="Remove from this facility (keeps in global library)"
                              onClick={() => onRemovePhoto(photo.id)}
                              className="p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Caption Input */}
                      <div className="p-1.5">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={photo.caption || ''}
                          onChange={(e) => onUpdatePhotoCaption(photo.id, e.target.value)}
                          placeholder="Photo caption..."
                          className="w-full px-1.5 py-1 text-[10px] rounded border border-transparent hover:border-slate-200 focus:border-[#4338CA] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SchoolMediaPickerModal Dialog */}
            <SchoolMediaPickerModal
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
              sectionKey={def.id}
              sectionTitle={def.title}
              mediaRegistry={mediaRegistry}
              alreadySelectedPhotoIdsOrUrls={photos.map((p) => p.url).concat(photos.map((p) => p.id))}
              onSelectPhotos={(selectedAssets) => {
                if (onSelectExistingPhotos) {
                  onSelectExistingPhotos(selectedAssets);
                }
              }}
              onDeleteAsset={onDeleteAsset}
            />
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* LIVE WEBSITE PREVIEW (SECTION 17)                           */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338CA] flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>WEBSITE PREVIEW</span>
              </span>
              <span className="text-[10px] text-[#64748B]">
                Updates live as you type
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 space-y-1 shadow-2xs">
              <h5 className="font-bold text-xs text-[#131B2E] flex items-center space-x-1.5">
                <span>{def.title}</span>
                <span className="text-[#64748B] font-normal">• {validation.summary}</span>
              </h5>
              <p className="text-[11px] text-[#64748B] leading-relaxed italic">
                "{config.description?.trim() || def.generateWebsiteSummary(config)}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
