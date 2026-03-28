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
  volunteerSlots: { role: string; count: number }[] | null;
}

interface SignupRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface SignupsData {
  event: EventData;
  signups: SignupRow[];
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function EventSignupsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SignupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { banners, addBanner, dismissBanner } = useBanners();
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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
                {signups.length}
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
                      <th className="w-[5%] px-4 py-3">#</th>
                      <th className="w-[22%] px-4 py-3">Name</th>
                      <th className="w-[25%] px-4 py-3">Email</th>
                      <th className="w-[16%] px-4 py-3">Phone</th>
                      <th className="w-[12%] px-4 py-3">Role</th>
                      <th className="w-[20%] px-4 py-3">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((signup, i) => (
                      <tr key={signup.id} className="border-b border-zinc-50 last:border-b-0">
                        <td className="px-4 py-3 text-sm text-zinc-400">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{signup.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{signup.email}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{signup.phone || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{signup.role}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{formatDateTime(signup.createdAt)}</td>
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
          recipients={signups.map((s) => ({ id: s.id, name: s.name, email: s.email }))}
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

    </div>
  );
}
