'use client';

import React, { useState, useMemo } from 'react';
import type { MediaUsageItem } from '@/lib/adminReviewEngine';
import { formatBytes } from '@/lib/imageUtils';
import {
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Grid,
  List,
  Search,
  ExternalLink,
  Eye,
  Tag,
  Sparkles,
  Layers,
} from 'lucide-react';

interface MediaUsageViewProps {
  mediaAssets: MediaUsageItem[];
  onPreviewMedia: (asset: MediaUsageItem) => void;
  onApproveMedia: (assetId: string) => void;
  onFlagMediaCR: (assetId: string, title: string, url?: string) => void;
}

export default function MediaUsageView({
  mediaAssets,
  onPreviewMedia,
  onApproveMedia,
  onFlagMediaCR,
}: MediaUsageViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUsage, setFilterUsage] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    mediaAssets.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [mediaAssets]);

  const filteredAssets = useMemo(() => {
    return mediaAssets.filter((a) => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      const isUsed = a.isUsedOnWebsite ?? a.usedOnWebsite;
      if (filterUsage === 'used' && !isUsed) return false;
      if (filterUsage === 'unused' && isUsed) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.fileName && a.fileName.toLowerCase().includes(q)) ||
          (a.websitePlacements || []).some((p: string) => p.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [mediaAssets, filterCategory, filterUsage, search]);

  const totalAssets = mediaAssets.length;
  const usedCount = mediaAssets.filter((a) => a.isUsedOnWebsite ?? a.usedOnWebsite).length;
  const warningsCount = mediaAssets.filter((a) => Boolean(a.qualityWarning)).length;
  const approvedCount = mediaAssets.filter((a) => a.reviewStatus === 'APPROVED' || (a.reviewStatus as string) === 'approved').length;

  return (
    <div className="space-y-6">
      {/* ─── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Media Assets</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalAssets}</span>
            <span className="text-xs font-semibold text-slate-500">Collected</span>
          </div>
          <p className="text-[11px] text-slate-500">Logos, banners, campus shots</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Placed on Website</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">{usedCount}</span>
            <span className="text-xs font-semibold text-indigo-600">
              {totalAssets > 0 ? Math.round((usedCount / totalAssets) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Embedded in website layouts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quality Warnings</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${warningsCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {warningsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Resolution / Aspect</span>
          </div>
          <p className="text-[11px] text-slate-500">Review before final publish</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Approved</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{approvedCount}</span>
            <span className="text-xs font-bold text-emerald-600">
              {totalAssets > 0 ? Math.round((approvedCount / totalAssets) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Verified for production</p>
        </div>
      </div>

      {/* ─── CONTROLS & FILTERS ───────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by asset title, file, placement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterUsage}
            onChange={(e) => setFilterUsage(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Usage</option>
            <option value="used">Placed on Website</option>
            <option value="unused">Unused in Current Theme</option>
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── GRID VIEW ────────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400">
              No media assets match the active filters.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isApproved = asset.reviewStatus === 'APPROVED' || (asset.reviewStatus as string) === 'approved';
              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {asset.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}

                    {/* Preview overlay button */}
                    <button
                      type="button"
                      onClick={() => onPreviewMedia(asset)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect</span>
                    </button>

                    {/* Badge: Used vs Unused */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs ${
                          (asset.isUsedOnWebsite ?? asset.usedOnWebsite)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700/80 text-slate-200 backdrop-blur-xs'
                        }`}
                      >
                        {(asset.isUsedOnWebsite ?? asset.usedOnWebsite) ? 'Placed on Site' : 'Unused'}
                      </span>
                    </div>

                    {/* Quality Warning badge */}
                    {asset.qualityWarning && (
                      <div className="absolute top-2 right-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs" title={asset.qualityWarning}>
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={asset.title}>
                          {asset.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                          {asset.category}
                        </span>
                      </div>

                      {/* Website Placements */}
                      {asset.websitePlacements && asset.websitePlacements.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {asset.websitePlacements.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>{p}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block">Not bound to active page template</span>
                      )}

                      {/* Technical Info */}
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 pt-0.5">
                        {asset.fileSize && <span>{formatBytes(asset.fileSize)}</span>}
                        {asset.aspectRatio && <span>&bull; {asset.aspectRatio}</span>}
                      </div>

                      {asset.qualityWarning && (
                        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 p-1.5 rounded-lg leading-tight">
                          {asset.qualityWarning}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onFlagMediaCR(asset.id, asset.title, asset.url)}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Request Replacement"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Flag</span>
                      </button>

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => onApproveMedia(asset.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TABLE VIEW ───────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Website Placements</th>
                  <th className="py-3 px-4">Quality &amp; Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  const isApproved = asset.reviewStatus === 'APPROVED' || (asset.reviewStatus as string) === 'approved';
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => onPreviewMedia(asset)}
                            className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 cursor-pointer flex items-center justify-center"
                          >
                            {asset.url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={asset.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[200px]">{asset.title}</span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[200px]">
                              {asset.fileName || 'asset.jpg'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono uppercase text-[11px] text-slate-700 font-semibold">
                          {asset.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {asset.websitePlacements && asset.websitePlacements.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {asset.websitePlacements.map((p, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unplaced</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] space-y-0.5">
                          <div>{asset.fileSize ? formatBytes(asset.fileSize) : 'N/A'}</div>
                          {asset.qualityWarning && (
                            <span className="text-[10px] text-amber-600 font-semibold block">
                              {asset.qualityWarning}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : (asset.reviewStatus === 'CHANGES_REQUESTED' || (asset.reviewStatus as string) === 'changes_requested')
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span>{asset.reviewStatus.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreviewMedia(asset)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Inspect image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onFlagMediaCR(asset.id, asset.title, asset.url)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Flag Change Request"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => onApproveMedia(asset.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
