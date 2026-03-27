'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────

interface OfficerRow {
  id: string;
  name: string;
  role: string;
  displayOrder: number;
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
          <h2 className="text-base font-semibold text-zinc-900">Delete Officer</h2>
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

interface AboutManagerProps {
  initialAboutText: string;
  initialOfficers: OfficerRow[];
}

export function AboutManager({ initialAboutText, initialOfficers }: AboutManagerProps) {
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [savingText, setSavingText] = useState(false);
  const [officers, setOfficers] = useState(initialOfficers);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfficerRow | null>(null);
  const [editTarget, setEditTarget] = useState<OfficerRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; role?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const router = useRouter();

  const isFormDirty = showAddForm
    ? formName.trim() !== '' || formRole.trim() !== ''
    : editTarget !== null && (
      formName.trim() !== editTarget.name || formRole.trim() !== editTarget.role
    );

  const handleFormCancel = () => {
    if (isFormDirty) {
      setShowDiscardDialog(true);
    } else {
      resetForm();
    }
  };

  // ── About text ──

  const handleSaveAboutText = async () => {
    setSavingText(true);
    try {
      const res = await fetch('/api/admin/about-text', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: aboutText }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setToast({ message: 'About text updated', type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to update about text', type: 'error' });
    } finally {
      setSavingText(false);
    }
  };

  // ── Officer CRUD ──

  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormErrors({});
    setShowAddForm(false);
    setEditTarget(null);
  };

  const openEditForm = (officer: OfficerRow) => {
    setEditTarget(officer);
    setFormName(officer.name);
    setFormRole(officer.role);
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
    if (!formRole.trim()) errors.role = 'Role is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOfficer = async () => {
    if (!validateForm()) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          role: formRole.trim(),
          displayOrder: officers.length + 1,
        }),
      });
      if (!res.ok) throw new Error('Failed to add officer');
      const { data } = await res.json();
      setOfficers((prev) => [...prev, { id: data.id, name: data.name, role: data.role, displayOrder: data.displayOrder }]);
      setToast({ message: 'Officer added', type: 'success' });
      resetForm();
      router.refresh();
    } catch {
      setToast({ message: 'Failed to add officer', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateOfficer = async () => {
    if (!editTarget || !validateForm()) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/admin/officers/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), role: formRole.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const { data } = await res.json();
      setOfficers((prev) => prev.map((o) => o.id === editTarget.id ? { ...o, name: data.name, role: data.role } : o));
      setToast({ message: 'Officer updated', type: 'success' });
      resetForm();
      router.refresh();
    } catch {
      setToast({ message: 'Failed to update officer', type: 'error' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteOfficer = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/officers/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setOfficers((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setToast({ message: 'Officer deleted', type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to delete officer', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Reorder ──

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    const newOfficers = [...officers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOfficers.length) return;

    [newOfficers[index], newOfficers[targetIndex]] = [newOfficers[targetIndex], newOfficers[index]];
    setOfficers(newOfficers);

    try {
      const res = await fetch('/api/admin/officers/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newOfficers.map((o) => o.id) }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
    } catch {
      setOfficers(officers); // revert
      setToast({ message: 'Failed to reorder officers', type: 'error' });
    }
  }, [officers]);

  // ── Render ──

  const isEditing = editTarget !== null;
  const showForm = showAddForm || isEditing;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">About</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your organization description and officers.</p>
      </div>

      {/* About Text Section */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-extrabold text-zinc-900">Organization Description</h2>
        <div>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the PTO organization..."
          />
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-[0.65rem] ${aboutText.length > 4500 ? 'text-amber-600' : 'text-zinc-400'}`}>
              {aboutText.length} / 5,000
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveAboutText}
            disabled={savingText || aboutText === initialAboutText}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {savingText ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Officers Section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-900">PTO Officers</h2>
          {!showForm && (
            <button
              onClick={openAddForm}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Add Officer
            </button>
          )}
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
              {isEditing ? 'Edit Officer' : 'Add Officer'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="officer-name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Name</label>
                <input
                  id="officer-name"
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormErrors((prev) => ({ ...prev, name: undefined })); }}
                  placeholder="e.g., Jane Smith"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {formErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="officer-role" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Role</label>
                <input
                  id="officer-role"
                  type="text"
                  value={formRole}
                  onChange={(e) => { setFormRole(e.target.value); setFormErrors((prev) => ({ ...prev, role: undefined })); }}
                  placeholder="e.g., President"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.role ? 'border-red-400' : 'border-zinc-200'}`}
                />
                {formErrors.role && <p className="mt-1 text-xs font-medium text-red-600">{formErrors.role}</p>}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={handleFormCancel} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
              <button
                onClick={isEditing ? handleUpdateOfficer : handleAddOfficer}
                disabled={formSubmitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {formSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Officer list */}
        {officers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-zinc-500">No officers added yet — add your first PTO officer</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="w-[8%] px-4 py-3">Order</th>
                  <th className="w-[32%] px-4 py-3">Name</th>
                  <th className="w-[28%] px-4 py-3">Role</th>
                  <th className="w-[32%] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer, i) => (
                  <tr key={officer.id} className="border-b border-zinc-50 last:border-b-0 hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm text-zinc-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{officer.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{officer.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleMove(i, 'up')}
                          disabled={i === 0}
                          title="Move up"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowUpIcon />
                        </button>
                        <button
                          onClick={() => handleMove(i, 'down')}
                          disabled={i === officers.length - 1}
                          title="Move down"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:opacity-30"
                        >
                          <ArrowDownIcon />
                        </button>
                        <button
                          onClick={() => openEditForm(officer)}
                          title="Edit"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-blue-600"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(officer)}
                          title="Delete"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500"
                        >
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
      </div>

      {/* Delete confirmation */}
      {deleteTarget && <DeleteDialog name={deleteTarget.name} onConfirm={handleDeleteOfficer} onCancel={() => setDeleteTarget(null)} />}
      {showDiscardDialog && <DiscardDialog onDiscard={() => { setShowDiscardDialog(false); resetForm(); }} onKeepEditing={() => setShowDiscardDialog(false)} />}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
