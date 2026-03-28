'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

import { BannerStack } from '@/components/admin/banner';
import { useBanners } from '@/components/admin/use-banners';
import { ContactVolunteersModal } from '@/components/shared/contact-volunteers-modal';
import { SITE_TIMEZONE } from '@/lib/site-config';

// ── Types ──────────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  volunteerSlots: { role: string; count: number; type?: 'shift' | 'supply' }[] | null;
  isPublished: boolean;
  signupCount: number;
  shiftFilled: number;
  shiftTotal: number;
  supplyFilled: number;
  supplyTotal: number;
  retentionExpired: boolean;
  daysSinceEvent: number | null;
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
      <circle cx="7" cy="7" r="3"/><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z"/>
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

function MailIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M1 4l6 4 6-4"/>
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2.5 4h9"/><path d="M5 4V2.5h4V4"/><path d="M3.5 4v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4"/>
    </svg>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

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

// ── Purge volunteer data dialog ──────────────────────────────────────────────

function PurgeDataDialog({ event, onConfirm, onCancel }: { event: EventRow; onConfirm: () => void; onCancel: () => void }) {
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
            for <strong className="text-zinc-700">{event.title}</strong>. This data is past the 90-day
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function EventsListPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<EventRow | null>(null);
  const [contactTarget, setContactTarget] = useState<{ event: EventRow; recipients: { id: string; name: string; email: string }[] } | null>(null);
  const { banners, addBanner, dismissBanner } = useBanners();
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');

  const handleContactVolunteers = async (event: EventRow) => {
    try {
      const res = await fetch(`/api/admin/events/${event.id}/signups`);
      if (!res.ok) throw new Error('Failed to fetch signups');
      const { data } = await res.json();
      const recipients = data.signups.map((s: { id: string; name: string; email: string }) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      }));
      setContactTarget({ event, recipients });
    } catch {
      addBanner( 'Failed to load volunteer data', 'error');
    }
  };

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
          startTime: (() => {
            const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: SITE_TIMEZONE });
            const parts = formatter.formatToParts(new Date(data.date));
            const h = (parts.find((p) => p.type === 'hour')?.value ?? '00').padStart(2, '0');
            const m = (parts.find((p) => p.type === 'minute')?.value ?? '00').padStart(2, '0');
            return `${h}:${m}`;
          })(),
          location: data.location,
          zoomUrl: data.zoomUrl ?? '',
          volunteerSlots: data.volunteerSlots ?? [],
          isPublished: false,
        }),
      });

      if (!dupRes.ok) throw new Error('Failed to duplicate');
      addBanner( 'Event duplicated as draft', 'success');
      fetchEvents();
    } catch {
      addBanner( 'Failed to duplicate event', 'error');
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const body = await res.json();
      setEvents(body.data);
    } catch {
      addBanner( 'Failed to load events', 'error');
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
        addBanner( 'Failed to delete event', 'error');
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      addBanner(`Event '${deleteTarget.title}' deleted`, 'success');
    } catch {
      addBanner( 'Failed to delete event', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePurgeSignups = async () => {
    if (!purgeTarget) return;
    try {
      const res = await fetch(`/api/admin/events/${purgeTarget.id}/signups`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        addBanner( 'Failed to delete volunteer data', 'error');
        return;
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === purgeTarget.id
            ? { ...e, signupCount: 0, retentionExpired: false }
            : e,
        ),
      );
      addBanner( `Volunteer data deleted for ${purgeTarget.title}`, 'success');
    } catch {
      addBanner( 'Failed to delete volunteer data', 'error');
    } finally {
      setPurgeTarget(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Events</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage events and volunteer signups.</p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 2v10"/><path d="M2 7h10"/></svg>
          Create Event
        </Link>
      </div>

      <BannerStack banners={banners} onDismiss={dismissBanner} />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'current'}
          onClick={() => setActiveTab('current')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'current' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Current
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'past'}
          onClick={() => setActiveTab('past')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'past' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Past
        </button>
      </div>

      {/* Table */}
      {(() => {
        const now = new Date();
        const filteredEvents = events.filter((e) => {
          const eventDate = new Date(e.date);
          return activeTab === 'current' ? eventDate >= now : eventDate < now;
        });
        return loading ? (
        <div className="py-16 text-center text-sm text-zinc-400">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-500">
            {activeTab === 'current' ? 'No upcoming events' : 'No past events'}
          </p>
          {activeTab === 'current' && (
            <Link
              href="/admin/events/new"
              className="mt-2 inline-block text-sm font-semibold text-[#1B6DC2] hover:text-[#1B6DC2]"
            >
              Create your first event &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="w-[32%] px-5 py-3">Event</th>
                <th className="w-[12%] px-4 py-3">Date</th>
                <th className="w-[10%] px-4 py-3">Shifts</th>
                <th className="w-[10%] px-4 py-3">Supplies</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[26%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                return (
                  <tr key={event.id} className="border-b border-zinc-50 last:border-b-0 hover:bg-[#EFF6FF]/40">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-zinc-900">{event.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {formatTime(event.date)} &middot; {event.location}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        {event.shiftTotal > 0 ? (
                          <span>{event.shiftFilled} / {event.shiftTotal}</span>
                        ) : (
                          <span className="text-zinc-400">&mdash;</span>
                        )}
                        {event.retentionExpired && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.6rem] font-bold text-amber-700"
                            title={`Event was ${event.daysSinceEvent} days ago — volunteer data should be deleted per retention policy`}
                          >
                            <ClockAlertIcon />
                            90d+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-600">
                      {event.supplyTotal > 0 ? (
                        <span>{event.supplyFilled} / {event.supplyTotal}</span>
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
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]"
                        >
                          <EditIcon />
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/signups`}
                          title="View Signups"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-emerald-200 hover:text-emerald-600"
                        >
                          <SignupsIcon />
                        </Link>
                        {event.signupCount > 0 && (
                          <button
                            onClick={() => handleContactVolunteers(event)}
                            title="Contact Volunteers"
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]"
                          >
                            <MailIcon />
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(event)}
                          title="Duplicate"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-[#BFDBFE] hover:text-[#1B6DC2]"
                        >
                          <DuplicateIcon />
                        </button>
                        {event.retentionExpired && (
                          <button
                            onClick={() => setPurgeTarget(event)}
                            title="Delete Volunteer Data (past 90-day retention)"
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-amber-200 hover:text-amber-600"
                          >
                            <BroomIcon />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(event)}
                          title="Delete"
                          className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md border border-zinc-200 text-zinc-400 transition-colors hover:border-red-200 hover:text-red-500"
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
      );
      })()}

      {/* Contact Volunteers modal */}
      {contactTarget && (
        <ContactVolunteersModal
          eventId={contactTarget.event.id}
          eventTitle={contactTarget.event.title}
          recipients={contactTarget.recipients}
          onClose={() => setContactTarget(null)}
          onSuccess={(count) => {
            setContactTarget(null);
            addBanner( `Message sent to ${count} volunteer${count !== 1 ? 's' : ''}`, 'success');
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && <DeleteDialog event={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Purge volunteer data confirmation dialog */}
      {purgeTarget && <PurgeDataDialog event={purgeTarget} onConfirm={handlePurgeSignups} onCancel={() => setPurgeTarget(null)} />}

      {/* Toast */}
    </div>
  );
}
