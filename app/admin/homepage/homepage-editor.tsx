'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { FileUpload } from '@/components/admin/file-upload';

// ── Types ──────────────────────────────────────────────────────────────────

interface HomepageSettings {
  missionText: string;
  heroImageUrl: string;
  heroImageKey: string;
  heroImagePosition: string;
  socialFacebook: string;
  socialInstagram: string;
  contactEmail: string;
  contactPhone: string;
  socialSchoolWebsite: string;
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

interface HomepageEditorProps {
  initialSettings: HomepageSettings;
}

export function HomepageEditor({ initialSettings }: HomepageEditorProps) {
  const [missionText, setMissionText] = useState(initialSettings.missionText);
  const [heroImageUrl, setHeroImageUrl] = useState(initialSettings.heroImageUrl);
  const [heroImageKey, setHeroImageKey] = useState(initialSettings.heroImageKey);
  const [heroImagePosition, setHeroImagePosition] = useState(initialSettings.heroImagePosition || 'center');
  const [socialFacebook, setSocialFacebook] = useState(initialSettings.socialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(initialSettings.socialInstagram);
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone || '');
  const [socialSchoolWebsite, setSocialSchoolWebsite] = useState(initialSettings.socialSchoolWebsite || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!missionText.trim()) newErrors.missionText = 'Mission text is required';
    if (socialFacebook.trim() && !/^https?:\/\/.+/.test(socialFacebook.trim())) {
      newErrors.socialFacebook = 'Must be a valid URL (https://...)';
    }
    if (socialInstagram.trim() && !/^https?:\/\/.+/.test(socialInstagram.trim())) {
      newErrors.socialInstagram = 'Must be a valid URL (https://...)';
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(contactEmail.trim())) {
      newErrors.contactEmail = 'Must be a valid email address';
    }
    if (contactPhone.trim()) {
      const digits = contactPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        newErrors.contactPhone = 'Must be a valid phone number (at least 10 digits)';
      }
    }
    if (socialSchoolWebsite.trim() && !/^https?:\/\/.+/.test(socialSchoolWebsite.trim())) {
      newErrors.socialSchoolWebsite = 'Must be a valid URL (https://...)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'mission_text', value: missionText.trim() },
            { key: 'hero_image_url', value: heroImageUrl },
            { key: 'hero_image_key', value: heroImageKey },
            { key: 'hero_image_position', value: heroImagePosition },
            { key: 'social_facebook', value: socialFacebook.trim() },
            { key: 'social_instagram', value: socialInstagram.trim() },
            { key: 'contact_email', value: contactEmail.trim() },
            { key: 'contact_phone', value: contactPhone.trim() },
            { key: 'social_school_website', value: socialSchoolWebsite.trim() },
          ],
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setToast({ message: 'Homepage updated', type: 'success' });
      router.refresh();
    } catch {
      setToast({ message: 'Failed to update homepage', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Homepage Editor</h1>
        <p className="mt-1 text-sm text-zinc-500">Edit the hero section, social links, and newsletter settings for the public homepage.</p>
      </div>

      {/* Hero Section */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="mission-text" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Mission Statement
            </label>
            <textarea
              id="mission-text"
              value={missionText}
              onChange={(e) => { setMissionText(e.target.value); setErrors((prev) => ({ ...prev, missionText: '' })); }}
              rows={4}
              placeholder="This text appears in the hero section below the PTO name"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.missionText ? 'border-red-400' : 'border-zinc-200'}`}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.missionText && <p className="text-xs font-medium text-red-600">{errors.missionText}</p>}
              <span className={`ml-auto text-[0.65rem] ${missionText.length > 450 ? 'text-amber-600' : 'text-zinc-400'}`}>
                {missionText.length} / 500
              </span>
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Hero Image</span>
            {heroImageUrl && (
              <>
                <p className="mb-1.5 text-[0.65rem] text-zinc-400">Preview — this is how the image will appear on the homepage hero section.</p>
                <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200" style={{ height: '180px', maxWidth: '400px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: heroImagePosition }}
                  />
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <label htmlFor="hero-position" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vertical Position</label>
                  <select
                    id="hero-position"
                    value={heroImagePosition}
                    onChange={(e) => setHeroImagePosition(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                  {initialSettings.heroImageUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        setHeroImageUrl('');
                        setHeroImageKey('');
                        setHeroImagePosition('center');
                        await fetch('/api/admin/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ settings: [
                            { key: 'hero_image_url', value: '' },
                            { key: 'hero_image_key', value: '' },
                            { key: 'hero_image_position', value: 'center' },
                          ] }),
                        });
                        setToast({ message: 'Hero image removed', type: 'success' });
                        router.refresh();
                      }}
                      className="cursor-pointer text-xs font-semibold text-zinc-400 underline hover:text-zinc-700"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </>
            )}
            <FileUpload
              type="events"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              maxSizeMB={5}
              onUploadComplete={(result) => { setHeroImageUrl(result.fileUrl); setHeroImageKey(result.fileKey); }}
            />
            <p className="mt-1 text-[0.65rem] text-zinc-400">Recommended: 1200 x 400px. JPG or PNG, max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 border-b border-zinc-100 pb-3 text-sm font-extrabold text-zinc-900">Connect</h2>
        <p className="mb-4 text-xs text-zinc-400">These links appear in the footer. Leave blank to hide.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="social-facebook" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Facebook URL</label>
            <input
              id="social-facebook"
              type="text"
              value={socialFacebook}
              onChange={(e) => { setSocialFacebook(e.target.value); setErrors((prev) => ({ ...prev, socialFacebook: '' })); }}
              placeholder="https://facebook.com/..."
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialFacebook ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.socialFacebook && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialFacebook}</p>}
          </div>
          <div>
            <label htmlFor="social-instagram" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Instagram URL</label>
            <input
              id="social-instagram"
              type="text"
              value={socialInstagram}
              onChange={(e) => { setSocialInstagram(e.target.value); setErrors((prev) => ({ ...prev, socialInstagram: '' })); }}
              placeholder="https://instagram.com/..."
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialInstagram ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.socialInstagram && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialInstagram}</p>}
          </div>
          <div>
            <label htmlFor="social-email" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Email</label>
            <input
              id="social-email"
              type="text"
              value={contactEmail}
              onChange={(e) => { setContactEmail(e.target.value); setErrors((prev) => ({ ...prev, contactEmail: '' })); }}
              placeholder="pto@westmontpto.org"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactEmail ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.contactEmail && <p className="mt-1 text-xs font-medium text-red-600">{errors.contactEmail}</p>}
          </div>
          <div>
            <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Phone <span className="font-normal normal-case text-zinc-400">(optional)</span></label>
            <input
              id="contact-phone"
              type="text"
              value={contactPhone}
              onChange={(e) => {
                // Auto-format as (XXX) XXX-XXXX
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                let formatted = digits;
                if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                else if (digits.length > 0) formatted = `(${digits}`;
                setContactPhone(formatted);
                setErrors((prev) => ({ ...prev, contactPhone: '' }));
              }}
              placeholder="(555) 123-4567"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPhone ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.contactPhone && <p className="mt-1 text-xs font-medium text-red-600">{errors.contactPhone}</p>}
          </div>
          <div>
            <label htmlFor="social-school-website" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">School Website</label>
            <input
              id="social-school-website"
              type="text"
              value={socialSchoolWebsite}
              onChange={(e) => { setSocialSchoolWebsite(e.target.value); setErrors((prev) => ({ ...prev, socialSchoolWebsite: '' })); }}
              placeholder="https://school.example.org"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.socialSchoolWebsite ? 'border-red-400' : 'border-zinc-200'}`}
            />
            {errors.socialSchoolWebsite && <p className="mt-1 text-xs font-medium text-red-600">{errors.socialSchoolWebsite}</p>}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
