'use client';

import { useCallback, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

type UploadType = 'newsletters' | 'minutes' | 'sponsors' | 'events' | 'settings';

interface UploadResult {
  fileKey: string;
  fileUrl: string;
}

interface FileUploadProps {
  type: UploadType;
  accept: string;
  maxSizeMB?: number;
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; filename: string }
  | { status: 'success'; filename: string }
  | { status: 'error'; message: string };

// ── Icons ──────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-[#71717A]" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 L9 17 L4 12"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      className="animate-spin text-[#1B6DC2]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2"/>
      <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function FileUpload({
  type,
  accept,
  maxSizeMB = 10,
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext) && !acceptedTypes.includes(file.type)) {
      const msg = `File type not allowed. Accepted: ${accept}`;
      setState({ status: 'error', message: msg });
      onUploadError?.(msg);
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const msg = `File is too large. Maximum size: ${maxSizeMB}MB`;
      setState({ status: 'error', message: msg });
      onUploadError?.(msg);
      return;
    }

    setState({ status: 'uploading', filename: file.name });

    try {
      // 1. Get presigned URL
      const presignedRes = await fetch('/api/admin/uploads/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          type,
        }),
      });

      if (!presignedRes.ok) {
        const body = await presignedRes.json();
        throw new Error(body.error ?? 'Failed to get upload URL');
      }

      const { data } = await presignedRes.json();
      const { presignedUrl, fileKey, fileUrl } = data as UploadResult & { presignedUrl: string };
      // 2. Upload file directly to R2
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 3. Success
      setState({ status: 'success', filename: file.name });
      onUploadComplete({ fileKey, fileUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setState({ status: 'error', message: msg });
      onUploadError?.(msg);
    }
  }, [accept, maxSizeBytes, maxSizeMB, type, onUploadComplete, onUploadError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const hint = `${accept.replace(/\./g, '').toUpperCase()} files only, max ${maxSizeMB}MB`;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={state.status === 'uploading'}
        className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
          state.status === 'uploading'
            ? 'cursor-wait border-[#BFDBFE] bg-[#EFF6FF]'
            : dragOver
              ? 'border-[#1B6DC2] bg-[#EFF6FF]'
              : 'border-[#E4E4E7] bg-white hover:border-[#BFDBFE] hover:bg-[#FAFAFA]'
        }`}
      >
        {state.status === 'uploading' ? (
          <>
            <Spinner />
            <p className="text-[0.85rem] font-medium text-[#71717A]">
              Uploading {state.filename}...
            </p>
          </>
        ) : state.status === 'success' ? (
          <>
            <CheckIcon />
            <p className="text-[0.85rem] font-semibold text-[#16A34A]">
              {state.filename} uploaded
            </p>
            <p className="text-[0.75rem] text-[#71717A]">
              Click or drag to replace
            </p>
          </>
        ) : (
          <>
            <UploadIcon />
            <p className="text-[0.85rem] font-medium text-[#71717A]">
              Drag &amp; drop or click to upload
            </p>
            <p className="text-[0.72rem] text-[#A1A1AA]">{hint}</p>
          </>
        )}
      </button>

      {state.status === 'error' && (
        <p className="mt-2 text-[0.8rem] font-medium text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label={`Upload ${type} file`}
      />
    </div>
  );
}
