'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { BannerStack } from '@/components/admin/banner';
import { FileUpload } from '@/components/admin/file-upload';
import { useBanners } from '@/components/admin/use-banners';
import { SITE_TIMEZONE } from '@/lib/site-config';

// ── Types ──────────────────────────────────────────────────────────────────

interface FileRow {
  id: string;
  title: string;
  url: string;
  date: string;
}

type Tab = 'newsletters' | 'minutes';

interface ArchiveFileConfig {
  type: 'newsletters' | 'minutes';
  label: string;
  labelSingular: string;
  description: string;
  uploadTitle: string;
  uploadPlaceholder: string;
  emptyState: string;
  apiEndpoint: string;
  countNoun: string;
  countNounPlural: string;
}

const NEWSLETTER_CONFIG: ArchiveFileConfig = {
  type: 'newsletters',
  label: 'Newsletters',
  labelSingular: 'Newsletter',
  description: "Upload PDF newsletters. They'll appear on the public archive grouped by school year.",
  uploadTitle: 'Upload Newsletter',
  uploadPlaceholder: 'e.g., Spring Updates — March 2026',
  emptyState: 'No newsletters uploaded yet',
  apiEndpoint: '/api/admin/newsletters',
  countNoun: 'newsletter',
  countNounPlural: 'newsletters',
};

const MINUTES_CONFIG: ArchiveFileConfig = {
  type: 'minutes',
  label: 'Meeting Minutes',
  labelSingular: 'Minutes',
  description: "Upload meeting minutes PDFs. They'll appear on the public archive grouped by school year.",
  uploadTitle: 'Upload Minutes',
  uploadPlaceholder: 'e.g., March 2026 General Meeting',
  emptyState: 'No meeting minutes uploaded yet',
  apiEndpoint: '/api/admin/minutes',
  countNoun: 'document',
  countNounPlural: 'documents',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE_TIMEZONE,
  });
}

function schoolYearKey(iso: string): string {
  const d = new Date(iso);
  const m = parseInt(d.toLocaleDateString('en-US', { month: 'numeric', timeZone: SITE_TIMEZONE }), 10);
  const y = parseInt(d.toLocaleDateString('en-US', { year: 'numeric', timeZone: SITE_TIMEZONE }), 10);
  return m >= 8 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

function schoolYearLabel(key: string): string {
  return `${key} School Year`;
}

function getSchoolYearOptions(count: number): string[] {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const currentStart = m >= 8 ? y : y - 1;
  return Array.from({ length: count }, (_, i) => {
    const start = currentStart - i;
    return `${start}–${start + 1}`;
  });
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M10 1.5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.5L10 1.5z"/>
      <path d="M10 1.5v5h5"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="3"/><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2.5 4h9"/><path d="M5 4V2.5h4V4"/><path d="M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4"/>
    </svg>
  );
}

function UploadBtnIcon() {
  return (
    <svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7.5 10V2.5M4 5l3.5-3.5L11 5"/><path d="M2 11v1.5h11V11"/>
    </svg>
  );
}

// ── Delete dialog ──────────────────────────────────────────────────────────

function DeleteDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'delete-dialog-portal';
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: portal needs re-render
    return () => { document.body.removeChild(el); };
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '24rem' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Delete File</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This action can&apos;t be undone. Are you sure you want to delete{' '}
            <strong className="text-zinc-700">{title}</strong>?
          </p>
          <div className="mt-8 flex justify-end gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button onClick={onCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" autoFocus>Cancel</button>
            <button onClick={onConfirm} style={{ backgroundColor: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Discard dialog ─────────────────────────────────────────────────────────

function DiscardDialog({ onDiscard, onKeepEditing }: { onDiscard: () => void; onKeepEditing: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'discard-dialog-portal';
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: portal needs re-render
    return () => { document.body.removeChild(el); };
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onKeepEditing} />
      <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '22rem' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Discard changes?</h2>
          <p className="mt-2 text-sm text-zinc-500">You have unsaved changes. Discard?</p>
          <div className="mt-6 flex justify-end gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button onClick={onKeepEditing} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" autoFocus>Keep Editing</button>
            <button onClick={onDiscard} style={{ backgroundColor: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Discard</button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Shared file tab (list + delete only) ──────────────────────────────────

interface ArchiveFileTabProps {
  config: ArchiveFileConfig;
  files: FileRow[];
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}

function ArchiveFileTab({ config, files, onDeleted, onError }: ArchiveFileTabProps) {
  const [deleteTarget, setDeleteTarget] = useState<FileRow | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${config.apiEndpoint}/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        onError(`Failed to delete ${config.labelSingular.toLowerCase()}`);
        return;
      }
      onDeleted(deleteTarget.id);
    } catch {
      onError(`Failed to delete ${config.labelSingular.toLowerCase()}`);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Group by school year
  const groups = new Map<string, FileRow[]>();
  for (const f of files) {
    const key = schoolYearKey(f.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  return (
    <div>
      {/* File list */}
      {files.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">{config.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {Array.from(groups.entries()).map(([yearKey, items]) => (
            <div key={yearKey}>
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{schoolYearLabel(yearKey)}</span>
                <span className="text-xs font-semibold text-zinc-400">
                  {items.length} {items.length !== 1 ? config.countNounPlural : config.countNoun}
                </span>
              </div>
              {items.map((f) => (
                <div key={f.id} className="flex items-center gap-3 border-b border-zinc-50 px-5 py-3 last:border-b-0 hover:bg-[#EFF6FF]/40">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500">
                    <FileIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-900">{f.title}</div>
                    <div className="text-xs text-zinc-400">{formatDate(f.date)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Preview"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]"
                    >
                      <EyeIcon />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      title="Delete"
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {deleteTarget && <DeleteDialog title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface ArchiveManagerProps {
  newsletters: FileRow[];
  minutes: FileRow[];
}

export function ArchiveManager({ newsletters: initialNewsletters, minutes: initialMinutes }: ArchiveManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('newsletters');
  const [newsletters, setNewsletters] = useState(initialNewsletters);
  const [minutes, setMinutes] = useState(initialMinutes);
  const { banners, addBanner, dismissBanner } = useBanners();
  const router = useRouter();

  // Upload form state (shared across tabs)
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState(getSchoolYearOptions(1)[0]);
  const [uploadResult, setUploadResult] = useState<{ fileKey: string; fileUrl: string } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ title?: string; file?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const schoolYearOptions = getSchoolYearOptions(6);
  const activeConfig = activeTab === 'newsletters' ? NEWSLETTER_CONFIG : MINUTES_CONFIG;

  const isFormDirty = uploadTitle.trim() !== '' || uploadResult !== null;

  const resetForm = () => {
    setUploadTitle('');
    setSchoolYear(schoolYearOptions[0]);
    setUploadResult(null);
    setUploadErrors({});
    setShowUploadForm(false);
  };

  const handleUploadCancel = () => {
    if (isFormDirty) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  const handleUploadSubmit = async () => {
    const newErrors: typeof uploadErrors = {};
    if (!uploadTitle.trim()) newErrors.title = 'Title is required';
    if (!uploadResult) newErrors.file = 'PDF file is required';
    setUploadErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const dateField = activeConfig.type === 'newsletters' ? 'publishedAt' : 'meetingDate';
      const res = await fetch(activeConfig.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          [dateField]: todayDateString(),
          fileKey: uploadResult!.fileKey,
          fileUrl: uploadResult!.fileUrl,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Failed to create ${activeConfig.labelSingular.toLowerCase()}`);
      }
      const { data } = await res.json();
      const fileUrl = activeConfig.type === 'newsletters' ? data.pdfUrl : data.fileUrl;
      const fileDate = activeConfig.type === 'newsletters' ? data.publishedAt : data.meetingDate;
      const file: FileRow = { id: data.id, title: data.title, url: fileUrl, date: fileDate };

      if (activeTab === 'newsletters') {
        setNewsletters((prev) => [file, ...prev]);
        addBanner('Newsletter uploaded', 'success');
      } else {
        setMinutes((prev) => [file, ...prev]);
        addBanner('Meeting minutes uploaded', 'success');
      }
      resetForm();
    } catch (err) {
      addBanner(err instanceof Error ? err.message : `Failed to upload ${activeConfig.labelSingular.toLowerCase()}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleted = useCallback((tab: Tab, id: string) => {
    if (tab === 'newsletters') {
      setNewsletters((prev) => prev.filter((f) => f.id !== id));
      addBanner('Newsletter deleted', 'success');
    } else {
      setMinutes((prev) => prev.filter((f) => f.id !== id));
      addBanner('Meeting minutes deleted', 'success');
    }
    router.refresh();
  }, [router, addBanner]);

  // Close upload form when switching tabs (if not dirty)
  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    if (showUploadForm && isFormDirty) {
      setShowDiscardDialog(true);
      return;
    }
    resetForm();
    setActiveTab(tab);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Archive</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage newsletters and meeting minutes.</p>
        </div>
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <UploadBtnIcon />
            Upload
          </button>
        )}
      </div>

      <BannerStack banners={banners} onDismiss={dismissBanner} />

      {/* Upload form */}
      {showUploadForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">{activeConfig.uploadTitle}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="upload-title" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Title</label>
              <input
                id="upload-title"
                type="text"
                value={uploadTitle}
                onChange={(e) => { setUploadTitle(e.target.value); setUploadErrors((prev) => ({ ...prev, title: undefined })); }}
                placeholder={activeConfig.uploadPlaceholder}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1B6DC2] ${uploadErrors.title ? 'border-red-400' : 'border-zinc-200'}`}
              />
              {uploadErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{uploadErrors.title}</p>}
            </div>
            <div>
              <label htmlFor="upload-school-year" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">School Year</label>
              <select
                id="upload-school-year"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1B6DC2]"
              >
                {schoolYearOptions.map((sy) => (
                  <option key={sy} value={sy}>{sy}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">PDF File</span>
              <FileUpload
                type={activeConfig.type}
                accept=".pdf,application/pdf"
                maxSizeMB={10}
                onUploadComplete={(result) => { setUploadResult(result); setUploadErrors((prev) => ({ ...prev, file: undefined })); }}
                onUploadError={(msg) => setUploadErrors((prev) => ({ ...prev, file: msg }))}
              />
              {uploadErrors.file && <p className="mt-1 text-xs font-medium text-red-600">{uploadErrors.file}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={handleUploadCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button
              onClick={handleUploadSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <UploadBtnIcon />
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'newsletters'}
          onClick={() => handleTabChange('newsletters')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'newsletters'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Newsletters
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'minutes'}
          onClick={() => handleTabChange('minutes')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'minutes'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Meeting Minutes
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'newsletters' ? (
        <ArchiveFileTab
          config={NEWSLETTER_CONFIG}
          files={newsletters}
          onDeleted={(id) => handleDeleted('newsletters', id)}
          onError={(msg) => addBanner(msg, 'error')}
        />
      ) : (
        <ArchiveFileTab
          config={MINUTES_CONFIG}
          files={minutes}
          onDeleted={(id) => handleDeleted('minutes', id)}
          onError={(msg) => addBanner(msg, 'error')}
        />
      )}

      {showDiscardDialog && <DiscardDialog onDiscard={() => { setShowDiscardDialog(false); resetForm(); }} onKeepEditing={() => setShowDiscardDialog(false)} />}
    </div>
  );
}
