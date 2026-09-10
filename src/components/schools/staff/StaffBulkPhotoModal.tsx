'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  RefreshCw,
  Download,
  Users,
} from 'lucide-react';
import type { StaffMember } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';

export interface StaffBulkPhotoModalProps {
  token?: string;
  isOpen: boolean;
  staffMembers: StaffMember[];
  onClose: () => void;
  onPhotosUploaded: (updatedStaff: StaffMember[]) => void;
}

interface PhotoMatchItem {
  file: File;
  matchedMember: StaffMember | null;
  status: 'pending' | 'uploading' | 'success' | 'unmatched' | 'error';
  errorMessage?: string;
  optimizedUrl?: string;
}

export default function StaffBulkPhotoModal({
  token,
  isOpen,
  staffMembers,
  onClose,
  onPhotosUploaded,
}: StaffBulkPhotoModalProps) {
  const [photoQueue, setPhotoQueue] = useState<PhotoMatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Build lookup map for fast employee code matching
  const memberMap = new Map<string, StaffMember>();
  staffMembers.forEach((s) => {
    const code = (s.employeeCode || s.facultyId || '').trim().toUpperCase();
    if (code) memberMap.set(code, s);
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items: PhotoMatchItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseName = file.name.replace(/\.[^/.]+$/, '').trim().toUpperCase();
      const matched = memberMap.get(baseName) || null;

      items.push({
        file,
        matchedMember: matched,
        status: matched ? 'pending' : 'unmatched',
      });
    }

    setPhotoQueue(items);
  };

  const handleProcessUploads = async () => {
    if (!token || photoQueue.length === 0) return;
    setIsProcessing(true);

    const updatedStaffMap = new Map<string, StaffMember>();
    staffMembers.forEach((s) => updatedStaffMap.set(s.id, { ...s }));

    const updatedQueue = [...photoQueue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (!item.matchedMember || item.status === 'unmatched') continue;

      item.status = 'uploading';
      setPhotoQueue([...updatedQueue]);

      try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('file', item.file);
        formData.append('employeeCode', item.matchedMember.employeeCode || item.matchedMember.facultyId || '');
        formData.append('fileName', item.file.name);

        const res = await fetch('/api/school-assets/staff-photo', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.asset?.url) {
          item.status = 'success';
          item.optimizedUrl = data.asset.url;

          // Update member in map
          const target = updatedStaffMap.get(item.matchedMember.id);
          if (target) {
            target.photoUrl = data.asset.url;
            target.updatedAt = new Date().toISOString();
          }
        } else {
          item.status = 'error';
          item.errorMessage = data.error || 'Upload failed.';
        }
      } catch (err: any) {
        item.status = 'error';
        item.errorMessage = err.message || 'Network error.';
      }

      setPhotoQueue([...updatedQueue]);
    }

    setIsProcessing(false);
    onPhotosUploaded(Array.from(updatedStaffMap.values()));
  };

  const matchedCount = photoQueue.filter((q) => q.matchedMember !== null).length;
  const unmatchedCount = photoQueue.filter((q) => q.matchedMember === null).length;
  const successCount = photoQueue.filter((q) => q.status === 'success').length;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Automated Photo Matcher
            </span>
            <h2 className="text-lg font-black text-[#131B2E] mt-1">Bulk Staff Profile Photos</h2>
            <p className="text-xs text-[#64748B]">
              Name each photo with the staff member’s Employee ID (e.g. <code>FAC-2026-00012.jpg</code>) for automated matching.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {photoQueue.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-10 text-center cursor-pointer transition space-y-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <Camera className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#131B2E]">Select Multiple Staff Photos</h3>
                <p className="text-xs text-[#64748B]">
                  Select JPG, PNG, or WebP files matching Employee IDs from your computer.
                </p>
              </div>

              <div className="pt-2">
                <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition inline-block">
                  Choose Photo Files
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Selected</span>
                  <p className="text-lg font-black text-[#131B2E]">{photoQueue.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Matched to Staff</span>
                  <p className="text-lg font-black text-emerald-800">{matchedCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Unmatched Filenames</span>
                  <p className="text-lg font-black text-rose-800">{unmatchedCount}</p>
                </div>
              </div>

              {/* Photo Queue List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {photoQueue.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <FileImage className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-bold text-[#131B2E]">{item.file.name}</p>
                        {item.matchedMember ? (
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Matched: {item.matchedMember.name} ({item.matchedMember.employeeCode})
                          </p>
                        ) : (
                          <p className="text-[11px] text-rose-600 font-semibold">
                            No staff member found matching filename
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.status === 'pending' && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Ready to Upload
                        </span>
                      )}
                      {item.status === 'uploading' && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Optimizing...</span>
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>WebP Saved</span>
                        </span>
                      )}
                      {item.status === 'unmatched' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          Unmatched
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPhotoQueue([])}
            disabled={isProcessing || photoQueue.length === 0}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Clear List
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Close
            </button>

            {matchedCount > 0 && (
              <button
                type="button"
                onClick={handleProcessUploads}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? 'Optimizing Photos...'
                    : `Upload & Optimize ${matchedCount} Matched Photos`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
