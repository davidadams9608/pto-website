'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';
import { createSponsorSchema } from '@/lib/validators/sponsors';

// ── Types ──────────────────────────────────────────────────────────────────

interface SponsorData {
  id: string;
  name: string;
  logoUrl: string;
  logoKey: string;
  websiteUrl: string | null;
  isActive: boolean;
}

interface SponsorEditorProps {
  sponsorId?: string; // undefined = create mode
}

// ── Unsaved changes dialog ─────────────────────────────────────────────────

function UnsavedDialog({ onLeave, onStay }: { onLeave: () => void; onStay: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: need re-render after portal DOM element is created
    return () => { document.body.removeChild(el); };
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onStay} />
      <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '24rem' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Unsaved Changes</h2>
          <p className="mt-2 text-sm text-zinc-500">You have unsaved changes. Are you sure you want to leave?</p>
          <div className="mt-8 flex justify-end gap-2">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button onClick={onStay} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50" autoFocus>
              Stay
            </button>
            <button onClick={onLeave} style={{ backgroundColor: '#dc2626', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Leave
            </button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Toast (local, for validation errors only — success redirects with banner) ──

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

// ── Component ──────────────────────────────────────────────────────────────

export function SponsorEditor({ sponsorId }: SponsorEditorProps) {
  const router = useRouter();
  const isEdit = !!sponsorId;

  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [logo, setLogo] = useState<{ fileKey: string; fileUrl: string } | null>(null);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const markDirty = useCallback(() => setDirty(true), []);

  // Load sponsor data in edit mode
  useEffect(() => {
    if (!sponsorId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/sponsors/${sponsorId}`);
        if (!res.ok) throw new Error('Failed to load sponsor');
        const { data } = await res.json() as { data: SponsorData };

        setName(data.name);
        setWebsite(data.websiteUrl ?? '');
        setIsActive(data.isActive);
        setLogo({ fileKey: data.logoKey, fileUrl: data.logoUrl });
      } catch {
        setToast({ message: 'Failed to load sponsor', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [sponsorId]);

  // Cancel with dirty check
  const handleCancel = () => {
    if (dirty) {
      setShowLeaveDialog(true);
    } else {
      router.push('/admin/sponsors');
    }
  };

  // Save
  const handleSave = async () => {
    setFieldErrors({});

    const payload = {
      name: name.trim(),
      websiteUrl: website.trim() || '',
      logoKey: logo?.fileKey ?? '',
      logoUrl: logo?.fileUrl ?? '',
      isActive,
    };

    // Client-side validation
    const result = createSponsorSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errors[key]) errors[key] = issue.message;
      }
      // Map logoKey/logoUrl errors to a single "logo" field
      if (errors.logoKey || errors.logoUrl) {
        errors.logo = 'Logo image is required';
        delete errors.logoKey;
        delete errors.logoUrl;
      }
      setFieldErrors(errors);
      setToast({ message: 'Please fix the highlighted fields', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/sponsors/${sponsorId}` : '/api/admin/sponsors';
      const method = isEdit ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        name: payload.name,
        websiteUrl: payload.websiteUrl,
        isActive: payload.isActive,
      };

      // For edit, only send logo fields if changed
      if (isEdit && logo) {
        // Always send logo fields — the API handles the diff
        body.logoKey = logo.fileKey;
        body.logoUrl = logo.fileUrl;
      } else {
        body.logoKey = payload.logoKey;
        body.logoUrl = payload.logoUrl;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error ?? 'Failed to save sponsor', type: 'error' });
        return;
      }

      setDirty(false);
      const msg = isEdit ? `Sponsor '${name.trim()}' updated` : `Sponsor '${name.trim()}' created`;
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/admin/sponsors?success=${encodeURIComponent(msg)}`);
    } catch {
      setToast({ message: 'Failed to save sponsor', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-[#1B6DC2] focus:ring-1 focus:ring-[#1B6DC2]/30 ${
      fieldErrors[field] ? 'border-red-400 bg-red-50/30' : 'border-zinc-200'
    }`;

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-400">Loading sponsor...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          {isEdit ? 'Edit Sponsor' : 'Add Sponsor'}
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Sponsor Details */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-xs font-bold uppercase tracking-[0.06em] text-zinc-500">
            Sponsor Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="sponsor-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                Sponsor Name
              </label>
              <input
                id="sponsor-name"
                type="text"
                placeholder="e.g., Green Valley Market"
                className={fieldClass('name')}
                value={name}
                onChange={(e) => { setName(e.target.value); markDirty(); }}
              />
              {fieldErrors.name && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.name}</p>}
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="sponsor-website" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                Website URL <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="sponsor-website"
                type="text"
                placeholder="https://example.com"
                className={fieldClass('websiteUrl')}
                value={website}
                onChange={(e) => { setWebsite(e.target.value); markDirty(); }}
              />
              {fieldErrors.websiteUrl && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.websiteUrl}</p>}
            </div>

            {/* Logo */}
            <div className="col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">Logo</span>
              {logo && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                  <Image src={logo.fileUrl} alt="Current logo" width={60} height={40} className="rounded object-contain" />
                  <span className="text-xs text-zinc-500">
                    {isEdit ? 'Current logo \u2014 upload a new image to replace' : 'Logo uploaded'}
                  </span>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => { setLogo(null); markDirty(); }}
                      className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
              <FileUpload
                type="sponsors"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                maxSizeMB={2}
                onUploadComplete={(result) => { setLogo(result); markDirty(); setFieldErrors((prev) => { const next = { ...prev }; delete next.logo; return next; }); }}
                onUploadError={(msg) => setFieldErrors((prev) => ({ ...prev, logo: msg }))}
              />
              {fieldErrors.logo && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.logo}</p>}
            </div>

            {/* Active toggle */}
            <div className="col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => { setIsActive(e.target.checked); markDirty(); }}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-[#1B6DC2] focus:ring-[#1B6DC2]"
                />
                <span className="font-semibold text-zinc-900">Active</span>
                <span className="text-xs text-zinc-400">&mdash; visible on the public sponsors page</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={handleCancel}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: '#18181b', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Add Sponsor'}
          </button>
        </div>
      </div>

      {/* Unsaved changes dialog */}
      {showLeaveDialog && (
        <UnsavedDialog
          onLeave={() => router.push('/admin/sponsors')}
          onStay={() => setShowLeaveDialog(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
