'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';
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

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onDismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
      {type === 'error' && (
        <button onClick={onDismiss} className="ml-2 rounded px-2 py-0.5 text-xs font-bold text-white/80 hover:text-white">
          Dismiss
        </button>
      )}
    </div>
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

// ── Shared file tab ────────────────────────────────────────────────────────

interface ArchiveFileTabProps {
  config: ArchiveFileConfig;
  files: FileRow[];
  onCreated: (file: FileRow) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}

function ArchiveFileTab({ config, files, onCreated, onDeleted, onError }: ArchiveFileTabProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [schoolYear, setSchoolYear] = useState(getSchoolYearOptions(1)[0]);
  const [uploadResult, setUploadResult] = useState<{ fileKey: string; fileUrl: string } | null>(null);
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileRow | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const schoolYearOptions = getSchoolYearOptions(6);
  const idPrefix = config.type === 'newsletters' ? 'nl' : 'min';

  const isFormDirty = title.trim() !== '' || uploadResult !== null;

  const handleCancel = () => {
    if (isFormDirty) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle('');
    setSchoolYear(schoolYearOptions[0]);
    setUploadResult(null);
    setErrors({});
    setShowUploadForm(false);
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!uploadResult) newErrors.file = 'PDF file is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const dateField = config.type === 'newsletters' ? 'publishedAt' : 'meetingDate';
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          [dateField]: todayDateString(),
          fileKey: uploadResult!.fileKey,
          fileUrl: uploadResult!.fileUrl,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Failed to create ${config.labelSingular.toLowerCase()}`);
      }
      const { data } = await res.json();
      const fileUrl = config.type === 'newsletters' ? data.pdfUrl : data.fileUrl;
      const fileDate = config.type === 'newsletters' ? data.publishedAt : data.meetingDate;
      onCreated({ id: data.id, title: data.title, url: fileUrl, date: fileDate });
      resetForm();
    } catch (err) {
      onError(err instanceof Error ? err.message : `Failed to upload ${config.labelSingular.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">{config.description}</p>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <UploadBtnIcon />
          {config.uploadTitle}
        </button>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">{config.uploadTitle}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${idPrefix}-title`} className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Title</label>
              <input
                id={`${idPrefix}-title`}
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((prev) => ({ ...prev, title: undefined })); }}
                placeholder={config.uploadPlaceholder}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-zinc-200'}`}
              />
              {errors.title && <p className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor={`${idPrefix}-school-year`} className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">School Year</label>
              <select
                id={`${idPrefix}-school-year`}
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schoolYearOptions.map((sy) => (
                  <option key={sy} value={sy}>{sy}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">PDF File</span>
              <FileUpload
                type={config.type}
                accept=".pdf,application/pdf"
                maxSizeMB={10}
                onUploadComplete={(result) => { setUploadResult(result); setErrors((prev) => ({ ...prev, file: undefined })); }}
                onUploadError={(msg) => setErrors((prev) => ({ ...prev, file: msg }))}
              />
              {errors.file && <p className="mt-1 text-xs font-medium text-red-600">{errors.file}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={handleCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <UploadBtnIcon />
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

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
                <div key={f.id} className="flex items-center gap-3 border-b border-zinc-50 px-5 py-3 last:border-b-0 hover:bg-blue-50/40">
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
                      className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600"
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
      {showDiscardDialog && <DiscardDialog onDiscard={() => { setShowDiscardDialog(false); resetForm(); }} onKeepEditing={() => setShowDiscardDialog(false)} />}
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const handleCreated = useCallback((tab: Tab, file: FileRow) => {
    if (tab === 'newsletters') {
      setNewsletters((prev) => [file, ...prev]);
      setToast({ message: 'Newsletter uploaded', type: 'success' });
    } else {
      setMinutes((prev) => [file, ...prev]);
      setToast({ message: 'Meeting minutes uploaded', type: 'success' });
    }
  }, []);

  const handleDeleted = useCallback((tab: Tab, id: string) => {
    if (tab === 'newsletters') {
      setNewsletters((prev) => prev.filter((f) => f.id !== id));
      setToast({ message: 'Newsletter deleted', type: 'success' });
    } else {
      setMinutes((prev) => prev.filter((f) => f.id !== id));
      setToast({ message: 'Meeting minutes deleted', type: 'success' });
    }
    router.refresh();
  }, [router]);

  return (
    <div>
      {/* Header with tabs */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Archive</h1>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('newsletters')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'newsletters' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Newsletters
          </button>
          <button
            onClick={() => setActiveTab('minutes')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === 'minutes' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Meeting Minutes
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'newsletters' ? (
        <ArchiveFileTab
          config={NEWSLETTER_CONFIG}
          files={newsletters}
          onCreated={(f) => handleCreated('newsletters', f)}
          onDeleted={(id) => handleDeleted('newsletters', id)}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      ) : (
        <ArchiveFileTab
          config={MINUTES_CONFIG}
          files={minutes}
          onCreated={(f) => handleCreated('minutes', f)}
          onDeleted={(id) => handleDeleted('minutes', id)}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
