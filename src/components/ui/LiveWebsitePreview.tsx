'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Globe,
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  Sparkles,
  AlertCircle,
  Play,
  CheckCircle2,
  Maximize2,
  ShieldCheck
} from 'lucide-react';
import ErpLiveDemo from './ErpLiveDemo';

interface LiveWebsitePreviewProps {
  url?: string;
  title: string;
  fallbackImage?: string;
  className?: string;
  defaultDevice?: 'desktop' | 'tablet' | 'mobile';
  showDeviceControls?: boolean;
  autoLoad?: boolean;
  heightClass?: string;
  aspectRatio?: string;
  isFeatured?: boolean;
  isFrameRestricted?: boolean;
}

export default function LiveWebsitePreview({
  url,
  title,
  fallbackImage,
  className = '',
  defaultDevice = 'desktop',
  showDeviceControls = true,
  autoLoad = false,
  heightClass = 'h-[380px] sm:h-[480px] md:h-[540px]',
  isFeatured = false,
  isFrameRestricted = false,
}: LiveWebsitePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(defaultDevice);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isActivated, setIsActivated] = useState(autoLoad && !isFrameRestricted);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'screenshot'>(
    url && autoLoad && !isFrameRestricted ? 'live' : 'screenshot'
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Validate URL protocol
  const isValidUrl = Boolean(
    url && (url.startsWith('https://') || url.startsWith('http://'))
  );

  const cleanDisplayUrl = isValidUrl
    ? url!.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  // Handle URL change when switching projects
  useEffect(() => {
    setIsIframeLoaded(false);
    setLoadError(false);
    if (url && (autoLoad || isActivated) && !isFrameRestricted) {
      setViewMode('live');
    } else {
      setViewMode('screenshot');
    }
  }, [url, autoLoad, isActivated, isFrameRestricted]);

  // Handle lazy activation via IntersectionObserver if not explicitly activated
  useEffect(() => {
    if (autoLoad || isActivated || !isValidUrl || isFrameRestricted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isFeatured) {
            setIsActivated(true);
            setViewMode('live');
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoLoad, isActivated, isFeatured, isValidUrl, isFrameRestricted]);

  // Handle iframe reload/refresh
  const handleRefresh = () => {
    if (!iframeRef.current || !isValidUrl) return;
    setIsRefreshing(true);
    setIsIframeLoaded(false);
    setLoadError(false);
    iframeRef.current.src = url!;
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Device width wrappers
  const getDeviceWidthClass = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[390px] shadow-2xl rounded-2xl mx-auto border-x border-b border-[#E2E8F0]';
      case 'tablet':
        return 'max-w-[768px] shadow-xl rounded-xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`group relative flex flex-col rounded-3xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* ─── Browser Chrome Top Bar ───────────────────────────────── */}
      <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Window Controls & Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-[#F97360] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-[#F4C95D] inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
          </div>

          {/* URL Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-3.5 py-1 rounded-full border border-[#E2E8F0] text-[11px] font-mono text-[#64748B] shadow-inner max-w-xs truncate">
            <Globe className="w-3 h-3 text-[#4338CA] shrink-0" />
            <span className="truncate">{cleanDisplayUrl}</span>
          </div>
        </div>

        {/* Center: Device Controls (Desktop / Tablet / Mobile) */}
        {showDeviceControls && isValidUrl && viewMode === 'live' && isActivated && (
          <div className="hidden md:flex items-center gap-1 bg-[#F1ECE4] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              aria-label="Desktop Preview"
              title="Desktop View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                device === 'desktop'
                  ? 'bg-white text-[#4338CA] shadow-sm'
                  : 'text-[#64748B] hover:text-[#131B2E]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              aria-label="Tablet Preview"
              title="Tablet View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                device === 'tablet'
                  ? 'bg-white text-[#4338CA] shadow-sm'
                  : 'text-[#64748B] hover:text-[#131B2E]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              aria-label="Mobile Preview"
              title="Mobile View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                device === 'mobile'
                  ? 'bg-white text-[#4338CA] shadow-sm'
                  : 'text-[#64748B] hover:text-[#131B2E]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Mode Toggles & External Link */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {isFrameRestricted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Interactive ERP
            </span>
          ) : isValidUrl && viewMode === 'live' && isActivated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview
            </span>
          ) : isValidUrl ? (
            <button
              type="button"
              onClick={() => {
                setIsActivated(true);
                setViewMode('live');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4338CA]/10 text-[#4338CA] hover:bg-[#4338CA] hover:text-white transition-colors border border-[#4338CA]/20 cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              Launch Live Site
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Screenshot Archive
            </span>
          )}

          {/* Refresh Iframe Button */}
          {isValidUrl && isActivated && (
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Reload website preview"
              title="Refresh Live Preview"
              className={`p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin text-[#4338CA]' : ''
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Direct External Link */}
          {isValidUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${title} live website in new tab`}
              title="Open Live Website in New Tab"
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#4338CA] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ─── Main Viewport Canvas ─────────────────────────────────── */}
      <div className={`relative w-full ${heightClass} bg-[#F3EFEA] overflow-hidden flex items-center justify-center`}>
        {/* State 0: Interactive Live Native ERP App */}
        {isFrameRestricted && (
          <div className="w-full h-full relative bg-[#0F172A]">
            <ErpLiveDemo />
          </div>
        )}

        {/* State 1: Live Interactive Iframe */}
        {!isFrameRestricted && isValidUrl && viewMode === 'live' && isActivated && !loadError && (
          <div className={`h-full transition-all duration-300 bg-white relative ${getDeviceWidthClass()}`}>
            {/* Loading Overlay */}
            {!isIframeLoaded && (
              <div className="absolute inset-0 bg-[#FAF7F2] flex flex-col items-center justify-center gap-3 z-20 text-center p-6">
                <div className="w-10 h-10 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center animate-pulse border border-[#4338CA]/20">
                  <Globe className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#131B2E]">Connecting to live website...</div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">{cleanDisplayUrl}</div>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={url}
              title={`Live interactive preview of ${title}`}
              loading="lazy"
              onLoad={() => setIsIframeLoaded(true)}
              onError={() => {
                setLoadError(true);
                setViewMode('screenshot');
              }}
              className="w-full h-full border-0 transition-opacity duration-300"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          </div>
        )}

        {/* State 2: Screenshot Image View (Fallback / Pre-activation) */}
        {!isFrameRestricted && (viewMode === 'screenshot' || !isActivated || loadError || !isValidUrl) && (
          <div className="relative w-full h-full group/view overflow-hidden">
            {fallbackImage ? (
              <Image
                src={fallbackImage}
                alt={`${title} project preview`}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover/view:scale-102"
                priority={isFeatured}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FAF7F2] p-8 text-center">
                <Globe className="w-10 h-10 text-[#4338CA]/40" />
                <span className="text-sm font-extrabold text-[#131B2E]">{title}</span>
                <span className="text-xs text-[#64748B] font-mono">{cleanDisplayUrl}</span>
              </div>
            )}


            {/* Click-to-launch live overlay banner if URL exists */}
            {isValidUrl && !isActivated && !isFrameRestricted && (
              <div className="absolute inset-0 bg-[#131B2E]/40 opacity-0 group-hover/view:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px] p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsActivated(true);
                    setViewMode('live');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xl hover:scale-105 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Live Interactive Preview</span>
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-100 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xl transition-all"
                >
                  <span>Open in Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* If embedded mode failed or blocked by CSP */}
            {loadError && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 border border-amber-200 p-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Embedded iframe restricted by domain policies. View directly in browser.</span>
                </div>
                {isValidUrl && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4338CA] text-white font-bold rounded-lg text-[11px] shrink-0"
                  >
                    <span>Open Live Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
