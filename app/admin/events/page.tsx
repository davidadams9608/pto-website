'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

import { SITE_TIMEZONE } from '@/lib/site-config';

// ── Types ──────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  volunteerSlots: { role: string; count: number }[] | null;
  isPublished: boolean;
  signupCount: number;
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

function totalSlots(slots: { role: string; count: number }[] | null): number {
  if (!Array.isArray(slots)) return 0;
  return slots.reduce((sum, s) => sum + (s.count ?? 0), 0);
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

function SignupsIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="5" r="2.5"/><path d="M2 12.5c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.5"/><path d="M1.5 9.5V2.5a1 1 0 0 1 1-1h7"/>
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
      type === 'success'
        ? 'bg-emerald-600 text-white'
        : 'bg-red-600 text-white'
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

// ── Delete dialog ───────────────────────────────────────────────────────────

function DeleteDialog({ event, onConfirm, onCancel }: { event: EventRow; onConfirm: () => void; onCancel: () => void }) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'delete-dialog-portal';
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
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
          width: '100%',
          maxWidth: '24rem',
        }}
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Delete Event</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This action can&apos;t be undone. Are you sure you want to delete{' '}
            <strong className="text-zinc-700">{event.title}</strong>?
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function EventsListPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDuplicate = async (event: EventRow) => {
    try {
      const res = await fetch(`/api/admin/events/${event.id}`);
      if (!res.ok) throw new Error('Failed to fetch event');
      const { data } = await res.json();

      const dupRes = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${data.title} (Copy)`,
          description: data.description ?? '',
          date: new Date(data.date).toISOString().slice(0, 10),
          startTime: new Date(data.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Chicago' }),
          location: data.location,
          zoomUrl: data.zoomUrl ?? '',
          volunteerSlots: data.volunteerSlots ?? [],
          isPublished: false,
        }),
      });

      if (!dupRes.ok) throw new Error('Failed to duplicate');
      setToast({ message: 'Event duplicated as draft', type: 'success' });
      fetchEvents();
    } catch {
      setToast({ message: 'Failed to duplicate event', type: 'error' });
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const body = await res.json();
      setEvents(body.data);
    } catch {
      setToast({ message: 'Failed to load events', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        setToast({ message: 'Failed to delete event', type: 'error' });
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setToast({ message: 'Event deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete event', type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create Event
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">No events yet</p>
          <Link
            href="/admin/events/new"
            className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first event &rarr;
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="w-[36%] px-5 py-3">Event</th>
                <th className="w-[14%] px-4 py-3">Date</th>
                <th className="w-[12%] px-4 py-3">Volunteers</th>
                <th className="w-[10%] px-4 py-3">State</th>
                <th className="w-[28%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const slots = totalSlots(event.volunteerSlots);
                return (
                  <tr key={event.id} className="border-b border-zinc-50 last:border-b-0">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-zinc-900">{event.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {formatTime(event.date)} &middot; {event.location}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      {slots > 0 ? (
                        <Link
                          href={`/admin/events/${event.id}/signups`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {event.signupCount} / {slots}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold ${
                          event.isPublished
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          title="Edit"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <EditIcon />
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/signups`}
                          title="View Signups"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-emerald-200 text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                          <SignupsIcon />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(event)}
                          title="Duplicate"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-blue-200 hover:text-zinc-700"
                        >
                          <DuplicateIcon />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(event)}
                          title="Delete"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-red-200 text-red-500 transition-colors hover:bg-red-50"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && <DeleteDialog event={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
