'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';

// ── Types ──────────────────────────────────────────────────────────────────

interface SponsorRow {
  id: string;
  name: string;
  logoUrl: string;
  logoKey: string;
  websiteUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M10 2l2 2-7.5 7.5H2.5v-2L10 2z"/>
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

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 11V3"/><path d="M3.5 6.5L7 3l3.5 3.5"/>
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v8"/><path d="M3.5 7.5L7 11l3.5-3.5"/>
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

function DeleteDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
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
          <h2 className="text-base font-semibold text-zinc-900">Delete Sponsor</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This action can&apos;t be undone. Are you sure you want to delete{' '}
            <strong className="text-zinc-700">{name}</strong>?
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

// ── Main Component ─────────────────────────────────────────────────────────

interface SponsorsManagerProps {
  initialSponsors: SponsorRow[];
}

export function SponsorsManager({ initialSponsors }: SponsorsManagerProps) {
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SponsorRow | null>(null);
  const [editTarget, setEditTarget] = useState<SponsorRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formLogo, setFormLogo] = useState<{ fileKey: string; fileUrl: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; logo?: string; website?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const router = useRouter();

  const isFormDirty = showAddForm
    ? formName.trim() !== '' || formWebsite.trim() !== '' || formLogo !== null
    : editTarget !== null && (
      formName.trim() !== editTarget.name ||
      (formWebsite.trim() || '') !== (editTarget.websiteUrl || '') ||
      formActive !== editTarget.isActive ||
      (formLogo?.fileKey ?? '') !== editTarget.logoKey
    );

  const handleCancel = () => {
    if (isFormDirty) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormWebsite('');
    setFormActive(true);
    setFormLogo(null);
    setFormErrors({});
    setShowAddForm(false);
    setEditTarget(null);
  };

  const openEditForm = (sponsor: SponsorRow) => {
    setEditTarget(sponsor);
    setFormName(sponsor.name);
    setFormWebsite(sponsor.websiteUrl ?? '');
    setFormActive(sponsor.isActive);
    setFormLogo({ fileKey: sponsor.logoKey, fileUrl: sponsor.logoUrl });
    setFormErrors({});
    setShowAddForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!formName.trim()) errors.name = 'Name is required';
    if (!formLogo) errors.logo = 'Logo image is required';
    if (formWebsite.trim() && !/^https?:\/\/.+/.test(formWebsite.trim())) errors.website = 'Must be a valid URL (https://...)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          websiteUrl: formWebsite.trim() || '',
          logoKey: formLogo!.fileKey,
          logoUrl: formLogo!.fileUrl,
          isActive: formActive,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add sponsor');
      const { data } = await res.json();
      setSponsors((prev) => [...prev, data]);
      setToast({ message: 'Sponsor added', type: 'success' });
      resetForm();
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to add sponsor', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTarget || !validateForm()) return;
    setFormSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        websiteUrl: formWebsite.trim() || '',
        isActive: formActive,
      };
      // Only send logo fields if changed
      if (formLogo && formLogo.fileKey !== editTarget.logoKey) {
        payload.logoKey = formLogo.fileKey;
        payload.logoUrl = formLogo.fileUrl;
      }

      const res = await fetch(`/api/admin/sponsors/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update sponsor');
      const { data } = await res.json();
      setSponsors((prev) => prev.map((s) => s.id === editTarget.id ? data : s));
      setToast({ message: 'Sponsor updated', type: 'success' });
      resetForm();
      router.refresh();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update sponsor', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/sponsors/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setSponsors((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setToast({ message: 'Sponsor deleted', type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to delete sponsor', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const next = [...sponsors];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setSponsors(next);

    try {
      const res = await fetch('/api/admin/sponsors/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
    } catch {
      setSponsors(sponsors);
      setToast({ message: 'Failed to reorder sponsors', type: 'error' });
    }
  }, [sponsors]);

  const isEditing = editTarget !== null;
  const showForm = showAddForm || isEditing;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Sponsors</h1>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Add Sponsor
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">
            {isEditing ? 'Edit Sponsor' : 'Add Sponsor'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sponsor-name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Sponsor Name</label>
              <input
                id="sponsor-name"
                type="text"
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setFormErrors((prev) => ({ ...prev, name: undefined })); }}
                placeholder="e.g., Green Valley Market"
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-400' : 'border-zinc-200'}`}
              />
              {formErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="sponsor-website" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Website URL <span className="font-normal normal-case text-zinc-400">(optional)</span></label>
              <input
                id="sponsor-website"
                type="text"
                value={formWebsite}
                onChange={(e) => { setFormWebsite(e.target.value); setFormErrors((prev) => ({ ...prev, website: undefined })); }}
                placeholder="https://example.com"
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.website ? 'border-red-400' : 'border-zinc-200'}`}
              />
              {formErrors.website && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.website}</p>}
            </div>
            <div className="col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Logo</span>
              {isEditing && formLogo && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                  <Image src={formLogo.fileUrl} alt="Current logo" width={60} height={40} className="rounded object-contain" />
                  <span className="text-xs text-zinc-500">Current logo — upload a new image to replace</span>
                </div>
              )}
              <FileUpload
                type="sponsors"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                maxSizeMB={2}
                onUploadComplete={(result) => { setFormLogo(result); setFormErrors((prev) => ({ ...prev, logo: undefined })); }}
                onUploadError={(msg) => setFormErrors((prev) => ({ ...prev, logo: msg }))}
              />
              {formErrors.logo && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.logo}</p>}
            </div>
            <div className="col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-zinc-900">Active</span>
                <span className="text-xs text-zinc-400">— visible on the public sponsors page</span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={handleCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button
              onClick={isEditing ? handleUpdate : handleAdd}
              disabled={formSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Sponsor'}
            </button>
          </div>
        </div>
      )}

      {/* Sponsor list */}
      {sponsors.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">No sponsors yet — add your first sponsor</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="w-[10%] px-4 py-3">Logo</th>
                <th className="w-[25%] px-4 py-3">Name</th>
                <th className="w-[25%] px-4 py-3">Website</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[30%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor, i) => (
                <tr key={sponsor.id} className="border-b border-zinc-50 last:border-b-0 hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <Image
                      src={sponsor.logoUrl}
                      alt={`${sponsor.name} logo`}
                      width={60}
                      height={40}
                      className="rounded object-contain"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{sponsor.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {sponsor.websiteUrl ? (
                      <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {sponsor.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold ${
                      sponsor.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                    }`}>
                      {sponsor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleMove(i, 'up')} disabled={i === 0} title="Move up"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-30">
                        <ArrowUpIcon />
                      </button>
                      <button onClick={() => handleMove(i, 'down')} disabled={i === sponsors.length - 1} title="Move down"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-30">
                        <ArrowDownIcon />
                      </button>
                      <button onClick={() => openEditForm(sponsor)} title="Edit"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600">
                        <EditIcon />
                      </button>
                      <button onClick={() => setDeleteTarget(sponsor)} title="Delete"
                        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && <DeleteDialog name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      {showDiscardDialog && <DiscardDialog onDiscard={() => { setShowDiscardDialog(false); resetForm(); }} onKeepEditing={() => setShowDiscardDialog(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
