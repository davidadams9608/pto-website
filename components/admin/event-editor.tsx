'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';
import { SITE_TIMEZONE } from '@/lib/site-config';
import { createEventSchema, validateForPublish } from '@/lib/validators/events';

// ── Types ──────────────────────────────────────────────────────────────────

interface VolunteerSlot {
  role: string;
  count: number;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string; // ISO timestamp
  location: string;
  zoomUrl: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  volunteerSlots: VolunteerSlot[] | null;
  isPublished: boolean;
}

interface EventEditorProps {
  eventId?: string; // undefined = create mode
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

// ── Toggle switch ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: 40,
          height: 22,
          borderRadius: 11,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          backgroundColor: checked ? '#1B6DC2' : '#d4d4d8',
          transition: 'background-color 150ms',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'transform 150ms',
            transform: checked ? 'translateX(20px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function EventEditor({ eventId }: EventEditorProps) {
  const router = useRouter();
  const isEdit = !!eventId;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => eventId ? '' : new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(() => eventId ? '' : '12:30');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [zoomUrl, setZoomUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [volunteerEnabled, setVolunteerEnabled] = useState(false);
  const [slots, setSlots] = useState<VolunteerSlot[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  // UI state
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; redirect?: boolean } | null>(null);

  const markDirty = useCallback(() => setDirty(true), []);

  // Load event data in edit mode
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}`);
        if (!res.ok) throw new Error('Failed to load event');
        const { data } = await res.json() as { data: EventData };

        setTitle(data.title);
        setDescription(data.description ?? '');
        // Extract date and time from ISO timestamp
        const d = new Date(data.date);
        setDate(d.toLocaleDateString('en-CA', { timeZone: SITE_TIMEZONE })); // YYYY-MM-DD
        setStartTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SITE_TIMEZONE }));
        setLocation(data.location);
        setZoomUrl(data.zoomUrl ?? '');
        setImageUrl(data.imageUrl ?? '');
        setImageKey(data.imageKey ?? '');
        if (Array.isArray(data.volunteerSlots) && data.volunteerSlots.length > 0) {
          setVolunteerEnabled(true);
          setSlots(data.volunteerSlots);
        }
        setIsPublished(data.isPublished);
      } catch {
        setToast({ message: 'Failed to load event', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  // Slot helpers
  const addSlot = () => { setSlots((prev) => [...prev, { role: '', count: 1 }]); markDirty(); };
  const removeSlot = (i: number) => { setSlots((prev) => prev.filter((_, idx) => idx !== i)); markDirty(); };
  const updateSlot = (i: number, field: 'role' | 'count', value: string | number) => {
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    markDirty();
  };

  const totalSpots = slots.reduce((sum, s) => sum + (s.count || 0), 0);

  // Cancel with dirty check
  const handleCancel = () => {
    if (dirty) {
      setShowLeaveDialog(true);
    } else {
      router.push('/admin/events');
    }
  };

  // Save
  const handleSave = async () => {
    setFieldErrors({});
    setSlotErrors({});
    setPublishErrors([]);

    const payload = {
      title,
      description,
      date,
      startTime,
      endTime: endTime || undefined,
      location,
      zoomUrl: zoomUrl || undefined,
      imageUrl: imageUrl || undefined,
      imageKey: imageKey || undefined,
      volunteerSlots: volunteerEnabled ? slots : [],
      isPublished,
    };

    // Client-side validation
    const result = createEventSchema.safeParse(payload);
    const errors: Record<string, string> = {};
    const sErrors: Record<string, string> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        // Handle nested volunteerSlots errors: path = ['volunteerSlots', index, 'role'|'count']
        if (issue.path[0] === 'volunteerSlots' && typeof issue.path[1] === 'number' && issue.path[2]) {
          const slotKey = `${issue.path[1]}-${String(issue.path[2])}`;
          if (!sErrors[slotKey]) sErrors[slotKey] = issue.message;
        } else {
          const key = issue.path[0]?.toString();
          if (key && !errors[key]) errors[key] = issue.message;
        }
      }
    }

    // Date/time must not be in the past for new events
    if (!isEdit && date && startTime) {
      const eventDate = new Date(`${date}T${startTime}:00`);
      if (eventDate < new Date()) {
        errors.date = 'Event date and time cannot be in the past';
      }
    }

    // End time must be after start time
    if (startTime && endTime && endTime <= startTime) {
      errors.endTime = 'End time must be after start time';
    }

    if (Object.keys(errors).length > 0 || Object.keys(sErrors).length > 0) {
      setFieldErrors(errors);
      setSlotErrors(sErrors);
      setToast({ message: 'Please fix the highlighted fields', type: 'error' });
      return;
    }

    // Publish validation
    if (isPublished) {
      const missing = validateForPublish(payload);
      if (missing.length > 0) {
        setPublishErrors(missing);
        const errors: Record<string, string> = {};
        for (const field of missing) errors[field] = 'Required for publishing';
        setFieldErrors(errors);
        return;
      }
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/events/${eventId}` : '/api/admin/events';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        setToast({ message: body.error ?? 'Failed to save event', type: 'error' });
        return;
      }

      setDirty(false);
      const eventTitle = title.trim();
      const msg = isEdit ? `Event '${eventTitle}' updated` : `Event '${eventTitle}' created`;
      // Brief spinner then redirect with banner
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/admin/events?success=${encodeURIComponent(msg)}`);
    } catch {
      setToast({ message: 'Failed to save event', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (name: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-[#1B6DC2] focus:ring-1 focus:ring-[#1B6DC2]/30 ${
      fieldErrors[name] ? 'border-red-400 bg-red-50/30' : 'border-zinc-200'
    }`;

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-400">Loading event...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h1>
      </div>

      {/* Publish error banner */}
      {publishErrors.length > 0 && (
        <div style={{ marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#b91c1c' }}>
          Please fill in all highlighted fields before publishing.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Event Details */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-xs font-bold uppercase tracking-[0.06em] text-zinc-500">
            Event Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Title — full width */}
            <div className="col-span-2">
              <label htmlFor="title" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                Event Title
              </label>
              <input id="title" type="text" placeholder="e.g., Family Movie Night" className={fieldClass('title')}
                value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} />
              {fieldErrors.title && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.title}</p>}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">Date</label>
              <input id="date" type="date" className={fieldClass('date')}
                value={date} onChange={(e) => { setDate(e.target.value); markDirty(); }} />
              {fieldErrors.date && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.date}</p>}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">Location</label>
              <input id="location" type="text" placeholder="e.g., School Gymnasium" className={fieldClass('location')}
                value={location} onChange={(e) => { setLocation(e.target.value); markDirty(); }} />
              {fieldErrors.location && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.location}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="startTime" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">Start Time</label>
              <input id="startTime" type="time" className={fieldClass('startTime')}
                value={startTime} onChange={(e) => { setStartTime(e.target.value); markDirty(); }} />
              {fieldErrors.startTime && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.startTime}</p>}
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="endTime" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">End Time <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span></label>
              <input id="endTime" type="time" className={fieldClass('endTime')} style={!endTime ? { color: '#a1a1aa' } : undefined}
                value={endTime} onChange={(e) => { setEndTime(e.target.value); markDirty(); }} />
            </div>

            {/* Zoom Link — full width */}
            <div className="col-span-2">
              <label htmlFor="zoomUrl" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="1" y="3.5" width="8" height="7" rx="1.5"/><path d="M9 6 L13 4v6L9 8"/>
                </svg>
                Zoom Link <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
              </label>
              <input id="zoomUrl" type="url" placeholder="https://zoom.us/j/..." className={fieldClass('zoomUrl')}
                value={zoomUrl} onChange={(e) => { setZoomUrl(e.target.value); markDirty(); }} />
              {fieldErrors.zoomUrl && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{fieldErrors.zoomUrl}</p>}
            </div>

            {/* Description — full width */}
            <div className="col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-500">Description</label>
              <textarea id="description" placeholder="Describe the event — what it is, who should attend, what to bring, etc."
                className={`${fieldClass('description')} min-h-[120px] resize-y`}
                value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} />
              <p className="mt-1 text-xs text-zinc-400">Supports plain text. Displayed on the public event detail page.</p>
            </div>
          </div>
        </div>

        {/* Event Options */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-xs font-bold uppercase tracking-[0.06em] text-zinc-500">
            Event Options
          </h2>
          <div className="space-y-5">
            <Toggle
              checked={volunteerEnabled}
              onChange={(v) => { setVolunteerEnabled(v); if (v && slots.length === 0) addSlot(); markDirty(); }}
              label="Enable volunteer signup"
              hint="When enabled, a signup form will appear on the public event page."
            />
            {volunteerEnabled && (
              <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-600">
                    Volunteer Roles &middot; {totalSpots} total spots
                  </p>
                  <button type="button" onClick={addSlot}
                    className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50">
                    + Add Role
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {slots.map((slot, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Role name (e.g., Setup Crew)"
                          style={slotErrors[`${i}-role`] ? { borderColor: '#f87171', backgroundColor: 'rgba(254,242,242,0.3)' } : undefined}
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[#1B6DC2]"
                          value={slot.role}
                          onChange={(e) => updateSlot(i, 'role', e.target.value)}
                        />
                        <input
                          type="number"
                          min="1"
                          style={slotErrors[`${i}-count`] ? { borderColor: '#f87171', backgroundColor: 'rgba(254,242,242,0.3)' } : undefined}
                          className="w-20 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-bold text-zinc-900 outline-none focus:border-[#1B6DC2]"
                          value={slot.count}
                          onChange={(e) => updateSlot(i, 'count', parseInt(e.target.value) || 0)}
                        />
                        <button type="button" onClick={() => removeSlot(i)} title="Remove role"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500">
                          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M3 3l8 8M11 3l-8 8"/>
                          </svg>
                        </button>
                      </div>
                      {(slotErrors[`${i}-role`] || slotErrors[`${i}-count`]) && (
                        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>
                          {slotErrors[`${i}-role`] || slotErrors[`${i}-count`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-400">Visitors will see &quot;X spots left&quot; on the public page.</p>
              </div>
            )}
            <div className="border-t border-zinc-100 pt-5">
              <Toggle
                checked={isPublished}
                onChange={(v) => { setIsPublished(v); markDirty(); }}
                label={isEdit ? 'Publish' : 'Publish immediately'}
                hint={isEdit
                  ? 'Toggle to publish or unpublish this event on the public site.'
                  : 'Published events are visible on the public site. Unpublished events are saved as drafts.'}
              />
            </div>
          </div>
        </div>

        {/* Event Image */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 border-b border-zinc-100 pb-3 text-xs font-bold uppercase tracking-[0.06em] text-zinc-500">
            Event Image <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
          </h2>
          {imageUrl ? (
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Event preview" className="h-24 w-24 rounded-lg border border-zinc-200 object-cover" />
              <button
                type="button"
                onClick={() => { setImageUrl(''); setImageKey(''); markDirty(); }}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <FileUpload
              type="events"
              accept=".jpg,.jpeg,.png,.webp"
              onUploadComplete={({ fileKey, fileUrl }) => { setImageUrl(fileUrl); setImageKey(fileKey); markDirty(); }}
              onUploadError={(error) => setToast({ message: error, type: 'error' })}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={handleCancel}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: '#18181b', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      {/* Unsaved changes dialog */}
      {showLeaveDialog && (
        <UnsavedDialog
          onLeave={() => router.push('/admin/events')}
          onStay={() => setShowLeaveDialog(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => {
        const shouldRedirect = toast.redirect;
        setToast(null);
        if (shouldRedirect) router.push('/admin/events');
      }} />}
    </div>
  );
}
