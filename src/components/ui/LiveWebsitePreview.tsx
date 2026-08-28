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
} from 'lucide-react';

export type DeviceType = 'laptop' | 'tablet' | 'mobile';

export interface DeviceConfig {
  id: DeviceType;
  label: string;
  viewportWidth: number;
  viewportHeight: number;
  dimensionLabel: string;
}

export const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  laptop: {
    id: 'laptop',
    label: 'Laptop',
    viewportWidth: 1440,
    viewportHeight: 900,
    dimensionLabel: 'Laptop · 1440px',
  },
  tablet: {
    id: 'tablet',
    label: 'Tablet',
    viewportWidth: 768,
    viewportHeight: 1024,
    dimensionLabel: 'Tablet · 768px',
  },
  mobile: {
    id: 'mobile',
    label: 'Mobile',
    viewportWidth: 390,
    viewportHeight: 844,
    dimensionLabel: 'Mobile · 390px',
  },
};

interface LiveWebsitePreviewProps {
  url?: string;
  title: string;
  fallbackImage?: string;
  className?: string;
  defaultDevice?: 'laptop' | 'desktop' | 'tablet' | 'mobile';
  showDeviceControls?: boolean;
  autoLoad?: boolean;
  heightClass?: string;
  isFeatured?: boolean;
  isFrameRestricted?: boolean;
}

export default function LiveWebsitePreview({
  url,
  title,
  fallbackImage,
  className = '',
  defaultDevice = 'laptop',
  showDeviceControls = true,
  autoLoad = false,
  heightClass = 'h-[380px] sm:h-[480px] md:h-[540px]',
  isFeatured = false,
  isFrameRestricted = false,
}: LiveWebsitePreviewProps) {
  // Normalize defaultDevice to valid DeviceType
  const initialDevice: DeviceType =
    defaultDevice === 'desktop' ? 'laptop' : (defaultDevice as DeviceType);

  const [device, setDevice] = useState<DeviceType>(initialDevice);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isActivated, setIsActivated] = useState(autoLoad && !isFrameRestricted);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [viewMode, setViewMode] = useState<'live' | 'screenshot'>(
    url && autoLoad && !isFrameRestricted ? 'live' : 'screenshot'
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Validate URL protocol
  const isValidUrl = Boolean(
    url && (url.startsWith('https://') || url.startsWith('http://'))
  );

  const cleanDisplayUrl = isValidUrl
    ? url!.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  // Timeout guard for iframe loading overlay
  useEffect(() => {
    if (!isActivated || viewMode !== 'live' || !isValidUrl || isFrameRestricted) {
      return;
    }

    setIsTakingLong(false);

    const warnTimer = setTimeout(() => {
      if (!isIframeLoaded) {
        setIsTakingLong(true);
      }
    }, 3500);

    const autoReleaseTimer = setTimeout(() => {
      setIsIframeLoaded(true);
    }, 7500);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(autoReleaseTimer);
    };
  }, [isActivated, viewMode, isValidUrl, reloadKey, url, isIframeLoaded, isFrameRestricted]);

  // Measure canvas size dynamically
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setCanvasDimensions({
            width: Math.floor(entry.contentRect.width),
            height: Math.floor(entry.contentRect.height),
          });
        }
      }
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

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

  const handleDeviceChange = (newDevice: DeviceType) => {
    setDevice(newDevice);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIsIframeLoaded(false);
    setLoadError(false);
    setReloadKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Viewport calculation & scale factors
  const cWidth = canvasDimensions.width || 600;
  const cHeight = canvasDimensions.height || 400;

  let scale = 1;
  let visualFrameWidth: number | string = '100%';
  let visualFrameHeight: number | string = '100%';
  let internalIframeWidth = 1440;
  let internalIframeHeight = 900;
  let visualScreenWidth: number | string = '100%';
  let visualScreenHeight: number | string = '100%';

  if (device === 'laptop') {
    scale = Math.min(1, cWidth / 1440);
    internalIframeWidth = 1440;
    internalIframeHeight = Math.max(900, Math.round(cHeight / (scale || 1)));
    visualFrameWidth = '100%';
    visualFrameHeight = '100%';
  } else if (device === 'tablet') {
    const tabletPaddingX = 24;
    const tabletPaddingY = 32;
    const availableW = Math.max(280, cWidth - tabletPaddingX);
    const availableH = Math.max(340, cHeight - tabletPaddingY);

    const scaleW = availableW / 768;
    const scaleH = availableH / 1024;
    scale = Math.min(scaleW, scaleH, 0.85);

    visualScreenWidth = Math.round(768 * scale);
    visualScreenHeight = Math.round(1024 * scale);
    visualFrameWidth = visualScreenWidth + 12;
    visualFrameHeight = visualScreenHeight + 24;

    internalIframeWidth = 768;
    internalIframeHeight = Math.max(1024, Math.round(visualScreenHeight / (scale || 1)));
  } else if (device === 'mobile') {
    const phonePaddingX = 16;
    const phonePaddingY = 24;
    const availableW = Math.max(200, cWidth - phonePaddingX);
    const availableH = Math.max(300, cHeight - phonePaddingY);

    const scaleW = availableW / 390;
    const scaleH = availableH / 844;
    scale = Math.min(scaleW, scaleH, 0.9);

    visualScreenWidth = Math.round(390 * scale);
    visualScreenHeight = Math.round(844 * scale);
    visualFrameWidth = visualScreenWidth + 10;
    visualFrameHeight = visualScreenHeight + 26;

    internalIframeWidth = 390;
    internalIframeHeight = Math.max(844, Math.round(visualScreenHeight / (scale || 1)));
  }

  return (
    <div
      ref={containerRef}
      className={`group relative flex flex-col rounded-3xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* --- Browser Chrome Top Bar (Identical for ALL projects) -- */}
      <div className="bg-[#FAF7F2] px-2.5 sm:px-4 py-1.5 sm:py-2.5 border-b border-[#E2E8F0] flex items-center justify-between gap-1.5 sm:gap-3 shrink-0">
        {/* Left: Window Controls & URL */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5" aria-hidden="true">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F97360] inline-block shadow-sm" />
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#F4C95D] inline-block shadow-sm" />
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
          </div>

          {/* URL Pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8F0] text-[10.5px] font-mono text-[#64748B] shadow-inner max-w-xs truncate">
            <Globe className="w-3 h-3 text-[#4338CA] shrink-0" />
            <span className="truncate">{cleanDisplayUrl}</span>
          </div>
        </div>

        {/* Center: Device Controls (Laptop / Tablet / Mobile) */}
        {showDeviceControls && (
          <div
            role="group"
            aria-label="Device Viewport Switcher"
            className="flex items-center gap-0.5 sm:gap-1 bg-[#F1ECE4] p-0.5 sm:p-1 rounded-xl border border-[#E2E8F0] shrink-0"
          >
            {(['laptop', 'tablet', 'mobile'] as DeviceType[]).map((devKey) => {
              const config = DEVICE_CONFIGS[devKey];
              const isActive = device === devKey;
              const IconComp =
                devKey === 'laptop'
                  ? Laptop
                  : devKey === 'tablet'
                  ? Tablet
                  : Smartphone;

              return (
                <button
                  key={devKey}
                  type="button"
                  onClick={() => handleDeviceChange(devKey)}
                  aria-pressed={isActive}
                  aria-label={config.label}
                  className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer motion-reduce:transition-none ${
                    isActive
                      ? 'bg-white text-[#4338CA] shadow-sm'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-white/60'
                  }`}
                >
                  <IconComp className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Live Status & External Link */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {isValidUrl && (
            <span className="hidden xs:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 premium-live-dot" />
              Live
            </span>
          )}

          {/* Refresh Iframe Button */}
          {isValidUrl && !isFrameRestricted && isActivated && (
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Reload website preview"
              title="Refresh Live Preview"
              className={`p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer motion-reduce:transition-none ${
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

      {/* --- Main Viewport Canvas (Identical structure for ALL projects) - */}
      <div
        ref={canvasRef}
        className={`relative w-full ${heightClass} bg-[#F3EFEA] overflow-hidden flex items-center justify-center`}
      >
        {/* Live Interactive Iframe Viewport */}
        {!isFrameRestricted && isValidUrl && viewMode === 'live' && isActivated && !loadError ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Laptop Frame */}
            {device === 'laptop' ? (
              <div
                className="relative w-full h-full bg-white overflow-hidden shadow-inner"
                style={{ width: visualFrameWidth, height: visualFrameHeight }}
              >
                <div
                  style={{
                    width: internalIframeWidth,
                    height: internalIframeHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                  className="absolute top-0 left-0"
                >
                  <iframe
                    key={`${url}-${device}-${reloadKey}`}
                    src={url}
                    title={`Live interactive preview of ${title} (Laptop Viewport)`}
                    loading="lazy"
                    onLoad={() => setIsIframeLoaded(true)}
                    onError={() => {
                      setLoadError(true);
                      setViewMode('screenshot');
                    }}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                  />
                </div>
              </div>
            ) : device === 'tablet' ? (
              /* Tablet Chassis */
              <div
                className="relative flex flex-col rounded-2xl border-[5px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300 motion-reduce:transition-none"
                style={{ width: visualFrameWidth, height: visualFrameHeight }}
              >
                <div className="h-3.5 bg-slate-900 w-full flex items-center justify-center shrink-0 relative z-10 pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
                <div
                  className="relative flex-1 w-full bg-white overflow-hidden"
                  style={{ width: visualScreenWidth, height: visualScreenHeight }}
                >
                  <div
                    style={{
                      width: internalIframeWidth,
                      height: internalIframeHeight,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                    className="absolute top-0 left-0"
                  >
                    <iframe
                      key={`${url}-${device}-${reloadKey}`}
                      src={url}
                      title={`Live interactive preview of ${title} (Tablet Viewport)`}
                      loading="lazy"
                      onLoad={() => setIsIframeLoaded(true)}
                      onError={() => {
                        setLoadError(true);
                        setViewMode('screenshot');
                      }}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                    />
                  </div>
                </div>
                <div className="h-2 bg-slate-900 w-full shrink-0 pointer-events-none" />
              </div>
            ) : (
              /* Mobile Chassis */
              <div
                className="relative flex flex-col rounded-[28px] border-[5px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300 motion-reduce:transition-none"
                style={{ width: visualFrameWidth, height: visualFrameHeight }}
              >
                <div className="h-4 bg-slate-900 w-full flex items-center justify-center shrink-0 relative z-10 pointer-events-none">
                  <div className="w-16 h-2.5 bg-slate-950 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800 ml-auto mr-1.5" />
                  </div>
                </div>
                <div
                  className="relative flex-1 w-full bg-white overflow-hidden"
                  style={{ width: visualScreenWidth, height: visualScreenHeight }}
                >
                  <div
                    style={{
                      width: internalIframeWidth,
                      height: internalIframeHeight,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                    className="absolute top-0 left-0"
                  >
                    <iframe
                      key={`${url}-${device}-${reloadKey}`}
                      src={url}
                      title={`Live interactive preview of ${title} (Mobile Viewport)`}
                      loading="lazy"
                      onLoad={() => setIsIframeLoaded(true)}
                      onError={() => {
                        setLoadError(true);
                        setViewMode('screenshot');
                      }}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                    />
                  </div>
                </div>
                <div className="h-2.5 bg-slate-900 w-full flex items-center justify-center shrink-0 pointer-events-none">
                  <div className="w-20 h-1 bg-slate-700/60 rounded-full" />
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {!isIframeLoaded && (
              <div className="absolute inset-0 bg-[#FAF7F2]/95 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-30 text-center p-6 transition-opacity duration-300">
                <div className="w-9 h-9 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center animate-pulse border border-[#4338CA]/20">
                  <Globe className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#131B2E]">
                    Connecting to live website...
                  </div>
                  <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                    {cleanDisplayUrl}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Clean Device Screenshot View (Zero obstructing dark overlays or buttons) */
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
            {device === 'laptop' ? (
              <div className={`relative w-full h-full overflow-hidden ${
                isFrameRestricted || title.toLowerCase().includes('erp') ? 'bg-[#031B3A]' : ''
              }`}>
                {fallbackImage ? (
                  <Image
                    src={fallbackImage}
                    alt={`${title} project preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                    className={`${
                      isFrameRestricted || title.toLowerCase().includes('erp')
                        ? 'object-contain object-center scale-[0.98]'
                        : 'object-cover object-top'
                    } transition-transform duration-700`}
                    priority={isFeatured}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FAF7F2] p-8 text-center">
                    <Globe className="w-10 h-10 text-[#4338CA]/40" />
                    <span className="text-sm font-extrabold text-[#131B2E]">{title}</span>
                    <span className="text-xs text-[#64748B] font-mono">{cleanDisplayUrl}</span>
                  </div>
                )}
              </div>
            ) : device === 'tablet' ? (
              <div
                className="relative flex flex-col rounded-2xl border-[5px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300"
                style={{ width: visualFrameWidth, height: visualFrameHeight }}
              >
                <div className="h-3 bg-slate-900 w-full flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
                <div className="relative flex-1 w-full bg-white overflow-hidden">
                  {fallbackImage && (
                    <Image
                      src={fallbackImage}
                      alt={`${title} tablet preview`}
                      fill
                      sizes="400px"
                      className="object-cover object-top"
                    />
                  )}
                </div>
                <div className="h-2 bg-slate-900 w-full shrink-0" />
              </div>
            ) : (
              <div
                className="relative flex flex-col rounded-[24px] border-[5px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden transition-all duration-300"
                style={{ width: visualFrameWidth, height: visualFrameHeight }}
              >
                <div className="h-3.5 bg-slate-900 w-full flex items-center justify-center shrink-0">
                  <div className="w-14 h-2 bg-slate-950 rounded-full" />
                </div>
                <div className="relative flex-1 w-full bg-white overflow-hidden">
                  {fallbackImage && (
                    <Image
                      src={fallbackImage}
                      alt={`${title} mobile preview`}
                      fill
                      sizes="280px"
                      className="object-cover object-top"
                    />
                  )}
                </div>
                <div className="h-2 bg-slate-900 w-full shrink-0" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
