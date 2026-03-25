'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// ── Types ──────────────────────────────────────────────────────────────────

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface ContactVolunteersModalProps {
  eventId: string;
  eventTitle: string;
  recipients: Recipient[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l8 8"/><path d="M12 4l-8 8"/>
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

// ── Discard confirmation dialog ────────────────────────────────────────────

function DiscardDialog({ onDiscard, onKeepEditing }: { onDiscard: () => void; onKeepEditing: () => void }) {
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 100001, backgroundColor: 'rgba(0,0,0,0.2)' }}
        onClick={onKeepEditing}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Discard unsaved message"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100002,
          width: '100%',
          maxWidth: '22rem',
        }}
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Discard message?</h2>
          <p className="mt-2 text-sm text-zinc-500">
            You have an unsaved message. Discard?
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onKeepEditing}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            >
              Keep Editing
            </button>
            <button
              onClick={onDiscard}
              style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function ContactVolunteersModal({
  eventId,
  eventTitle,
  recipients,
  onClose,
  onSuccess,
}: ContactVolunteersModalProps) {
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(recipients.map((r) => r.id)));
  const [subject, setSubject] = useState(`Re: ${eventTitle}`);
  const [body, setBody] = useState('');
  const [ccAdmin, setCcAdmin] = useState(true);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ recipients?: string; subject?: string; body?: string }>({});
  const [showDiscard, setShowDiscard] = useState(false);

  const isDirty = useMemo(() => {
    return subject !== `Re: ${eventTitle}` || body.length > 0;
  }, [subject, body, eventTitle]);

  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'contact-modal-portal';
    document.body.appendChild(el);
    setPortalEl(el);

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const allSelected = selectedIds.size === recipients.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipients.map((r) => r.id)));
    }
  }, [allSelected, recipients]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (selectedIds.size === 0) newErrors.recipients = 'At least one recipient is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!body.trim()) newErrors.body = 'Message body is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedIds, subject, body]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: Array.from(selectedIds),
          subject: subject.trim(),
          body: body.trim(),
          ccAdmin,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      onSuccess(selectedIds.size);
    } catch (err) {
      setErrors({ body: err instanceof Error ? err.message : 'Failed to send message' });
    } finally {
      setSending(false);
    }
  }, [eventId, selectedIds, subject, body, ccAdmin, validate, onSuccess]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleOverlayClick = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  if (!portalEl) return null;

  return createPortal(
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={handleOverlayClick}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Contact volunteers for ${eventTitle}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
          width: '100%',
          maxWidth: '32rem',
        }}
      >
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <span className="text-base font-extrabold text-zinc-900">Contact Volunteers</span>
            <button
              onClick={handleCancel}
              className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Recipient info */}
            <p className="mb-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Sending to <strong className="text-zinc-800">{selectedIds.size}</strong> of{' '}
              <strong className="text-zinc-800">{recipients.length}</strong> volunteers for{' '}
              <strong className="text-zinc-800">{eventTitle}</strong>.{' '}
              <span className="text-zinc-400">Email sent via Resend.</span>
            </p>

            {/* Recipient picker */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Recipients
                </span>
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                  type="button"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {errors.recipients && (
                <p className="mb-1 text-xs font-medium text-red-600">{errors.recipients}</p>
              )}
              <div
                className="overflow-y-auto rounded-lg border border-zinc-200"
                style={{ maxHeight: '180px' }}
              >
                {recipients.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-zinc-100 px-3 py-2 text-sm transition-colors last:border-b-0 hover:bg-blue-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-[120px] font-semibold text-zinc-900">{r.name}</span>
                    <span className="text-xs text-zinc-400">{r.email}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                Subject Line
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setErrors((prev) => ({ ...prev, subject: undefined })); }}
                placeholder={`e.g., Volunteer Update — ${eventTitle}`}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? 'border-red-400' : 'border-zinc-200'
                }`}
              />
              {errors.subject && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.subject}</p>
              )}
            </div>

            {/* Message body */}
            <div className="mb-4">
              <label htmlFor="contact-body" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
                Email Body
              </label>
              <textarea
                id="contact-body"
                value={body}
                onChange={(e) => { setBody(e.target.value); setErrors((prev) => ({ ...prev, body: undefined })); }}
                placeholder="Write your message to volunteers here. Keep it clear and actionable — include any logistics, time changes, or instructions they need."
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.body ? 'border-red-400' : 'border-zinc-200'
                }`}
                style={{ minHeight: '140px', resize: 'vertical' }}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[0.65rem] text-zinc-400">
                  Plain text only. Volunteers will receive this via Resend.
                </span>
                <span className={`text-[0.65rem] ${body.length > 4500 ? 'text-amber-600' : 'text-zinc-400'}`}>
                  {body.length} / 5,000
                </span>
              </div>
              {errors.body && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.body}</p>
              )}
            </div>

            {/* CC Admin */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={ccAdmin}
                onChange={(e) => setCcAdmin(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-zinc-900">Also send a copy to me (admin)</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
            <button
              onClick={handleCancel}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <MailIcon />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
      {showDiscard && (
        <DiscardDialog
          onDiscard={onClose}
          onKeepEditing={() => setShowDiscard(false)}
        />
      )}
    </>,
    portalEl,
  );
}
