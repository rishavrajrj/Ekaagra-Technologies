'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Download,
  Loader2,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import type { SchoolIntakeChangeRequest, ChangeRequestType } from '@/lib/types';
import { validateSchoolDocumentFile } from '@/lib/schoolAssetChecklist';
import { formatBytes } from '@/lib/imageUtils';

export interface FileUploadMetadata {
  url: string;
  fileName: string;
  fileSize: number;
  storageKey?: string;
  uploadedAt?: string;
}

export interface CorrectionInputProps {
  request: SchoolIntakeChangeRequest;
  requestType: ChangeRequestType;
  value: string;
  token: string;
  initialFile?: FileUploadMetadata | null;
  onChange: (value: string) => void;
  onFileUploaded?: (meta: FileUploadMetadata) => void;
  onFileRemoved?: () => void;
  onValidChange?: (isValid: boolean) => void;
}

export default function CorrectionInput({
  request,
  requestType,
  value,
  token,
  initialFile,
  onChange,
  onFileUploaded,
  onFileRemoved,
  onValidChange,
}: CorrectionInputProps) {
  // File state for PDF / DOCUMENT / IMAGE
  const [uploadedFile, setUploadedFile] = useState<FileUploadMetadata | null>(
    initialFile ||
      (request.file_url
        ? {
            url: request.file_url,
            fileName: request.file_name || 'uploaded_document.pdf',
            fileSize: request.file_size || 0,
            storageKey: request.file_storage_key || undefined,
          }
        : null)
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate state whenever input changes
  useEffect(() => {
    let valid = false;
    if (requestType === 'PDF' || requestType === 'DOCUMENT') {
      valid = Boolean(uploadedFile && uploadedFile.url);
    } else if (requestType === 'IMAGE') {
      valid = Boolean((uploadedFile && uploadedFile.url) || (value && value.trim().length > 0));
    } else if (requestType === 'URL') {
      try {
        const u = new URL(value.trim());
        valid = u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        valid = false;
      }
    } else {
      // TEXT or FIELD
      valid = value.trim().length > 0;
    }

    if (onValidChange) {
      onValidChange(valid);
    }
  }, [requestType, uploadedFile, value, onValidChange]);

  // Handle PDF/Document upload
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);

    if (requestType === 'PDF') {
      // Strict PDF validation
      const validation = validateSchoolDocumentFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.isValid) {
        setErrorMessage(validation.error || 'Invalid file. Only official PDF documents under 2 MB are accepted.');
        return;
      }
    } else if (requestType === 'IMAGE') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp|svg)$/i.test(file.name)) {
        setErrorMessage('Invalid image format. Please upload a JPG, PNG, WebP, or SVG image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image file is too large. Maximum allowed size is 10 MB.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);
      formData.append('itemId', request.field_key || request.asset_id || 'correction-asset');
      formData.append('itemType', requestType === 'IMAGE' ? 'image' : 'document');
      formData.append('section', request.section_key || 'legalPolicies');
      formData.append('isPrivate', 'false');

      setUploadProgress(45);

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Upload failed. Please try again.');
      }

      setUploadProgress(100);

      const fileUrl = json.asset?.fileUrl || json.asset?.url || json.url;
      const meta: FileUploadMetadata = {
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        storageKey: json.asset?.storageKey || json.storageKey,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedFile(meta);
      onChange(fileUrl);
      if (onFileUploaded) {
        onFileUploaded(meta);
      }
    } catch (err: any) {
      console.error('[CorrectionInput upload error]:', err);
      setErrorMessage(err.message || 'Failed to upload document. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onChange('');
    setErrorMessage(null);
    if (onFileRemoved) {
      onFileRemoved();
    }
  };

  // ─── RENDERER: PDF / DOCUMENT UPLOADER ──────────────────────────────────────
  if (requestType === 'PDF' || requestType === 'DOCUMENT') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {requestType === 'PDF' ? 'Upload Official PDF' : 'Upload Required Document'}
            <span className="text-rose-500 ml-1">*</span>
          </label>
          <span className="text-[11px] font-semibold text-slate-500">PDF only &bull; Max 2 MB</span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadedFile ? (
          /* File Uploaded Success Card */
          <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {uploadedFile.fileName}
                    </p>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatBytes(uploadedFile.fileSize)}
                    {uploadedFile.uploadedAt && (
                      <span> &bull; Uploaded {new Date(uploadedFile.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {uploadedFile.url && (
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Preview uploaded PDF in new tab"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Remove this PDF"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900 font-medium">
              <span>PDF verified and attached to this correction.</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                Replace with different PDF
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone / Upload Control */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-3 py-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-800">Uploading and validating PDF document...</p>
                <div className="w-48 mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    Choose Official PDF
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    or drag &amp; drop your official PDF document here
                  </p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepted format: <strong className="text-slate-600">.pdf</strong> &bull; Strict limit:{' '}
                  <strong className="text-slate-600">2 MB</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDERER: IMAGE UPLOADER ───────────────────────────────────────────────
  if (requestType === 'IMAGE') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Upload Replacement Image
            <span className="text-rose-500 ml-1">*</span>
          </label>
          <span className="text-[11px] font-semibold text-slate-500">JPG, PNG, WebP &bull; Max 10 MB</span>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadedFile ? (
          <div className="p-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedFile.url} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{uploadedFile.fileName}</p>
                <p className="text-[11px] text-slate-500">{formatBytes(uploadedFile.fileSize)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 text-center bg-slate-50/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <div className="space-y-2">
              <ImageIcon className="w-7 h-7 text-indigo-600 mx-auto" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Select Replacement Photo
              </button>
              <p className="text-[11px] text-slate-400">High-resolution JPG or PNG recommended</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDERER: URL INPUT ───────────────────────────────────────────────────
  if (requestType === 'URL') {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Corrected Website Link / URL <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.school.edu.in"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <p className="text-[11px] text-slate-500">Must include http:// or https://</p>
      </div>
    );
  }

  // ─── RENDERER: TEXT / FIELD ────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Corrected Value / Text <span className="text-rose-500">*</span>
      </label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter updated field value..."
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
      />
    </div>
  );
}
