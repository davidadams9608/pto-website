'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { BannerStack } from '@/components/admin/banner';
import { useBanners } from '@/components/admin/use-banners';
import { ContactVolunteersModal } from '@/components/shared/contact-volunteers-modal';
import { SITE_TIMEZONE } from '@/lib/site-config';
import { downloadSignupsCsv } from '@/lib/utils/csv';

// ── Types ──────────────────────────────────────────────────────────────────

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  volunteerSlots: { role: string; count: number; type?: 'shift' | 'supply' }[] | null;
}

interface SignupRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  quantity: number;
  signupGroupId: string;
  notes: string | null;
  createdAt: string;
}

interface SignupsData {
  event: EventData;
  signups: SignupRow[];
  retentionExpired: boolean;
  daysSinceEvent: number | null;
}

interface SignupGroup {
  key: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  roles: Array<{ role: string; quantity: number }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: SITE_TIMEZONE,
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: SITE_TIMEZONE,
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: SITE_TIMEZONE,
  });
}

function totalSlots(slots: { role: string; count: number }[] | null): number {
  if (!Array.isArray(slots)) return 0;
  return slots.reduce((sum, s) => sum + (s.count ?? 0), 0);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11L5 7l4-4"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.5" y="3" width="12" height="9" rx="1.5"/><path d="M1.5 4.5L7.5 8.5l6-4"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7.5 1.5v9M4 7l3.5 3.5L11 7"/><path d="M2 12.5v1h11v-1"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 13 13" width="13" height="13" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 4v2.5"/>
      <circle cx="6.5" cy="9" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function ClockAlertIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3.5l2.5 1.5"/>
    </svg>
  );
}

function BroomIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3 13l2-6"/><path d="M5 7c0-2 1-4 2-5"/><path d="M5 7c2 0 4-1 5-2"/><path d="M1.5 13h5"/>
    </svg>
  );
}

// ── Purge data dialog ────────────────────────────────────────────────────

function PurgeDataDialog({ eventTitle, onConfirm, onCancel }: { eventTitle: string; onConfirm: () => void; onCancel: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'purge-dialog-portal';
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: need re-render after portal DOM element is created

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="purge-dialog-title"
        aria-describedby="purge-dialog-desc"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
          width: '100%',
          maxWidth: '28rem',
        }}
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 id="purge-dialog-title" className="text-base font-semibold text-zinc-900">
            Delete Volunteer Data
          </h2>
          <p id="purge-dialog-desc" className="mt-2 text-sm text-zinc-500">
            This action can&apos;t be undone. This will permanently delete all volunteer signup data
            for <strong className="text-zinc-700">{eventTitle}</strong>. This data is past the 90-day
            retention period.
          </p>
          <div className="mt-8 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Delete single signup dialog ────────────────────────────────────────────

function DeleteSignupDialog({ volunteerName, onConfirm, onCancel }: { volunteerName: string; onConfirm: () => void; onCancel: () => void }) {
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onCancel} />
      <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '26rem' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Delete Signup</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This will permanently delete the signup for <strong className="text-zinc-700">{volunteerName}</strong> and all their volunteer roles for this event.
          </p>
          <div className="mt-6 flex justify-end gap-2">
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

// ── Edit signup modal ─────────────────────────────────────────────────────

interface EditSignupModalProps {
  eventId: string;
  signupGroup: SignupGroup;
  availableSlots: Array<{ role: string; count: number; type?: 'shift' | 'supply' }>;
  onClose: () => void;
  onSaved: () => void;
}

function EditSignupModal({ eventId, signupGroup, availableSlots, onClose, onSaved }: EditSignupModalProps) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const [name, setName] = useState(signupGroup.name);
  const [email, setEmail] = useState(signupGroup.email);
  const [phone, setPhone] = useState(signupGroup.phone ?? '');
  const [notes, setNotes] = useState(signupGroup.notes ?? '');
  const [selectedRoles, setSelectedRoles] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const r of signupGroup.roles) map.set(r.role, r.quantity);
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setPortalEl(el); // eslint-disable-line react-hooks/set-state-in-effect -- intentional
    return () => { document.body.removeChild(el); };
  }, []);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const next = new Map(prev);
      if (next.has(role)) next.delete(role);
      else next.set(role, 1);
      return next;
    });
  };

  const setQuantity = (role: string, qty: number) => {
    setSelectedRoles((prev) => {
      const next = new Map(prev);
      next.set(role, qty);
      return next;
    });
  };

  const handleSave = async () => {
    setError('');
    const roles = Array.from(selectedRoles.entries()).map(([role, quantity]) => ({ role, quantity }));
    if (!name.trim()) { setError('Name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (roles.length === 0) { setError('Select at least one role'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/signups/${signupGroup.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, notes, roles }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'Failed to save');
        return;
      }
      onSaved();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!portalEl) return null;

  const inputClass = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#1B6DC2] focus:ring-1 focus:ring-[#1B6DC2]/30';

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100000, width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Edit Signup</h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="edit-name" className="mb-1 block text-xs font-semibold text-zinc-500">Name</label>
              <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-email" className="mb-1 block text-xs font-semibold text-zinc-500">Email</label>
              <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="edit-phone" className="mb-1 block text-xs font-semibold text-zinc-500">Phone</label>
              <input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>

            {/* Roles */}
            <fieldset>
              <legend className="mb-1 block text-xs font-semibold text-zinc-500">Roles</legend>
              <div className="space-y-1.5">
                {availableSlots.map((slot) => {
                  const isChecked = selectedRoles.has(slot.role);
                  const qty = selectedRoles.get(slot.role) ?? 1;
                  return (
                    <div key={slot.role} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(slot.role)}
                        className="h-4 w-4 accent-[#1B6DC2]"
                        id={`edit-role-${slot.role}`}
                      />
                      <label htmlFor={`edit-role-${slot.role}`} className="flex-1 text-sm text-zinc-700">
                        {slot.role}
                        <span className="ml-1.5 text-xs text-zinc-400">({slot.type === 'supply' ? 'supply' : 'shift'})</span>
                      </label>
                      {isChecked && slot.type === 'supply' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQuantity(slot.role, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-14 rounded border border-zinc-200 px-2 py-1 text-center text-sm font-medium text-zinc-900 outline-none focus:border-[#1B6DC2]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="edit-notes" className="mb-1 block text-xs font-semibold text-zinc-500">Notes</label>
              <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))} rows={2} className={`${inputClass} resize-none`} />
              <p className="mt-0.5 text-right text-[0.65rem] text-zinc-400">{notes.length}/500</p>
            </div>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#18181b', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>,
    portalEl,
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EventSignupsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SignupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { banners, addBanner, dismissBanner } = useBanners();
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ key: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<SignupGroup | null>(null);

  const fetchSignups = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/signups`);
      if (!res.ok) throw new Error('Failed to fetch signups');
      const body = await res.json();
      setData(body.data);
    } catch {
      addBanner('Failed to load signups', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  const handlePurge = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/signups`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        addBanner('Failed to delete volunteer data', 'error');
        return;
      }
      setData((prev) => prev ? { ...prev, signups: [], retentionExpired: false } : prev);
      addBanner(`Volunteer data deleted for ${data.event.title}`, 'success');
    } catch {
      addBanner('Failed to delete volunteer data', 'error');
    } finally {
      setShowPurgeDialog(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/signups/${deleteTarget.key}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        addBanner('Failed to delete signup', 'error');
        return;
      }
      await fetchSignups();
      addBanner(`Signup deleted for ${deleteTarget.name}`, 'success');
    } catch {
      addBanner('Failed to delete signup', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEditSaved = async () => {
    setEditTarget(null);
    await fetchSignups();
    addBanner('Signup updated', 'success');
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-400">Loading signups...</div>;
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        Event not found.{' '}
        <Link href="/admin/events" className="font-semibold text-[#1B6DC2] hover:text-[#1B6DC2]">
          Back to Events
        </Link>
      </div>
    );
  }

  const { event, signups, retentionExpired, daysSinceEvent } = data;
  const slots = totalSlots(event.volunteerSlots);
  const hasVolunteerSlots = slots > 0;
  const spotsRemaining = Math.max(0, slots - signups.length);

  // Per-role capacity breakdown
  const roleCountMap = new Map<string, number>();
  for (const s of signups) {
    roleCountMap.set(s.role, (roleCountMap.get(s.role) ?? 0) + (s.quantity ?? 1));
  }

  // Group signups by signupGroupId
  const signupGroups: SignupGroup[] = [];
  const groupMap = new Map<string, number>(); // signupGroupId → index in signupGroups
  for (const s of signups) {
    const idx = groupMap.get(s.signupGroupId);
    if (idx !== undefined) {
      signupGroups[idx].roles.push({ role: s.role, quantity: s.quantity });
    } else {
      groupMap.set(s.signupGroupId, signupGroups.length);
      signupGroups.push({
        key: s.signupGroupId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        notes: s.notes,
        createdAt: s.createdAt,
        roles: [{ role: s.role, quantity: s.quantity }],
      });
    }
  }

  return (
    <div>
      <BannerStack banners={banners} onDismiss={dismissBanner} />

      {/* Back link */}
      <Link
        href="/admin/events"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#1B6DC2] hover:text-[#1B6DC2]"
      >
        <BackIcon />
        Back to Events
      </Link>

      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {event.title} — Signups
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(event.date)} &middot; {formatTime(event.date)} &middot; {event.location}
          </p>
        </div>
        {hasVolunteerSlots && signups.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MailIcon />
              Contact Volunteers
            </button>
            <button
              onClick={() => downloadSignupsCsv(event.title, signups)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <DownloadIcon />
              Export CSV
            </button>
            {retentionExpired && (
              <button
                onClick={() => setShowPurgeDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                title={`Event was ${daysSinceEvent} days ago — volunteer data should be deleted per retention policy`}
              >
                <BroomIcon />
                Delete All Signup Data
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[0.55rem] font-bold text-amber-700">
                  <ClockAlertIcon />
                  90d+
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* No volunteer slots configured */}
      {!hasVolunteerSlots && (
        <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1B6DC2]">
          <InfoIcon />
          Volunteer signup is not enabled for this event.
        </div>
      )}

      {/* Summary cards + table — only when volunteer slots are configured */}
      {hasVolunteerSlots && (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                Total Signups
              </div>
              <div className="mt-1 text-xl font-extrabold text-zinc-900">
                {signupGroups.length}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                Spots Filled
              </div>
              <div className="mt-1 text-xl font-extrabold text-emerald-600">
                {signups.length} / {slots}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                Spots Remaining
              </div>
              <div className="mt-1 text-xl font-extrabold text-amber-600">
                {spotsRemaining}
              </div>
            </div>
          </div>

          {/* Per-role capacity breakdown — split by type */}
          {Array.isArray(event.volunteerSlots) && event.volunteerSlots.length > 0 && (() => {
            const shiftSlots = event.volunteerSlots!.filter((s) => (s.type ?? 'shift') === 'shift');
            const supplySlots = event.volunteerSlots!.filter((s) => s.type === 'supply');

            const renderSlots = (slotList: typeof event.volunteerSlots & object) =>
              slotList.map((slot) => {
                const filled = roleCountMap.get(slot.role) ?? 0;
                const pct = slot.count > 0 ? Math.min(100, Math.round((filled / slot.count) * 100)) : 0;
                return (
                  <div key={slot.role}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700">{slot.role}</span>
                      <span className="text-xs font-semibold text-zinc-500">{filled} / {slot.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              });

            return (
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {shiftSlots.length > 0 && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Volunteer Shifts</p>
                    <div className="space-y-2">{renderSlots(shiftSlots)}</div>
                  </div>
                )}
                {supplySlots.length > 0 && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Supplies</p>
                    <div className="space-y-2">{renderSlots(supplySlots)}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Volunteer table */}
          {signups.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
              <p className="text-sm text-zinc-500">No volunteer signups yet for this event.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <th className="w-[4%] px-4 py-3">#</th>
                      <th className="w-[15%] px-4 py-3">Name</th>
                      <th className="w-[18%] px-4 py-3">Email</th>
                      <th className="w-[12%] px-4 py-3">Phone</th>
                      <th className="w-[17%] px-4 py-3">Roles</th>
                      <th className="w-[12%] px-4 py-3">Notes</th>
                      <th className="w-[14%] px-4 py-3">Signed Up</th>
                      <th className="w-[8%] px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signupGroups.map((group, i) => (
                      <tr key={group.key} className="border-b border-zinc-50 last:border-b-0">
                        <td className="px-4 py-3 text-sm text-zinc-400">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{group.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{group.email}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{group.phone || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">
                          {group.roles.map((r, j) => (
                            <div key={j}>
                              {r.role}{r.quantity > 1 ? ` (×${r.quantity})` : ''}
                            </div>
                          ))}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-sm text-zinc-500" title={group.notes ?? undefined}>
                          {group.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{formatDateTime(group.createdAt)}</td>
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditTarget(group)}
                              title="Edit"
                              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]"
                            >
                              <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                                <path d="M10 2l2 2-7.5 7.5H2.5v-2L10 2z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ key: group.key, name: group.name })}
                              title="Delete"
                              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500"
                            >
                              <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                                <path d="M2.5 4h9"/><path d="M5 4V2.5h4V4"/><path d="M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Privacy note */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                <InfoIcon />
                Volunteer contact info is only visible to admins. Public visitors see &quot;X spots left&quot; only.
              </div>
            </>
          )}
        </>
      )}

      {/* Contact Volunteers modal */}
      {showContactModal && data && (
        <ContactVolunteersModal
          eventId={id}
          eventTitle={event.title}
          recipients={signupGroups.map((g) => ({ id: g.key, name: g.name, email: g.email }))}
          onClose={() => setShowContactModal(false)}
          onSuccess={(count) => {
            setShowContactModal(false);
            addBanner(`Message sent to ${count} volunteer${count !== 1 ? 's' : ''}`, 'success');
          }}
        />
      )}

      {/* Purge data dialog */}
      {showPurgeDialog && (
        <PurgeDataDialog
          eventTitle={event.title}
          onConfirm={handlePurge}
          onCancel={() => setShowPurgeDialog(false)}
        />
      )}

      {/* Delete single signup dialog */}
      {deleteTarget && (
        <DeleteSignupDialog
          volunteerName={deleteTarget.name}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Edit signup modal */}
      {editTarget && data && (
        <EditSignupModal
          eventId={id}
          signupGroup={editTarget}
          availableSlots={(data.event.volunteerSlots ?? []) as Array<{ role: string; count: number; type?: 'shift' | 'supply' }>}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

    </div>
  );
}
