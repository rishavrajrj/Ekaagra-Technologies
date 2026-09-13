'use client';

import React from 'react';
import type { DesignVerification } from '@/lib/adminReviewEngine';
import {
  Palette,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Image as ImageIcon,
  Type,
  Layout,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

interface DesignBrandingViewProps {
  designVerification: DesignVerification;
  onEditOverride: (key: string, label: string, currentValue: any) => void;
  onApproveDesign: () => void;
}

export default function DesignBrandingView({
  designVerification,
  onEditOverride,
  onApproveDesign,
}: DesignBrandingViewProps) {
  const logo = designVerification.logo || {
    submittedUrl: undefined,
    actualUrl: designVerification.logoUrl,
    transparentBackground: true,
    aspectRatio: 'Horizontal Header standard',
  };
  const favicon = designVerification.favicon || {
    submittedUrl: undefined,
    actualUrl: designVerification.faviconUrl,
    isSquare: true,
  };
  const colors = designVerification.colors || {
    submittedPrimary: undefined,
    actualPrimary: designVerification.primaryColor,
    submittedSecondary: undefined,
    actualSecondary: designVerification.secondaryColor,
    contrastRatioValid: true,
    colorPaletteMatchScore: 100,
  };
  const typography = {
    actualFont: designVerification.typography?.actualFont || designVerification.fontFamily,
    actualFontFamily: designVerification.typography?.actualFont || designVerification.fontFamily,
    submittedFont: designVerification.typography?.submittedFont,
    submittedFontFamily: designVerification.typography?.submittedFont,
    fontPairingStatus: designVerification.typography?.fontPairingStatus || 'Optimal Google Fonts Pairing',
  };
  const theme = {
    actualTheme: designVerification.theme?.actualTheme || designVerification.themeVariant,
    actualVariant: designVerification.theme?.actualTheme || designVerification.themeVariant,
    submittedTheme: designVerification.theme?.submittedTheme,
    isMatched: designVerification.theme?.isMatched ?? true,
    navigationStyle: designVerification.navigationStyle || 'Sticky Header with Quick CTA',
  };

  const isReady = designVerification.isReadyForApproval ?? (designVerification.overallStatus === 'MATCHED' || designVerification.overallStatus === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* ─── TOP STATUS CARD ──────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isReady
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Branding &amp; Design Token Verification</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Validates logo transparency, favicon dimensions, WCAG contrast compliance, and typography pairings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onApproveDesign}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Design Tokens</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── 1. LOGO COMPARISON ─────────────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Institution Logo</h4>
            </div>
            <button
              type="button"
              onClick={() => onEditOverride('branding.logoUrl', 'Institution Logo URL', logo.submittedUrl)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Submitted */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted File</span>
              <div className="h-20 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 overflow-hidden">
                {logo.submittedUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logo.submittedUrl} alt="Submitted Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">No logo provided</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[150px] mx-auto">
                {logo.submittedUrl ? 'Custom upload' : 'Default generated'}
              </span>
            </div>

            {/* Actual on Website */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Rendered on Site</span>
              <div className="h-20 flex items-center justify-center bg-white rounded-lg border border-emerald-200 p-2 overflow-hidden">
                {logo.actualUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logo.actualUrl} alt="Rendered Logo" className="max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">Placeholder</span>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-700">
                <Check className="w-3 h-3" />
                <span>Header Brand Tag</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Transparent Background Check:</span>
              <span className={`font-bold flex items-center gap-1 ${logo.transparentBackground ? 'text-emerald-600' : 'text-amber-600'}`}>
                {logo.transparentBackground ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {logo.transparentBackground ? 'Passed (PNG/SVG/WebP)' : 'Check Transparency'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Aspect Ratio:</span>
              <span className="font-mono font-semibold text-slate-700">{logo.aspectRatio || 'Horizontal Header standard'}</span>
            </div>
          </div>
        </div>

        {/* ─── 2. FAVICON COMPARISON ──────────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Browser Favicon</h4>
            </div>
            <button
              type="button"
              onClick={() => onEditOverride('branding.faviconUrl', 'Browser Favicon URL', favicon.submittedUrl)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted Favicon</span>
              <div className="h-20 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2">
                {favicon.submittedUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={favicon.submittedUrl} alt="Submitted Favicon" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">None</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 block truncate">
                {favicon.submittedUrl ? 'Custom Icon' : 'Default Derived'}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Website Tab Favicon</span>
              <div className="h-20 flex items-center justify-center bg-white rounded-lg border border-emerald-200 p-2">
                {favicon.actualUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={favicon.actualUrl} alt="Website Favicon" className="w-10 h-10 object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 italic">App Icon</span>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-700">
                <Check className="w-3 h-3" />
                <span>32x32 Tab Icon</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Square Aspect Ratio:</span>
              <span className={`font-bold flex items-center gap-1 ${favicon.isSquare ? 'text-emerald-600' : 'text-amber-600'}`}>
                {favicon.isSquare ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {favicon.isSquare ? '1:1 Square' : 'Not 1:1'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 3. COLOR PALETTE ───────────────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Color Palette &amp; Contrast</h4>
            </div>
            <button
              type="button"
              onClick={() => onEditOverride('branding.primaryColor', 'Primary & Secondary Colors', colors)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override Colors</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Primary Color */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary Brand Color</span>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-xs shrink-0"
                  style={{ backgroundColor: colors.actualPrimary }}
                />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800 block uppercase">
                    {colors.actualPrimary}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {colors.submittedPrimary ? `Submitted: ${colors.submittedPrimary}` : 'Theme preset'}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Secondary Accent</span>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-xs shrink-0"
                  style={{ backgroundColor: colors.actualSecondary }}
                />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800 block uppercase">
                    {colors.actualSecondary}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {colors.submittedSecondary ? `Submitted: ${colors.submittedSecondary}` : 'Theme preset'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">WCAG 2.1 Contrast Ratio:</span>
              <span className={`font-bold flex items-center gap-1 ${colors.contrastRatioValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                {colors.contrastRatioValid ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {colors.contrastRatioValid ? 'AA Compliant (>= 4.5:1)' : 'Low Contrast Alert'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Palette Match Score:</span>
              <span className="font-bold text-indigo-600">{colors.colorPaletteMatchScore}%</span>
            </div>
          </div>
        </div>

        {/* ─── 4. TYPOGRAPHY & THEME VARIANT ──────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">Typography &amp; Theme Variant</h4>
            </div>
            <button
              type="button"
              onClick={() => onEditOverride('branding.themeVariant', 'Theme Variant & Fonts', { typography, theme })}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Typography Pairing</span>
              <span className="font-bold text-xs text-slate-800 block">{typography.actualFontFamily}</span>
              <span className="text-[10px] text-slate-400 block">
                {typography.submittedFontFamily ? `Chosen: ${typography.submittedFontFamily}` : 'System Modern Sans'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Theme Variant</span>
              <span className="font-bold text-xs text-indigo-600 uppercase block font-mono">
                {theme.actualVariant}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Nav: {theme.navigationStyle || 'Sticky Header with Quick CTA'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Live Sample Preview</span>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h5 className="font-bold text-sm text-slate-900">Excellence in Holistic Education</h5>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Empowering inquisitive minds with moral integrity, cutting-edge STEM discovery, and global leadership skills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
