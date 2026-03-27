'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';

// ── Types ──────────────────────────────────────────────────────────────────

interface DonateSettings {
  venmoUrl: string;
  venmoQrUrl: string;
  venmoQrKey: string;
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

// ── Component ──────────────────────────────────────────────────────────────

interface DonateEditorProps {
  initialSettings: DonateSettings;
}

export function DonateEditor({ initialSettings }: DonateEditorProps) {
  const [venmoUrl, setVenmoUrl] = useState(initialSettings.venmoUrl);
  const [venmoQrUrl, setVenmoQrUrl] = useState(initialSettings.venmoQrUrl);
  const [venmoQrKey, setVenmoQrKey] = useState(initialSettings.venmoQrKey);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const isDirty =
    venmoUrl !== initialSettings.venmoUrl ||
    venmoQrUrl !== initialSettings.venmoQrUrl ||
    venmoQrKey !== initialSettings.venmoQrKey;

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (venmoUrl.trim() && !/^https?:\/\/.+/.test(venmoUrl.trim())) {
      newErrors.venmoUrl = 'Must be a valid URL (https://...)';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'venmo_url', value: venmoUrl.trim() },
            { key: 'venmo_qr_url', value: venmoQrUrl },
            { key: 'venmo_qr_key', value: venmoQrKey },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setToast({ message: 'Donation settings updated', type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Donate</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your Venmo payment details for the public donate page.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Venmo</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="venmo-url" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Venmo URL
            </label>
            <input
              id="venmo-url"
              type="text"
              value={venmoUrl}
              onChange={(e) => { setVenmoUrl(e.target.value); clearError('venmoUrl'); }}
              placeholder="https://venmo.com/YourPTO"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.venmoUrl ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.venmoUrl && <p className="mt-1 text-xs font-medium text-red-600">{errors.venmoUrl}</p>}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Venmo QR Code</span>
            {venmoQrUrl && (
              <div className="mb-3 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venmoQrUrl}
                  alt="Venmo QR code preview"
                  className="h-24 w-24 rounded-lg border border-zinc-200 object-contain"
                />
                {initialSettings.venmoQrUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      setVenmoQrUrl('');
                      setVenmoQrKey('');
                      await fetch('/api/admin/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ settings: [
                          { key: 'venmo_qr_url', value: '' },
                          { key: 'venmo_qr_key', value: '' },
                        ] }),
                      });
                      setToast({ message: 'QR code removed', type: 'success' });
                      router.refresh();
                    }}
                    className="cursor-pointer text-xs font-semibold text-zinc-400 underline hover:text-zinc-700"
                  >
                    Remove QR code
                  </button>
                )}
              </div>
            )}
            <FileUpload
              type="settings"
              accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
              maxSizeMB={5}
              onUploadComplete={(result) => { setVenmoQrUrl(result.fileUrl); setVenmoQrKey(result.fileKey); }}
            />
            <p className="mt-1 text-[0.65rem] text-zinc-400">The Venmo QR code appears on the public Donate page. PNG, JPG, SVG, max 5MB.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
